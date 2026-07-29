import { NextRequest, NextResponse } from "next/server";
import { clearRewardsSession, ensureRewardsDevice } from "@/lib/launchRewardsServer";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  clearRewardsSession(response);
  ensureRewardsDevice(request, response);
  return response;
}
