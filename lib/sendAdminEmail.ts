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

export async function sendAdminEmail({ subject, title, rows, adminPath = "/admin" }: AdminEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to) {
    console.warn("Skipping admin email. Missing RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL.");
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const rowsHtml = Object.entries(rows)
    .map(([key, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;color:#0f4f4a;">${escapeHtml(key)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#233;">${escapeHtml(value)}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:28px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;">
        <div style="background:#075c58;color:#fff;padding:22px 26px;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">NestHelper Admin</div>
          <h1 style="margin:6px 0 0;font-size:24px;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:22px 26px;">
          <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
          <p style="margin-top:22px;"><a href="${siteUrl}${adminPath}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Open Admin Dashboard</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;">This notification was sent because a public NestHelper form was submitted.</p>
        </div>
      </div>
    </div>`;

  return resend.emails.send({ from, to, subject, html });
}
