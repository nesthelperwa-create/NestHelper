import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { Resend } from "resend";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getCustomerReplyEmail } from "@/lib/emailRouting";

export const runtime = "nodejs";

const allowedCollections = new Set(["helperApplications", "partnerApplications"]);

type ApplicantCollection = "helperApplications" | "partnerApplications";

type Body = {
  collection?: string;
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

function getApplicantName(collection: ApplicantCollection, data: Record<string, unknown>) {
  const name = cleanText(data.fullName || data.ownerName || data.businessName || data.name, 120);
  if (name) return name;
  return collection === "partnerApplications" ? "Partner applicant" : "Helper applicant";
}

function formatMessageHtml(message: string) {
  return escapeHtml(message).replace(/\r?\n/g, "<br />");
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as Body;
    const collection = cleanText(body.collection, 80) as ApplicantCollection;
    const id = cleanText(body.id, 160);
    const subject = cleanText(body.subject, 160);
    const message = cleanText(body.message, 5000);

    if (!allowedCollections.has(collection) || !id) {
      return NextResponse.json({ ok: false, error: "Missing or invalid applicant email request." }, { status: 400 });
    }
    if (!subject || subject.length < 3) {
      return NextResponse.json({ ok: false, error: "Add a subject before sending." }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ ok: false, error: "Write a message before sending." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY. Applicant email was not sent." }, { status: 500 });
    }

    const db = getFirebaseAdminDb();
    const docRef = db.collection(collection).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: "Application not found." }, { status: 404 });
    }

    const data = docSnap.data() || {};
    const to = cleanEmail(data.email);
    if (!to) {
      return NextResponse.json({ ok: false, error: "This applicant does not have a valid email address on file." }, { status: 400 });
    }

    const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
    const replyTo = getCustomerReplyEmail(collection, data);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nesthelperwa.com";
    const applicantName = getApplicantName(collection, data);
    const routeLabel = collection === "partnerApplications" ? "Partner application" : "Helper application";

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
              Application: ${escapeHtml(routeLabel)}<br />
              Applicant: ${escapeHtml(applicantName)}<br />
              Reply-to: ${escapeHtml(replyTo)}
            </div>
            <p style="margin:22px 0 0 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;">Visit NestHelper</a></p>
          </div>
        </div>
      </div>`;

    const text = `${message}\n\nNestHelper: ${siteUrl}`;
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({ from, to, subject, html, text, replyTo });
    const resendError = (result as { error?: { message?: string } }).error;
    if (resendError) {
      return NextResponse.json({ ok: false, error: resendError.message || "Resend could not send the applicant email." }, { status: 502 });
    }

    const sentAtIso = new Date().toISOString();
    const sentBy = decoded.email || "admin";
    const emailHistoryEntry = {
      sentAtIso,
      sentBy,
      to,
      subject,
      bodyPreview: message.slice(0, 300),
      resendId: (result as { data?: { id?: string } }).data?.id || "",
    };

    await docRef.update({
      updatedAt: FieldValue.serverTimestamp(),
      applicantEmailLastSentAt: FieldValue.serverTimestamp(),
      applicantEmailLastSentAtIso: sentAtIso,
      applicantEmailLastSentBy: sentBy,
      applicantEmailLastTo: to,
      applicantEmailLastSubject: subject,
      applicantEmailLastBodyPreview: message.slice(0, 300),
      applicantEmailCount: FieldValue.increment(1),
      applicantEmailHistory: FieldValue.arrayUnion(emailHistoryEntry),
    });

    return NextResponse.json({ ok: true, to, sentAtIso, subject });
  } catch (error) {
    console.error("Applicant email failed", error);
    return NextResponse.json({ ok: false, error: "Unable to send applicant email." }, { status: 500 });
  }
}
