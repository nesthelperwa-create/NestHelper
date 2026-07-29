import { NextResponse } from "next/server";
import { preparePublicSubmission, PublicFormError, publicFormErrorResponse } from "@/lib/publicFormSecurity";
import { claimIncomingFamilyReferral, getIncomingReferralCodeFromPayload } from "@/lib/referrals";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { saveSubmission } from "@/lib/saveSubmission";
import { getLaunchRewardTokenFromPayload, reserveLaunchRewardForRequest } from "@/lib/launchRewardsRedemption";

export async function POST(request: Request) {
  try {
    const payload = await preparePublicSubmission(request, "serviceRequests");
    const incomingReferralCode = getIncomingReferralCodeFromPayload(payload);
    const launchRewardToken = getLaunchRewardTokenFromPayload(payload);

    if (incomingReferralCode && launchRewardToken) {
      throw new PublicFormError("Launch Rewards cannot be combined with a referral credit.", 400);
    }

    const result = await saveSubmission({
      collection: "serviceRequests",
      payload,
      emailSubject: launchRewardToken
        ? "New NestHelper Request with Launch Reward"
        : incomingReferralCode
          ? "New Referred NestHelper Service Request"
          : "New NestHelper Service Request",
      emailTitle: launchRewardToken
        ? "New Service Request with Launch Reward"
        : incomingReferralCode
          ? "New Referred Service Request"
          : "New Service Request",
      adminPath: "/admin/requests",
      beforeNotifications: incomingReferralCode || launchRewardToken
        ? async ({ docId, docRef, cleaned }) => {
            const db = getFirebaseAdminDb();
            try {
              if (launchRewardToken) {
                return await reserveLaunchRewardForRequest({
                  db,
                  requestRef: docRef,
                  requestId: docId,
                  payload: cleaned,
                });
              }

              return await claimIncomingFamilyReferral({
                db,
                requestRef: docRef,
                requestId: docId,
                payload: cleaned,
              });
            } catch (error) {
              throw new PublicFormError(error instanceof Error ? error.message : "This promotion could not be accepted.", 400);
            }
          }
        : undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicFormErrorResponse(error, "Unable to submit request.");
  }
}
