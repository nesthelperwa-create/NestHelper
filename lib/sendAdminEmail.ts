import { Resend } from "resend";

type AdminEmailInput = {
  subject: string;
  title: string;
  rows: Record<string, unknown>;
  adminPath?: string;
  intro?: string;
  to?: string | string[];
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
  return process.env.ADMIN_NOTIFICATION_EMAIL || "nesthelperwa@gmail.com";
}

function getReplyTo(rows: Record<string, unknown>) {
  const possibleEmail = rows.email || rows.Email || rows.customerEmail || rows["Customer email"] || rows.contactEmail;
  const email = typeof possibleEmail === "string" ? possibleEmail.trim() : "";
  return email.includes("@") ? email : undefined;
}

export async function sendAdminEmail({ subject, title, rows, adminPath = "/admin", intro, to: routedTo }: AdminEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = routedTo || getAdminEmail();
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
          <div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;">${rowsHtml}</div>
          <p style="margin-top:22px;"><a href="${siteUrl}${adminPath}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Open Admin Dashboard</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;">Sent to ${escapeHtml(to)}. ${replyTo ? `Replying to this email should reply to ${escapeHtml(replyTo)}.` : ""}</p>
        </div>
      </div>
    </div>`;

  const text = `${title}\n\n${intro || "A new public NestHelper form was submitted."}\n\n${textRows}\n\nOpen admin dashboard: ${siteUrl}${adminPath}`;

  return resend.emails.send({ from, to, subject, html, text, replyTo });
}
