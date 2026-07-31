import { NextResponse } from "next/server";
import { verifyCustomerRequest } from "@/lib/smartLabelAccountServer";
import { listFinderMessagesForOwner, updateFinderMessageForOwner } from "@/lib/smartLabelFinderServer";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const { code } = await context.params;
    const messages = await listFinderMessagesForOwner(user, code);
    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load finder messages." }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const { code } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { messageId?: unknown; status?: unknown };
    const message = await updateFinderMessageForOwner(user, code, String(body.messageId || ""), body.status);
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update finder message." }, { status: 400 });
  }
}
