import { Resend } from "resend";
import { emailAliases } from "./emailRouting";

type LaundryFinalBalanceEmailInput = {
  to: string;
  customerName?: string;
  requestId: string;
  invoiceUrl: string;
  invoicePdf?: string;
  invoiceNumber?: string;
  dryWeightLbs: number;
  includedWeightLbs?: number;
  additionalWeightLbs?: number;
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
  return Number.isFinite(value) ? value.toFixed(2).replace(/\.?0+$/, "") : "0";
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

export async function sendLaundryFinalBalanceEmail({
  to,
  customerName,
  requestId,
  invoiceUrl,
  invoicePdf,
  invoiceNumber,
  dryWeightLbs,
  includedWeightLbs,
  additionalWeightLbs,
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

  if (!apiKey || !to || !invoiceUrl) {
    console.warn("Skipping laundry final balance email. Missing RESEND_API_KEY, customer email, or invoice URL.");
    return { skipped: true };
  }

  const greeting = customerName?.trim() ? `Hi ${customerName.trim()},` : "Hi,";
  const displayIncludedWeightLbs = includedWeightLbs && includedWeightLbs > 0 ? includedWeightLbs : 26.2;
  const displayAdditionalWeightLbs = additionalWeightLbs && additionalWeightLbs > 0 ? additionalWeightLbs : Math.max(0, dryWeightLbs - displayIncludedWeightLbs);
  const summaryRows = buildSummaryRows({
    "Request ID": requestId,
    "Invoice number": invoiceNumber,
    Service: "Laundry Rescue final balance",
    "Final dry weight": `${formatNumber(dryWeightLbs)} lb`,
    "Included in $59 minimum": `Up to about ${formatNumber(displayIncludedWeightLbs)} lb`,
    "Additional laundry": `${formatNumber(displayAdditionalWeightLbs)} lb at ${formatMoney(ratePerLb)}/lb`,
    "Add-ons / bulky items": addOnsAmount > 0 ? formatMoney(addOnsAmount) : "None",
    "Minimum already paid": formatMoney(depositCredit),
    "Final balance due": formatMoney(balanceDue),
    "Preferred date": preferredDate,
    "Preferred window": preferredWindow,
    City: city,
  });

  const noteHtml = note?.trim()
    ? `<div style="margin:0 0 20px 0;padding:14px 14px;border-radius:14px;background:#fbf6ea;border:1px solid #eadfc8;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:700;margin-bottom:6px;">Note from NestHelper</div><div style="white-space:pre-wrap;color:#233;line-height:1.6;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(note.trim())}</div></div>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">Laundry final balance</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Your Laundry Rescue final balance is ready.</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">Your laundry has been washed, dried, folded, and calculated by final dry weight. Your $59 intro minimum already includes pickup, wash, dry, fold, return, and up to about 26.2 lbs. The remaining balance covers any additional laundry above the included final dry weight plus approved add-ons or bulky items.</p>
          ${noteHtml}
          ${summaryRows ? `<div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;margin:0 0 22px 0;">${summaryRows}</div>` : ""}
          <p style="margin:22px 0;"><a href="${escapeHtml(invoiceUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:800;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">View and pay final invoice</a></p>
          <p style="margin:0 0 14px 0;font-size:14px;color:#556;">If the button does not work, copy and paste this secure invoice link into your browser:</p>
          <p style="word-break:break-all;font-size:13px;color:#075c58;margin:0 0 18px 0;">${escapeHtml(invoiceUrl)}</p>
          ${invoicePdf ? `<p style="margin:0 0 18px 0;"><a href="${escapeHtml(invoicePdf)}" style="display:inline-block;background:#fff;color:#075c58;text-decoration:none;padding:11px 16px;border-radius:999px;border:1px solid #075c58;font-weight:800;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Download invoice PDF</a></p>` : ""}
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens after payment</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">
            <li style="margin:0 0 8px 0;">Stripe confirms the final invoice payment securely.</li>
            <li style="margin:0 0 8px 0;">NestHelper marks the Laundry Rescue request fully paid after Stripe confirms the invoice payment.</li>
            <li style="margin:0 0 8px 0;">Reply right away if you have questions about the weight, add-ons, or return details.</li>
          </ol>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email or contact us at ${escapeHtml(customerSupportEmail)}.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
        </div>
      </div>
    </div>`;

  const text = `${greeting}\n\nYour laundry has been washed, dried, folded, and calculated by final dry weight. Your $59 intro minimum already includes pickup, wash, dry, fold, return, and up to about 26.2 lbs. The remaining balance covers any additional laundry above the included final dry weight plus approved add-ons or bulky items.\n\nRequest ID: ${requestId}\nDry weight: ${formatNumber(dryWeightLbs)} lb\nIncluded in $59 minimum: up to about ${formatNumber(displayIncludedWeightLbs)} lb\nAdditional laundry: ${formatNumber(displayAdditionalWeightLbs)} lb at ${formatMoney(ratePerLb)}/lb\nAdd-ons / bulky items: ${addOnsAmount > 0 ? formatMoney(addOnsAmount) : "None"}\nMinimum already paid: ${formatMoney(depositCredit)}\nFinal balance due: ${formatMoney(balanceDue)}${note?.trim() ? `\n\nNote from NestHelper:\n${note.trim()}` : ""}\n\nPay securely: ${invoiceUrl}\n\nQuestions or changes? Reply to this email or contact us at ${customerSupportEmail}.\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: "Laundry Rescue final invoice is ready", html, text, replyTo: customerSupportEmail });
}
