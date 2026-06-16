import { Resend } from "resend";
import { getPublicReplyEmail } from "./emailRouting";

export type SendReviewRequestEmailInput = {
  to: string;
  customerName?: string;
  subject?: string;
  message?: string;
  reviewUrl: string;
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

function getFirstName(name?: string) {
  return clean(name).split(/\s+/).filter(Boolean)[0] || "";
}

function normalizeMessage(message: string, reviewUrl: string) {
  const trimmed = clean(message);
  const body = trimmed || "Thank you for trusting NestHelper. If your reset helped your home feel calmer, would you mind leaving a quick Google review? It helps other local families know what to expect.";
  return body.includes(reviewUrl) ? body : `${body}\n\n${reviewUrl}`;
}

export async function sendReviewRequestEmail({ to, customerName, subject, message, reviewUrl, replyToEmail }: SendReviewRequestEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const replyTo = replyToEmail || getPublicReplyEmail();

  if (!apiKey || !to || !to.includes("@") || !reviewUrl) {
    console.warn("Skipping review request email. Missing RESEND_API_KEY, customer email, or review URL.");
    return { skipped: true };
  }

  const firstName = getFirstName(customerName);
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const finalSubject = clean(subject) || "Thank you from NestHelper";
  const finalMessage = normalizeMessage(message || "", reviewUrl);
  const safeParagraphs = finalMessage
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px 0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(paragraph)}</p>`)
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">Thank you</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Thank you for trusting NestHelper.</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          ${safeParagraphs}
          <p style="margin:22px 0 18px 0;"><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Leave a Google review</a></p>
          <p style="margin:0 0 18px 0;font-size:13px;color:#667;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(reviewUrl)}</p>
          <p style="font-size:12px;color:#667;line-height:1.5;margin-top:22px;">Reviews should reflect your genuine experience. NestHelper does not offer discounts, gifts, or payment in exchange for reviews.</p>
          <p style="margin:18px 0 0 0;">Questions or concerns? Reply to this email or contact us at ${escapeHtml(replyTo)}.</p>
        </div>
      </div>
    </div>`;

  const text = `${greeting}\n\n${finalMessage}\n\nLeave a Google review: ${reviewUrl}\n\nReviews should reflect your genuine experience. NestHelper does not offer discounts, gifts, or payment in exchange for reviews.\n\nQuestions or concerns? Reply to this email or contact us at ${replyTo}.`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: finalSubject, html, text, replyTo });
}
