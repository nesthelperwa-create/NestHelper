import { Resend } from "resend";
import { getPublicReplyEmail } from "./emailRouting";

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
  replyToEmail?: string;
  quoteBreakdownText?: string;
  quoteBreakdownTitle?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatInlineText(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\$([0-9,]+(?:\.[0-9]{2})?)/g, "<strong>$$$1</strong>");
}

function isPaymentSummaryHeading(line: string) {
  return ["SERVICE DETAILS", "ITEMS INCLUDED", "AMOUNT SUMMARY", "CUSTOMER NOTE", "PLEASE NOTE"].includes(line.trim().toUpperCase());
}

function cleanCustomerPaymentSummaryText(value: string) {
  return String(value || "")
    .replace(/Customer-facing draft estimate/gi, "Customer-facing payment summary")
    .replace(/draft estimate/gi, "payment summary")
    .replace(/draft total/gi, "amount summary")
    .replace(/payment breakdown/gi, "payment summary")
    .replace(/payment summary/gi, "payment summary")
    .replace(/Review before sending\.?/gi, "Reviewed by NestHelper.")
    .replace(/Reviewed before sending\.?/gi, "Reviewed by NestHelper.")
    .trim();
}

function renderPaymentSummaryLine(line: string) {
  if (line.startsWith("•")) {
    return `<div style="margin:10px 0 12px 0;padding:12px 12px;border-radius:12px;background:#ffffff;border:1px solid #eadfc8;color:#233;line-height:1.55;">
      <div style="font-weight:800;color:#075c58;margin-bottom:4px;">${formatInlineText(line.replace(/^•\s*/, ""))}</div>
    </div>`;
  }

  const labelMatch = line.match(/^([^:]{2,42}):\s*(.*)$/);
  if (labelMatch) {
    return `<div style="margin:0 0 9px 0;line-height:1.55;"><strong style="color:#0f4f4a;">${formatInlineText(labelMatch[1])}:</strong> ${formatInlineText(labelMatch[2])}</div>`;
  }

  return `<p style="margin:0 0 10px 0;line-height:1.6;">${formatInlineText(line)}</p>`;
}

function buildPaymentSummaryCard(text: string) {
  const clean = cleanCustomerPaymentSummaryText(text);
  if (!clean) return "";

  const lines = clean
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstHeadingIndex = lines.findIndex(isPaymentSummaryHeading);
  const introLines = firstHeadingIndex > 0 ? lines.slice(0, firstHeadingIndex) : [];
  const sectionLines = firstHeadingIndex >= 0 ? lines.slice(firstHeadingIndex) : lines;

  const sections: Array<{ heading: string; lines: string[] }> = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const line of sectionLines) {
    if (isPaymentSummaryHeading(line)) {
      if (current) sections.push(current);
      current = { heading: line.toUpperCase(), lines: [] };
      continue;
    }

    if (!current) current = { heading: "PAYMENT SUMMARY", lines: [] };
    current.lines.push(line);
  }

  if (current) sections.push(current);

  const introHtml = introLines.length
    ? `<div style="font-size:15px;line-height:1.55;color:#233;margin:0 0 16px 0;">${introLines.map(formatInlineText).join("<br>")}</div>`
    : "";

  const sectionHtml = sections.map((section) => {
    const body = section.lines.map(renderPaymentSummaryLine).join("");

    return `<div style="margin:0 0 18px 0;padding:0 0 4px 0;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:900;margin:0 0 10px 0;">${escapeHtml(section.heading)}</div>
      <div style="font-size:15px;line-height:1.6;color:#233;">${body}</div>
    </div>`;
  }).join("");

  return `<div style="margin:0 0 22px 0;padding:18px 16px;border-radius:16px;background:#fbf6ea;border:1px solid #eadfc8;box-sizing:border-box;overflow-wrap:anywhere;word-break:normal;">
    ${introHtml}
    ${sectionHtml}
  </div>`;
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
  replyToEmail,
  quoteBreakdownText,
  quoteBreakdownTitle,
}: PaymentLinkEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const customerSupportEmail = replyToEmail || getPublicReplyEmail();
  const replyTo = customerSupportEmail;
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
  const cleanQuoteBreakdown = cleanCustomerPaymentSummaryText(String(quoteBreakdownText || "").trim());
  const quoteBreakdownHtml = cleanQuoteBreakdown
    ? `<div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:800;margin:0 0 10px 0;">${escapeHtml(quoteBreakdownTitle || "Payment summary")}</div>${buildPaymentSummaryCard(cleanQuoteBreakdown)}`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">NestHelper checkout</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Your NestHelper request is ready for checkout.</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">We reviewed your request and the next step is secure checkout. If a payment summary is included below, please review it before paying. Your visit is not confirmed until payment is completed and NestHelper follows up with scheduling details.</p>
          ${summaryRows ? `<div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;margin:0 0 22px 0;">${summaryRows}</div>` : ""}
          ${quoteBreakdownHtml}
          <p style="margin:22px 0;"><a href="${escapeHtml(paymentUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:800;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Pay securely with Stripe</a></p>
          <p style="margin:0 0 14px 0;font-size:14px;color:#556;">If the button does not work, copy and paste this secure checkout link into your browser:</p>
          <p style="word-break:break-all;font-size:13px;color:#075c58;margin:0 0 18px 0;">${escapeHtml(paymentUrl)}</p>
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens after payment</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">
            <li style="margin:0 0 8px 0;">Stripe confirms payment securely.</li>
            <li style="margin:0 0 8px 0;">NestHelper confirms timing and any final prep notes.</li>
            <li style="margin:0 0 8px 0;">For Laundry Rescue, dry weight and add-ons are confirmed before any final balance.</li>
          </ol>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email or contact us at ${escapeHtml(customerSupportEmail)}.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;margin-top:22px;">This checkout email was sent after a NestHelper request was reviewed. Do not forward this email if it contains personal request details.</p>
        </div>
      </div>
    </div>`;

  const quoteBreakdownTextBlock = cleanQuoteBreakdown ? `

${quoteBreakdownTitle || "Payment summary"}:
${cleanQuoteBreakdown}` : "";
  const text = `${greeting}

We reviewed your NestHelper request and it is ready for secure checkout. If a payment summary is included, please review it before paying. Your visit is not confirmed until payment is completed and NestHelper follows up with scheduling details.

Service: ${serviceTitle}
Request ID: ${requestId}
${servicePrice ? `Price / deposit: ${servicePrice}
` : ""}${quoteBreakdownTextBlock}

Pay securely with Stripe: ${paymentUrl}

After payment, NestHelper will confirm timing and prep notes. For Laundry Rescue, dry weight and add-ons are confirmed before any final balance.

Questions or changes? Reply to this email or contact us at ${customerSupportEmail}.

NestHelper: ${siteUrl}`;

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
