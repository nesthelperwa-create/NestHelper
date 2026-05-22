import { Resend } from "resend";

type AdminEmailInput = {
  subject: string;
  title: string;
  rows: Record<string, unknown>;
  adminPath?: string;
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
  return (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.CUSTOMER_SUPPORT_EMAIL ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    "hello@nesthelperwa.com"
  );
}

function getReplyTo(rows: Record<string, unknown>) {
  const possibleEmail = rows.email || rows.customerEmail || rows.contactEmail;
  const email = typeof possibleEmail === "string" ? possibleEmail.trim() : "";
  return email.includes("@") ? email : undefined;
}

export async function sendAdminEmail({ subject, title, rows, adminPath = "/admin" }: AdminEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = getAdminEmail();
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const replyTo = getReplyTo(rows);

  if (!apiKey) {
    console.warn("Skipping admin email. Missing RESEND_API_KEY.");
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const rowsHtml = Object.entries(rows)
    .filter(([, value]) => formatValue(value).trim().length > 0)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;color:#0f4f4a;vertical-align:top;">${escapeHtml(key)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#233;white-space:pre-wrap;vertical-align:top;">${escapeHtml(formatValue(value))}</td></tr>`
    )
    .join("");

  const textRows = Object.entries(rows)
    .filter(([, value]) => formatValue(value).trim().length > 0)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:28px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;">
        <div style="background:#075c58;color:#fff;padding:22px 26px;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">NestHelper Admin Alert</div>
          <h1 style="margin:6px 0 0;font-size:24px;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:22px 26px;">
          <p style="margin:0 0 16px 0;color:#233;line-height:1.6;">A new public NestHelper form was submitted. Review it in the admin dashboard.</p>
          <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
          <p style="margin-top:22px;"><a href="${siteUrl}${adminPath}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Open Admin Dashboard</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;">Sent to ${escapeHtml(to)}. ${replyTo ? `Replying to this email should reply to ${escapeHtml(replyTo)}.` : ""}</p>
        </div>
      </div>
    </div>`;

  const text = `${title}\n\nA new public NestHelper form was submitted.\n\n${textRows}\n\nOpen admin dashboard: ${siteUrl}${adminPath}`;

  return resend.emails.send({ from, to, subject, html, text, replyTo });
}
