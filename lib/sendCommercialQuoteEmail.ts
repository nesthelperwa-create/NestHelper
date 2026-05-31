import { Resend } from "resend";
import { getPublicReplyEmail } from "./emailRouting";

type CommercialQuoteEmailInput = {
  to: string;
  customerName?: string;
  requestId: string;
  quoteTitle?: string;
  quoteBreakdownText: string;
  validUntil?: string;
  servicePeriodLabel?: string;
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

function buildSummaryRows(rows: Record<string, unknown>) {
  return Object.entries(rows)
    .filter(([, value]) => String(value || "").trim().length > 0)
    .map(
      ([key, value]) =>
        `<div style="padding:10px 12px;border-bottom:1px solid #eee;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;line-height:1.35;font-weight:700;color:#0f4f4a;margin:0 0 4px 0;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(key)}</div><div style="font-size:15px;line-height:1.5;color:#233;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value)}</div></div>`
    )
    .join("");
}

export async function sendCommercialQuoteEmail({
  to,
  customerName,
  requestId,
  quoteTitle,
  quoteBreakdownText,
  validUntil,
  servicePeriodLabel,
  replyToEmail,
}: CommercialQuoteEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const customerSupportEmail = replyToEmail || getPublicReplyEmail();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to || !quoteBreakdownText.trim()) {
    console.warn("Skipping commercial quote email. Missing RESEND_API_KEY, customer email, or quote breakdown.");
    return { skipped: true } as const;
  }

  const greeting = customerName?.trim() ? `Hi ${customerName.trim()},` : "Hi,";
  const cleanTitle = quoteTitle?.trim() || "Commercial Reset quote breakdown";
  const cleanBreakdown = quoteBreakdownText.trim();
  const summaryRows = buildSummaryRows({
    "Request ID": requestId,
    "Quote status": "For review",
    "Valid / review date": validUntil,
    "Service period": servicePeriodLabel,
  });

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:720px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">NestHelper Commercial Reset</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Your Commercial Reset quote is ready for review.</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">Thank you for your Commercial Reset request. We reviewed the details and prepared the quote below for your review. This email is not a payment request yet.</p>
          ${summaryRows ? `<div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;margin:0 0 22px 0;">${summaryRows}</div>` : ""}
          <div style="margin:0 0 22px 0;padding:16px 14px;border-radius:14px;background:#fbf6ea;border:1px solid #eadfc8;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:800;margin-bottom:8px;">${escapeHtml(cleanTitle)}</div>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.55;color:#233;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(cleanBreakdown)}</div>
          </div>
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">Next step</h2>
          <p style="margin:0 0 18px 0;">Please reply to this email with approval, questions, or any changes. Once the quote is approved, NestHelper can send the secure Stripe invoice/payment link.</p>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email or contact us at ${escapeHtml(customerSupportEmail)}.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
        </div>
      </div>
    </div>`;

  const text = `${greeting}\n\nThank you for your Commercial Reset request. We reviewed the details and prepared this quote for your review. This is not a payment request yet.\n\nRequest ID: ${requestId}${validUntil ? `\nValid / review date: ${validUntil}` : ""}${servicePeriodLabel ? `\nService period: ${servicePeriodLabel}` : ""}\n\n${cleanTitle}:\n${cleanBreakdown}\n\nPlease reply to this email with approval, questions, or any changes. Once the quote is approved, NestHelper can send the secure Stripe invoice/payment link.\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({
    from,
    to,
    subject: "Your NestHelper Commercial Reset quote",
    html,
    text,
    replyTo: customerSupportEmail,
  });
}
