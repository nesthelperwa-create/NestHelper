import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { sendStatusUpdateEmail } from "@/lib/sendStatusUpdateEmail";
import { sendReferralRewardEmail } from "@/lib/sendReferralRewardEmail";
import { emailAliases } from "@/lib/emailRouting";
import { markReferralRewardEmailFailed, markReferralRewardSent, reserveReferralRewardForCompletedRequest } from "@/lib/referrals";
import { services } from "@/lib/services";

const allowedCollections = new Set(["serviceRequests", "helperApplications", "partnerApplications", "contactMessages"]);

type UpdateStatusBody = {
  collection?: string;
  id?: string;
  status?: string;
  notes?: string;
  notifyCustomer?: boolean;
  customerNote?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getServiceTitle(data: Record<string, unknown>) {
  const serviceId = getString(data.service);
  return getString(data.selectedServiceTitle) || services.find((item) => item.id === serviceId)?.title || serviceId || "NestHelper service";
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
    getFirebaseAdminDb(); // initialize admin app
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const { collection, id, status, notes, notifyCustomer, customerNote } = (await request.json().catch(() => ({}))) as UpdateStatusBody;
    if (!collection || !allowedCollections.has(collection) || !id || !status) {
      return NextResponse.json({ ok: false, error: "Missing or invalid update fields." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const docRef = db.collection(collection).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: "Record not found." }, { status: 404 });
    }

    const data = docSnap.data() || {};
    const updatePayload: Record<string, unknown> = {
      status,
      adminNotes: notes || "",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email,
    };

    let emailSent = false;
    let emailSkipped = false;
    let emailError = "";

    if (notifyCustomer) {
      const email = getString(data.email);

      if (!email) {
        emailSkipped = true;
        emailError = "No customer email is available for this record.";
      } else {
        try {
          const serviceId = getString(data.service);
          await sendStatusUpdateEmail({
            to: email,
            customerName: getString(data.fullName) || getString(data.name),
            requestId: id,
            serviceTitle: getServiceTitle(data),
            status,
            note: customerNote || notes || "",
            preferredDate: getString(data.preferredDate),
            preferredWindow: getString(data.preferredWindow),
            city: getString(data.city),
            replyToEmail: serviceId === "laundry-rescue" ? emailAliases.laundry : serviceId === "commercial-reset" ? emailAliases.commercial : emailAliases.booking,
          });
          emailSent = true;
          updatePayload.lastStatusEmailSentAt = FieldValue.serverTimestamp();
          updatePayload.lastStatusEmailStatus = status;
          updatePayload.lastStatusEmailNote = customerNote || notes || "";
        } catch (error) {
          console.error("Status update email failed", error);
          emailError = "Status updated, but the customer email failed to send.";
          updatePayload.lastStatusEmailError = emailError;
        }
      }
    }

    await docRef.update(updatePayload);

    let referralRewardEmailSent = false;
    let referralRewardEmailError = "";

    if (collection === "serviceRequests" && getString(status).toLowerCase() === "completed") {
      try {
        const reservedReward = await reserveReferralRewardForCompletedRequest({
          db,
          requestId: id,
          requestData: { ...data, status },
        });

        if (reservedReward) {
          try {
            const rewardEmailResult = await sendReferralRewardEmail({
              to: reservedReward.referrerEmail,
              customerName: reservedReward.referrerName,
              rewardCode: reservedReward.rewardCode,
              rewardLabel: reservedReward.rewardLabel,
              referredName: reservedReward.referredName,
              referredServiceTitle: reservedReward.referredServiceTitle,
              replyToEmail: emailAliases.booking,
            }) as any;

            if (rewardEmailResult?.skipped) {
              throw new Error("Referral reward email skipped because RESEND_API_KEY or the referring customer email is missing.");
            }
            const rewardProviderError = getEmailResultError(rewardEmailResult);
            if (rewardProviderError) throw new Error(rewardProviderError);

            await markReferralRewardSent({
              db,
              code: reservedReward.code,
              requestId: id,
              referrerRequestId: reservedReward.referrerRequestId,
              rewardCode: reservedReward.rewardCode,
            });
            referralRewardEmailSent = true;
          } catch (error) {
            console.error("Referral reward email failed", error);
            referralRewardEmailError = "Request was marked completed, but the referral reward email failed to send.";
            await markReferralRewardEmailFailed({
              db,
              code: reservedReward.code,
              requestId: id,
              referrerRequestId: reservedReward.referrerRequestId,
              errorMessage: referralRewardEmailError,
            });
          }
        }
      } catch (error) {
        console.error("Referral reward handling failed", error);
        referralRewardEmailError = "Request was marked completed, but referral reward handling failed.";
      }
    }

    return NextResponse.json({ ok: true, emailSent, emailSkipped, emailError, referralRewardEmailSent, referralRewardEmailError });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to update status." }, { status: 500 });
  }
}
