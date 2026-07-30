import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { getLaunchRewardsPhase, LAUNCH_REWARDS_CAMPAIGN_ID } from "@/lib/launchRewards";
import {
  createOpaqueToken,
  createSecureEmailVerificationCode,
  ensureRewardsDevice,
  enforcePersistentRateLimit,
  getClientIpHash,
  hashEmailVerificationCode,
  LaunchRewardsError,
  requireRewardsAppCheck,
  normalizeEmailAddress,
  normalizeFirstName,
  normalizeZip,
  readRewardsTestMode,
  secureHash,
  verifyFirebasePhoneToken,
} from "@/lib/launchRewardsServer";
import { sendLaunchRewardCodeEmail } from "@/lib/sendLaunchRewardCodeEmail";

export const runtime = "nodejs";

function maskedEmail(email: string) {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(2, Math.min(6, local.length - visible.length)))}@${domain}`;
}

export async function POST(request: NextRequest) {
  const placeholderResponse = NextResponse.json({ ok: false }, { status: 500 });
  const deviceId = ensureRewardsDevice(request, placeholderResponse);

  try {
    const testMode = readRewardsTestMode(request);
    const fullVerificationTest = testMode?.testType === "full";

    if (getLaunchRewardsPhase() !== "live" && !fullVerificationTest) {
      throw new LaunchRewardsError("Launch Rewards is not open for spins yet.", 403, "promotion_not_live");
    }

    await requireRewardsAppCheck(request);

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (String(body.website || "").trim()) {
      const honeypotResponse = NextResponse.json({ ok: true, verificationId: "pending", maskedEmail: "your email" });
      ensureRewardsDevice(request, honeypotResponse, deviceId);
      return honeypotResponse;
    }
    if (body.rulesAccepted !== true) {
      throw new LaunchRewardsError("Please agree to the Official Rules before continuing.", 400, "rules_required");
    }

    const firstName = normalizeFirstName(body.firstName);
    const email = normalizeEmailAddress(body.email);
    const zip = normalizeZip(body.zip);
    const phoneAuthToken = String(body.phoneAuthToken || "");
    const phoneIdentity = await verifyFirebasePhoneToken(phoneAuthToken);
    const emailHash = secureHash(email, "email");
    const phoneHash = secureHash(phoneIdentity.phone, "phone");
    const ipHash = getClientIpHash(request);
    const deviceHash = secureHash(deviceId, "device");
    const ratePrefix = fullVerificationTest ? "full-test-" : "";

    await Promise.all([
      enforcePersistentRateLimit({
        scope: `${ratePrefix}request-email-code-ip`,
        key: fullVerificationTest ? `${testMode!.sessionId}:${ipHash}` : ipHash,
        limit: fullVerificationTest ? 12 : 6,
        windowMs: 60 * 60 * 1000,
        message: "Too many code requests were made from this connection. Please try again later.",
      }),
      enforcePersistentRateLimit({
        scope: `${ratePrefix}request-email-code-email`,
        key: fullVerificationTest ? `${testMode!.sessionId}:${emailHash}` : emailHash,
        limit: fullVerificationTest ? 8 : 4,
        windowMs: 60 * 60 * 1000,
        message: "Too many codes were requested for this email. Please wait before requesting another.",
      }),
      enforcePersistentRateLimit({
        scope: `${ratePrefix}request-email-code-phone`,
        key: fullVerificationTest ? `${testMode!.sessionId}:${phoneHash}` : phoneHash,
        limit: fullVerificationTest ? 8 : 4,
        windowMs: 60 * 60 * 1000,
        message: "Too many codes were requested for this phone number. Please wait before requesting another.",
      }),
    ]);

    const verificationId = createOpaqueToken(18);
    const code = createSecureEmailVerificationCode();
    const expiresAtMs = Date.now() + 10 * 60 * 1000;
    const collectionName = fullVerificationTest
      ? "launchRewardTestEmailVerifications"
      : "launchRewardEmailVerifications";
    const verificationRef = getFirebaseAdminDb().collection(collectionName).doc(verificationId);

    await verificationRef.set({
      campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
      testOnly: fullVerificationTest,
      testSessionId: fullVerificationTest ? testMode!.sessionId : null,
      adminEmail: fullVerificationTest ? testMode!.adminEmail : null,
      firstName,
      email,
      emailHash,
      phone: phoneIdentity.phone,
      phoneHash,
      phoneAuthUid: phoneIdentity.uid,
      zip,
      codeHash: hashEmailVerificationCode({ emailHash, verificationId, code }),
      attempts: 0,
      status: "pending",
      rulesAcceptedAt: FieldValue.serverTimestamp(),
      marketingOptIn: fullVerificationTest ? false : body.marketingOptIn === true,
      deviceHash,
      ipHash,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(expiresAtMs),
    });

    try {
      await sendLaunchRewardCodeEmail({ email, firstName, code, testOnly: fullVerificationTest });
      await verificationRef.update({ emailDelivery: "sent", emailSentAt: FieldValue.serverTimestamp() });
    } catch (error) {
      await verificationRef.delete().catch(() => undefined);
      throw error;
    }

    const success = NextResponse.json({
      ok: true,
      verificationId,
      maskedEmail: maskedEmail(email),
      expiresAt: new Date(expiresAtMs).toISOString(),
      testOnly: fullVerificationTest,
    });
    ensureRewardsDevice(request, success, deviceId);
    return success;
  } catch (error) {
    console.error("Launch Rewards email code request failed", error);
    const status = error instanceof LaunchRewardsError ? error.status : 500;
    const message = error instanceof LaunchRewardsError ? error.message : "We could not send the verification email. Please try again.";
    const code = error instanceof LaunchRewardsError ? error.code : "request_code_failed";
    const failure = NextResponse.json({ ok: false, error: message, code }, { status });
    ensureRewardsDevice(request, failure, deviceId);
    return failure;
  }
}
