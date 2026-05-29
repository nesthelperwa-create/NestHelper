import { Resend } from "resend";
import { getPaymentReplyEmail } from "./emailRouting";

type SendPaymentReceivedEmailInput = {
  to: string;
  customerName?: string;
  requestId: string;
  serviceTitle?: string;
  amountTotal?: number | null;
  currency?: string | null;
  paymentStatus?: string;
  replyToEmail?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(amountTotal?: number | null, currency?: string | null) {
  if (typeof amountTotal !== "number") return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(amountTotal / 100);
  } catch {
    return `$${(amountTotal / 100).toFixed(2)}`;
  }
}

function getPaymentCopy(paymentStatus: string) {
  if (paymentStatus === "Deposit Paid") {
    return {
      subject: "Laundry Rescue deposit received",
      eyebrow: "Deposit received",
      title: "Your Laundry Rescue deposit was received.",
      intro: "Thank you — we received your Laundry Rescue deposit/minimum. This deposit is credited toward your final laundry total after dry weigh-in.",
      nextSteps: [
        "NestHelper will confirm pickup/return details and any prep notes.",
        "Your laundry will be dry-weighed at pickup.",
        "If the final total is higher than your deposit, we’ll send a final balance link after weigh-in.",
      ],
    };
  }

  if (paymentStatus === "Final Balance Paid") {
    return {
      subject: "Laundry Rescue final balance received",
      eyebrow: "Final balance paid",
      title: "Your Laundry Rescue final balance was received.",
      intro: "Thank you — we received your Laundry Rescue final balance. Your Laundry Rescue payment is now fully paid.",
      nextSteps: [
        "NestHelper will continue with the agreed laundry return details.",
        "Reply right away if your return timing, access details, or delivery notes changed.",
      ],
    };
  }

  return {
    subject: "Payment received for your NestHelper request",
    eyebrow: "Payment received",
    title: "Your NestHelper payment was successful.",
    intro: "Thank you — we received your NestHelper payment. Your request is now marked as paid and ready for scheduling follow-up.",
    nextSteps: [
      "NestHelper will confirm scheduling and any final prep notes.",
      "Reply right away if your timing, access details, parking, pets, or service needs changed.",
      "For Laundry Rescue, dry weight and approved add-ons are confirmed before any final balance.",
    ],
  };
}

export async function sendPaymentReceivedEmail({ to, customerName, requestId, serviceTitle, amountTotal, currency, paymentStatus = "Paid", replyToEmail }: SendPaymentReceivedEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const normalizedPaymentStatus = paymentStatus.toLowerCase();
  const replyTo = replyToEmail || getPaymentReplyEmail({ serviceTitle, paymentStatus });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!apiKey || !to || !to.includes("@")) {
    console.warn("Skipping payment received email. Missing RESEND_API_KEY or customer email.");
    return { skipped: true };
  }

  const copy = getPaymentCopy(paymentStatus);
  const greeting = customerName?.trim() ? `Hi ${customerName.trim()},` : "Hi,";
  const amountLabel = formatMoney(amountTotal, currency);

  const summaryRows = [
    ["Request ID", requestId],
    ["Service", serviceTitle || "NestHelper service"],
    ["Payment status", paymentStatus],
    ["Amount paid", amountLabel],
  ]
    .filter(([, value]) => String(value || "").trim().length > 0)
    .map(
      ([key, value]) =>
        `<div style="padding:10px 12px;border-bottom:1px solid #eee;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;line-height:1.35;font-weight:700;color:#0f4f4a;margin:0 0 4px 0;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(key)}</div><div style="font-size:15px;line-height:1.5;color:#233;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value)}</div></div>`
    )
    .join("");

  const nextStepsHtml = copy.nextSteps.map((step) => `<li style="margin:0 0 8px 0;">${escapeHtml(step)}</li>`).join("");
  const nextStepsText = copy.nextSteps.map((step, index) => `${index + 1}. ${step}`).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">${escapeHtml(copy.eyebrow)}</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">${escapeHtml(copy.title)}</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px 0;">${escapeHtml(copy.intro)}</p>
          ${summaryRows ? `<div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;margin:0 0 20px 0;">${summaryRows}</div>` : ""}
          <h2 style="font-size:18px;margin:0 0 10px 0;color:#0f4f4a;">What happens next</h2>
          <ol style="margin:0 0 18px 20px;padding:0;">${nextStepsHtml}</ol>
          <p style="margin:0 0 18px 0;">Questions or changes? Reply to this email or contact us at ${escapeHtml(replyTo)}.</p>
          <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
          <p style="font-size:12px;color:#667;line-height:1.5;margin-top:22px;">Stripe may also send an official payment receipt depending on your receipt settings.</p>
        </div>
      </div>
    </div>`;

  const text = `${copy.title}\n\n${greeting}\n\n${copy.intro}\n\nRequest ID: ${requestId}\nService: ${serviceTitle || "NestHelper service"}\nStatus: ${paymentStatus}${amountLabel ? `\nAmount paid: ${amountLabel}` : ""}\n\nWhat happens next:\n${nextStepsText}\n\nQuestions or changes? Reply to this email or contact us at ${replyTo}.\n\nNestHelper: ${siteUrl}`;

  const resend = new Resend(apiKey);
  return resend.emails.send({ from, to, subject: copy.subject, html, text, replyTo });
}
