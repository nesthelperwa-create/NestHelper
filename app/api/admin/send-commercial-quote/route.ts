import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { emailAliases } from "@/lib/emailRouting";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { sendCommercialQuoteEmail } from "@/lib/sendCommercialQuoteEmail";

export const runtime = "nodejs";

type SendCommercialQuoteBody = {
  requestId?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatServicePeriodLabel(start: unknown, end: unknown) {
  const cleanStart = getString(start);
  const cleanEnd = getString(end);
  if (cleanStart && cleanEnd) return `${cleanStart} to ${cleanEnd}`;
  if (cleanStart) return `Starts ${cleanStart}`;
  if (cleanEnd) return `Through ${cleanEnd}`;
  return "";
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => null)) as SendCommercialQuoteBody | null;
    const requestId = getString(body?.requestId);
    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });

    const data = requestSnap.data() || {};
    if (getString(data.service) !== "commercial-reset") {
      return NextResponse.json({ ok: false, error: "This quote email is only for Commercial Reset requests." }, { status: 400 });
    }

    const email = getString(data.email);
    if (!email) return NextResponse.json({ ok: false, error: "Customer email is missing." }, { status: 400 });

    const breakdown = (data.commercialQuoteBreakdown || {}) as Record<string, unknown>;
    const quoteBreakdownText = getString(breakdown.customerBreakdownText);
    if (!quoteBreakdownText) {
      return NextResponse.json({ ok: false, error: "Save the Commercial Quote / Breakdown Builder draft before emailing the quote." }, { status: 400 });
    }

    const customerName = getString(data.fullName) || getString(data.contactName) || getString(data.businessName) || "NestHelper customer";
    const servicePeriodLabel = getString(breakdown.servicePeriodLabel) || formatServicePeriodLabel(breakdown.servicePeriodStart, breakdown.servicePeriodEnd);
    let emailSent = false;
    let emailWarning = "";

    try {
      const result = (await sendCommercialQuoteEmail({
        to: email,
        customerName,
        requestId,
        quoteTitle: getString(breakdown.quoteTitle) || "Commercial Reset quote breakdown",
        quoteBreakdownText,
        validUntil: getString(breakdown.validUntil),
        servicePeriodLabel,
        replyToEmail: emailAliases.commercial || emailAliases.billing,
      })) as any;

      if (result?.skipped) {
        emailWarning = "Quote was saved, but email was skipped because email settings or the customer email are missing.";
      } else if (result?.error) {
        emailWarning = result.error?.message || "Quote was saved, but the NestHelper quote email could not be sent.";
      } else {
        emailSent = true;
      }
    } catch (error: any) {
      console.error("Commercial quote email failed", error);
      emailWarning = error?.message || "Quote was saved, but the NestHelper quote email could not be sent.";
    }

    const nextStatus = emailSent ? "Quote Sent" : "Quote Drafted";
    await requestRef.update({
      status: nextStatus,
      commercialQuoteStatus: emailSent ? "Quote sent" : "Quote drafted",
      commercialQuoteEmailSent: emailSent,
      commercialQuoteEmailWarning: emailWarning,
      commercialQuoteEmailSentAt: emailSent ? FieldValue.serverTimestamp() : null,
      commercialQuoteEmailSentBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    });

    return NextResponse.json({
      ok: true,
      emailSent,
      emailWarning,
      status: nextStatus,
      commercialQuoteStatus: emailSent ? "Quote sent" : "Quote drafted",
    });
  } catch (error: any) {
    console.error("Unable to send commercial quote", error);
    return NextResponse.json({ ok: false, error: error?.message || "Unable to send commercial quote." }, { status: 500 });
  }
}
