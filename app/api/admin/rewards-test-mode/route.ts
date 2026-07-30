import { NextRequest, NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { getLaunchRewardPrize, launchRewardPrizes } from "@/lib/launchRewards";
import {
  clearRewardsTestMode,
  createOpaqueToken,
  ensureRewardsDevice,
  readRewardsTestMode,
  setRewardsTestMode,
  type RewardsTestModeType,
} from "@/lib/launchRewardsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(request: NextRequest) {
  getFirebaseAdminDb();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim() || "";
  if (!token || !getApps().length) throw new Error("Unauthorized.");
  const decoded = await getAuth().verifyIdToken(token, true);
  if (!isAllowedAdminEmail(decoded.email)) throw new Error("Forbidden.");
  return String(decoded.email || "admin");
}

function modePayload(mode: ReturnType<typeof readRewardsTestMode>) {
  const prize = mode ? getLaunchRewardPrize(mode.prizeId) : null;
  const testType: RewardsTestModeType = mode?.testType === "full" ? "full" : "quick";
  return {
    ok: true,
    enabled: Boolean(mode),
    prizeId: prize?.id || launchRewardPrizes[0].id,
    prizeTitle: prize?.title || launchRewardPrizes[0].title,
    testType,
    fullVerified: testType === "full" && mode?.fullVerified === true,
    expiresAt: mode ? new Date(mode.expiresAt).toISOString() : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json(modePayload(readRewardsTestMode(request)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized.";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Forbidden." ? 403 : 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminEmail = await requireAdmin(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "enable").trim();

    if (action === "disable") {
      const response = NextResponse.json({ ok: true, enabled: false, testType: "quick", fullVerified: false });
      clearRewardsTestMode(response);
      return response;
    }

    if (!["enable", "update", "reset"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid test-mode action." }, { status: 400 });
    }

    const prizeId = String(body.prizeId || launchRewardPrizes[0].id).trim();
    const prize = getLaunchRewardPrize(prizeId);
    if (!prize) return NextResponse.json({ ok: false, error: "Choose a valid test prize." }, { status: 400 });

    const requestedTestType: RewardsTestModeType = body.testType === "full" ? "full" : "quick";
    const existing = readRewardsTestMode(request);
    const typeChanged = Boolean(existing && existing.testType !== requestedTestType);
    const startFresh = action === "reset" || !existing || typeChanged;
    const expiresAt = Date.now() + 2 * 60 * 60 * 1000;

    const response = NextResponse.json({
      ok: true,
      enabled: true,
      prizeId: prize.id,
      prizeTitle: prize.title,
      testType: requestedTestType,
      fullVerified: startFresh ? false : existing?.fullVerified === true,
      expiresAt: new Date(expiresAt).toISOString(),
    });

    const deviceId = ensureRewardsDevice(request, response, existing?.deviceId);
    setRewardsTestMode(response, {
      version: 1,
      adminEmail,
      deviceId,
      prizeId: prize.id,
      sessionId: startFresh ? createOpaqueToken(18) : existing!.sessionId,
      expiresAt,
      testType: requestedTestType,
      fullVerified: startFresh ? false : existing?.fullVerified === true,
      testIdentity: startFresh ? undefined : existing?.testIdentity,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update test mode.";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Forbidden." ? 403 : 401 });
  }
}
