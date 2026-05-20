import { NextResponse } from "next/server";
import { saveSubmission } from "@/lib/saveSubmission";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await saveSubmission({
      collection: "helperApplications",
      payload,
      emailSubject: "New NestHelper Helper Application",
      emailTitle: "New Helper Application",
      adminPath: "/admin/helpers",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to submit helper application." }, { status: 500 });
  }
}
