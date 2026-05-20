import { NextResponse } from "next/server";
import { saveSubmission } from "@/lib/saveSubmission";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await saveSubmission({
      collection: "partnerApplications",
      payload,
      emailSubject: "New NestHelper Partner / Contractor Application",
      emailTitle: "New Partner / Contractor Application",
      adminPath: "/admin/partners",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to submit partner application." }, { status: 500 });
  }
}
