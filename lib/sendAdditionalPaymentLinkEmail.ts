import { Resend } from "resend";
import { emailAliases } from "./emailRouting";

type AdditionalPaymentLinkEmailInput = {
  to: string;
  customerName?: string;
  requestId: string;
  serviceTitle: string;
  paymentUrl: string;
  amount: number;
  reason: string;
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number.isFinite(value) ? value : 0);
}

function buildSummaryRows(rows: Record<string, unknown>) {
  return Object.entries(rows)
    .filter(([, value]) => String(value || "").trim().length > 0)
    .map(
      ([key, value]) =>
        `<div style="padding:10px 12px;border-bottom:1px solid #eee;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;line-height:1.35;font-weight:700;color:#0f4f4a;margin:0 0 4px 0;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(key)}</div><div style="font-size:15px;line-height:1.5;color:#233;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value)}</div></div>`
    )
    .join("");
}

export async function sendAdditionalPaymentLinkEmail({
  to,
  customerName,
  requestId,
  serviceTitle,
  paymentUrl,
  amount,
  reason,
  note,
  preferredDate,
  preferredWindow,
  city,
  replyToEmail,
}: AdditionalPaymentLinkEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const replyTo = replyToEmail || emailAliases.billing;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to || !paymentUrl) {
    console.warn("Skipping additional payment email. Missing RESEND_API_KEY, customer email, or payment URL.");
    return { skipped: true };
  }

  const greeting = customerName?.trim() ? `Hi ${customerName.trim()},` : "Hi,";
  const cleanReason = reason?.trim() || "Additional approved balance";
  const cleanNote = note?.trim() || "";
  const summaryRows = buildSummaryRows({
    "Request ID": requestId,
    Service: serviceTitle,
    "Additional balance": formatMoney(amount),
    Reason: cleanReason,
    "Preferred date": preferredDate,
    "Preferred window": preferredWindow,
    City: city,
  });

  const noteHtml = cleanNote
    ? `<div style="margin:0 0 20px 0;padding:14px 14px;border-radius:14px;background:#fbf6ea;border:1px solid #eadfc8;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:700;margin-bottom:6px;">Note from NestHelper</div><div style="white-space:pre-wrap;color:#233;line-height:1.6;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(cleanNote)}</div></div>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">Additional NestHelper balance</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">An additional payment link is ready.</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">An additional NestHelper balance is ready for secure checkout. This may be used for approved extra time, extra miles, route changes, add-ons, or other work that was needed beyond the original payment.</p>
          ${noteHtml}
          ${summaryRows ? `<div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;margin:0 0 22px 0;">${summaryRows}</div>` : ""}
          <p style="margin:22px 0;"><a href="${escapeHtml(paymentUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:800;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Pay additional balance securely</a></p>
          <p style="margin:0 0 14px 0;font-size:14px;color:#556;">If the button does not work, copy and paste this secure checkout link into your browser:</p>
          <p style="word-break:break-all;font-size:13px;color:#075c58;margin:0 0 18px 0;">${escapeHtml(paymentUrl)}</p>
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens after payment</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">
            <li style="margin:0 0 8px 0;">Stripe confirms the additional payment securely.</li>
            <li style="margin:0 0 8px 0;">NestHelper records the additional balance as paid on your request.</li>
            <li style="margin:0 0 8px 0;">Reply right away if you have questions about the added time, mileage, or approved work.</li>
          </ol>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email or contact us at ${escapeHtml(replyTo)}.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
        </div>
      </div>
    </div>`;

  const text = `${greeting}\n\nAn additional NestHelper balance is ready for secure checkout. This may be used for approved extra time, extra miles, route changes, add-ons, or other work needed beyond the original payment.\n\nRequest ID: ${requestId}\nService: ${serviceTitle}\nAdditional balance: ${formatMoney(amount)}\nReason: ${cleanReason}${cleanNote ? `\n\nNote from NestHelper:\n${cleanNote}` : ""}\n\nPay securely: ${paymentUrl}\n\nQuestions or changes? Reply to this email or contact us at ${replyTo}.\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: "Additional NestHelper payment link", html, text, replyTo });
}
