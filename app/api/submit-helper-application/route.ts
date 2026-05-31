import { NextResponse } from "next/server";
import { preparePublicSubmission, publicFormErrorResponse } from "@/lib/publicFormSecurity";
import { saveSubmission } from "@/lib/saveSubmission";

export async function POST(request: Request) {
  try {
    const payload = await preparePublicSubmission(request, "helperApplications");
    const result = await saveSubmission({
      collection: "helperApplications",
      payload,
      emailSubject: "New NestHelper Helper Application",
      emailTitle: "New Helper Application",
      adminPath: "/admin/helpers",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicFormErrorResponse(error, "Unable to submit helper application.");
  }
}
