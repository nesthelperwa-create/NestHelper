import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import {
  getLaunchRewardsPhase,
  getPacificMonthKey,
  launchRewardPrizes,
  LAUNCH_REWARDS_CAMPAIGN_ID,
  LAUNCH_REWARDS_GRAND_PRIZE_MONTHLY_LIMIT,
  LAUNCH_REWARDS_MAX_SPINS_PER_MONTH,
  LAUNCH_REWARDS_SPIN_COOLDOWN_DAYS,
  launchRewardsTotalWeight,
  type LaunchRewardPrize,
} from "@/lib/launchRewards";
import {
  createOpaqueToken,
  createRewardDates,
  createRewardReference,
  enforcePersistentRateLimit,
  getClientIpHash,
  getTimestampMillis,
  LaunchRewardsError,
  requireRewardsAppCheck,
  requireRewardsSession,
  secureHash,
} from "@/lib/launchRewardsServer";

export const runtime = "nodejs";

const ODDS_VERSION = "launch-2026-v1";
const grandPrize = launchRewardPrizes.find((prize) => prize.id === "parent-reset-grand")!;
const nonGrandPrizes = launchRewardPrizes.filter((prize) => prize.id !== "parent-reset-grand");
const nonGrandTotalWeight = nonGrandPrizes.reduce((sum, prize) => sum + prize.weight, 0);

function selectPrize(prizes: LaunchRewardPrize[], totalWeight: number, draw: number) {
  let cursor = 0;
  for (const prize of prizes) {
    cursor += prize.weight;
    if (draw < cursor) return prize;
  }
  return prizes[prizes.length - 1];
}

function serializePrize(prize: LaunchRewardPrize, reward: Record<string, unknown>) {
  return {
    prizeId: prize.id,
    prizeIndex: launchRewardPrizes.findIndex((item) => item.id === prize.id),
    title: prize.title,
    description: prize.description,
    customerMessage: prize.customerMessage,
    referenceCode: String(reward.referenceCode || ""),
    status: String(reward.status || "issued"),
    publicToken: String(reward.publicToken || ""),
    expiresAt: String(reward.expiresAtIso || ""),
    claimDeadline: String(reward.claimDeadlineIso || ""),
    requiresManualVerification: prize.requiresManualVerification === true,
    useHref: reward.publicToken
      ? `/request?reward=${encodeURIComponent(String(reward.publicToken))}${prize.eligibleServiceIds[0] ? `&service=${encodeURIComponent(prize.eligibleServiceIds[0])}` : ""}`
      : "",
  };
}

export async function POST(request: NextRequest) {
  try {
    if (getLaunchRewardsPhase() !== "live") {
      throw new LaunchRewardsError("Launch Rewards is not open for spins right now.", 403, "promotion_not_live");
    }

    await requireRewardsAppCheck(request, { consume: true });

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const idempotencyKey = String(body.idempotencyKey || "").trim();
    if (!/^[A-Za-z0-9_-]{12,100}$/.test(idempotencyKey)) {
      throw new LaunchRewardsError("The spin request was incomplete. Refresh the page and try again.", 400, "invalid_spin_request");
    }

    const { session } = await requireRewardsSession(request);
    const ipHash = getClientIpHash(request);
    const participantHash = secureHash(session.participantId, "participant-rate-limit");

    await Promise.all([
      enforcePersistentRateLimit({
        scope: "spin-ip",
        key: ipHash,
        limit: 30,
        windowMs: 24 * 60 * 60 * 1000,
        message: "Too many spin requests were made from this connection. Please try again later.",
      }),
      enforcePersistentRateLimit({
        scope: "spin-participant",
        key: participantHash,
        limit: 12,
        windowMs: 24 * 60 * 60 * 1000,
        message: "Too many spin requests were made for this account. Please try again later.",
      }),
    ]);

    const nowMs = Date.now();
    const monthKey = getPacificMonthKey(new Date(nowMs));
    const requestKeyHash = secureHash(idempotencyKey, "spin-idempotency").slice(0, 32);
    const requestRefId = `${session.participantId}_${requestKeyHash}`;
    const spinId = createOpaqueToken(18);
    const rewardId = createOpaqueToken(18);
    const rewardPublicToken = createOpaqueToken(32);
    const referenceCode = createRewardReference();
    const primaryDraw = randomInt(launchRewardsTotalWeight);
    const fallbackDraw = randomInt(nonGrandTotalWeight);
    const db = getFirebaseAdminDb();

    const result = await db.runTransaction(async (transaction) => {
      const requestRef = db.collection("launchRewardSpinRequests").doc(requestRefId);
      const requestSnapshot = await transaction.get(requestRef);
      if (requestSnapshot.exists) {
        const stored = requestSnapshot.data() || {};
        const storedPrize = launchRewardPrizes.find((prize) => prize.id === stored.prizeId);
        if (!storedPrize) throw new LaunchRewardsError("The saved spin result could not be loaded.", 500, "saved_result_missing");
        return {
          duplicate: true,
          prize: storedPrize,
          reward: stored.rewardSnapshot as Record<string, unknown>,
          grandPrizeAvailable: stored.grandPrizeAvailableAfter !== false,
          nextEligibleSpinAt: String(stored.nextEligibleSpinAtIso || ""),
          spinsThisMonth: Number(stored.spinsThisMonth || 0),
        };
      }

      const participantRef = db.collection("launchRewardParticipants").doc(session.participantId);
      const participantMonthRef = db.collection("launchRewardParticipantMonths").doc(`${session.participantId}_${monthKey}`);
      const grandMonthRef = db.collection("launchRewardGrandPrizeMonths").doc(monthKey);
      const [participantSnapshot, participantMonthSnapshot, grandMonthSnapshot] = await Promise.all([
        transaction.get(participantRef),
        transaction.get(participantMonthRef),
        transaction.get(grandMonthRef),
      ]);

      if (!participantSnapshot.exists) {
        throw new LaunchRewardsError("Your rewards account could not be found. Verify again to continue.", 401, "participant_missing");
      }
      const participant = participantSnapshot.data() || {};
      if (participant.status === "blocked") {
        throw new LaunchRewardsError("This rewards account is not eligible to participate.", 403, "participant_blocked");
      }
      if (Number(participant.sessionVersion || 1) !== session.sessionVersion) {
        throw new LaunchRewardsError("Verify your information again to continue.", 401, "session_expired");
      }

      const nextEligibleMs = getTimestampMillis(participant.nextEligibleSpinAt);
      if (nextEligibleMs > nowMs) {
        throw new LaunchRewardsError(
          `Your next spin unlocks ${new Date(nextEligibleMs).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`,
          409,
          "spin_cooldown"
        );
      }

      const spinCount = Number(participantMonthSnapshot.data()?.spinCount || 0);
      if (spinCount >= LAUNCH_REWARDS_MAX_SPINS_PER_MONTH) {
        throw new LaunchRewardsError("You have used all four spins available for this calendar month.", 409, "monthly_spin_limit");
      }

      const winnerCount = Number(grandMonthSnapshot.data()?.winnerCount || 0);
      const grandAvailable = winnerCount < LAUNCH_REWARDS_GRAND_PRIZE_MONTHLY_LIMIT;
      const initiallySelected = selectPrize(launchRewardPrizes, launchRewardsTotalWeight, primaryDraw);
      const selectedPrize = initiallySelected.id === grandPrize.id && !grandAvailable
        ? selectPrize(nonGrandPrizes, nonGrandTotalWeight, fallbackDraw)
        : initiallySelected;
      const isGrandWinner = selectedPrize.id === grandPrize.id && grandAvailable;
      const nextEligibleSpinAtMs = nowMs + LAUNCH_REWARDS_SPIN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const dates = createRewardDates(selectedPrize, nowMs);
      const rewardStatus = isGrandWinner ? "pending_verification" : "issued";
      const rewardSnapshot = {
        referenceCode,
        publicToken: rewardPublicToken,
        status: rewardStatus,
        expiresAtIso: dates.expiresAtIso,
        claimDeadlineIso: dates.claimDeadlineIso,
      };

      const spinRef = db.collection("launchRewardSpins").doc(spinId);
      const rewardRef = db.collection("launchRewards").doc(rewardId);

      transaction.create(spinRef, {
        campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
        participantId: session.participantId,
        monthKey,
        prizeId: selectedPrize.id,
        prizeTitle: selectedPrize.title,
        rewardId,
        oddsVersion: ODDS_VERSION,
        primaryDraw,
        fallbackUsed: initiallySelected.id === grandPrize.id && !grandAvailable,
        grandPrizeAvailableBefore: grandAvailable,
        ipHash,
        deviceHash: secureHash(session.deviceId, "device"),
        idempotencyHash: requestKeyHash,
        status: "completed",
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.create(rewardRef, {
        campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
        participantId: session.participantId,
        spinId,
        monthKey,
        prizeId: selectedPrize.id,
        prizeTitle: selectedPrize.title,
        rewardKind: selectedPrize.rewardKind,
        valueCents: selectedPrize.valueCents,
        eligibleServiceIds: selectedPrize.eligibleServiceIds,
        minimumSubtotalCents: selectedPrize.minimumSubtotalCents || 0,
        requiresPaidService: selectedPrize.requiresPaidService,
        requiresManualVerification: selectedPrize.requiresManualVerification === true,
        referenceCode,
        publicToken: rewardPublicToken,
        publicTokenHash: secureHash(rewardPublicToken, "reward-public-token"),
        status: rewardStatus,
        expiresAt: dates.expiresAt,
        expiresAtIso: dates.expiresAtIso,
        claimDeadline: dates.claimDeadline,
        claimDeadlineIso: dates.claimDeadlineIso,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(participantMonthRef, {
        campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
        participantId: session.participantId,
        monthKey,
        spinCount: spinCount + 1,
        lastSpinAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: participantMonthSnapshot.data()?.createdAt || FieldValue.serverTimestamp(),
      }, { merge: true });

      transaction.update(participantRef, {
        totalSpins: Number(participant.totalSpins || 0) + 1,
        lastSpinAt: FieldValue.serverTimestamp(),
        lastPrizeId: selectedPrize.id,
        nextEligibleSpinAt: Timestamp.fromMillis(nextEligibleSpinAtMs),
        updatedAt: FieldValue.serverTimestamp(),
        ipHashes: FieldValue.arrayUnion(ipHash),
      });

      if (isGrandWinner) {
        transaction.set(grandMonthRef, {
          campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
          monthKey,
          winnerCount: winnerCount + 1,
          winnerParticipantId: session.participantId,
          winnerSpinId: spinId,
          winnerRewardId: rewardId,
          status: "pending_verification",
          claimedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: grandMonthSnapshot.data()?.createdAt || FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      transaction.create(requestRef, {
        campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
        participantId: session.participantId,
        idempotencyHash: requestKeyHash,
        spinId,
        rewardId,
        prizeId: selectedPrize.id,
        rewardSnapshot,
        spinsThisMonth: spinCount + 1,
        nextEligibleSpinAtIso: new Date(nextEligibleSpinAtMs).toISOString(),
        grandPrizeAvailableAfter: isGrandWinner ? false : grandAvailable,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        duplicate: false,
        prize: selectedPrize,
        reward: rewardSnapshot,
        grandPrizeAvailable: isGrandWinner ? false : grandAvailable,
        nextEligibleSpinAt: new Date(nextEligibleSpinAtMs).toISOString(),
        spinsThisMonth: spinCount + 1,
      };
    });

    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      result: serializePrize(result.prize, result.reward),
      grandPrizeAvailable: result.grandPrizeAvailable,
      nextEligibleSpinAt: result.nextEligibleSpinAt,
      spinsThisMonth: result.spinsThisMonth,
      spinsRemainingThisMonth: Math.max(0, LAUNCH_REWARDS_MAX_SPINS_PER_MONTH - result.spinsThisMonth),
    });
  } catch (error) {
    console.error("Launch Rewards spin failed", error);
    const status = error instanceof LaunchRewardsError ? error.status : 500;
    const message = error instanceof LaunchRewardsError ? error.message : "The wheel could not complete this spin. Please try again.";
    const code = error instanceof LaunchRewardsError ? error.code : "spin_failed";
    return NextResponse.json({ ok: false, error: message, code }, { status });
  }
}
