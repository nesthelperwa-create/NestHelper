import { NextResponse } from "next/server";
import { saveSubmission } from "@/lib/saveSubmission";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await saveSubmission({
      collection: "serviceRequests",
      payload,
      emailSubject: "New NestHelper Service Request",
      emailTitle: "New Service Request",
      adminPath: "/admin/requests",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to submit request." }, { status: 500 });
  }
}
