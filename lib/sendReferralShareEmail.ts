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

export async function sendReferralShareEmail({
  to,
  customerName,
  referralUrl,
  referralCode,
  rewardLabel,
  replyToEmail,
}: {
  to: string;
  customerName?: string;
  referralUrl: string;
  referralCode: string;
  rewardLabel: string;
  replyToEmail?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const replyTo = replyToEmail || getPublicReplyEmail();

  if (!apiKey || !to || !to.includes("@")) {
    console.warn("Skipping referral share email. Missing RESEND_API_KEY or customer email.");
    return { skipped: true };
  }

  const safeName = clean(customerName);
  const greeting = safeName ? `Hi ${safeName},` : "Hi,";
  const safeUrl = referralUrl;

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">Family referral</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Your NestHelper referral share page is ready.</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">Thank you for trusting NestHelper. You can share the link below with one family who may need help resetting the home. Open the share page first, then tap the Copy referral link button to paste it into a text or email.</p>

          <div style="margin:0 0 20px 0;padding:14px;border-radius:14px;background:#fbf6ea;border:1px solid #eadfc8;box-sizing:border-box;">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:700;margin-bottom:6px;">Your share code</div>
            <div style="font-size:20px;font-weight:800;color:#075c58;margin-bottom:10px;">${escapeHtml(referralCode)}</div>
            <a href="${escapeHtml(safeUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Open share page + copy link</a>
            <p style="margin:12px 0 0 0;font-size:13px;color:#667;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(safeUrl)}</p>
            <p style="margin:10px 0 0 0;font-size:13px;color:#667;">Tip: the share page has a Copy referral link button for easy texting or emailing.</p>
          </div>

          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What to do</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">
            <li style="margin:0 0 8px 0;">Open the referral share page above.</li>
            <li style="margin:0 0 8px 0;">Tap Copy referral link on that page.</li>
            <li style="margin:0 0 8px 0;">Paste it into a text or email to one family.</li>
          </ol>

          <div style="background:#fbf6ea;border:1px solid #eadfc8;border-radius:18px;padding:14px 16px;margin:0 0 18px 0;">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b98a2f;font-weight:700;margin-bottom:8px;">What your referral receives</div>
            <p style="margin:0 0 8px 0;">If they request <strong>Laundry Rescue</strong>, they can receive <strong>$10 off</strong> their first Laundry Rescue order.</p>
            <p style="margin:0;">For other eligible NestHelper family services, the referral credit may be <strong>$25</strong>. Commercial Reset is not included.</p>
          </div>
          <p style="margin:0 0 18px 0;">After the referred family completes their first eligible paid service, we will email you about ${escapeHtml(rewardLabel)}. Your credit will be saved under this email address, so use the same email next time you request help and NestHelper can apply it before sending payment.</p>
          <p style="margin:0 0 18px 0;">Questions? Reply to this email or contact us at ${escapeHtml(replyTo)}.</p>
          <p style="font-size:12px;color:#667;line-height:1.5;margin-top:22px;">Referral rewards are subject to NestHelper’s Referral Program Policy. Commercial Reset, canceled visits, refunded visits, incomplete visits, self-referrals, duplicate accounts, and misuse are not eligible unless NestHelper approves an exception in writing.</p>
        </div>
      </div>
    </div>`;

  const text = `Your NestHelper referral share page is ready

${greeting}

Thank you for trusting NestHelper. Open the referral share page below, tap Copy referral link, then paste it into a text or email to one family.

Referral code: ${referralCode}
Referral share page: ${safeUrl}

What to do:
1. Open the referral share page above.
2. Tap Copy referral link on that page.
3. Paste it into a text or email to one family.

What your referral receives:
- Laundry Rescue: $10 off their first Laundry Rescue order.
- Other eligible NestHelper family services: referral credit may be $25.
- Commercial Reset is not included.

After the referred family completes their first eligible paid service, we will email you about ${rewardLabel}. Your credit will be saved under this email address, so use the same email next time you request help and NestHelper can apply it before sending payment.

Questions? Reply to this email or contact us at ${replyTo}.`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: "Your NestHelper referral share page", html, text, replyTo });
}
