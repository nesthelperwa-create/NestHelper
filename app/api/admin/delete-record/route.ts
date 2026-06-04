import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

const allowedCollections = new Set(["serviceRequests", "helperApplications", "partnerApplications", "contactMessages"]);

type DeleteRecordBody = {
  collection?: string;
  id?: string;
  confirmDeleteTestRecord?: boolean;
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

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const { collection, id, confirmDeleteTestRecord } = (await request.json().catch(() => ({}))) as DeleteRecordBody;
    if (!collection || !allowedCollections.has(collection) || !id || !confirmDeleteTestRecord) {
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
