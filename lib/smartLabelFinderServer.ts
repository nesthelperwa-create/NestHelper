import { createHash } from "crypto";
import { FieldValue, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Resend } from "resend";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { getPublicReplyEmail } from "@/lib/emailRouting";
import { cleanOptionalEmail, cleanSmartLabelText, normalizeSmartLabelCode } from "@/lib/smartLabels";
import type { AuthenticatedUser } from "@/lib/smartLabelAccountServer";
import { cleanPublicItemName, getSmartLabelOwnerSummary, smartLabelCustomerLimits } from "@/lib/smartLabelCustomer";

const finderLimits = {
  name: 80,
  email: 160,
  phone: 40,
  message: smartLabelCustomerLimits.maxFinderMessage,
  location: 240,
};

export type SmartLabelFinderMessageStatus = "new" | "read" | "resolved";

export type SmartLabelFinderMessage = {
  id: string;
  labelCode: string;
  publicItemName: string;
  finderName: string;
  finderEmail: string;
  finderPhone: string;
  message: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  status: SmartLabelFinderMessageStatus;
  createdAtIso: string;
  updatedAtIso: string;
  resolvedAtIso: string;
  emailDeliveryStatus: string;
};

export type FinderContactPayload = {
  finderName?: unknown;
  finderEmail?: unknown;
  finderPhone?: unknown;
  message?: unknown;
  locationText?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  consent?: unknown;
  website?: unknown;
};

function timestampToIso(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const maybeDate = value as { toDate?: () => Date; seconds?: number };
  if (typeof maybeDate.toDate === "function") return maybeDate.toDate().toISOString();
  if (typeof maybeDate.seconds === "number") return new Date(maybeDate.seconds * 1000).toISOString();
  return "";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanFinderName(value: unknown) {
  return cleanSmartLabelText(value, finderLimits.name);
}

function cleanFinderEmail(value: unknown) {
  const email = cleanOptionalEmail(value).slice(0, finderLimits.email);
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function cleanFinderPhone(value: unknown) {
  const phone = cleanSmartLabelText(value, finderLimits.phone);
  if (!phone) return "";
  const digitCount = (phone.match(/\d/g) || []).length;
  return digitCount >= 7 ? phone : "";
}

function cleanFinderMessage(value: unknown) {
  return cleanSmartLabelText(value, finderLimits.message);
}

function cleanFinderLocation(value: unknown) {
  return cleanSmartLabelText(value, finderLimits.location);
}

function cleanCoordinate(value: unknown, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return Math.round(parsed * 1_000_000) / 1_000_000;
}

function normalizeStatus(value: unknown): SmartLabelFinderMessageStatus {
  return value === "resolved" ? "resolved" : value === "new" ? "new" : "read";
}

function serializeFinderMessage(doc: QueryDocumentSnapshot | { id: string; data: () => DocumentData }): SmartLabelFinderMessage {
  const data = doc.data() || {};
  return {
    id: doc.id,
    labelCode: normalizeSmartLabelCode(data.labelCode),
    publicItemName: cleanPublicItemName(data.publicItemName),
    finderName: cleanFinderName(data.finderName),
    finderEmail: cleanFinderEmail(data.finderEmail),
    finderPhone: cleanFinderPhone(data.finderPhone),
    message: cleanFinderMessage(data.message),
    locationText: cleanFinderLocation(data.locationText),
    latitude: cleanCoordinate(data.latitude, -90, 90),
    longitude: cleanCoordinate(data.longitude, -180, 180),
    status: normalizeStatus(data.status),
    createdAtIso: timestampToIso(data.createdAt),
    updatedAtIso: timestampToIso(data.updatedAt),
    resolvedAtIso: timestampToIso(data.resolvedAt),
    emailDeliveryStatus: cleanSmartLabelText(data.emailDeliveryStatus, 40),
  };
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function getRateLimitDocId(code: string, request: Request) {
  const tenMinuteBucket = Math.floor(Date.now() / (10 * 60 * 1000));
  const pepper = process.env.SMART_LABEL_ACTIVATION_PEPPER || process.env.FIREBASE_PROJECT_ID || "nesthelper-finder-rate";
  return createHash("sha256")
    .update(`${code}:${getClientIp(request)}:${tenMinuteBucket}:${pepper}`)
    .digest("hex");
}

async function sendFinderMessageEmail(input: {
  ownerEmail: string;
  code: string;
  publicItemName: string;
  finderName: string;
  finderEmail: string;
  finderPhone: string;
  message: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fallbackEmail = getPublicReplyEmail();
  const to = input.ownerEmail || fallbackEmail;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "NestHelper <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nesthelperwa.com";
  const ownerUrl = `${siteUrl}/my-labels/label/${encodeURIComponent(input.code)}`;
  const mapUrl = input.latitude !== null && input.longitude !== null
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${input.latitude},${input.longitude}`)}`
    : "";

  if (!apiKey || !to.includes("@")) {
    console.warn("Skipping Smart Label finder email. Missing RESEND_API_KEY or owner email.");
    return { skipped: true };
  }

  const contactRows = [
    ["Finder name", input.finderName],
    ["Finder email", input.finderEmail],
    ["Finder phone", input.finderPhone],
    ["Location", input.locationText],
  ].filter(([, value]) => Boolean(value));

  const rowsHtml = contactRows
    .map(([label, value]) => `<div style="padding:10px 12px;border-bottom:1px solid #eee;"><div style="font-size:12px;font-weight:800;color:#075c58;text-transform:uppercase;letter-spacing:.06em;">${escapeHtml(label)}</div><div style="margin-top:3px;font-size:15px;color:#233;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value)}</div></div>`)
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#faf7ef;padding:14px;margin:0;width:100%;box-sizing:border-box;">
      <div style="width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #eadfc8;overflow:hidden;box-sizing:border-box;">
        <div style="background:#075c58;color:#fff;padding:22px 18px;box-sizing:border-box;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#f1c96b;">Smart Label finder message</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Someone scanned ${escapeHtml(input.publicItemName || input.code)}</h1>
        </div>
        <div style="padding:22px 18px;color:#233;line-height:1.6;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;">
          <p style="margin:0 0 16px 0;">A finder used your NestHelper Smart Label to send you a private message. Your email address and private label contents were not shown to them.</p>
          <div style="width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:14px;overflow:hidden;">${rowsHtml}</div>
          <div style="margin-top:16px;padding:14px 16px;background:#fbf6ea;border-radius:14px;border:1px solid #eadfc8;">
            <div style="font-size:12px;font-weight:800;color:#075c58;text-transform:uppercase;letter-spacing:.06em;">Message</div>
            <div style="margin-top:6px;font-size:15px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(input.message)}</div>
          </div>
          ${mapUrl ? `<p style="margin:18px 0 0;"><a href="${escapeHtml(mapUrl)}" style="display:inline-block;background:#f4ecdc;color:#075c58;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Open shared location</a></p>` : ""}
          <p style="margin:18px 0 0;"><a href="${escapeHtml(ownerUrl)}" style="display:inline-block;background:#075c58;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Open this Smart Label</a></p>
          <p style="margin:18px 0 0;font-size:12px;color:#667;line-height:1.5;">For safety, use your judgment before meeting anyone. NestHelper only relays the information the finder submitted and does not verify their identity or location.</p>
        </div>
      </div>
    </div>`;

  const textRows = contactRows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const text = `Someone scanned ${input.publicItemName || input.code}.\n\n${textRows}\n\nMessage:\n${input.message}${mapUrl ? `\n\nShared location: ${mapUrl}` : ""}\n\nOpen this Smart Label: ${ownerUrl}\n\nYour email address and private label contents were not shown to the finder. Use your judgment before meeting anyone; NestHelper does not verify finder identity or location.`;

  const resend = new Resend(apiKey);
  return resend.emails.send({
    from,
    to,
    subject: `Finder message for ${input.publicItemName || `Smart Label ${input.code}`}`,
    html,
    text,
    replyTo: input.finderEmail || fallbackEmail,
  });
}

export async function createFinderMessage(codeInput: string, payload: FinderContactPayload, request: Request) {
  const code = normalizeSmartLabelCode(codeInput);
  if (!code) throw new Error("Missing label code.");

  // Honeypot submissions receive a normal response without storing or emailing anything.
  if (cleanSmartLabelText(payload.website, 120)) {
    return { accepted: true, messageId: "" };
  }

  const finderName = cleanFinderName(payload.finderName);
  const finderEmail = cleanFinderEmail(payload.finderEmail);
  const finderPhone = cleanFinderPhone(payload.finderPhone);
  const message = cleanFinderMessage(payload.message);
  const locationText = cleanFinderLocation(payload.locationText);
  const latitude = cleanCoordinate(payload.latitude, -90, 90);
  const longitude = cleanCoordinate(payload.longitude, -180, 180);

  if (!finderName) throw new Error("Enter your name so the owner knows who contacted them.");
  if (!finderEmail && !finderPhone) throw new Error("Enter a valid email address or phone number.");
  if (!message || message.length < 5) throw new Error("Enter a short message for the owner.");
  if (payload.consent !== true) throw new Error("Confirm that NestHelper may privately relay this message to the owner.");

  const db = getFirebaseAdminDb();
  const labelRef = db.collection("smartLabels").doc(code);
  const messageRef = db.collection("smartLabelFinderMessages").doc();
  const rateRef = db.collection("smartLabelFinderRateLimits").doc(getRateLimitDocId(code, request));

  const result = await db.runTransaction(async (transaction) => {
    const [labelSnap, rateSnap] = await Promise.all([transaction.get(labelRef), transaction.get(rateRef)]);
    if (!labelSnap.exists) throw new Error("This Smart Label is not available for finder contact.");

    const labelData = (labelSnap.data() || {}) as Record<string, unknown>;
    const owner = getSmartLabelOwnerSummary(labelData);
    if (!owner.ownerUid || owner.useMode !== "lost_and_found" || !owner.allowFinderContact || owner.archived) {
      throw new Error("The owner has not enabled finder contact for this label.");
    }
    if (owner.lostStatus === "recovered") {
      throw new Error("The owner has marked this item as recovered.");
    }

    const rateCount = Number(rateSnap.get("count") || 0);
    if (rateSnap.exists && rateCount >= 3) {
      throw new Error("Too many messages were sent recently. Please wait a few minutes and try again.");
    }

    const now = FieldValue.serverTimestamp();
    transaction.set(rateRef, {
      labelCode: code,
      count: rateCount + 1,
      updatedAt: now,
      expiresAtMs: Date.now() + 12 * 60 * 1000,
    }, { merge: true });

    transaction.set(messageRef, {
      labelCode: code,
      ownerUid: owner.ownerUid,
      ownerEmail: owner.ownerEmail,
      publicItemName: owner.publicItemName || cleanSmartLabelText(labelData.labelName, 90) || `Smart Label ${code}`,
      finderName,
      finderEmail,
      finderPhone,
      message,
      locationText: owner.allowFinderLocation ? locationText : "",
      latitude: owner.allowFinderLocation ? latitude : null,
      longitude: owner.allowFinderLocation ? longitude : null,
      status: "new",
      source: "public-scan",
      emailDeliveryStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    transaction.set(labelRef, {
      finderMessageCount: FieldValue.increment(1),
      unreadFinderMessageCount: FieldValue.increment(1),
      lastFinderMessageAt: now,
      updatedAt: now,
    }, { merge: true });

    return {
      ownerEmail: owner.ownerEmail,
      publicItemName: owner.publicItemName || cleanSmartLabelText(labelData.labelName, 90) || `Smart Label ${code}`,
      allowFinderLocation: owner.allowFinderLocation,
    };
  });

  try {
    const delivery = await sendFinderMessageEmail({
      ownerEmail: result.ownerEmail,
      code,
      publicItemName: result.publicItemName,
      finderName,
      finderEmail,
      finderPhone,
      message,
      locationText: result.allowFinderLocation ? locationText : "",
      latitude: result.allowFinderLocation ? latitude : null,
      longitude: result.allowFinderLocation ? longitude : null,
    });
    const skipped = "skipped" in delivery && delivery.skipped === true;
    const failed = "error" in delivery && Boolean(delivery.error);
    await messageRef.set({
      emailDeliveryStatus: failed ? "failed" : skipped ? "skipped" : "sent",
      emailSentAt: failed || skipped ? null : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Smart Label finder email failed", error);
    await messageRef.set({ emailDeliveryStatus: "failed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  return { accepted: true, messageId: messageRef.id };
}

export async function listFinderMessagesForOwner(user: AuthenticatedUser, codeInput: string) {
  const code = normalizeSmartLabelCode(codeInput);
  if (!code) throw new Error("Missing label code.");
  const db = getFirebaseAdminDb();
  const labelRef = db.collection("smartLabels").doc(code);
  const labelSnap = await labelRef.get();
  if (!labelSnap.exists || cleanSmartLabelText(labelSnap.get("ownerUid"), 200) !== user.uid) {
    throw new Error("Label not found.");
  }

  const snapshot = await db.collection("smartLabelFinderMessages").where("ownerUid", "==", user.uid).get();
  const allMatching = snapshot.docs
    .filter((doc) => normalizeSmartLabelCode(doc.get("labelCode")) === code)
    .sort((a, b) => timestampToIso(b.get("createdAt")).localeCompare(timestampToIso(a.get("createdAt"))));
  const matching = allMatching.slice(0, 50);

  const unread = allMatching.filter((doc) => normalizeStatus(doc.get("status")) === "new");
  if (unread.length) {
    const batch = db.batch();
    unread.forEach((doc) => batch.set(doc.ref, { status: "read", readAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true }));
    batch.set(labelRef, { unreadFinderMessageCount: 0, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await batch.commit();
  }

  return matching.map((doc) => {
    const serialized = serializeFinderMessage(doc);
    return serialized.status === "new" ? { ...serialized, status: "read" as const } : serialized;
  });
}

export async function updateFinderMessageForOwner(user: AuthenticatedUser, codeInput: string, messageId: string, statusInput: unknown) {
  const code = normalizeSmartLabelCode(codeInput);
  const safeMessageId = cleanSmartLabelText(messageId, 200);
  if (!code || !safeMessageId) throw new Error("Missing finder message.");
  const status: SmartLabelFinderMessageStatus = statusInput === "resolved" ? "resolved" : "read";
  const db = getFirebaseAdminDb();
  const ref = db.collection("smartLabelFinderMessages").doc(safeMessageId);
  const snap = await ref.get();
  if (!snap.exists || cleanSmartLabelText(snap.get("ownerUid"), 200) !== user.uid || normalizeSmartLabelCode(snap.get("labelCode")) !== code) {
    throw new Error("Finder message not found.");
  }

  await ref.set({
    status,
    resolvedAt: status === "resolved" ? FieldValue.serverTimestamp() : null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  const updated = await ref.get();
  return serializeFinderMessage(updated as QueryDocumentSnapshot);
}
