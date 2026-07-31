import { NextResponse } from "next/server";
import { createFinderMessage, type FinderContactPayload } from "@/lib/smartLabelFinderServer";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = (await request.json().catch(() => ({}))) as FinderContactPayload;
    await createFinderMessage(code, body, request);
    return NextResponse.json({
      ok: true,
      message: "Your message was saved privately for the owner.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send your message.";
    const status = message.includes("Too many messages")
      ? 429
      : message.includes("marked this item as recovered") || message.includes("not enabled")
        ? 403
        : message.includes("not available")
          ? 404
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
