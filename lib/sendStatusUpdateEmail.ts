import { Resend } from "resend";
import { getPublicReplyEmail } from "./emailRouting";

type SendStatusUpdateEmailInput = {
  to: string;
  customerName?: string;
  requestId: string;
  serviceTitle?: string;
  status: string;
  note?: string;
  preferredDate?: string;
  preferredWindow?: string;
  city?: string;
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

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatMultilineHtml(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return "";

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br />");

      return `<p style="margin:0 0 12px 0;color:#233;line-height:1.65;overflow-wrap:anywhere;word-break:break-word;">${lines}</p>`;
    })
    .join("");
}

function getStatusContent(status: string) {
  const normalized = status.toLowerCase().trim();

  if (normalized === "declined") {
    return {
      subject: "Update on your NestHelper request",
      eyebrow: "Request update",
      title: "We reviewed your NestHelper request.",
      intro:
        "Thank you for reaching out. After reviewing the details, we are not able to move forward with this request right now.",
      nextSteps: [
        "If there was missing information or the request changes, you can reply to this email.",
        "If NestHelper becomes a better fit later, we’ll be happy to review a new request.",
      ],
    };
  }

  if (normalized === "scheduled") {
    return {
      subject: "Your NestHelper request has been scheduled",
      eyebrow: "Scheduled",
      title: "Your NestHelper request is scheduled.",
      intro:
        "Your request has been moved to scheduled. Please review any notes below and reply if something needs to change.",
      nextSteps: [
        "Watch for any final prep notes from NestHelper.",
        "Please reply as soon as possible if your timing, access details, pets, parking, or service needs change.",
      ],
    };
  }

  if (normalized === "needs info" || normalized === "follow-up needed") {
    return {
      subject: "NestHelper needs a little more information",
      eyebrow: "More information needed",
      title: "We need a little more information before moving forward.",
      intro:
        "We reviewed your request and need a few more details before we can confirm whether it is a good fit.",
      nextSteps: [
        "Please reply to this email with the requested details.",
        "Once we have what we need, we’ll review the request again and follow up with next steps.",
      ],
    };
  }

  if (normalized === "quote sent") {
    return {
      subject: "NestHelper quote for your request",
      eyebrow: "Quote sent",
      title: "Your NestHelper quote is ready for review.",
      intro:
        "Thank you for reaching out. We reviewed your request and prepared the quote details below. This is not a payment request yet.",
      nextSteps: [
        "Review the quote and any note from NestHelper below.",
        "Reply to this email with approval, questions, or any changes needed.",
        "Once the quote is approved, NestHelper can send the secure Stripe invoice or checkout link.",
      ],
    };
  }

  if (normalized === "quote approved") {
    return {
      subject: "Your NestHelper quote was approved for next steps",
      eyebrow: "Quote approved",
      title: "Your NestHelper quote is approved for next steps.",
      intro:
        "Your quote has been marked approved. NestHelper will follow up with the secure invoice or checkout link before the visit is fully confirmed.",
      nextSteps: [
        "Watch for a secure NestHelper invoice or checkout link.",
        "Your visit is not fully confirmed until payment and final scheduling details are complete.",
      ],
    };
  }

  if (normalized === "approved") {
    return {
      subject: "Your NestHelper request was approved for next steps",
      eyebrow: "Approved for next steps",
      title: "Your NestHelper request was approved for next steps.",
      intro:
        "We reviewed your request and it looks like a potential fit. We’ll follow up with payment, scheduling, or any final details needed.",
      nextSteps: [
        "Watch for a secure NestHelper checkout link or scheduling follow-up.",
        "Your visit is not fully confirmed until payment and final scheduling details are complete.",
      ],
    };
  }

  if (normalized === "canceled" || normalized === "cancelled") {
    return {
      subject: "Your NestHelper request was canceled",
      eyebrow: "Canceled",
      title: "Your NestHelper request was canceled.",
      intro:
        "This request has been marked as canceled. If this was unexpected, please reply to this email so we can review it.",
      nextSteps: [
        "Reply to this email if you have questions.",
        "You can submit a new request anytime if you need help later.",
      ],
    };
  }

  if (normalized === "paid") {
    return {
      subject: "Payment received for your NestHelper request",
      eyebrow: "Payment received",
      title: "Payment received — thank you.",
      intro:
        "Your NestHelper payment was received. We’ll use your request details to confirm the next steps for service.",
      nextSteps: [
        "Watch for scheduling or prep details from NestHelper.",
        "Reply right away if any timing, access, parking, pets, or scope details changed.",
      ],
    };
  }

  return {
    subject: "Update on your NestHelper request",
    eyebrow: "Request update",
    title: "Your NestHelper request has been updated.",
    intro: `Your request status is now: ${status}.`,
    nextSteps: [
      "Review any notes below.",
      "Reply to this email if you have questions or need to update anything.",
    ],
  };
}

export async function sendStatusUpdateEmail({
  to,
  customerName,
  requestId,
  serviceTitle,
  status,
  note,
  preferredDate,
  preferredWindow,
  city,
  replyToEmail,
}: SendStatusUpdateEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const replyTo = replyToEmail || getPublicReplyEmail();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to || !to.includes("@")) {
    console.warn("Skipping status update email. Missing RESEND_API_KEY or customer email.");
    return { skipped: true };
  }

  const content = getStatusContent(status);
  const safeName = clean(customerName);
  const greeting = safeName ? `Hi ${safeName},` : "Hi,";
  const safeNote = clean(note);

  const summaryRows = [
    ["Request ID", requestId],
    ["Service", serviceTitle || "NestHelper service"],
    ["Status", status],
    ["Preferred date", preferredDate || ""],
    ["Preferred time window", preferredWindow || ""],
    ["City", city || ""],
  ]
    .filter(([, value]) => String(value || "").trim().length > 0)
    .map(
      ([key, value]) =>
        `<div style="padding:10px 12px;border-bottom:1px solid #eee;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;line-height:1.35;font-weight:700;color:#0f4f4a;margin:0 0 4px 0;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(key)}</div><div style="font-size:15px;line-height:1.5;color:#233;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value)}</div></div>`
    )
    .join("");

  const nextStepsHtml = content.nextSteps.map((step) => `<li style="margin:0 0 8px 0;">${escapeHtml(step)}</li>`).join("");

  const noteHtml = safeNote
    ? `<div style="margin:0 0 20px 0;padding:14px 14px 6px 14px;border-radius:14px;background:#fbf6ea;border:1px solid #eadfc8;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:700;margin-bottom:8px;">Note from NestHelper</div><div style="margin:0;padding:0;color:#233;line-height:1.65;overflow-wrap:anywhere;word-break:break-word;">${formatMultilineHtml(safeNote)}</div></div>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">${escapeHtml(content.eyebrow)}</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">${escapeHtml(content.title)}</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">${escapeHtml(content.intro)}</p>
          ${noteHtml}
          ${summaryRows ? `<div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;margin:0 0 20px 0;">${summaryRows}</div>` : ""}
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens next</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">${nextStepsHtml}</ol>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email or contact us at ${escapeHtml(replyTo)}.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;margin-top:22px;">This update was sent because this email address was used on a NestHelper service request.</p>
        </div>
      </div>
    </div>`;

  const text = `${content.title}\n\n${greeting}\n\n${content.intro}\n\n${safeNote ? `Note from NestHelper:\n${safeNote}\n\n` : ""}Request ID: ${requestId}\nService: ${serviceTitle || "NestHelper service"}\nStatus: ${status}\n\nWhat happens next:\n${content.nextSteps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n")}\n\nQuestions or changes? Reply to this email or contact us at ${replyTo}.\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: content.subject, html, text, replyTo });
}
