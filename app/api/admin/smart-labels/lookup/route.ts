import { NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { extractSmartLabelCode, getSmartLabelUrl, normalizeSmartLabelCode } from "@/lib/smartLabels";

export const runtime = "nodejs";

type LookupBody = {
  query?: string;
  code?: string;
};

async function verifyAdmin(request: Request) {
  getFirebaseAdminDb();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token || !getApps().length) return null;
  const decoded = await getAuth().verifyIdToken(token);
  if (!isAllowedAdminEmail(decoded.email)) return null;
  return decoded.email || "";
}

function timestampToIso(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const maybeDate = value as { toDate?: () => Date; seconds?: number };
  if (typeof maybeDate.toDate === "function") return maybeDate.toDate().toISOString();
  if (typeof maybeDate.seconds === "number") return new Date(maybeDate.seconds * 1000).toISOString();
  return "";
}

function serializeAdminLabel(code: string, data: Record<string, unknown>, reservedOnly = false) {
  const labelUrl = typeof data.labelUrl === "string" && data.labelUrl ? data.labelUrl : getSmartLabelUrl(code);
  return {
    id: code,
    code,
    labelUrl,
    publicUrl: typeof data.publicUrl === "string" && data.publicUrl ? data.publicUrl : labelUrl,
    sequence: typeof data.sequence === "number" ? data.sequence : 0,
    labelIndex: typeof data.labelIndex === "number" ? data.labelIndex : 0,
    batchId: typeof data.batchId === "string" ? data.batchId : "",
    batchName: typeof data.batchName === "string" ? data.batchName : "",
    customerName: reservedOnly ? "" : typeof data.customerName === "string" ? data.customerName : "",
    customerEmail: reservedOnly ? "" : typeof data.customerEmail === "string" ? data.customerEmail : "",
    labelName: reservedOnly ? "" : typeof data.labelName === "string" ? data.labelName : "",
    locationName: reservedOnly ? "" : typeof data.locationName === "string" ? data.locationName : "",
    location: reservedOnly ? "" : typeof data.location === "string" ? data.location : "",
    itemsInside: reservedOnly ? "" : typeof data.itemsInside === "string" ? data.itemsInside : "",
    notes: reservedOnly ? "" : typeof data.notes === "string" ? data.notes : "",
    photos: reservedOnly || !Array.isArray(data.photos) ? [] : data.photos,
    pinEnabled: !reservedOnly && Boolean(data.pinEnabled),
    status: reservedOnly ? "Reserved" : typeof data.status === "string" && data.status ? data.status : "Ready",
    mode: typeof data.mode === "string" ? data.mode : reservedOnly ? "csv-only" : "active",
    reservedOnly,
    updatedAtIso: timestampToIso(data.updatedAt),
    createdAtIso: timestampToIso(data.createdAt),
  };
}

export async function POST(request: Request) {
  try {
    const adminEmail = await verifyAdmin(request);
    if (!adminEmail) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as LookupBody;
    const code = normalizeSmartLabelCode(body.code || "") || extractSmartLabelCode(body.query || "");
    if (!code) return NextResponse.json({ ok: false, error: "Enter a Smart Label code or paste a QR label link." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const labelSnap = await db.collection("smartLabels").doc(code).get();
    if (labelSnap.exists) {
      return NextResponse.json({ ok: true, code, reservedOnly: false, label: serializeAdminLabel(code, labelSnap.data() || {}, false) });
    }

    const reservationSnap = await db.collection("smartLabelReservations").doc(code).get();
    if (reservationSnap.exists) {
      return NextResponse.json({
        ok: true,
        code,
        reservedOnly: true,
        label: serializeAdminLabel(code, reservationSnap.data() || {}, true),
        message: "This is a reserved sticker-order code. Activate it before editing, resetting PINs, or archiving.",
      });
    }

    return NextResponse.json({ ok: false, code, error: `No Smart Label found for ${code}.` }, { status: 404 });
  } catch (error) {
    console.error("Smart label admin lookup failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to look up this label." }, { status: 500 });
  }
}
