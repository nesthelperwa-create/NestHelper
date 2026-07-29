import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { getLaunchRewardPrize } from "@/lib/launchRewards";
import {
  getTimestampMillis,
  LaunchRewardsError,
  requireRewardsSession,
  secureHash,
} from "@/lib/launchRewardsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim() || "";
    if (!/^[A-Za-z0-9_-]{30,100}$/.test(token)) {
      throw new LaunchRewardsError("This reward link is not valid.", 400, "invalid_reward_token");
    }

    const { session } = await requireRewardsSession(request);
    const tokenHash = secureHash(token, "reward-public-token");
    const snapshot = await getFirebaseAdminDb()
      .collection("launchRewards")
      .where("publicTokenHash", "==", tokenHash)
      .limit(1)
      .get();

    if (snapshot.empty) throw new LaunchRewardsError("This reward could not be found.", 404, "reward_not_found");
    const document = snapshot.docs[0];
    const reward = document.data() || {};
    if (reward.participantId !== session.participantId) {
      throw new LaunchRewardsError("This reward belongs to a different verified participant.", 403, "reward_owner_mismatch");
    }

    const prize = getLaunchRewardPrize(String(reward.prizeId || ""));
    if (!prize) throw new LaunchRewardsError("This reward is not available.", 404, "reward_type_missing");

    const expiresAtMs = getTimestampMillis(reward.expiresAt);
    const expired = Boolean(expiresAtMs && expiresAtMs <= Date.now());
    const status = expired && reward.status === "issued" ? "expired" : String(reward.status || "issued");

    return NextResponse.json({
      ok: true,
      reward: {
        id: document.id,
        prizeId: prize.id,
        title: prize.title,
        description: prize.description,
        referenceCode: String(reward.referenceCode || ""),
        status,
        expired,
        expiresAt: expiresAtMs ? new Date(expiresAtMs).toISOString() : "",
        eligibleServiceIds: prize.eligibleServiceIds,
        minimumSubtotalCents: prize.minimumSubtotalCents || 0,
        requiresManualVerification: prize.requiresManualVerification === true,
      },
    });
  } catch (error) {
    console.error("Launch Reward lookup failed", error);
    const status = error instanceof LaunchRewardsError ? error.status : 500;
    const message = error instanceof LaunchRewardsError ? error.message : "This reward could not be loaded.";
    const code = error instanceof LaunchRewardsError ? error.code : "reward_lookup_failed";
    return NextResponse.json({ ok: false, error: message, code }, { status });
  }
}
