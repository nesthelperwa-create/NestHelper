import { NextResponse } from "next/server";
import { preparePublicMultipartSubmission, preparePublicSubmission, publicFormErrorResponse } from "@/lib/publicFormSecurity";
import { saveSubmission } from "@/lib/saveSubmission";
import { uploadApplicationDocumentsSafely } from "@/lib/applicationDocuments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
    const prepared = isMultipart
      ? await preparePublicMultipartSubmission(request, "helperApplications")
      : { payload: await preparePublicSubmission(request, "helperApplications"), files: [] };

    let documentUploadWarning = "";
    const result = await saveSubmission({
      collection: "helperApplications",
      payload: prepared.payload,
      emailSubject: "New NestHelper Helper Application",
      emailTitle: "New Helper Application",
      adminPath: "/admin/helpers",
      beforeNotifications: async ({ docId, docRef }) => {
        const uploadResult = await uploadApplicationDocumentsSafely({
          collection: "helperApplications",
          docId,
          docRef,
          files: prepared.files,
        });

        if ((uploadResult as Record<string, unknown>)?.applicationDocumentUploadStatus === "error") {
          documentUploadWarning = "Application received, but the optional document upload did not finish. NestHelper can follow up for documents if needed.";
        }

        return uploadResult;
      },
    });
    return NextResponse.json({ ok: true, ...result, ...(documentUploadWarning ? { warning: documentUploadWarning } : {}) });
  } catch (error) {
    return publicFormErrorResponse(error, "Unable to submit helper application.");
  }
}
