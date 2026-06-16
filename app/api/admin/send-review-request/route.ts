import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { emailAliases } from "@/lib/emailRouting";
import { sendReviewRequestEmail } from "@/lib/sendReviewRequestEmail";

const allowedCollections = new Set(["serviceRequests"]);

type SendReviewRequestBody = {
  collection?: string;
  id?: string;
  reviewUrl?: string;
  subject?: string;
  message?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    const next = getString(value);
    if (next) return next;
  }
  return "";
}

function getDefaultReviewUrl() {
  return getFirstString(process.env.GOOGLE_REVIEW_URL, process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL);
}

function normalizeUrl(value: unknown) {
  const raw = getString(value) || getDefaultReviewUrl();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function getEmailResultError(result: unknown) {
  if (!result || typeof result !== "object") return "";
  const record = result as { skipped?: boolean; error?: unknown };
  if (!record.error) return "";
  if (record.error instanceof Error) return record.error.message;
  if (typeof record.error === "object" && record.error && "message" in record.error) {
    return String((record.error as { message?: unknown }).message || "Email provider returned an error.");
  }
  return String(record.error);
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const { collection, id, reviewUrl, subject, message } = (await request.json().catch(() => ({}))) as SendReviewRequestBody;
    if (!collection || !allowedCollections.has(collection) || !id) {
      return NextResponse.json({ ok: false, error: "Missing or invalid review request fields." }, { status: 400 });
    }

    const finalReviewUrl = normalizeUrl(reviewUrl);
    if (!finalReviewUrl) {
      return NextResponse.json({ ok: false, error: "Add your Google review link before sending. In Google Business Profile, open Read Reviews → Get more reviews → Copy." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const docRef = db.collection(collection).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: "Record not found." }, { status: 404 });
    }

    const data = docSnap.data() || {};
    const to = getString(data.email);
    if (!to || !to.includes("@")) {
      return NextResponse.json({ ok: false, error: "No customer email is available for this request." }, { status: 400 });
    }

    const status = getString(data.status).toLowerCase();
    if (status !== "completed") {
      return NextResponse.json({ ok: false, error: "Mark the request Completed before sending a Google review request." }, { status: 400 });
    }

    const sentAtIso = new Date().toISOString();
    const finalSubject = getString(subject) || "Thank you from NestHelper";
    const finalMessage = getString(message);

    const emailResult = await sendReviewRequestEmail({
      to,
      customerName: getFirstString(data.fullName, data.name, data.ownerName),
      subject: finalSubject,
      message: finalMessage,
      reviewUrl: finalReviewUrl,
      replyToEmail: emailAliases.booking,
    }) as any;

    if (emailResult?.skipped) {
      return NextResponse.json({ ok: false, error: "Review request email was skipped because Resend or the customer email is missing." }, { status: 500 });
    }

    const providerError = getEmailResultError(emailResult);
    if (providerError) {
      return NextResponse.json({ ok: false, error: providerError }, { status: 502 });
    }

    const historyEntry = {
      status: "Sent",
      sentAtIso,
      to,
      subject: finalSubject,
      reviewUrl: finalReviewUrl,
      by: decoded.email || "admin",
      resendId: emailResult?.data?.id || emailResult?.id || "",
    };

    await docRef.update({
      googleReviewRequestStatus: "Sent",
      googleReviewRequestSentAt: FieldValue.serverTimestamp(),
      googleReviewRequestSentAtIso: sentAtIso,
      googleReviewRequestUrl: finalReviewUrl,
      googleReviewRequestLastSubject: finalSubject,
      googleReviewRequestLastMessagePreview: finalMessage.slice(0, 500),
      googleReviewRequestCount: FieldValue.increment(1),
      googleReviewRequestHistory: FieldValue.arrayUnion(historyEntry),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email,
    });

    return NextResponse.json({ ok: true, sentAtIso, to, reviewUrl: finalReviewUrl, subject: finalSubject, historyEntry });
  } catch (error) {
    console.error("Review request email failed", error);
    return NextResponse.json({ ok: false, error: "Unable to send review request email." }, { status: 500 });
  }
}
