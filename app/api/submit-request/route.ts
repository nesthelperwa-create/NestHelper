import { NextResponse } from "next/server";
import { preparePublicSubmission, PublicFormError, publicFormErrorResponse } from "@/lib/publicFormSecurity";
import { claimIncomingFamilyReferral, getIncomingReferralCodeFromPayload } from "@/lib/referrals";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { saveSubmission } from "@/lib/saveSubmission";

export async function POST(request: Request) {
  try {
    const payload = await preparePublicSubmission(request, "serviceRequests");
    const incomingReferralCode = getIncomingReferralCodeFromPayload(payload);

    const result = await saveSubmission({
      collection: "serviceRequests",
      payload,
      emailSubject: incomingReferralCode ? "New Referred NestHelper Service Request" : "New NestHelper Service Request",
      emailTitle: incomingReferralCode ? "New Referred Service Request" : "New Service Request",
      adminPath: "/admin/requests",
      beforeNotifications: incomingReferralCode
        ? async ({ docId, docRef, cleaned }) => {
            const db = getFirebaseAdminDb();
            try {
              return await claimIncomingFamilyReferral({
                db,
                requestRef: docRef,
                requestId: docId,
                payload: cleaned,
              });
            } catch (error) {
              throw new PublicFormError(error instanceof Error ? error.message : "This referral link could not be accepted.", 400);
            }
          }
        : undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicFormErrorResponse(error, "Unable to submit request.");
  }
}
