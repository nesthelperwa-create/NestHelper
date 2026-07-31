import { NextResponse } from "next/server";
import { searchOwnedLabels, verifyCustomerRequest } from "@/lib/smartLabelAccountServer";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await verifyCustomerRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const labels = await searchOwnedLabels(user, query);
    return NextResponse.json({ ok: true, labels });
  } catch (error) {
    console.error("Smart label search failed", error);
    return NextResponse.json({ ok: false, error: "Unable to search your labels." }, { status: 500 });
  }
}
