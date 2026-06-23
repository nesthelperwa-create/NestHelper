import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type UpdateCommercialQuoteBody = {
  requestId?: string;
  quoteStatus?: string;
  quoteType?: string;
  initialAmount?: number | string;
  additionalAmount?: number | string;
  customerQuoteNote?: string;
  internalQuoteNotes?: string;
  quoteBreakdown?: unknown;
  refundTracking?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(num) ? Math.max(0, num) : 0;
}

function moneyToCents(value: number) {
  return Math.round(Math.max(0, value) * 100);
}


function cleanJsonValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return null;
  if (value === null) return null;
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map((item) => cleanJsonValue(item, depth + 1)).filter((item) => item !== undefined);
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nextValue] of Object.entries(value as Record<string, unknown>)) {
      if (!key || nextValue === undefined || typeof nextValue === "function") continue;
      output[key] = cleanJsonValue(nextValue, depth + 1);
    }
    return output;
  }
  return null;
}

function isCommercialRequest(data: Record<string, unknown>) {
  const combined = [data.service, data.selectedServiceTitle, data.packageType, data.requestType]
    .map((value) => getString(value).toLowerCase())
    .join(" ");

  return combined.includes("commercial");
}

function getMappedRequestStatus(quoteStatus: string) {
  const normalized = quoteStatus.trim().toLowerCase();
  if (normalized === "quote drafted" || normalized === "quoted") return "Quote Drafted";
  if (normalized === "quote sent") return "Quote Sent";
  if (normalized === "quote approved") return "Quote Approved";
  if (normalized === "initial paid") return "Deposit Paid";
  if (normalized === "additional sent") return "Additional Payment Sent";
  if (normalized === "additional paid") return "Additional Paid";
  return "";
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => null)) as UpdateCommercialQuoteBody | null;
    const requestId = getString(body?.requestId);
    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return NextResponse.json({ ok: false, error: "Commercial request not found." }, { status: 404 });
    }

    const data = requestSnap.data() || {};
    if (!isCommercialRequest(data)) {
      return NextResponse.json({ ok: false, error: "This quote panel is only for Commercial Reset requests." }, { status: 400 });
    }

    const quoteStatus = getString(body?.quoteStatus) || "Quote drafted";
    const quoteType = getString(body?.quoteType) || "Flat visit quote";
    const initialAmount = cleanNumber(body?.initialAmount);
    const additionalAmount = cleanNumber(body?.additionalAmount);
    const customerQuoteNote = getString(body?.customerQuoteNote);
    const internalQuoteNotes = getString(body?.internalQuoteNotes);
    const mappedStatus = getMappedRequestStatus(quoteStatus);
    const quoteBreakdown = cleanJsonValue(body?.quoteBreakdown);
    const refundTracking = cleanJsonValue(body?.refundTracking);

    const updatePayload: Record<string, unknown> = {
      commercialQuoteStatus: quoteStatus,
      commercialQuoteType: quoteType,
      commercialInitialAmount: Number(initialAmount.toFixed(2)),
      commercialInitialAmountCents: moneyToCents(initialAmount),
      commercialAdditionalAmount: Number(additionalAmount.toFixed(2)),
      commercialAdditionalAmountCents: moneyToCents(additionalAmount),
      commercialCustomerQuoteNote: customerQuoteNote,
      commercialInternalQuoteNotes: internalQuoteNotes,
      commercialQuoteUpdatedAt: FieldValue.serverTimestamp(),
      commercialQuoteUpdatedBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    if (quoteBreakdown && typeof quoteBreakdown === "object") {
      updatePayload.commercialQuoteBreakdown = quoteBreakdown;
    }

    if (refundTracking && typeof refundTracking === "object") {
      updatePayload.commercialRefundTracking = refundTracking;
    }

    if (mappedStatus) {
      updatePayload.status = mappedStatus;
    }

    await requestRef.update(updatePayload);

    return NextResponse.json({
      ok: true,
      quoteStatus,
      quoteType,
      initialAmount: Number(initialAmount.toFixed(2)),
      additionalAmount: Number(additionalAmount.toFixed(2)),
      mappedStatus: mappedStatus || null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to update commercial quote." }, { status: 500 });
  }
}
