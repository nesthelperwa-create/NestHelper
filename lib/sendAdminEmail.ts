import { Resend } from "resend";
import { getPublicReplyEmail } from "./emailRouting";

type AdminEmailInput = {
  subject: string;
  title: string;
  rows: Record<string, unknown>;
  adminPath?: string;
  intro?: string;
  to?: string | string[];
  routeLabel?: string;
  routedToText?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  if (value === null || value === undefined) return "";
  return String(value);
}

function getAdminEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.NESTHELPER_HELLO_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com";
}

function extractEmailAddress(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : "";
}

function getReplyTo(rows: Record<string, unknown>) {
  const possibleEmail = rows.email || rows.Email || rows.customerEmail || rows["Customer email"] || rows.contactEmail;
  const email = extractEmailAddress(possibleEmail);
  return email || undefined;
}

function encodeMailto(value: string) {
  return encodeURIComponent(value);
}

function encodeMailtoRecipient(email: string) {
  // Keep the recipient as a plain email address. Some email apps display
  // "email <email>" if they receive a display-name style recipient.
  return extractEmailAddress(email);
}

function getCustomerName(rows: Record<string, unknown>) {
  const possibleName = rows.name || rows.Name || rows.customerName || rows["Customer name"] || rows.fullName || rows["Full name"] || rows.Customer;
  const name = typeof possibleName === "string" ? possibleName.trim() : "";
  return name;
}

function getRowValue(rows: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = rows[key];
    const formatted = formatValue(value).trim();
    if (formatted) return formatted;
  }
  return "";
}

function isInternalAdminField(key: string) {
  const normalized = key.trim().toLowerCase();
  return [
    "inbox route",
    "website route / sent to",
    "customer reply-to",
    "dashboard id",
    "admin id",
    "submission id",
    "firestore id",
    "stripe checkout session",
  ].includes(normalized);
}

function buildCustomerDetailsText(rows: Record<string, unknown>) {
  return Object.entries(rows)
    .filter(([key, value]) => !isInternalAdminField(key) && formatValue(value).trim().length > 0)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join("\n");
}

type ReplyTemplateKind = "contact" | "helper" | "partner" | "payment" | "laundry" | "errand" | "service" | "general";

function detectReplyTemplateKind(adminTitle: string, rows: Record<string, unknown>): ReplyTemplateKind {
  const normalizedTitle = adminTitle.trim().toLowerCase();
  const serviceText = [
    getRowValue(rows, ["Service", "selectedServiceTitle", "serviceTitle"]),
    getRowValue(rows, ["service"]),
    getRowValue(rows, ["packageType", "Package type"]),
  ]
    .join(" ")
    .toLowerCase();
  const topicText = getRowValue(rows, ["topic", "Topic", "subject", "Subject"]).toLowerCase();

  if (normalizedTitle.includes("helper")) return "helper";
  if (normalizedTitle.includes("partner") || normalizedTitle.includes("contractor")) return "partner";
  if (normalizedTitle.includes("payment") || normalizedTitle.includes("invoice") || normalizedTitle.includes("billing")) return "payment";
  if (normalizedTitle.includes("contact")) return "contact";
  if (normalizedTitle.includes("laundry") || serviceText.includes("laundry") || topicText.includes("laundry")) return "laundry";
  if (serviceText.includes("errand") || topicText.includes("errand")) return "errand";
  if (normalizedTitle.includes("service") || normalizedTitle.includes("request")) return "service";

  return "general";
}

function getFirstName(rows: Record<string, unknown>) {
  const name = getCustomerName(rows);
  return name.split(/\s+/).filter(Boolean)[0] || "";
}

function buildContactReplyIntro(rows: Record<string, unknown>) {
  const subject = getRowValue(rows, ["subject", "Subject"]);
  const topic = getRowValue(rows, ["topic", "Topic"]);
  const subjectLine = subject ? ` about “${subject}”` : topic ? ` about ${topic.toLowerCase()}` : "";

  return [
    `Thanks for reaching out to NestHelper${subjectLine}. I saw your message and wanted to follow up directly.`,
    "",
    "I’m reviewing what you sent so I can answer clearly and point you to the right next step.",
  ];
}

function buildServiceReplyIntro(rows: Record<string, unknown>) {
  const serviceTitle = getRowValue(rows, ["selectedServiceTitle", "Service", "serviceTitle"]) || "your NestHelper request";
  const preferredDate = getRowValue(rows, ["preferredDate", "Preferred date"]);
  const preferredWindow = getRowValue(rows, ["preferredWindow", "Preferred window"]);
  const city = getRowValue(rows, ["city", "City"]);
  const timing = [preferredDate, preferredWindow].filter(Boolean).join(" / ");
  const locationText = city ? ` in ${city}` : "";
  const timingText = timing ? ` for ${timing}` : "";

  return [
    `Thanks for requesting ${serviceTitle}${locationText}${timingText}.`,
    "",
    "I’m reviewing the service area, timing, scope, home/access notes, and safety details before confirming next steps. If everything looks good, we’ll follow up with any questions or send the secure checkout link.",
  ];
}

function buildLaundryReplyIntro(rows: Record<string, unknown>) {
  const preferredDate = getRowValue(rows, ["preferredDate", "Preferred date"]);
  const preferredWindow = getRowValue(rows, ["preferredWindow", "Preferred window"]);
  const timing = [preferredDate, preferredWindow].filter(Boolean).join(" / ");

  return [
    `Thanks for your Laundry Rescue request${timing ? ` for ${timing}` : ""}.`,
    "",
    "I’m reviewing the pickup details, laundry estimate, detergent/dry preferences, reusable bag acknowledgement, and timing before confirming next steps.",
  ];
}

function buildErrandReplyIntro(rows: Record<string, unknown>) {
  const preferredDate = getRowValue(rows, ["preferredDate", "Preferred date"]);
  const preferredWindow = getRowValue(rows, ["preferredWindow", "Preferred window"]);
  const timing = [preferredDate, preferredWindow].filter(Boolean).join(" / ");

  return [
    `Thanks for your Errand Helper request${timing ? ` for ${timing}` : ""}.`,
    "",
    "I’m reviewing the stops, starting area, timing, mileage acknowledgement, and any access notes before confirming whether we can help and what the next step should be.",
  ];
}

function buildHelperReplyIntro(rows: Record<string, unknown>) {
  const availability = getRowValue(rows, ["availability", "Availability"]);
  const serviceArea = getRowValue(rows, ["serviceArea", "Service area"]);
  const context = [serviceArea ? `service area: ${serviceArea}` : "", availability ? `availability: ${availability}` : ""].filter(Boolean).join("; ");

  return [
    "Thanks for applying to become a NestHelper helper.",
    "",
    `I’m reviewing your experience, service area, availability, references/background-check readiness, and fit for Parent Reset services${context ? ` (${context})` : ""}.`,
  ];
}

function buildPartnerReplyIntro(rows: Record<string, unknown>) {
  const businessName = getRowValue(rows, ["businessName", "Business name"]);
  const serviceType = getRowValue(rows, ["serviceType", "Service type"]);
  const introTarget = businessName ? ` with ${businessName}` : " with NestHelper";

  return [
    `Thanks for reaching out about partnering${introTarget}.`,
    "",
    `I’m reviewing your ${serviceType ? `${serviceType.toLowerCase()} ` : ""}service fit, service area, capacity, business/license details, insurance information, and reliability standards before next steps.`,
  ];
}

function buildPaymentReplyIntro(rows: Record<string, unknown>) {
  const serviceTitle = getRowValue(rows, ["Service", "selectedServiceTitle", "serviceTitle"]) || "your NestHelper service";
  const paymentType = getRowValue(rows, ["Payment type"]);
  const amount = getRowValue(rows, ["Amount paid"]);
  const paymentContext = [paymentType, amount].filter(Boolean).join(" — ");

  return [
    `Thanks — I saw the payment come through for ${serviceTitle}.`,
    "",
    `I’m reviewing the request now so we can follow up about scheduling and next steps${paymentContext ? ` (${paymentContext})` : ""}.`,
  ];
}

function buildGenericReplyIntro() {
  return [
    "Thanks for reaching out to NestHelper.",
    "",
    "I’m reviewing what you sent and wanted to follow up directly.",
  ];
}

function buildReplyIntro(adminTitle: string, rows: Record<string, unknown>) {
  const kind = detectReplyTemplateKind(adminTitle, rows);

  if (kind === "contact") return buildContactReplyIntro(rows);
  if (kind === "helper") return buildHelperReplyIntro(rows);
  if (kind === "partner") return buildPartnerReplyIntro(rows);
  if (kind === "payment") return buildPaymentReplyIntro(rows);
  if (kind === "laundry") return buildLaundryReplyIntro(rows);
  if (kind === "errand") return buildErrandReplyIntro(rows);
  if (kind === "service") return buildServiceReplyIntro(rows);

  return buildGenericReplyIntro();
}

function getCustomerDetailsHeading(adminTitle: string, rows: Record<string, unknown>) {
  const kind = detectReplyTemplateKind(adminTitle, rows);

  if (kind === "contact") return "--- Your original message to NestHelper ---";
  if (kind === "helper") return "--- Your helper application details ---";
  if (kind === "partner") return "--- Your partner / contractor application details ---";
  if (kind === "payment") return "--- Payment/request details we have on file ---";
  if (kind === "laundry") return "--- Your Laundry Rescue request details ---";
  if (kind === "errand") return "--- Your Errand Helper request details ---";
  if (kind === "service") return "--- Your NestHelper request details ---";

  return "--- Details you sent us ---";
}

function getComposeButtonLabel(adminTitle: string, rows: Record<string, unknown>) {
  const kind = detectReplyTemplateKind(adminTitle, rows);

  if (kind === "contact") return "Reply to contact message";
  if (kind === "helper") return "Reply to helper applicant";
  if (kind === "partner") return "Reply to partner applicant";
  if (kind === "payment") return "Reply about payment";
  if (kind === "laundry") return "Reply to Laundry Rescue request";
  if (kind === "errand") return "Reply to Errand Helper request";
  if (kind === "service") return "Reply to service request";

  return "Compose customer reply";
}

function buildCustomerComposeBody(adminTitle: string, rows: Record<string, unknown>, publicReplyEmail: string) {
  const firstName = getFirstName(rows);
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const customerDetails = buildCustomerDetailsText(rows);
  const introLines = buildReplyIntro(adminTitle, rows);
  const detailsHeading = getCustomerDetailsHeading(adminTitle, rows);

  const body = [
    greeting,
    "",
    ...introLines,
    "",
    customerDetails ? "For reference, here is what we received:" : "",
    customerDetails ? detailsHeading : "",
    customerDetails,
    "",
    "Best,",
    "NestHelper",
    publicReplyEmail,
  ]
    .filter((line, index, lines) => {
      // Keep intentional blank lines, but avoid empty double gaps when no details exist.
      if (customerDetails) return true;
      return !(line === "" && lines[index - 1] === "" && lines[index + 1] === "");
    })
    .join("\n");

  // Mailto URLs can get too long in some email apps. Keep the customer context,
  // but trim very large form payloads so the compose button still opens reliably.
  return body.length > 4500 ? `${body.slice(0, 4500)}\n\n[Customer details truncated. Open the admin dashboard to review the full submission.]` : body;
}

function getCustomerReplySubject(adminTitle: string, rows: Record<string, unknown>) {
  const normalizedTitle = adminTitle.trim().toLowerCase();
  const customerSubject = formatValue(rows.subject || rows.Subject).trim();

  if (customerSubject && !customerSubject.toLowerCase().startsWith("new nesthelper")) {
    return `Re: ${customerSubject}`;
  }

  if (normalizedTitle.includes("contact")) return "Re: Your NestHelper message";
  if (normalizedTitle.includes("helper")) return "Re: Your NestHelper helper application";
  if (normalizedTitle.includes("partner") || normalizedTitle.includes("contractor")) return "Re: Your NestHelper partner application";
  if (normalizedTitle.includes("payment") || normalizedTitle.includes("invoice") || normalizedTitle.includes("billing")) return "Re: Your NestHelper payment";
  if (normalizedTitle.includes("laundry")) return "Re: Your NestHelper Laundry Rescue request";
  if (normalizedTitle.includes("service") || normalizedTitle.includes("request")) return "Re: Your NestHelper request";

  return "Re: NestHelper";
}

function getSafeCustomerComposeLink(customerEmail: string | undefined, subject: string, rows: Record<string, unknown>, publicReplyEmail: string) {
  if (!customerEmail) return "";
  const body = buildCustomerComposeBody(subject, rows, publicReplyEmail);
  const replySubject = getCustomerReplySubject(subject, rows);
  const recipient = encodeMailtoRecipient(customerEmail);
  if (!recipient) return "";
  return `mailto:${recipient}?subject=${encodeMailto(replySubject)}&body=${encodeURIComponent(body)}`;
}

export async function sendAdminEmail({ subject, title, rows, adminPath = "/admin", intro, to: routedTo, routeLabel, routedToText }: AdminEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = routedTo || getAdminEmail();
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const customerEmail = getReplyTo(rows);
  const publicReplyEmail = getPublicReplyEmail();
  const composeCustomerLink = getSafeCustomerComposeLink(customerEmail, title || "Your NestHelper request", rows, publicReplyEmail);
  const composeButtonLabel = getComposeButtonLabel(title || "Your NestHelper request", rows);
  const toText = Array.isArray(to) ? to.join(", ") : String(to);
  const routeHtml = routeLabel || routedToText
    ? `<div style="margin:0 0 16px 0;padding:12px 14px;background:#f5fbf8;border:1px solid #d7eee4;border-radius:14px;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;line-height:1.35;font-weight:700;color:#0f4f4a;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:.08em;">Inbox route</div><div style="font-size:18px;line-height:1.35;font-weight:800;color:#123;margin:0;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(routeLabel || "NestHelper")}</div><div style="font-size:14px;line-height:1.5;color:#456;margin:4px 0 0 0;overflow-wrap:anywhere;word-break:break-word;">Website route: ${escapeHtml(routedToText || toText)}</div>${customerEmail ? `<div style="font-size:13px;line-height:1.5;color:#667;margin:4px 0 0 0;overflow-wrap:anywhere;word-break:break-word;">Customer email: ${escapeHtml(customerEmail)}</div>` : ""}</div>`
    : "";

  if (!apiKey) {
    console.warn("Skipping admin email. Missing RESEND_API_KEY.");
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const rowsHtml = Object.entries(rows)
    .filter(([, value]) => formatValue(value).trim().length > 0)
    .map(
      ([key, value]) =>
        `<div style="padding:10px 12px;border-bottom:1px solid #eee;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;line-height:1.35;font-weight:700;color:#0f4f4a;margin:0 0 4px 0;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(key)}</div><div style="font-size:15px;line-height:1.5;color:#233;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(formatValue(value))}</div></div>`
    )
    .join("");

  const textRows = Object.entries(rows)
    .filter(([, value]) => formatValue(value).trim().length > 0)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">NestHelper Admin Alert</div>
          <h1 style="margin:6px 0 0;font-size:22px;line-height:1.25;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:22px 18px;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;color:#233;line-height:1.6;">${escapeHtml(intro || "A new public NestHelper form was submitted. Review it in the admin dashboard.")}</p>
          ${routeHtml}
          <div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;">${rowsHtml}</div>
          ${composeCustomerLink ? `<p style="margin-top:22px;"><a href="${composeCustomerLink}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">${escapeHtml(composeButtonLabel)}</a></p>` : ""}
          <p style="margin-top:${composeCustomerLink ? "10px" : "22px"};"><a href="${siteUrl}${adminPath}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Open Admin Dashboard</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;">Sent to admin inbox: ${escapeHtml(toText)}. Customer-facing replies should come from ${escapeHtml(publicReplyEmail)}. Use the compose button to start a clean customer reply with the original customer message/details included, without quoting private admin dashboard links or internal notes.</p>
        </div>
      </div>
    </div>`;

  const routeText = routeLabel || routedToText
    ? `Inbox route: ${routeLabel || "NestHelper"}\nWebsite route: ${routedToText || toText}\n${customerEmail ? `Customer email: ${customerEmail}\n` : ""}\n`
    : "";

  const text = `${title}\n\n${intro || "A new public NestHelper form was submitted."}\n\n${routeText}${textRows}${customerEmail ? `\n\nCompose customer reply: ${composeCustomerLink}` : ""}\nOpen admin dashboard: ${siteUrl}${adminPath}\n\nDo not reply directly to this admin alert when contacting a customer. Use the compose link so the reply includes the customer's original message/details without private admin dashboard links or internal notes.`;

  return resend.emails.send({ from, to, subject, html, text, replyTo: publicReplyEmail });
}
