import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { emailAliases } from "@/lib/emailRouting";
import { createFamilyReferralLinkForRequest, getReferralRewardLabel } from "@/lib/referrals";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { sendReferralShareEmail } from "@/lib/sendReferralShareEmail";

export const runtime = "nodejs";

type CreateReferralLinkBody = {
  requestId?: string;
  sendEmail?: boolean;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getEmailResultError(result: unknown) {
  if (!result || typeof result !== "object") return "";
  const record = result as { skipped?: boolean; error?: unknown };
  if (!record.error) return "";
  if (record.error instanceof Error) return record.error.message;
  if (typeof record.error === "object" && record.error && "message" in record.error) {
    return String((record.error as { message?: unknown }).message || "Email provider returned an error.");
  }
  return String(record.error);
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => null)) as CreateReferralLinkBody | null;
    const requestId = getString(body?.requestId);
    const sendEmail = body?.sendEmail !== false;

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing service request ID." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const referral = await createFamilyReferralLinkForRequest({ db, requestId, createdBy: decoded.email });
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const linkRef = db.collection("referralLinks").doc(referral.code);

    let emailSent = false;
    let emailWarning = "";

    if (sendEmail) {
      try {
        const result = await sendReferralShareEmail({
          to: referral.referrerEmail,
          customerName: referral.referrerName,
          referralUrl: referral.url,
          referralCode: referral.code,
          rewardLabel: getReferralRewardLabel(),
          replyToEmail: emailAliases.booking,
        }) as any;

        const providerError = getEmailResultError(result);
        if (result?.skipped) {
          emailWarning = "Referral link was created, but the email was skipped because RESEND_API_KEY or the customer email is missing.";
        } else if (providerError) {
          emailWarning = providerError;
        } else {
          emailSent = true;
        }
      } catch (error) {
        console.error("Referral share email failed", error);
        emailWarning = "Referral link was created, but the email failed to send.";
      }

      await Promise.all([
        requestRef.update({
          outgoingReferralEmailSent: emailSent,
          outgoingReferralEmailSentAt: emailSent ? FieldValue.serverTimestamp() : null,
          outgoingReferralEmailError: emailWarning,
          outgoingReferralStatus: referral.reused ? (getString(referral.linkData.status) || "Active") : "Active",
          updatedAt: FieldValue.serverTimestamp(),
        }),
        linkRef.update({
          emailSent,
          emailSentAt: emailSent ? FieldValue.serverTimestamp() : null,
          emailError: emailWarning,
          updatedAt: FieldValue.serverTimestamp(),
        }),
      ]);
    }

    return NextResponse.json({
      ok: true,
      code: referral.code,
      url: referral.url,
      reused: referral.reused,
      emailSent,
      emailWarning,
      status: referral.reused ? (getString(referral.linkData.status) || "Active") : "Active",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create referral link." }, { status: 500 });
  }
}
