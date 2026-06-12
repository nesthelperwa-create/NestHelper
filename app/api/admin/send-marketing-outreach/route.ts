import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { Resend } from "resend";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

export const runtime = "nodejs";

type Body = {
  id?: string;
  subject?: string;
  message?: string;
};

function cleanText(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMessageHtml(message: string) {
  return escapeHtml(message).replace(/\r?\n/g, "<br />");
}

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getLeadName(data: Record<string, unknown>) {
  return cleanText(data.businessName || data.contactName || data.email || "Marketing lead", 140);
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as Body;
    const id = cleanText(body.id, 160);
    const subject = cleanText(body.subject, 180);
    const message = cleanText(body.message, 8000);

    if (!id) return NextResponse.json({ ok: false, error: "Missing outreach lead." }, { status: 400 });
    if (!subject || subject.length < 3) return NextResponse.json({ ok: false, error: "Add a subject before sending." }, { status: 400 });
    if (!message || message.length < 20) return NextResponse.json({ ok: false, error: "Write a longer outreach message before sending." }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY. Outreach email was not sent." }, { status: 500 });
    }

    const db = getFirebaseAdminDb();
    const docRef = db.collection("marketingOutreach").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return NextResponse.json({ ok: false, error: "Outreach lead not found." }, { status: 404 });

    const data = docSnap.data() || {};
    const to = cleanEmail(data.email);
    if (!to) return NextResponse.json({ ok: false, error: "This lead does not have a valid email address." }, { status: 400 });
    if (cleanText(data.status, 80) === "Do not contact") {
      return NextResponse.json({ ok: false, error: "This lead is marked Do not contact." }, { status: 400 });
    }

    const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
    const replyTo = process.env.CUSTOMER_REPLY_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || "hello@nesthelperwa.com";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nesthelperwa.com";
    const leadName = getLeadName(data);

    const html = `
      <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;max-width:100%;box-sizing:border-box;">
        <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
          <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
            <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">NestHelper</div>
            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">${escapeHtml(subject)}</h1>
          </div>
          <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
            <div style="font-size:15px;line-height:1.7;white-space:normal;overflow-wrap:anywhere;word-break:break-word;">${formatMessageHtml(message)}</div>
            <div style="margin-top:22px;padding:12px 14px;border-radius:14px;background:#fbf6ea;border:1px solid #eadfc8;color:#52606d;font-size:12px;line-height:1.5;">
              Outreach lead: ${escapeHtml(leadName)}<br />
              Reply-to: ${escapeHtml(replyTo)}
            </div>
            <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
          </div>
        </div>
      </div>`;

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({ from, to, subject, html, text: message, replyTo });
    const resendError = (result as { error?: { message?: string } }).error;
    if (resendError) {
      return NextResponse.json({ ok: false, error: resendError.message || "Resend could not send the outreach email." }, { status: 502 });
    }

    const sentAtIso = new Date().toISOString();
    const followUpDate = todayPlus(5);
    const sentBy = decoded.email || "admin";
    const resendId = (result as { data?: { id?: string } }).data?.id || "";

    await docRef.update({
      status: "Intro sent",
      followUpDate,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: sentBy,
      lastSentAt: FieldValue.serverTimestamp(),
      lastSentAtIso: sentAtIso,
      lastSentBy: sentBy,
      lastTo: to,
      lastSubject: subject,
      lastMessagePreview: message.slice(0, 500),
      lastResendId: resendId,
      emailCount: FieldValue.increment(1),
      outreachHistory: FieldValue.arrayUnion({
        type: "intro.sent",
        sentAtIso,
        sentBy,
        to,
        subject,
        messagePreview: message.slice(0, 500),
        resendId,
        followUpDate,
      }),
    });

    return NextResponse.json({ ok: true, to, sentAtIso, subject, resendId, followUpDate });
  } catch (error) {
    console.error("Marketing outreach email failed", error);
    return NextResponse.json({ ok: false, error: "Unable to send marketing outreach email." }, { status: 500 });
  }
}
