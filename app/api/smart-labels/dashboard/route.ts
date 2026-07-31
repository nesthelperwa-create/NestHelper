import { NextResponse } from "next/server";
import { getCustomerSummary, verifyCustomerRequest } from "@/lib/smartLabelAccountServer";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const dashboard = await getCustomerSummary(user);
    return NextResponse.json({ ok: true, ...dashboard, account: { email: user.email, uid: user.uid } });
  } catch (error) {
    console.error("Smart label dashboard failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load your labels." }, { status: 500 });
  }
}
