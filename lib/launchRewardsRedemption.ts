import { FieldValue, Timestamp, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import { getLaunchRewardPrize } from "@/lib/launchRewards";
import {
  getTimestampMillis,
  LaunchRewardsError,
  normalizeEmailAddress,
  normalizeUsPhone,
  secureHash,
} from "@/lib/launchRewardsServer";

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getLaunchRewardTokenFromPayload(payload: Record<string, unknown>) {
  const token = getString(payload.launchRewardToken);
  return /^[A-Za-z0-9_-]{30,100}$/.test(token) ? token : "";
}

export async function reserveLaunchRewardForRequest(input: {
  db: Firestore;
  requestRef: DocumentReference;
  requestId: string;
  payload: Record<string, unknown>;
}) {
  const token = getLaunchRewardTokenFromPayload(input.payload);
  if (!token) return undefined;

  if (getString(input.payload.incomingReferralCode) || getString(input.payload.promoCode)) {
    throw new LaunchRewardsError(
      "Launch Rewards cannot be combined with a referral credit, promo code, or another discount.",
      400,
      "reward_stacking_not_allowed"
    );
  }

  const tokenHash = secureHash(token, "reward-public-token");
  const lookup = await input.db.collection("launchRewards").where("publicTokenHash", "==", tokenHash).limit(1).get();
  if (lookup.empty) throw new LaunchRewardsError("This Launch Reward could not be found.", 404, "reward_not_found");

  const rewardRef = lookup.docs[0].ref;
  return input.db.runTransaction(async (transaction) => {
    const rewardSnapshot = await transaction.get(rewardRef);
    if (!rewardSnapshot.exists) throw new LaunchRewardsError("This Launch Reward could not be found.", 404, "reward_not_found");
    const reward = rewardSnapshot.data() || {};
    const prize = getLaunchRewardPrize(String(reward.prizeId || ""));
    if (!prize) throw new LaunchRewardsError("This Launch Reward is no longer available.", 400, "reward_unavailable");

    const participantRef = input.db.collection("launchRewardParticipants").doc(String(reward.participantId || ""));
    const participantSnapshot = await transaction.get(participantRef);
    if (!participantSnapshot.exists) throw new LaunchRewardsError("The verified reward owner could not be confirmed.", 400, "reward_owner_missing");
    const participant = participantSnapshot.data() || {};

    const currentStatus = String(reward.status || "issued");
    if (currentStatus === "redeemed" || currentStatus === "voided" || currentStatus === "expired") {
      throw new LaunchRewardsError("This Launch Reward is no longer available.", 409, "reward_unavailable");
    }
    if (["reserved", "claim_submitted"].includes(currentStatus)) {
      if (reward.reservedRequestId === input.requestId) {
        return {
          launchRewardId: rewardSnapshot.id,
          launchRewardPrizeId: prize.id,
          launchRewardTitle: prize.title,
          launchRewardReferenceCode: reward.referenceCode,
          launchRewardStatus: currentStatus,
          launchRewardToken: "",
        };
      }
      throw new LaunchRewardsError("This Launch Reward is already attached to another request.", 409, "reward_already_reserved");
    }

    const expiresAtMs = getTimestampMillis(reward.expiresAt);
    if (expiresAtMs && expiresAtMs <= Date.now()) {
      transaction.update(rewardRef, { status: "expired", updatedAt: FieldValue.serverTimestamp() });
      throw new LaunchRewardsError("This Launch Reward has expired.", 409, "reward_expired");
    }
    const claimDeadlineMs = getTimestampMillis(reward.claimDeadline);
    if (prize.requiresManualVerification && claimDeadlineMs && claimDeadlineMs <= Date.now()) {
      transaction.update(rewardRef, { status: "claim_expired", updatedAt: FieldValue.serverTimestamp() });
      throw new LaunchRewardsError("The grand-prize claim period has ended.", 409, "claim_expired");
    }

    const serviceId = getString(input.payload.service);
    if (!prize.eligibleServiceIds.includes(serviceId)) {
      throw new LaunchRewardsError(
        `This reward applies only to: ${prize.eligibleServiceIds.join(", ")}. Choose an eligible service or remove the reward link.`,
        400,
        "reward_service_mismatch"
      );
    }

    let email: string;
    let phone: string;
    try {
      email = normalizeEmailAddress(input.payload.email);
      phone = normalizeUsPhone(input.payload.phone);
    } catch {
      throw new LaunchRewardsError("Use the same verified email and phone number that won this reward.", 400, "reward_identity_mismatch");
    }

    if (secureHash(email, "email") !== participant.emailHash || secureHash(phone, "phone") !== participant.phoneHash) {
      throw new LaunchRewardsError("Use the same verified email and phone number that won this reward.", 403, "reward_identity_mismatch");
    }

    const nextStatus = prize.requiresManualVerification ? "claim_submitted" : "reserved";
    transaction.update(rewardRef, {
      status: nextStatus,
      reservedRequestId: input.requestId,
      reservedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(input.requestRef, {
      launchRewardToken: FieldValue.delete(),
      launchRewardId: rewardSnapshot.id,
      launchRewardPrizeId: prize.id,
      launchRewardTitle: prize.title,
      launchRewardReferenceCode: reward.referenceCode,
      launchRewardStatus: nextStatus,
      launchRewardValueCents: prize.valueCents,
      launchRewardMinimumSubtotalCents: prize.minimumSubtotalCents || 0,
      launchRewardRequiresManualVerification: prize.requiresManualVerification === true,
      launchRewardReservedAt: FieldValue.serverTimestamp(),
      launchRewardExpiresAt: reward.expiresAt instanceof Timestamp ? reward.expiresAt : null,
    });

    return {
      launchRewardId: rewardSnapshot.id,
      launchRewardPrizeId: prize.id,
      launchRewardTitle: prize.title,
      launchRewardReferenceCode: String(reward.referenceCode || ""),
      launchRewardStatus: nextStatus,
      launchRewardValue: `$${(prize.valueCents / 100).toFixed(2)}`,
      launchRewardToken: "",
      launchRewardNote: prize.requiresManualVerification
        ? "Rare Parent Reset prize claim submitted; eligibility and standard scope must be manually verified before approval."
        : "Launch Reward reserved for this request. Apply only after the request is reviewed and accepted.",
    };
  });
}
