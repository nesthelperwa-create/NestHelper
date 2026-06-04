import { Resend } from "resend";
import { getPublicReplyEmail } from "./emailRouting";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function sendReferralRewardEmail({
  to,
  customerName,
  rewardCode,
  rewardLabel,
  referredName,
  referredServiceTitle,
  replyToEmail,
}: {
  to: string;
  customerName?: string;
  rewardCode: string;
  rewardLabel: string;
  referredName?: string;
  referredServiceTitle?: string;
  replyToEmail?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const replyTo = replyToEmail || getPublicReplyEmail();

  if (!apiKey || !to || !to.includes("@")) {
    console.warn("Skipping referral reward email. Missing RESEND_API_KEY or customer email.");
    return { skipped: true };
  }

  const safeName = clean(customerName);
  const greeting = safeName ? `Hi ${safeName},` : "Hi,";
  const referredText = clean(referredName) ? `${clean(referredName)} completed an eligible NestHelper family reset.` : "Your referred family completed an eligible NestHelper family reset.";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">Referral thank-you</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Your family referral credit is ready.</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">${escapeHtml(referredText)}</p>
          <div style="margin:0 0 20px 0;padding:14px;border-radius:14px;background:#fbf6ea;border:1px solid #eadfc8;box-sizing:border-box;">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:700;margin-bottom:6px;">Reward / credit</div>
            <div style="font-size:20px;font-weight:800;color:#075c58;margin-bottom:8px;">${escapeHtml(rewardLabel)}</div>
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:700;margin:12px 0 6px 0;">Credit code</div>
            <div style="font-size:18px;font-weight:800;color:#233;">${escapeHtml(rewardCode)}</div>
          </div>
          ${clean(referredServiceTitle) ? `<p style="margin:0 0 18px 0;"><strong>Completed service:</strong> ${escapeHtml(referredServiceTitle)}</p>` : ""}
          <p style="margin:0 0 18px 0;">Your credit is saved under this email address. Use the same email the next time you request an eligible NestHelper family service, and NestHelper can apply the credit before sending your payment link or invoice.</p>
          <p style="margin:0 0 18px 0;">Questions? Reply to this email or contact us at ${escapeHtml(replyTo)}.</p>
          <p style="font-size:12px;color:#667;line-height:1.5;margin-top:22px;">Referral credits are not cash, are not transferable unless NestHelper approves it, and are subject to NestHelper’s Referral Program Policy.</p>
        </div>
      </div>
    </div>`;

  const text = `Your family referral credit is ready\n\n${greeting}\n\n${referredText}\n\nReward / credit: ${rewardLabel}\nCredit code: ${rewardCode}\n${clean(referredServiceTitle) ? `Completed service: ${clean(referredServiceTitle)}\n` : ""}\nYour credit is saved under this email address. Use the same email the next time you request an eligible NestHelper family service, and NestHelper can apply the credit before sending your payment link or invoice.\n\nQuestions? Reply to this email or contact us at ${replyTo}.`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: "Your NestHelper referral credit is ready", html, text, replyTo });
}
