import { NextResponse } from "next/server";
import { activatePackForUser, verifyCustomerRequest } from "@/lib/smartLabelAccountServer";

export const runtime = "nodejs";

type Body = { activationCode?: string };

export async function POST(request: Request) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as Body;
    const pack = await activatePackForUser(user, body.activationCode || "");
    return NextResponse.json({ ok: true, pack, message: `Your label pack is active. You can now add up to ${pack.remainingQuantity} NestHelper labels.` });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to activate this pack." }, { status: 400 });
  }
}
