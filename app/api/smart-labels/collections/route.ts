import { NextResponse } from "next/server";
import { createCollectionForUser, listCustomerCollections, verifyCustomerRequest } from "@/lib/smartLabelAccountServer";

export const runtime = "nodejs";

type Body = { name?: string; description?: string };

export async function GET(request: Request) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const collections = await listCustomerCollections(user);
    return NextResponse.json({ ok: true, collections });
  } catch (error) {
    console.error("Collections load failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load collections." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as Body;
    const collection = await createCollectionForUser(user, body.name || "", body.description || "");
    return NextResponse.json({ ok: true, collection, message: "Collection created." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create this collection." }, { status: 400 });
  }
}
