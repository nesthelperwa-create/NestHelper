import { Resend } from "resend";
import { siteConfig } from "@/lib/siteConfig";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendLaunchRewardCodeEmail(input: { email: string; firstName: string; code: string; testOnly?: boolean }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const replyTo = process.env.CUSTOMER_SUPPORT_EMAIL || siteConfig.emails.support;

  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: input.email,
    replyTo,
    subject: `${input.testOnly ? "TEST — " : ""}${input.code} is your NestHelper Launch Rewards code`,
    text: [
      `Hi ${input.firstName},`,
      "",
      input.testOnly ? "This is an admin-only test of the Launch Rewards verification flow." : "Your NestHelper Launch Rewards verification code is below.",
      "",
      `Your NestHelper verification code is ${input.code}.`,
      "",
      "The code expires in 10 minutes and can only be used once.",
      "Return to nesthelperwa.com/rewards to finish verification.",
      "",
      "If you did not request this code, you can ignore this email.",
      "",
      `NestHelper | ${siteConfig.phone} | ${siteConfig.emails.support}`,
    ].join("\n"),
    html: `
      <div style="background:#fff8ee;padding:28px;font-family:Arial,sans-serif;color:#1f2d2b;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ead8b5;border-radius:24px;padding:30px;">
          <p style="margin:0;color:#c18f37;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">NestHelper Launch Rewards${input.testOnly ? " — Admin Test" : ""}</p>
          <h1 style="margin:14px 0 8px;color:#005d56;font-size:27px;">Hi ${escapeHtml(input.firstName)} — here is your code.</h1>
          ${input.testOnly ? '<p style="margin:0 0 14px;border-radius:14px;background:#fff4cf;padding:12px;color:#7a5512;font-weight:800;line-height:1.5;">This code is for an admin-only full verification test. It will not create a real reward.</p>' : ""}
          <p style="margin:0 0 20px;line-height:1.65;color:#4b5b58;">Enter this one-time code on the NestHelper rewards page. It expires in 10 minutes.</p>
          <div style="margin:22px 0;border-radius:18px;background:#e9f7f1;padding:20px;text-align:center;color:#005d56;font-size:34px;font-weight:900;letter-spacing:8px;">${escapeHtml(input.code)}</div>
          <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#687773;">If you did not request this code, you can safely ignore this email. NestHelper will never ask you to send this code back by email or text.</p>
        </div>
      </div>
    `,
  });

  if (result.error) throw new Error(result.error.message || "Unable to send verification email.");
  return result.data;
}
