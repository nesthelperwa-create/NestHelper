import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "./firebaseAdmin";
import { sendAdminEmail } from "./sendAdminEmail";

export type SaveSubmissionInput = {
  collection: "serviceRequests" | "helperApplications" | "partnerApplications" | "contactMessages";
  payload: Record<string, unknown>;
  emailSubject: string;
  emailTitle: string;
  adminPath: string;
};

export async function saveSubmission({ collection, payload, emailSubject, emailTitle, adminPath }: SaveSubmissionInput) {
  const db = getFirebaseAdminDb();
  const cleaned = Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
  );

  const doc = await db.collection(collection).add({
    ...cleaned,
    status: "New",
    source: "website",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    await sendAdminEmail({
      subject: emailSubject,
      title: emailTitle,
      rows: { "Dashboard ID": doc.id, ...cleaned },
      adminPath,
    });
  } catch (error) {
    // Form submissions should still succeed even if email notifications fail.
    // Check Vercel runtime logs to debug notification issues.
    console.error("Admin notification email failed", error);
  }

  return { id: doc.id };
}
