import { NextRequest, NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

export const runtime = "nodejs";

const allowedActions = new Set(["approve", "redeem", "void", "release"]);

export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
    if (!token || !getApps().length) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const rewardId = String(body.rewardId || "").trim();
    const action = String(body.action || "").trim();
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!rewardId || !allowedActions.has(action)) {
      return NextResponse.json({ ok: false, error: "Missing or invalid reward action." }, { status: 400 });
    }
    if (["void", "release"].includes(action) && reason.length < 3) {
      return NextResponse.json({ ok: false, error: "Add a short reason for this action." }, { status: 400 });
    }

    const outcome = await db.runTransaction(async (transaction) => {
      const rewardRef = db.collection("launchRewards").doc(rewardId);
      const rewardSnapshot = await transaction.get(rewardRef);
      if (!rewardSnapshot.exists) throw new Error("Reward not found.");
      const reward = rewardSnapshot.data() || {};
      const isGrand = reward.prizeId === "parent-reset-grand";
      const currentStatus = String(reward.status || "issued");
      const monthKey = String(reward.monthKey || "");
      const reservedRequestId = String(reward.reservedRequestId || "");
      const grandRef = monthKey ? db.collection("launchRewardGrandPrizeMonths").doc(monthKey) : null;
      const requestRef = reservedRequestId ? db.collection("serviceRequests").doc(reservedRequestId) : null;
      const grandSnapshot = grandRef ? await transaction.get(grandRef) : null;
      const requestSnapshot = requestRef ? await transaction.get(requestRef) : null;

      if (action === "approve" && (!isGrand || !["pending_verification", "claim_submitted"].includes(currentStatus))) {
        throw new Error("Only a pending grand-prize claim can be approved.");
      }
      if (action === "redeem") {
        const redeemable = isGrand
          ? currentStatus === "approved"
          : ["issued", "approved", "reserved"].includes(currentStatus);
        if (!redeemable) throw new Error("This reward is not ready to be marked redeemed.");
      }
      if (action === "release" && (isGrand || currentStatus !== "reserved")) {
        throw new Error(isGrand ? "Use Void to reopen a grand prize." : "Only a reserved reward can be released.");
      }
      if (action === "void" && ["voided", "redeemed"].includes(currentStatus)) {
        throw new Error("This reward can no longer be voided.");
      }

      const common = {
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: decoded.email || "admin",
        lastAdminAction: action,
        lastAdminReason: reason,
        lastAdminActionAt: FieldValue.serverTimestamp(),
      };

      if (action === "approve") {
        transaction.update(rewardRef, {
          ...common,
          status: isGrand ? "approved" : "issued",
          approvedAt: FieldValue.serverTimestamp(),
          approvedBy: decoded.email || "admin",
        });
        if (requestRef && requestSnapshot?.exists) {
          transaction.update(requestRef, { launchRewardStatus: "approved", updatedAt: FieldValue.serverTimestamp() });
        }
        if (isGrand && grandRef && grandSnapshot?.exists) {
          transaction.update(grandRef, {
            status: "verified",
            verifiedAt: FieldValue.serverTimestamp(),
            verifiedBy: decoded.email || "admin",
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      if (action === "redeem") {
        transaction.update(rewardRef, {
          ...common,
          status: "redeemed",
          redeemedAt: FieldValue.serverTimestamp(),
          redeemedBy: decoded.email || "admin",
        });
        if (requestRef && requestSnapshot?.exists) {
          transaction.update(requestRef, { launchRewardStatus: "redeemed", updatedAt: FieldValue.serverTimestamp() });
        }
        if (isGrand && grandRef && grandSnapshot?.exists) {
          transaction.update(grandRef, {
            status: "redeemed",
            redeemedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      if (action === "release") {
        transaction.update(rewardRef, {
          ...common,
          status: "issued",
          reservedRequestId: FieldValue.delete(),
          reservedAt: FieldValue.delete(),
          releasedAt: FieldValue.serverTimestamp(),
          releasedBy: decoded.email || "admin",
        });
        if (requestRef && requestSnapshot?.exists) {
          transaction.update(requestRef, { launchRewardStatus: "released", updatedAt: FieldValue.serverTimestamp() });
        }
      }

      if (action === "void") {
        transaction.update(rewardRef, {
          ...common,
          status: "voided",
          voidedAt: FieldValue.serverTimestamp(),
          voidedBy: decoded.email || "admin",
          voidReason: reason,
        });
        if (requestRef && requestSnapshot?.exists) {
          transaction.update(requestRef, { launchRewardStatus: "voided", updatedAt: FieldValue.serverTimestamp() });
        }
        if (isGrand && grandRef && grandSnapshot?.exists && grandSnapshot.data()?.winnerRewardId === rewardId) {
          transaction.update(grandRef, {
            winnerCount: 0,
            winnerParticipantId: FieldValue.delete(),
            winnerSpinId: FieldValue.delete(),
            winnerRewardId: FieldValue.delete(),
            claimedAt: FieldValue.delete(),
            status: "reopened_after_void",
            reopenedAt: FieldValue.serverTimestamp(),
            reopenedBy: decoded.email || "admin",
            reopenReason: reason,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      return { action, rewardId, isGrand };
    });

    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    console.error("Launch Reward admin update failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Reward update failed." }, { status: 400 });
  }
}
