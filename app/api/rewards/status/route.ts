import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import {
  getLaunchRewardPrize,
  getLaunchRewardsPhase,
  getPacificMonthKey,
  LAUNCH_REWARDS_GRAND_PRIZE_MONTHLY_LIMIT,
  LAUNCH_REWARDS_LAUNCH_AT,
  LAUNCH_REWARDS_END_AT,
  LAUNCH_REWARDS_MAX_SPINS_PER_MONTH,
} from "@/lib/launchRewards";
import {
  clearRewardsSession,
  ensureRewardsDevice,
  getTimestampMillis,
  readRewardsSession,
  readRewardsTestMode,
} from "@/lib/launchRewardsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskEmail(value: string) {
  const [local, domain] = value.split("@");
  if (!domain) return "";
  return `${local.slice(0, 2)}••••@${domain}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? `••• ••• ${digits.slice(-4)}` : "";
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const actualPhase = getLaunchRewardsPhase(now);
    const testMode = readRewardsTestMode(request);

    if (testMode) {
      const testPrize = getLaunchRewardPrize(testMode.prizeId);
      const response = NextResponse.json({
        ok: true,
        phase: "live",
        actualPhase,
        launchAt: LAUNCH_REWARDS_LAUNCH_AT,
        endAt: LAUNCH_REWARDS_END_AT,
        verified: true,
        testMode: true,
        testModeExpiresAt: new Date(testMode.expiresAt).toISOString(),
        testPrizeId: testPrize?.id || testMode.prizeId,
        testPrizeTitle: testPrize?.title || "Selected test prize",
        participant: {
          firstName: "Admin test",
          maskedEmail: maskEmail(testMode.adminEmail),
          maskedPhone: "Test mode",
          zip: "—",
        },
        grandPrizeAvailable: true,
        monthKey: getPacificMonthKey(new Date(now)),
        spinsThisMonth: 0,
        spinsRemainingThisMonth: 99,
        maxSpinsPerMonth: 99,
        nextEligibleSpinAt: null,
        canSpin: true,
        rewards: [],
      });
      ensureRewardsDevice(request, response, testMode.deviceId);
      return response;
    }

    const phase = actualPhase;
    const monthKey = getPacificMonthKey(new Date(now));
    const db = getFirebaseAdminDb();
    const grandSnapshot = await db.collection("launchRewardGrandPrizeMonths").doc(monthKey).get();
    const winnerCount = Number(grandSnapshot.data()?.winnerCount || 0);
    const grandPrizeAvailable = phase === "live" && winnerCount < LAUNCH_REWARDS_GRAND_PRIZE_MONTHLY_LIMIT;
    const session = readRewardsSession(request);

    if (!session) {
      const response = NextResponse.json({
        ok: true,
        phase,
        launchAt: LAUNCH_REWARDS_LAUNCH_AT,
        endAt: LAUNCH_REWARDS_END_AT,
        verified: false,
        grandPrizeAvailable,
        monthKey,
      });
      ensureRewardsDevice(request, response);
      return response;
    }

    const participantRef = db.collection("launchRewardParticipants").doc(session.participantId);
    const [participantSnapshot, monthSnapshot, rewardsSnapshot] = await Promise.all([
      participantRef.get(),
      db.collection("launchRewardParticipantMonths").doc(`${session.participantId}_${monthKey}`).get(),
      db.collection("launchRewards").where("participantId", "==", session.participantId).limit(25).get(),
    ]);

    if (!participantSnapshot.exists) {
      const response = NextResponse.json({
        ok: true,
        phase,
        launchAt: LAUNCH_REWARDS_LAUNCH_AT,
        endAt: LAUNCH_REWARDS_END_AT,
        verified: false,
        grandPrizeAvailable,
        monthKey,
      });
      clearRewardsSession(response);
      ensureRewardsDevice(request, response);
      return response;
    }

    const participant = participantSnapshot.data() || {};
    if (participant.status === "blocked" || Number(participant.sessionVersion || 1) !== session.sessionVersion) {
      const response = NextResponse.json({
        ok: false,
        phase,
        launchAt: LAUNCH_REWARDS_LAUNCH_AT,
        endAt: LAUNCH_REWARDS_END_AT,
        verified: false,
        grandPrizeAvailable,
        error: "Verify your information again to continue.",
      }, { status: 401 });
      clearRewardsSession(response);
      ensureRewardsDevice(request, response);
      return response;
    }

    const spinsThisMonth = Number(monthSnapshot.data()?.spinCount || 0);
    const nextEligibleSpinAtMs = getTimestampMillis(participant.nextEligibleSpinAt);
    const canSpin = phase === "live" && spinsThisMonth < LAUNCH_REWARDS_MAX_SPINS_PER_MONTH && (!nextEligibleSpinAtMs || nextEligibleSpinAtMs <= now);

    const rewards = rewardsSnapshot.docs
      .map((document) => {
        const data = document.data();
        const prize = getLaunchRewardPrize(String(data.prizeId || ""));
        if (!prize) return null;
        return {
          id: document.id,
          prizeId: prize.id,
          title: prize.title,
          description: prize.description,
          customerMessage: prize.customerMessage,
          referenceCode: String(data.referenceCode || ""),
          status: String(data.status || "issued"),
          issuedAt: getTimestampMillis(data.createdAt) ? new Date(getTimestampMillis(data.createdAt)).toISOString() : "",
          expiresAt: getTimestampMillis(data.expiresAt) ? new Date(getTimestampMillis(data.expiresAt)).toISOString() : "",
          claimDeadline: getTimestampMillis(data.claimDeadline) ? new Date(getTimestampMillis(data.claimDeadline)).toISOString() : "",
          publicToken: String(data.publicToken || ""),
          eligibleServiceIds: prize.eligibleServiceIds,
          requiresManualVerification: prize.requiresManualVerification === true,
          useHref: data.publicToken
            ? `/request?reward=${encodeURIComponent(String(data.publicToken))}${prize.eligibleServiceIds[0] ? `&service=${encodeURIComponent(prize.eligibleServiceIds[0])}` : ""}`
            : "",
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b?.issuedAt || 0).getTime() - new Date(a?.issuedAt || 0).getTime());

    const response = NextResponse.json({
      ok: true,
      phase,
      launchAt: LAUNCH_REWARDS_LAUNCH_AT,
      endAt: LAUNCH_REWARDS_END_AT,
      verified: true,
      participant: {
        firstName: String(participant.firstName || ""),
        maskedEmail: maskEmail(String(participant.email || "")),
        maskedPhone: maskPhone(String(participant.phone || "")),
        zip: String(participant.zip || ""),
      },
      grandPrizeAvailable,
      monthKey,
      spinsThisMonth,
      spinsRemainingThisMonth: Math.max(0, LAUNCH_REWARDS_MAX_SPINS_PER_MONTH - spinsThisMonth),
      maxSpinsPerMonth: LAUNCH_REWARDS_MAX_SPINS_PER_MONTH,
      nextEligibleSpinAt: nextEligibleSpinAtMs ? new Date(nextEligibleSpinAtMs).toISOString() : null,
      canSpin,
      rewards,
    });
    ensureRewardsDevice(request, response, session.deviceId);
    return response;
  } catch (error) {
    console.error("Launch Rewards status failed", error);
    const response = NextResponse.json({ ok: false, error: "Rewards status is temporarily unavailable." }, { status: 500 });
    ensureRewardsDevice(request, response);
    return response;
  }
}
