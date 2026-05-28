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

function getReplyTo(rows: Record<string, unknown>) {
  const possibleEmail = rows.email || rows.Email || rows.customerEmail || rows["Customer email"] || rows.contactEmail;
  const email = typeof possibleEmail === "string" ? possibleEmail.trim() : "";
  return email.includes("@") ? email : undefined;
}

function encodeMailto(value: string) {
  return encodeURIComponent(value).replaceAll("%20", "+");
}

function getSafeCustomerComposeLink(customerEmail: string | undefined, subject: string) {
  if (!customerEmail) return "";
  return `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeMailto(`Re: ${subject}`)}`;
}

export async function sendAdminEmail({ subject, title, rows, adminPath = "/admin", intro, to: routedTo, routeLabel, routedToText }: AdminEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = routedTo || getAdminEmail();
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const customerEmail = getReplyTo(rows);
  const publicReplyEmail = getPublicReplyEmail();
  const composeCustomerLink = getSafeCustomerComposeLink(customerEmail, title || "Your NestHelper request");
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
          ${composeCustomerLink ? `<p style="margin-top:22px;"><a href="${composeCustomerLink}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Compose customer reply</a></p>` : ""}
          <p style="margin-top:${composeCustomerLink ? "10px" : "22px"};"><a href="${siteUrl}${adminPath}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Open Admin Dashboard</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;">Sent to admin inbox: ${escapeHtml(toText)}. Customer-facing replies should come from ${escapeHtml(publicReplyEmail)}. Use the compose button so private admin dashboard links and internal notes are not quoted to the customer.</p>
        </div>
      </div>
    </div>`;

  const routeText = routeLabel || routedToText
    ? `Inbox route: ${routeLabel || "NestHelper"}\nWebsite route: ${routedToText || toText}\n${customerEmail ? `Customer email: ${customerEmail}\n` : ""}\n`
    : "";

  const text = `${title}\n\n${intro || "A new public NestHelper form was submitted."}\n\n${routeText}${textRows}${customerEmail ? `\n\nCompose customer reply: ${composeCustomerLink}` : ""}\nOpen admin dashboard: ${siteUrl}${adminPath}\n\nDo not reply directly to this admin alert when contacting a customer. Use a fresh message/compose link so the customer does not receive private admin dashboard links or internal notes.`;

  return resend.emails.send({ from, to, subject, html, text, replyTo: publicReplyEmail });
}
