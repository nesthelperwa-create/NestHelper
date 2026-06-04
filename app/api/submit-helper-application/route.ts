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
      ? await preparePublicMultipartSubmission(request, "helperApplications")
      : { payload: await preparePublicSubmission(request, "helperApplications"), files: [] };

    const result = await saveSubmission({
      collection: "helperApplications",
      payload: prepared.payload,
      emailSubject: "New NestHelper Helper Application",
      emailTitle: "New Helper Application",
      adminPath: "/admin/helpers",
      beforeNotifications: ({ docId, docRef }) => uploadApplicationDocuments({
        collection: "helperApplications",
        docId,
        docRef,
        files: prepared.files,
      }),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicFormErrorResponse(error, "Unable to submit helper application.");
  }
}
