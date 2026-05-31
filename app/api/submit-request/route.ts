import { NextResponse } from "next/server";
import { preparePublicSubmission, publicFormErrorResponse } from "@/lib/publicFormSecurity";
import { saveSubmission } from "@/lib/saveSubmission";

export async function POST(request: Request) {
  try {
    const payload = await preparePublicSubmission(request, "serviceRequests");
    const result = await saveSubmission({
      collection: "serviceRequests",
      payload,
      emailSubject: "New NestHelper Service Request",
      emailTitle: "New Service Request",
      adminPath: "/admin/requests",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicFormErrorResponse(error, "Unable to submit request.");
  }
}
