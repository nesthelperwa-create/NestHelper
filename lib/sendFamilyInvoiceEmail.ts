import { Resend } from "resend";
import { getPublicReplyEmail } from "./emailRouting";

type FamilyInvoiceEmailInput = {
  to: string;
  customerName?: string;
  requestId: string;
  invoiceUrl: string;
  invoicePdf?: string;
  invoiceNumber?: string | null;
  amountDueCents?: number | null;
  dueDate?: number | null;
  serviceTitle?: string;
  quoteTitle?: string;
  quoteBreakdownText?: string;
  replyToEmail?: string;
  servicePeriodLabel?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCents(value: unknown) {
  const cents = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDueDate(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "Shown on invoice";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value * 1000));
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
    .replace(/payment summary/gi, "payment summary")
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
        `<div style="padding:10px 12px;border-bottom:1px solid #eee;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;line-height:1.35;font-weight:700;color:#0f4f4a;margin:0 0 4px 0;">${escapeHtml(key)}</div><div style="font-size:15px;line-height:1.5;color:#233;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value)}</div></div>`
    )
    .join("");
}

export async function sendFamilyInvoiceEmail({
  to,
  customerName,
  requestId,
  invoiceUrl,
  invoicePdf,
  invoiceNumber,
  amountDueCents,
  dueDate,
  serviceTitle,
  quoteTitle,
  quoteBreakdownText,
  replyToEmail,
  servicePeriodLabel,
}: FamilyInvoiceEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const customerSupportEmail = replyToEmail || getPublicReplyEmail();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to || !invoiceUrl) {
    console.warn("Skipping family invoice email. Missing RESEND_API_KEY, customer email, or invoice URL.");
    return { skipped: true } as const;
  }

  const greeting = customerName?.trim() ? `Hi ${customerName.trim()},` : "Hi,";
  const cleanBreakdown = cleanCustomerPaymentSummaryText(String(quoteBreakdownText || "").trim());
  const cleanServiceTitle = serviceTitle || "NestHelper service";
  const summaryRows = buildSummaryRows({
    "Request ID": requestId,
    Service: cleanServiceTitle,
    "Invoice number": invoiceNumber || "Shown on invoice",
    "Amount due": formatCents(amountDueCents),
    "Due date": formatDueDate(dueDate),
    "Service period": servicePeriodLabel,
  });
  const breakdownHtml = cleanBreakdown
    ? `<div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:800;margin:0 0 10px 0;">${escapeHtml(quoteTitle || "NestHelper payment summary")}</div>${buildPaymentSummaryCard(cleanBreakdown)}`
    : "";

  const pdfLink = invoicePdf
    ? `<p style="margin:0 0 18px 0;"><a href="${escapeHtml(invoicePdf)}" style="color:#075c58;font-weight:800;">Download invoice PDF</a></p>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:720px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">NestHelper Parent Reset</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Your NestHelper invoice is ready.</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">Your NestHelper invoice is ready for review and secure payment through Stripe. Please review the service/payment summary before paying. Timing, access, and service notes are confirmed by NestHelper.</p>
          ${summaryRows ? `<div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;margin:0 0 22px 0;">${summaryRows}</div>` : ""}
          ${breakdownHtml}
          <p style="margin:22px 0;"><a href="${escapeHtml(invoiceUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:800;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Review and pay invoice</a></p>
          ${pdfLink}
          <p style="margin:0 0 14px 0;font-size:14px;color:#556;">If the button does not work, copy and paste this secure Stripe invoice link into your browser:</p>
          <p style="word-break:break-all;font-size:13px;color:#075c58;margin:0 0 18px 0;">${escapeHtml(invoiceUrl)}</p>
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens after payment</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">
            <li style="margin:0 0 8px 0;">Stripe confirms the invoice payment securely.</li>
            <li style="margin:0 0 8px 0;">NestHelper confirms schedule, access, and service notes.</li>
            <li style="margin:0 0 8px 0;">Any later approved add-ons, laundry balance, or scope changes are handled separately.</li>
          </ol>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email or contact us at ${escapeHtml(customerSupportEmail)}.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
        </div>
      </div>
    </div>`;

  const breakdownTextBlock = cleanBreakdown ? `\n\n${quoteTitle || "NestHelper payment summary"}:\n${cleanBreakdown}` : "";
  const text = `${greeting}\n\nYour NestHelper invoice is ready for review and secure payment through Stripe. Please review the service/payment summary before paying.\n\nRequest ID: ${requestId}\nService: ${cleanServiceTitle}\nInvoice number: ${invoiceNumber || "Shown on invoice"}\nAmount due: ${formatCents(amountDueCents)}\nDue date: ${formatDueDate(dueDate)}${servicePeriodLabel ? `
Service period: ${servicePeriodLabel}` : ""}${breakdownTextBlock}\n\nReview and pay invoice: ${invoiceUrl}${invoicePdf ? `\nInvoice PDF: ${invoicePdf}` : ""}\n\nQuestions or changes? Reply to this email or contact us at ${customerSupportEmail}.\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({
    from,
    to,
    subject: `Your NestHelper invoice for ${cleanServiceTitle}`,
    html,
    text,
    replyTo: customerSupportEmail,
  });
}
