import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { LAUNCH_REWARDS_CAMPAIGN_ID } from "@/lib/launchRewards";
import {
  createOpaqueToken,
  enforcePersistentRateLimit,
  getClientIpHash,
  hashEmailVerificationCode,
  LaunchRewardsError,
  requireRewardsAppCheck,
  readRewardsDeviceId,
  readRewardsTestMode,
  secureHash,
  secureValueMatches,
  setRewardsSession,
  setRewardsTestMode,
  verifyFirebasePhoneToken,
} from "@/lib/launchRewardsServer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireRewardsAppCheck(request);

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const verificationId = String(body.verificationId || "").trim();
    const code = String(body.code || "").replace(/\D/g, "").slice(0, 6);
    const phoneAuthToken = String(body.phoneAuthToken || "");
    const deviceId = readRewardsDeviceId(request);
    const testMode = readRewardsTestMode(request);
    const fullVerificationTest = testMode?.testType === "full";

    if (!/^[A-Za-z0-9_-]{16,80}$/.test(verificationId) || code.length !== 6) {
      throw new LaunchRewardsError("Enter the 6-digit code from your email.", 400, "invalid_email_code");
    }
    if (!deviceId) {
      throw new LaunchRewardsError("Your verification session expired. Please start again.", 401, "device_session_missing");
    }

    const phoneIdentity = await verifyFirebasePhoneToken(phoneAuthToken);
    const ipHash = getClientIpHash(request);
    const deviceHash = secureHash(deviceId, "device");

    await Promise.all([
      enforcePersistentRateLimit({
        scope: fullVerificationTest ? "full-test-verify-email-code-ip" : "verify-email-code-ip",
        key: fullVerificationTest ? `${testMode!.sessionId}:${ipHash}` : ipHash,
        limit: fullVerificationTest ? 30 : 20,
        windowMs: 15 * 60 * 1000,
        message: "Too many verification attempts were made from this connection. Please wait and try again.",
      }),
      enforcePersistentRateLimit({
        scope: fullVerificationTest ? "full-test-verify-email-code-record" : "verify-email-code-record",
        key: verificationId,
        limit: fullVerificationTest ? 12 : 8,
        windowMs: 15 * 60 * 1000,
        message: "Too many incorrect code attempts. Request a new code.",
      }),
    ]);

    const db = getFirebaseAdminDb();
    const verificationRef = db
      .collection(fullVerificationTest ? "launchRewardTestEmailVerifications" : "launchRewardEmailVerifications")
      .doc(verificationId);
    const verificationPreflightSnapshot = await verificationRef.get();
    if (!verificationPreflightSnapshot.exists) {
      throw new LaunchRewardsError("This code is no longer available. Request a new code.", 400, "verification_not_found");
    }
    const verificationPreflight = verificationPreflightSnapshot.data() || {};
    const preflightExpiresAt = verificationPreflight.expiresAt instanceof Timestamp
      ? verificationPreflight.expiresAt.toMillis()
      : 0;
    if (verificationPreflight.status !== "pending" || !preflightExpiresAt || preflightExpiresAt <= Date.now()) {
      throw new LaunchRewardsError("This code expired or has already been used. Request a new code.", 400, "verification_unavailable");
    }
    if (verificationPreflight.phone !== phoneIdentity.phone || verificationPreflight.phoneAuthUid !== phoneIdentity.uid) {
      throw new LaunchRewardsError("Phone verification does not match this email code.", 401, "phone_mismatch");
    }
    if (verificationPreflight.deviceHash !== deviceHash) {
      throw new LaunchRewardsError("This code must be completed on the same device that requested it.", 401, "device_mismatch");
    }
    const preflightExpectedCodeHash = hashEmailVerificationCode({
      emailHash: String(verificationPreflight.emailHash || ""),
      verificationId,
      code,
    });
    if (!secureValueMatches(String(verificationPreflight.codeHash || ""), preflightExpectedCodeHash)) {
      await verificationRef.update({
        attempts: Number(verificationPreflight.attempts || 0) + 1,
        lastAttemptAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      throw new LaunchRewardsError("That email code is not correct.", 400, "incorrect_email_code");
    }

    if (fullVerificationTest) {
      if (!testMode || verificationPreflight.testOnly !== true || verificationPreflight.testSessionId !== testMode.sessionId) {
        throw new LaunchRewardsError("This test verification does not match the active admin test session.", 401, "test_session_mismatch");
      }

      await db.runTransaction(async (transaction) => {
        const verificationSnapshot = await transaction.get(verificationRef);
        if (!verificationSnapshot.exists) {
          throw new LaunchRewardsError("This code is no longer available. Request a new code.", 400, "verification_not_found");
        }
        const verification = verificationSnapshot.data() || {};
        const expiresAt = verification.expiresAt instanceof Timestamp ? verification.expiresAt.toMillis() : 0;
        if (verification.status !== "pending" || !expiresAt || expiresAt <= Date.now()) {
          throw new LaunchRewardsError("This code expired or has already been used. Request a new code.", 400, "verification_unavailable");
        }
        if (verification.testOnly !== true || verification.testSessionId !== testMode.sessionId) {
          throw new LaunchRewardsError("This test verification does not match the active admin test session.", 401, "test_session_mismatch");
        }
        if (verification.phone !== phoneIdentity.phone || verification.phoneAuthUid !== phoneIdentity.uid) {
          throw new LaunchRewardsError("Phone verification does not match this email code.", 401, "phone_mismatch");
        }
        if (verification.deviceHash !== deviceHash) {
          throw new LaunchRewardsError("This code must be completed on the same device that requested it.", 401, "device_mismatch");
        }
        const expectedCodeHash = hashEmailVerificationCode({
          emailHash: String(verification.emailHash || ""),
          verificationId,
          code,
        });
        if (!secureValueMatches(String(verification.codeHash || ""), expectedCodeHash)) {
          throw new LaunchRewardsError("That email code is not correct.", 400, "incorrect_email_code");
        }
        transaction.update(verificationRef, {
          status: "consumed",
          consumedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      const response = NextResponse.json({ ok: true, verified: true, testOnly: true });
      setRewardsTestMode(response, {
        ...testMode,
        testType: "full",
        fullVerified: true,
        testIdentity: {
          firstName: String(verificationPreflight.firstName || "Admin"),
          email: String(verificationPreflight.email || ""),
          phone: String(verificationPreflight.phone || ""),
          zip: String(verificationPreflight.zip || ""),
        },
      });
      return response;
    }

    const participantId = await db.runTransaction(async (transaction) => {
      const verificationSnapshot = await transaction.get(verificationRef);
      if (!verificationSnapshot.exists) {
        throw new LaunchRewardsError("This code is no longer available. Request a new code.", 400, "verification_not_found");
      }

      const verification = verificationSnapshot.data() || {};
      if (verification.status !== "pending") {
        throw new LaunchRewardsError("This code has already been used. Sign in again if needed.", 400, "verification_used");
      }
      const expiresAt = verification.expiresAt instanceof Timestamp ? verification.expiresAt.toMillis() : 0;
      if (!expiresAt || expiresAt <= Date.now()) {
        throw new LaunchRewardsError("This code expired. Request a new code.", 400, "verification_expired");
      }
      if (verification.phone !== phoneIdentity.phone || verification.phoneAuthUid !== phoneIdentity.uid) {
        throw new LaunchRewardsError("Phone verification does not match this email code.", 401, "phone_mismatch");
      }
      if (verification.deviceHash !== deviceHash) {
        throw new LaunchRewardsError("This code must be completed on the same device that requested it.", 401, "device_mismatch");
      }

      const expectedCodeHash = hashEmailVerificationCode({
        emailHash: String(verification.emailHash || ""),
        verificationId,
        code,
      });
      if (!secureValueMatches(String(verification.codeHash || ""), expectedCodeHash)) {
        throw new LaunchRewardsError("That email code is not correct.", 400, "incorrect_email_code");
      }

      const emailHash = String(verification.emailHash || "");
      const phoneHash = String(verification.phoneHash || "");
      const emailLockRef = db.collection("launchRewardIdentityLocks").doc(`email_${emailHash.slice(0, 56)}`);
      const phoneLockRef = db.collection("launchRewardIdentityLocks").doc(`phone_${phoneHash.slice(0, 56)}`);
      const [emailLockSnapshot, phoneLockSnapshot] = await Promise.all([
        transaction.get(emailLockRef),
        transaction.get(phoneLockRef),
      ]);

      const emailParticipantId = String(emailLockSnapshot.data()?.participantId || "");
      const phoneParticipantId = String(phoneLockSnapshot.data()?.participantId || "");
      if (emailParticipantId && phoneParticipantId && emailParticipantId !== phoneParticipantId) {
        throw new LaunchRewardsError(
          "This email or phone number is already connected to another rewards account. Contact NestHelper if this is an error.",
          409,
          "identity_conflict"
        );
      }

      const resolvedParticipantId = emailParticipantId || phoneParticipantId || createOpaqueToken(18);
      const participantRef = db.collection("launchRewardParticipants").doc(resolvedParticipantId);
      const participantSnapshot = await transaction.get(participantRef);
      const participant = participantSnapshot.data() || {};
      if (participant.status === "blocked") {
        throw new LaunchRewardsError("This rewards account is not eligible to participate.", 403, "participant_blocked");
      }

      const sessionVersion = Math.max(1, Number(participant.sessionVersion || 1));
      transaction.set(
        participantRef,
        {
          campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
          firstName: verification.firstName,
          email: verification.email,
          emailHash,
          phone: verification.phone,
          phoneHash,
          zip: verification.zip,
          phoneAuthUid: phoneIdentity.uid,
          emailVerified: true,
          phoneVerified: true,
          status: participant.status || "active",
          sessionVersion,
          marketingOptIn: verification.marketingOptIn === true,
          rulesAcceptedAt: verification.rulesAcceptedAt || FieldValue.serverTimestamp(),
          verifiedAt: participant.verifiedAt || FieldValue.serverTimestamp(),
          lastVerifiedAt: FieldValue.serverTimestamp(),
          lastSeenAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: participant.createdAt || FieldValue.serverTimestamp(),
          deviceHashes: FieldValue.arrayUnion(deviceHash),
          ipHashes: FieldValue.arrayUnion(ipHash),
        },
        { merge: true }
      );
      transaction.set(emailLockRef, {
        campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
        identityType: "email",
        participantId: resolvedParticipantId,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: emailLockSnapshot.data()?.createdAt || FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(phoneLockRef, {
        campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
        identityType: "phone",
        participantId: resolvedParticipantId,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: phoneLockSnapshot.data()?.createdAt || FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.update(verificationRef, {
        status: "consumed",
        participantId: resolvedParticipantId,
        consumedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { id: resolvedParticipantId, sessionVersion };
    });

    const response = NextResponse.json({ ok: true, verified: true });
    setRewardsSession(response, {
      version: 1,
      participantId: participantId.id,
      deviceId,
      sessionVersion: participantId.sessionVersion,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
    return response;
  } catch (error) {
    console.error("Launch Rewards email verification failed", error);
    const status = error instanceof LaunchRewardsError ? error.status : 500;
    const message = error instanceof LaunchRewardsError ? error.message : "We could not verify the code. Please try again.";
    const code = error instanceof LaunchRewardsError ? error.code : "verification_failed";
    return NextResponse.json({ ok: false, error: message, code }, { status });
  }
}
