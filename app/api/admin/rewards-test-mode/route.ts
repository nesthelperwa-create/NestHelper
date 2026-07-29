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
  return {
    ok: true,
    enabled: Boolean(mode),
    prizeId: prize?.id || launchRewardPrizes[0].id,
    prizeTitle: prize?.title || launchRewardPrizes[0].title,
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
      const response = NextResponse.json({ ok: true, enabled: false });
      clearRewardsTestMode(response);
      return response;
    }

    if (!["enable", "update", "reset"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid test-mode action." }, { status: 400 });
    }

    const prizeId = String(body.prizeId || launchRewardPrizes[0].id).trim();
    const prize = getLaunchRewardPrize(prizeId);
    if (!prize) return NextResponse.json({ ok: false, error: "Choose a valid test prize." }, { status: 400 });

    const existing = readRewardsTestMode(request);
    const response = NextResponse.json({
      ok: true,
      enabled: true,
      prizeId: prize.id,
      prizeTitle: prize.title,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    });
    const deviceId = ensureRewardsDevice(request, response, existing?.deviceId);
    setRewardsTestMode(response, {
      version: 1,
      adminEmail,
      deviceId,
      prizeId: prize.id,
      sessionId: action === "reset" || !existing ? createOpaqueToken(18) : existing.sessionId,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update test mode.";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Forbidden." ? 403 : 401 });
  }
}
