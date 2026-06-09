import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type ResendWebhookEvent = {
  type?: string;
  created_at?: string;
  data?: Record<string, unknown>;
};

const trackedApplicantCollections = ["helperApplications", "partnerApplications"] as const;

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => cleanText(item, 320)).filter(Boolean);
}

function getWebhookStatus(type: string) {
  switch (type) {
    case "email.sent":
      return { status: "sent", label: "Sent by Resend" };
    case "email.delivered":
      return { status: "delivered", label: "Delivered" };
    case "email.delivery_delayed":
      return { status: "delayed", label: "Delivery delayed" };
    case "email.bounced":
      return { status: "bounced", label: "Bounced" };
    case "email.failed":
      return { status: "failed", label: "Failed" };
    case "email.complained":
      return { status: "complained", label: "Marked as spam" };
    case "email.suppressed":
      return { status: "suppressed", label: "Suppressed" };
    case "email.opened":
      return { status: "opened", label: "Opened" };
    case "email.clicked":
      return { status: "clicked", label: "Clicked" };
    default:
      return { status: cleanText(type, 80) || "unknown", label: cleanText(type, 80) || "Unknown email event" };
  }
}

function getReason(data: Record<string, unknown>) {
  return cleanText(data.reason || data.error || data.message || data.bounce_type || data.failed_reason, 500);
}

async function findApplicantDocsByResendId(emailId: string) {
  const db = getFirebaseAdminDb();
  const matches: Array<{ collectionName: string; id: string; ref: { update: (data: Record<string, unknown>) => Promise<unknown> } }> = [];

  for (const collectionName of trackedApplicantCollections) {
    const snap = await db.collection(collectionName).where("applicantEmailResendIds", "array-contains", emailId).limit(10).get();
    snap.docs.forEach((doc) => matches.push({ collectionName, id: doc.id, ref: doc.ref }));
  }

  return matches;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Missing RESEND_WEBHOOK_SECRET." }, { status: 500 });
  }

  try {
    const payload = await req.text();
    const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_key");
    const event = await (resend as unknown as { webhooks: { verify: (args: unknown) => ResendWebhookEvent | Promise<ResendWebhookEvent> } }).webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") || "",
        timestamp: req.headers.get("svix-timestamp") || "",
        signature: req.headers.get("svix-signature") || "",
      },
      webhookSecret,
    });

    const type = cleanText(event.type, 80);
    const data = event.data && typeof event.data === "object" ? event.data : {};
    const emailId = cleanText(data.email_id || data.id, 160);
    if (!type || !emailId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { status, label } = getWebhookStatus(type);
    const atIso = cleanText(event.created_at || data.created_at, 80) || new Date().toISOString();
    const to = cleanStringArray(data.to);
    const subject = cleanText(data.subject, 300);
    const reason = getReason(data);
    const statusEntry = {
      status,
      statusLabel: label,
      type,
      atIso,
      resendId: emailId,
      to,
      subject,
      reason,
    };

    const matches = await findApplicantDocsByResendId(emailId);
    if (!matches.length) {
      await getFirebaseAdminDb().collection("emailWebhookEvents").add({
        source: "resend",
        category: "applicantEmail",
        matched: false,
        type,
        emailId,
        status,
        statusLabel: label,
        atIso,
        to,
        subject,
        reason,
        receivedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, matched: 0 });
    }

    await Promise.all(matches.map(({ ref }) => ref.update({
      updatedAt: FieldValue.serverTimestamp(),
      applicantEmailLastDeliveryStatus: status,
      applicantEmailLastDeliveryStatusLabel: label,
      applicantEmailLastStatusAt: FieldValue.serverTimestamp(),
      applicantEmailLastStatusAtIso: atIso,
      applicantEmailLastStatusType: type,
      applicantEmailLastStatusReason: reason,
      applicantEmailStatusHistory: FieldValue.arrayUnion(statusEntry),
    })));

    return NextResponse.json({ ok: true, matched: matches.length, status, label });
  } catch (error) {
    console.error("Resend webhook failed", error);
    return NextResponse.json({ ok: false, error: "Invalid Resend webhook." }, { status: 400 });
  }
}
