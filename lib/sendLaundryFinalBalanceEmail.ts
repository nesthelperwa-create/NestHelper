import { Resend } from "resend";
import { emailAliases } from "./emailRouting";

type LaundryFinalBalanceEmailInput = {
  to: string;
  customerName?: string;
  requestId: string;
  paymentUrl: string;
  dryWeightLbs: number;
  ratePerLb: number;
  addOnsAmount: number;
  depositCredit: number;
  balanceDue: number;
  note?: string;
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, "") : "0";
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

export async function sendLaundryFinalBalanceEmail({
  to,
  customerName,
  requestId,
  paymentUrl,
  dryWeightLbs,
  ratePerLb,
  addOnsAmount,
  depositCredit,
  balanceDue,
  note,
  preferredDate,
  preferredWindow,
  city,
}: LaundryFinalBalanceEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const customerSupportEmail = emailAliases.laundry;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to || !paymentUrl) {
    console.warn("Skipping laundry final balance email. Missing RESEND_API_KEY, customer email, or payment URL.");
    return { skipped: true };
  }

  const greeting = customerName?.trim() ? `Hi ${customerName.trim()},` : "Hi,";
  const laundrySubtotal = dryWeightLbs * ratePerLb + addOnsAmount;
  const summaryRows = buildSummaryRows({
    "Request ID": requestId,
    Service: "Laundry Rescue final balance",
    "Dry weight": `${formatNumber(dryWeightLbs)} lb`,
    "Rate per lb": formatMoney(ratePerLb),
    "Laundry subtotal": formatMoney(laundrySubtotal),
    "Add-ons / bulky items": addOnsAmount > 0 ? formatMoney(addOnsAmount) : "None",
    "Deposit credit": `-${formatMoney(depositCredit)}`,
    "Final balance due": formatMoney(balanceDue),
    "Preferred date": preferredDate,
    "Preferred window": preferredWindow,
    City: city,
  });

  const noteHtml = note?.trim()
    ? `<div style="margin:0 0 20px 0;padding:16px 18px;border-radius:14px;background:#fbf6ea;border:1px solid #eadfc8;"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:700;margin-bottom:6px;">Note from NestHelper</div><div style="white-space:pre-wrap;color:#233;line-height:1.6;">${escapeHtml(note.trim())}</div></div>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:28px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;">
        <div style="background:#075c58;color:#fff;padding:24px 26px;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">Laundry final balance</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">Your Laundry Rescue final balance is ready.</h1>
        </div>
        <div style="padding:24px 26px;color:#233;line-height:1.6;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">Your laundry was dry-weighed and your deposit has been credited. The remaining balance is ready for secure checkout.</p>
          ${noteHtml}
          ${summaryRows ? `<table style="width:100%;border-collapse:collapse;margin:0 0 22px 0;">${summaryRows}</table>` : ""}
          <p style="margin:22px 0;"><a href="${escapeHtml(paymentUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:800;">Pay final balance securely</a></p>
          <p style="margin:0 0 14px 0;font-size:14px;color:#556;">If the button does not work, copy and paste this secure checkout link into your browser:</p>
          <p style="word-break:break-all;font-size:13px;color:#075c58;margin:0 0 18px 0;">${escapeHtml(paymentUrl)}</p>
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens after payment</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">
            <li style="margin:0 0 8px 0;">Stripe confirms the final balance securely.</li>
            <li style="margin:0 0 8px 0;">NestHelper marks the Laundry Rescue request fully paid.</li>
            <li style="margin:0 0 8px 0;">Reply right away if you have questions about the weight, add-ons, or return details.</li>
          </ol>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email or contact us at ${escapeHtml(customerSupportEmail)}.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Visit NestHelper</a></p>
        </div>
      </div>
    </div>`;

  const text = `${greeting}\n\nYour laundry was dry-weighed and your deposit has been credited. The remaining balance is ready for secure checkout.\n\nRequest ID: ${requestId}\nDry weight: ${formatNumber(dryWeightLbs)} lb\nRate per lb: ${formatMoney(ratePerLb)}\nLaundry subtotal: ${formatMoney(laundrySubtotal)}\nAdd-ons / bulky items: ${addOnsAmount > 0 ? formatMoney(addOnsAmount) : "None"}\nDeposit credit: -${formatMoney(depositCredit)}\nFinal balance due: ${formatMoney(balanceDue)}${note?.trim() ? `\n\nNote from NestHelper:\n${note.trim()}` : ""}\n\nPay securely: ${paymentUrl}\n\nQuestions or changes? Reply to this email or contact us at ${customerSupportEmail}.\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: "Laundry Rescue final balance is ready", html, text, replyTo: customerSupportEmail });
}
