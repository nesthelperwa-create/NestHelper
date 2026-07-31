import { NextResponse } from "next/server";
import { getOwnerLabel, updateOwnedLabel, verifyCustomerRequest } from "@/lib/smartLabelAccountServer";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const { code } = await context.params;
    const label = await getOwnerLabel(user, code);
    if (!label) return NextResponse.json({ ok: false, error: "Label not found." }, { status: 404 });
    return NextResponse.json({ ok: true, label });
  } catch (error) {
    console.error("Load owned label failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load this label." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const { code } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const label = await updateOwnedLabel(user, code, body);
    return NextResponse.json({ ok: true, label, message: "Saved. Your Smart Label is updated." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update this label." }, { status: 400 });
  }
}
