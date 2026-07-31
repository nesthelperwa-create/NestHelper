import { NextResponse } from "next/server";
import { claimLabelForUser, verifyCustomerRequest } from "@/lib/smartLabelAccountServer";

export const runtime = "nodejs";

type Body = { code?: string };

export async function POST(request: Request) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as Body;
    const result = await claimLabelForUser(user, body.code || "");
    return NextResponse.json({ ok: true, ...result, message: result.alreadyOwned ? "This label is already in your dashboard." : "Label added to your dashboard." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to claim this label." }, { status: 400 });
  }
}
