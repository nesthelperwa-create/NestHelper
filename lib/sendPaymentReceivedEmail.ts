import { Resend } from "resend";

type SendPaymentReceivedEmailInput = {
  to: string;
  customerName?: string;
  requestId: string;
  serviceTitle?: string;
  amountTotal?: number | null;
  currency?: string | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(amountTotal?: number | null, currency?: string | null) {
  if (typeof amountTotal !== "number") return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(amountTotal / 100);
  } catch {
    return `$${(amountTotal / 100).toFixed(2)}`;
  }
}

export async function sendPaymentReceivedEmail({ to, customerName, requestId, serviceTitle, amountTotal, currency }: SendPaymentReceivedEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const replyTo = process.env.CUSTOMER_SUPPORT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to || !to.includes("@")) {
    console.warn("Skipping payment received email. Missing RESEND_API_KEY or customer email.");
    return { skipped: true };
  }

  const greeting = customerName?.trim() ? `Hi ${customerName.trim()},` : "Hi,";
  const amountLabel = formatMoney(amountTotal, currency);

  const summaryRows = [
    ["Request ID", requestId],
    ["Service", serviceTitle || "NestHelper service"],
    ["Payment status", "Paid"],
    ["Amount paid", amountLabel],
  ]
    .filter(([, value]) => String(value || "").trim().length > 0)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:9px 12px;border-bottom:1px solid #eee;font-weight:700;color:#0f4f4a;vertical-align:top;">${escapeHtml(key)}</td><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#233;vertical-align:top;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:28px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;">
        <div style="background:#075c58;color:#fff;padding:24px 26px;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">Payment received</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">Your NestHelper payment was successful.</h1>
        </div>
        <div style="padding:24px 26px;color:#233;line-height:1.6;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">Thank you — we received your NestHelper payment. Your request is now marked as paid and ready for scheduling follow-up.</p>
          ${summaryRows ? `<table style="width:100%;border-collapse:collapse;margin:0 0 20px 0;">${summaryRows}</table>` : ""}
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens next</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">
            <li style="margin:0 0 8px 0;">NestHelper will confirm scheduling and any final prep notes.</li>
            <li style="margin:0 0 8px 0;">Reply right away if your timing, access details, parking, pets, or service needs changed.</li>
            <li style="margin:0 0 8px 0;">For Laundry Rescue, dry weight and approved add-ons are confirmed before any final balance.</li>
          </ol>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email or contact us at ${escapeHtml(replyTo)}.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Visit NestHelper</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;margin-top:22px;">Stripe may also send an official payment receipt depending on your receipt settings.</p>
        </div>
      </div>
    </div>`;

  const text = `Your NestHelper payment was successful.\n\n${greeting}\n\nThank you — we received your NestHelper payment. Your request is now marked as paid and ready for scheduling follow-up.\n\nRequest ID: ${requestId}\nService: ${serviceTitle || "NestHelper service"}\nStatus: Paid${amountLabel ? `\nAmount paid: ${amountLabel}` : ""}\n\nWhat happens next:\n1. NestHelper will confirm scheduling and any final prep notes.\n2. Reply right away if your timing, access details, parking, pets, or service needs changed.\n3. For Laundry Rescue, dry weight and approved add-ons are confirmed before any final balance.\n\nQuestions or changes? Reply to this email or contact us at ${replyTo}.\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: "Payment received for your NestHelper request", html, text, replyTo });
}
