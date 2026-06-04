import { NextResponse } from "next/server";
import { preparePublicMultipartSubmission, preparePublicSubmission, publicFormErrorResponse } from "@/lib/publicFormSecurity";
import { saveSubmission } from "@/lib/saveSubmission";
import { uploadApplicationDocuments } from "@/lib/applicationDocuments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
    const prepared = isMultipart
      ? await preparePublicMultipartSubmission(request, "partnerApplications")
      : { payload: await preparePublicSubmission(request, "partnerApplications"), files: [] };

    const result = await saveSubmission({
      collection: "partnerApplications",
      payload: prepared.payload,
      emailSubject: "New NestHelper Partner / Contractor Application",
      emailTitle: "New Partner / Contractor Application",
      adminPath: "/admin/partners",
      beforeNotifications: ({ docId, docRef }) => uploadApplicationDocuments({
        collection: "partnerApplications",
        docId,
        docRef,
        files: prepared.files,
      }),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicFormErrorResponse(error, "Unable to submit partner application.");
  }
}
