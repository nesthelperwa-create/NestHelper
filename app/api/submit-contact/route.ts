import { NextResponse } from "next/server";
import { saveSubmission } from "@/lib/saveSubmission";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await saveSubmission({
      collection: "contactMessages",
      payload,
      emailSubject: "New NestHelper Contact Message",
      emailTitle: "New Contact Message",
      adminPath: "/admin/contact",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to submit contact message." }, { status: 500 });
  }
}
