import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

const allowedCollections = new Set(["serviceRequests", "helperApplications", "partnerApplications", "contactMessages"]);
const BULK_DELETE_PHRASE = "DELETE REQUESTS";
const MAX_BULK_DELETE = 500;

type DeleteRecordBody = {
  collection?: string;
  id?: string;
  ids?: unknown;
  confirmDeleteTestRecord?: boolean;
  confirmBulkDeleteRequests?: boolean;
  cleanupPhrase?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value: unknown) {
  return getString(value).toLowerCase();
}

function hasAnyValue(data: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => {
    const value = data[key];
    if (value === null || value === undefined || value === "") return false;
    if (typeof value === "number") return Number.isFinite(value) && value !== 0;
    if (typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

function getProtectedDeleteReason(collection: string, data: Record<string, unknown>) {
  if (collection !== "serviceRequests") return "";

  const statusText = [
    data.status,
    data.paymentStatus,
    data.checkoutStatus,
    data.laundryPaymentStatus,
    data.familyInvoiceStatus,
    data.invoiceStatus,
    data.additionalPaymentStatus,
    data.commercialQuoteStatus,
  ].map(lower).join(" ");

  if (statusText.includes("paid") || statusText.includes("completed") || statusText.includes("scheduled")) {
    return "This request looks paid, completed, or scheduled. Keep it for customer/payment records and mark it Canceled or Archived instead.";
  }

  if (hasAnyValue(data, [
    "checkoutUrl",
    "checkoutSessionId",
    "paymentIntentId",
    "stripeCustomerId",
    "commercialInvoiceId",
    "commercialInvoiceUrl",
    "commercialInvoicePdf",
    "familyInvoiceId",
    "familyInvoiceUrl",
    "familyInvoicePdf",
    "laundryFinalInvoiceId",
    "laundryFinalInvoiceUrl",
    "laundryFinalCheckoutUrl",
    "additionalCheckoutUrl",
    "additionalCheckoutSessionId",
    "outgoingReferralCode",
    "outgoingReferralLink",
    "incomingReferralCode",
    "outgoingReferralCreditId",
    "incomingReferralRewardCode",
  ])) {
    return "This request already has payment, invoice, checkout, or referral data attached. Keep it for audit history and mark it Canceled or Archived instead.";
  }

  return "";
}

function getBulkIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];

  value.forEach((entry) => {
    const id = getString(entry);
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });

  return ids;
}

async function deleteServiceRequestBatch(ids: string[]) {
  const db = getFirebaseAdminDb();
  const deletedIds: string[] = [];
  const missingIds: string[] = [];

  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    const refs = chunk.map((id) => db.collection("serviceRequests").doc(id));
    const snaps = await db.getAll(...refs);
    const batch = db.batch();
    let batchCount = 0;

    snaps.forEach((snap, index) => {
      const id = chunk[index];
      if (!snap.exists) {
        missingIds.push(id);
        return;
      }
      batch.delete(snap.ref);
      deletedIds.push(id);
      batchCount += 1;
    });

    if (batchCount > 0) await batch.commit();
  }

  return { deletedIds, missingIds };
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as DeleteRecordBody;
    const { collection, id, confirmDeleteTestRecord, confirmBulkDeleteRequests, cleanupPhrase } = body;
    const bulkIds = getBulkIds(body.ids);

    if (!collection || !allowedCollections.has(collection)) {
      return NextResponse.json({ ok: false, error: "Invalid delete request." }, { status: 400 });
    }

    if (bulkIds.length > 0 || confirmBulkDeleteRequests) {
      if (collection !== "serviceRequests") {
        return NextResponse.json({ ok: false, error: "Bulk cleanup is only available for service requests." }, { status: 400 });
      }

      if (!confirmBulkDeleteRequests || getString(cleanupPhrase) !== BULK_DELETE_PHRASE) {
        return NextResponse.json({ ok: false, error: `Type ${BULK_DELETE_PHRASE} to confirm pre-launch request cleanup.` }, { status: 400 });
      }

      if (!bulkIds.length) {
        return NextResponse.json({ ok: false, error: "Select at least one request to delete." }, { status: 400 });
      }

      if (bulkIds.length > MAX_BULK_DELETE) {
        return NextResponse.json({ ok: false, error: `Select ${MAX_BULK_DELETE} or fewer requests at a time.` }, { status: 400 });
      }

      const result = await deleteServiceRequestBatch(bulkIds);
      return NextResponse.json({
        ok: true,
        collection,
        deletedIds: result.deletedIds,
        missingIds: result.missingIds,
        deletedCount: result.deletedIds.length,
        missingCount: result.missingIds.length,
        deletedBy: decoded.email || "admin",
        mode: "prelaunch_request_cleanup",
      });
    }

    if (!id || !confirmDeleteTestRecord) {
      return NextResponse.json({ ok: false, error: "Missing confirmation or invalid delete request." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const docRef = db.collection(collection).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: "Record not found." }, { status: 404 });
    }

    const data = docSnap.data() || {};
    const protectedReason = getProtectedDeleteReason(collection, data);
    if (protectedReason) {
      return NextResponse.json({ ok: false, error: protectedReason }, { status: 409 });
    }

    await docRef.delete();

    return NextResponse.json({ ok: true, deletedId: id, collection, deletedBy: decoded.email || "admin" });
  } catch (error) {
    console.error("Admin delete-record failed", error);
    return NextResponse.json({ ok: false, error: "Unable to delete this record." }, { status: 500 });
  }
}
