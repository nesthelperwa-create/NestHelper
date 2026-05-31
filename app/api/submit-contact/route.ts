import { NextResponse } from "next/server";
import { preparePublicSubmission, publicFormErrorResponse } from "@/lib/publicFormSecurity";
import { saveSubmission } from "@/lib/saveSubmission";

export async function POST(request: Request) {
  try {
    const payload = await preparePublicSubmission(request, "contactMessages");
    const result = await saveSubmission({
      collection: "contactMessages",
      payload,
      emailSubject: "New NestHelper Contact Message",
      emailTitle: "New Contact Message",
      adminPath: "/admin/contact",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicFormErrorResponse(error, "Unable to submit contact message.");
  }
}
