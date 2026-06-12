import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type UpdateFamilyPaymentBreakdownBody = {
  requestId?: string;
  amountDueNow?: number | string;
  additionalAmount?: number | string;
  paymentPlan?: string;
  quoteTitle?: string;
  customerNote?: string;
  internalNotes?: string;
  paymentBreakdown?: unknown;
  recurringTracking?: unknown;
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

function isFamilyRequest(data: Record<string, unknown>) {
  const combined = [data.service, data.selectedServiceTitle, data.packageType, data.requestType]
    .map((value) => getString(value).toLowerCase())
    .join(" ");

  return !combined.includes("commercial");
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => null)) as UpdateFamilyPaymentBreakdownBody | null;
    const requestId = getString(body?.requestId);
    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });
    }

    const data = requestSnap.data() || {};
    if (!isFamilyRequest(data)) {
      return NextResponse.json({ ok: false, error: "This payment breakdown tool is for family requests. Use the Commercial Quote Builder for Commercial Reset." }, { status: 400 });
    }

    const amountDueNow = cleanNumber(body?.amountDueNow);
    const additionalAmount = cleanNumber(body?.additionalAmount);
    const paymentPlan = getString(body?.paymentPlan) || "One-time family service";
    const quoteTitle = getString(body?.quoteTitle) || "NestHelper family payment breakdown";
    const customerNote = getString(body?.customerNote);
    const internalNotes = getString(body?.internalNotes);
    const paymentBreakdown = cleanJsonValue(body?.paymentBreakdown);
    const recurringTracking = cleanJsonValue(body?.recurringTracking);
    const refundTracking = cleanJsonValue(body?.refundTracking);

    const updatePayload: Record<string, unknown> = {
      familyPaymentStatus: "Breakdown saved",
      familyPaymentPlan: paymentPlan,
      familyPaymentTitle: quoteTitle,
      familyInitialAmount: Number(amountDueNow.toFixed(2)),
      familyInitialAmountCents: moneyToCents(amountDueNow),
      familyAdditionalAmount: Number(additionalAmount.toFixed(2)),
      familyAdditionalAmountCents: moneyToCents(additionalAmount),
      familyCustomerPaymentNote: customerNote,
      familyInternalPaymentNotes: internalNotes,
      familyPaymentUpdatedAt: FieldValue.serverTimestamp(),
      familyPaymentUpdatedBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    if (paymentBreakdown && typeof paymentBreakdown === "object") {
      updatePayload.familyPaymentBreakdown = paymentBreakdown;
    }

    if (recurringTracking && typeof recurringTracking === "object") {
      updatePayload.familyRecurringPlan = recurringTracking;
    }

    if (refundTracking && typeof refundTracking === "object") {
      updatePayload.familyRefundTracking = refundTracking;
    }

    await requestRef.update(updatePayload);

    return NextResponse.json({
      ok: true,
      paymentPlan,
      quoteTitle,
      amountDueNow: Number(amountDueNow.toFixed(2)),
      additionalAmount: Number(additionalAmount.toFixed(2)),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to save family payment breakdown." }, { status: 500 });
  }
}
