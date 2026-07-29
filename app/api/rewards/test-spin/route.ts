import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { getLaunchRewardPrize, launchRewardPrizes, LAUNCH_REWARDS_CAMPAIGN_ID } from "@/lib/launchRewards";
import {
  createOpaqueToken,
  enforcePersistentRateLimit,
  getClientIpHash,
  LaunchRewardsError,
  readRewardsTestMode,
  requireRewardsAppCheck,
  secureHash,
} from "@/lib/launchRewardsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeTestPrize(prizeId: string, referenceCode: string) {
  const prize = getLaunchRewardPrize(prizeId);
  if (!prize) throw new LaunchRewardsError("The selected test prize is unavailable.", 400, "invalid_test_prize");
  return {
    prizeId: prize.id,
    prizeIndex: launchRewardPrizes.findIndex((item) => item.id === prize.id),
    title: prize.title,
    description: prize.description,
    customerMessage: `${prize.customerMessage} This is a test result only and cannot be redeemed.`,
    referenceCode,
    status: "test_only",
    publicToken: "",
    expiresAt: "",
    claimDeadline: "",
    requiresManualVerification: false,
    useHref: "",
    testOnly: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const mode = readRewardsTestMode(request);
    if (!mode) {
      throw new LaunchRewardsError("Admin test mode is not enabled for this browser.", 403, "test_mode_required");
    }

    await requireRewardsAppCheck(request, { consume: true });
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const idempotencyKey = String(body.idempotencyKey || "").trim();
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
      throw new LaunchRewardsError("The secure test-spin request is invalid. Refresh and try again.", 400, "invalid_idempotency_key");
    }

    const ipHash = getClientIpHash(request);
    await enforcePersistentRateLimit({
      scope: "admin-test-spin",
      key: `${mode.sessionId}:${ipHash}`,
      limit: 40,
      windowMs: 60 * 60 * 1000,
      message: "Too many test spins were requested. Wait before testing again.",
    });

    const db = getFirebaseAdminDb();
    const requestId = secureHash(`${mode.sessionId}:${idempotencyKey}`, "test-spin-request").slice(0, 60);
    const result = await db.runTransaction(async (transaction) => {
      const requestRef = db.collection("launchRewardTestSpinRequests").doc(requestId);
      const existing = await transaction.get(requestRef);
      if (existing.exists) {
        const stored = existing.data() || {};
        return {
          duplicate: true,
          prizeId: String(stored.prizeId || mode.prizeId),
          referenceCode: String(stored.referenceCode || "TEST-SAVED"),
        };
      }

      const prize = getLaunchRewardPrize(mode.prizeId);
      if (!prize) throw new LaunchRewardsError("The selected test prize is unavailable.", 400, "invalid_test_prize");
      const spinId = createOpaqueToken(18);
      const referenceCode = `TEST-${randomInt(100000, 999999)}`;
      const record = {
        campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
        testOnly: true,
        redeemable: false,
        adminEmail: mode.adminEmail,
        testSessionId: mode.sessionId,
        prizeId: prize.id,
        prizeTitle: prize.title,
        referenceCode,
        ipHash,
        status: "test_only",
        createdAt: FieldValue.serverTimestamp(),
      };

      transaction.create(db.collection("launchRewardTestSpins").doc(spinId), record);
      transaction.create(requestRef, {
        ...record,
        spinId,
        idempotencyHash: secureHash(idempotencyKey, "test-spin-idempotency"),
      });
      return { duplicate: false, prizeId: prize.id, referenceCode };
    });

    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      testMode: true,
      result: serializeTestPrize(result.prizeId, result.referenceCode),
      grandPrizeAvailable: true,
      nextEligibleSpinAt: null,
      spinsThisMonth: 0,
      spinsRemainingThisMonth: 99,
    });
  } catch (error) {
    console.error("Launch Rewards test spin failed", error);
    const status = error instanceof LaunchRewardsError ? error.status : 500;
    const message = error instanceof LaunchRewardsError ? error.message : "The test spin could not be completed.";
    const code = error instanceof LaunchRewardsError ? error.code : "test_spin_failed";
    return NextResponse.json({ ok: false, error: message, code }, { status });
  }
}
