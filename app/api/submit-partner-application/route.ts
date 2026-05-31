import { NextResponse } from "next/server";
import { preparePublicSubmission, publicFormErrorResponse } from "@/lib/publicFormSecurity";
import { saveSubmission } from "@/lib/saveSubmission";

export async function POST(request: Request) {
  try {
    const payload = await preparePublicSubmission(request, "partnerApplications");
    const result = await saveSubmission({
      collection: "partnerApplications",
      payload,
      emailSubject: "New NestHelper Partner / Contractor Application",
      emailTitle: "New Partner / Contractor Application",
      adminPath: "/admin/partners",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicFormErrorResponse(error, "Unable to submit partner application.");
  }
}
