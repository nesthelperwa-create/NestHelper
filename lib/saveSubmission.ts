import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "./firebaseAdmin";
import { sendAdminEmail } from "./sendAdminEmail";
import { sendCustomerConfirmationEmail } from "./sendCustomerConfirmationEmail";
import { getCustomerReplyEmail, getSubmissionNotificationEmail, getSubmissionRouteLabel, getSubmissionSubjectPrefix } from "./emailRouting";

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

  const routedAliasEmail = getSubmissionNotificationEmail(collection, cleaned);
  const customerReplyEmail = getCustomerReplyEmail(collection, cleaned);
  const routeLabel = getSubmissionRouteLabel(collection, cleaned);
  const subjectPrefix = getSubmissionSubjectPrefix(collection, cleaned);

  try {
    await sendAdminEmail({
      subject: `${subjectPrefix} ${emailSubject}`,
      title: emailTitle,
      rows: {
        "Inbox route": routeLabel,
        "Website route / sent to": routedAliasEmail,
        "Customer reply-to": customerReplyEmail,
        "Dashboard ID": doc.id,
        ...cleaned,
      },
      adminPath,
      // Send the admin notice to the routed NestHelper alias for sorting/routing.
      // Replies stay customer-facing through hello@, not the alias.
      to: routedAliasEmail,
      routeLabel,
      routedToText: routedAliasEmail,
    });
  } catch (error) {
    // Form submissions should still succeed even if admin email notifications fail.
    // Check Vercel runtime logs to debug notification issues.
    console.error("Admin notification email failed", error);
  }

  try {
    await sendCustomerConfirmationEmail({
      collection,
      payload: cleaned,
      submissionId: doc.id,
      replyToEmail: customerReplyEmail,
    });
  } catch (error) {
    // Form submissions should still succeed even if the customer confirmation email fails.
    // Check Vercel runtime logs to debug notification issues.
    console.error("Customer confirmation email failed", error);
  }

  return { id: doc.id };
}
