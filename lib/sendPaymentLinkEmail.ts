import { Resend } from "resend";

type PaymentLinkEmailInput = {
  to: string;
  customerName?: string;
  requestId: string;
  serviceTitle: string;
  servicePrice?: string;
  paymentUrl: string;
  preferredDate?: string;
  preferredWindow?: string;
  city?: string;
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
        `<tr><td style="padding:9px 12px;border-bottom:1px solid #eee;font-weight:700;color:#0f4f4a;vertical-align:top;">${escapeHtml(key)}</td><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#233;vertical-align:top;">${escapeHtml(value)}</td></tr>`
    )
    .join("");
}

export async function sendPaymentLinkEmail({
  to,
  customerName,
  requestId,
  serviceTitle,
  servicePrice,
  paymentUrl,
  preferredDate,
  preferredWindow,
  city,
}: PaymentLinkEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const replyTo = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to || !paymentUrl) {
    console.warn("Skipping payment link email. Missing RESEND_API_KEY, customer email, or payment URL.");
    return { skipped: true };
  }

  const greeting = customerName ? `Hi ${customerName},` : "Hi,";
  const summaryRows = buildSummaryRows({
    "Request ID": requestId,
    Service: serviceTitle,
    "Price / deposit": servicePrice,
    "Preferred date": preferredDate,
    "Preferred window": preferredWindow,
    City: city,
  });

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:28px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;">
        <div style="background:#075c58;color:#fff;padding:24px 26px;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">NestHelper checkout</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">Your NestHelper request is ready for checkout.</h1>
        </div>
        <div style="padding:24px 26px;color:#233;line-height:1.6;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">We reviewed your request and the next step is secure checkout. Your visit is not confirmed until payment is completed and NestHelper follows up with scheduling details.</p>
          ${summaryRows ? `<table style="width:100%;border-collapse:collapse;margin:0 0 22px 0;">${summaryRows}</table>` : ""}
          <p style="margin:22px 0;"><a href="${escapeHtml(paymentUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:800;">Pay securely with Stripe</a></p>
          <p style="margin:0 0 14px 0;font-size:14px;color:#556;">If the button does not work, copy and paste this secure checkout link into your browser:</p>
          <p style="word-break:break-all;font-size:13px;color:#075c58;margin:0 0 18px 0;">${escapeHtml(paymentUrl)}</p>
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens after payment</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">
            <li style="margin:0 0 8px 0;">Stripe confirms payment securely.</li>
            <li style="margin:0 0 8px 0;">NestHelper confirms timing and any final prep notes.</li>
            <li style="margin:0 0 8px 0;">For Laundry Rescue, dry weight and add-ons are confirmed before any final balance.</li>
          </ol>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Visit NestHelper</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;margin-top:22px;">This checkout email was sent after a NestHelper request was reviewed. Do not forward this email if it contains personal request details.</p>
        </div>
      </div>
    </div>`;

  const text = `${greeting}\n\nWe reviewed your NestHelper request and it is ready for secure checkout. Your visit is not confirmed until payment is completed and NestHelper follows up with scheduling details.\n\nService: ${serviceTitle}\nRequest ID: ${requestId}\n${servicePrice ? `Price / deposit: ${servicePrice}\n` : ""}\nPay securely with Stripe: ${paymentUrl}\n\nAfter payment, NestHelper will confirm timing and prep notes. For Laundry Rescue, dry weight and add-ons are confirmed before any final balance.\n\nQuestions or changes? Reply to this email.\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({
    from,
    to,
    subject: "Your NestHelper checkout link",
    html,
    text,
    replyTo,
  });
}
