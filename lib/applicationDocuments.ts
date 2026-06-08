import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import type { PublicSubmissionFile } from "./publicFormSecurity";
import { getFirebaseAdminStorageBucket } from "./firebaseAdmin";

export type ApplicationCollection = "helperApplications" | "partnerApplications";

export type StoredApplicationDocument = {
  id: string;
  label: string;
  originalName: string;
  safeName: string;
  contentType: string;
  size: number;
  storagePath: string;
  uploadedAtIso: string;
};

function safeFileName(name: string) {
  const fallback = "application-document";
  const clean = (name || fallback)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);
  return clean || fallback;
}

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "record";
}

function getDocumentExtension(fileName: string) {
  const match = fileName.match(/\.([a-zA-Z0-9]{2,8})$/);
  return match ? match[1].toLowerCase() : "bin";
}

function summarizeDocuments(documents: StoredApplicationDocument[]) {
  if (!documents.length) return "No optional documents uploaded.";
  return documents.map((document) => `${document.label}: ${document.originalName}`).join("\n");
}

export async function uploadApplicationDocuments({
  collection,
  docId,
  docRef,
  files,
}: {
  collection: ApplicationCollection;
  docId: string;
  docRef: DocumentReference;
  files: PublicSubmissionFile[];
}) {
  if (!files.length) {
    return {
      applicationDocumentCount: 0,
      applicationDocumentSummary: "No optional documents uploaded.",
    };
  }

  const bucket = getFirebaseAdminStorageBucket();
  const uploadedAtIso = new Date().toISOString();
  const documents: StoredApplicationDocument[] = [];

  for (const [index, item] of files.entries()) {
    const safeName = safeFileName(item.file.name);
    const extension = getDocumentExtension(safeName);
    const id = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `application-documents/${collection}/${safePathSegment(docId)}/${id}-${safeName || `document.${extension}`}`;
    const bytes = Buffer.from(await item.file.arrayBuffer());
    const contentType = item.file.type || "application/octet-stream";

    await bucket.file(storagePath).save(bytes, {
      contentType,
      resumable: false,
      metadata: {
        cacheControl: "private, max-age=0, no-transform",
        metadata: {
          label: item.label,
          originalName: item.file.name,
          collection,
          docId,
        },
      },
    });

    documents.push({
      id,
      label: item.label,
      originalName: item.file.name,
      safeName,
      contentType,
      size: item.file.size,
      storagePath,
      uploadedAtIso,
    });
  }

  const updatePayload = {
    applicationDocuments: documents,
    applicationDocumentCount: documents.length,
    applicationDocumentSummary: summarizeDocuments(documents),
    applicationDocumentsUploadedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.update(updatePayload);
  return updatePayload;
}

function summarizeAttemptedUploads(files: PublicSubmissionFile[]) {
  if (!files.length) return "No optional documents uploaded.";
  return files
    .map((item) => `${item.label || "Other"}: ${item.file.name || "uploaded file"} (${item.file.size || 0} bytes)`)
    .join("\n");
}

function getSafeUploadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message.slice(0, 240);
  return "Unknown upload error";
}

export async function uploadApplicationDocumentsSafely(input: {
  collection: ApplicationCollection;
  docId: string;
  docRef: DocumentReference;
  files: PublicSubmissionFile[];
}) {
  if (!input.files.length) return uploadApplicationDocuments(input);

  try {
    return await uploadApplicationDocuments(input);
  } catch (error) {
    console.error("Application document upload failed", {
      collection: input.collection,
      docId: input.docId,
      error,
    });

    const attemptedSummary = summarizeAttemptedUploads(input.files);
    const updatePayload = {
      applicationDocuments: [],
      applicationDocumentCount: 0,
      applicationDocumentSummary: `Application submitted, but optional document upload failed. Attempted uploads:\n${attemptedSummary}`,
      applicationDocumentAttemptedUploadSummary: attemptedSummary,
      applicationDocumentUploadStatus: "error",
      applicationDocumentUploadError: "Optional document upload failed. Follow up with the applicant for documents if needed.",
      applicationDocumentTechnicalError: getSafeUploadErrorMessage(error),
      applicationDocumentsUploadedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await input.docRef.update(updatePayload);
    return updatePayload;
  }
}

export async function createApplicationDocumentSignedUrl(storagePath: string) {
  const bucket = getFirebaseAdminStorageBucket();
  const [exists] = await bucket.file(storagePath).exists();
  if (!exists) throw new Error("Document file was not found in storage.");

  const [url] = await bucket.file(storagePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 15 * 60 * 1000,
  });
  return url;
}
