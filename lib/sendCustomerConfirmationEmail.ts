import { Resend } from "resend";
import { getPublicReplyEmail } from "./emailRouting";

type SubmissionCollection = "serviceRequests" | "helperApplications" | "partnerApplications" | "contactMessages";

type CustomerConfirmationInput = {
  collection: SubmissionCollection;
  payload: Record<string, unknown>;
  submissionId: string;
  replyToEmail?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "";
  return String(value);
}

function getEmail(payload: Record<string, unknown>) {
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  return email.includes("@") ? email : "";
}

function getConfirmationContent(collection: SubmissionCollection, payload: Record<string, unknown>, submissionId: string, customerSupportEmail: string) {

  if (collection === "serviceRequests") {
    const service = formatValue(payload.selectedServiceTitle || payload.service || "Service request");
    const isCommercial = String(payload.service || payload.selectedServiceTitle || payload.packageType || payload.requestType || "").toLowerCase().includes("commercial");
    return {
      subject: isCommercial ? "We received your NestHelper Commercial Reset request" : "We received your NestHelper request",
      eyebrow: isCommercial ? "Commercial quote request received" : "Request received",
      title: isCommercial ? "Thanks — we received your Commercial Reset quote request." : "Thanks — we received your NestHelper request.",
      intro: isCommercial
        ? "We’ll review the business address, square footage, bathrooms, frequency, access notes, supplies, and service fit before anything is confirmed. No payment is due yet."
        : "We’ll review your service area, timing, scope, access notes, and safety details before anything is confirmed. No payment is due yet.",
      nextSteps: isCommercial
        ? [
            "NestHelper will review the commercial request details.",
            "If the request looks like a good fit, we’ll follow up with any questions, walkthrough needs, availability, and quote guidance.",
            "After a quote is approved, we can send a secure checkout link before service is scheduled.",
          ]
        : [
            "NestHelper will review the request details.",
            "If the request is a good fit, we’ll follow up with availability, any questions, and a secure checkout link.",
            "For Laundry Rescue, dry weight and any add-ons are confirmed before the final balance is charged.",
          ],
      summary: {
        "Request ID": submissionId,
        Service: service,
        "Preferred date": formatValue(payload.preferredDate),
        "Preferred time window": formatValue(payload.preferredWindow),
        City: formatValue(payload.city),
      },
      closing: `If anything changes, reply to this email or contact us at ${customerSupportEmail}.`,
    };
  }

  if (collection === "contactMessages") {
    return {
      subject: "We received your NestHelper message",
      eyebrow: "Message received",
      title: "Thanks — we received your message.",
      intro: "We’ll review it and follow up as soon as we can.",
      nextSteps: ["A NestHelper team member will review your message.", "We’ll reply to the email or phone number you provided."],
      summary: {
        "Message ID": submissionId,
        Topic: formatValue(payload.topic),
        Subject: formatValue(payload.subject || "Contact message"),
        "Your message": formatValue(payload.message),
      },
      closing: `Need to add anything? You can reply to this email or contact us at ${customerSupportEmail}.`,
    };
  }

  if (collection === "helperApplications") {
    return {
      subject: "We received your NestHelper helper application",
      eyebrow: "Application received",
      title: "Thanks — we received your helper application.",
      intro:
        "We’ll review your availability, experience, service fit, and next-step onboarding requirements before following up.",
      nextSteps: [
        "We’ll review your application details.",
        "If there may be a fit, we’ll follow up about references, standards, and background-check steps through secure providers.",
        "Please do not email SSNs, ID photos, or sensitive documents unless we send a secure approved method.",
      ],
      summary: {
        "Application ID": submissionId,
        City: formatValue(payload.city),
        Availability: formatValue(payload.availability),
      },
      closing: `Questions? Reply to this email or contact us at ${customerSupportEmail}.`,
    };
  }

  return {
    subject: "We received your NestHelper partner application",
    eyebrow: "Partner application received",
    title: "Thanks — we received your partner / contractor application.",
    intro: "We’ll review the business fit, service area, availability, standards, and insurance/business information before next steps.",
    nextSteps: [
      "We’ll review your application details.",
      "If there may be a fit, we’ll follow up about service standards, documentation, and partnership requirements.",
      "Please do not email sensitive documents unless we send a secure approved method.",
    ],
    summary: {
      "Application ID": submissionId,
      Business: formatValue(payload.businessName),
      "Service type": formatValue(payload.serviceType),
      "Service area": formatValue(payload.serviceArea),
    },
    closing: `Questions? Reply to this email or contact us at ${customerSupportEmail}.`,
  };
}

export async function sendCustomerConfirmationEmail({ collection, payload, submissionId, replyToEmail }: CustomerConfirmationInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = getEmail(payload);
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const replyTo = replyToEmail || process.env.CUSTOMER_SUPPORT_EMAIL || getPublicReplyEmail();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to) {
    console.warn("Skipping customer confirmation email. Missing RESEND_API_KEY or customer email.");
    return { skipped: true };
  }

  const content = getConfirmationContent(collection, payload, submissionId, replyTo);
  const summaryRows = Object.entries(content.summary)
    .filter(([, value]) => String(value || "").trim().length > 0)
    .map(
      ([key, value]) =>
        `<div style="padding:10px 12px;border-bottom:1px solid #eee;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;line-height:1.35;font-weight:700;color:#0f4f4a;margin:0 0 4px 0;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(key)}</div><div style="font-size:15px;line-height:1.5;color:#233;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value)}</div></div>`
    )
    .join("");

  const nextStepsHtml = content.nextSteps
    .map((step) => `<li style="margin:0 0 8px 0;">${escapeHtml(step)}</li>`)
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">${escapeHtml(content.eyebrow)}</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">${escapeHtml(content.title)}</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 18px 0;">${escapeHtml(content.intro)}</p>
          ${summaryRows ? `<div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;margin:0 0 20px 0;">${summaryRows}</div>` : ""}
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens next</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">${nextStepsHtml}</ol>
          <p style="margin:0 0 18px 0;">${escapeHtml(content.closing)}</p>
          <p style="margin:22px 0 0 0;"><a href="${siteUrl}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;margin-top:22px;">This confirmation was sent because this email address was used on a NestHelper website form.</p>
        </div>
      </div>
    </div>`;

  const textSummary = Object.entries(content.summary)
    .filter(([, value]) => String(value || "").trim().length > 0)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const text = `${content.title}\n\n${content.intro}${textSummary ? `\n\nSubmission details:\n${textSummary}` : ""}\n\nWhat happens next:\n${content.nextSteps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n")}\n\n${content.closing}\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: content.subject, html, text, replyTo });
}
