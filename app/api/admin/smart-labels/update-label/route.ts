import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { extractSmartLabelCode, getSmartLabelUrl, normalizeSmartLabelCode } from "@/lib/smartLabels";

export const runtime = "nodejs";

type UpdateLabelBody = {
  code?: string;
  query?: string;
  action?: "resetPin" | "archive" | "restore" | "activate";
};

function hasContent(data: Record<string, unknown>) {
  return Boolean(
    data.labelName ||
      data.locationName ||
      data.location ||
      data.itemsInside ||
      data.notes ||
      (Array.isArray(data.photos) && data.photos.length > 0)
  );
}

async function verifyAdmin(request: Request) {
  getFirebaseAdminDb();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token || !getApps().length) return null;
  const decoded = await getAuth().verifyIdToken(token);
  if (!isAllowedAdminEmail(decoded.email)) return null;
  return decoded.email || "";
}

async function activateReservedLabel(code: string, adminEmail: string) {
  const db = getFirebaseAdminDb();
  const labelRef = db.collection("smartLabels").doc(code);
  const reservationRef = db.collection("smartLabelReservations").doc(code);

  return db.runTransaction(async (transaction) => {
    const existingLabel = await transaction.get(labelRef);
    if (existingLabel.exists) return { alreadyActive: true, data: existingLabel.data() || {} };

    const reservation = await transaction.get(reservationRef);
    if (!reservation.exists) return null;

    const reservationData = reservation.data() || {};
    const now = FieldValue.serverTimestamp();
    const labelUrl = typeof reservationData.labelUrl === "string" && reservationData.labelUrl ? reservationData.labelUrl : getSmartLabelUrl(code);
    const newLabelData = {
      code,
      batchId: reservationData.batchId || "",
      batchName: reservationData.batchName || "Sticker Order Labels",
      customerName: "",
      customerEmail: "",
      labelUrl,
      publicUrl: typeof reservationData.publicUrl === "string" && reservationData.publicUrl ? reservationData.publicUrl : labelUrl,
      sequence: reservationData.sequence || 0,
      labelIndex: reservationData.labelIndex || 0,
      status: "Ready",
      ownerMode: "customer-owned",
      pinEnabled: false,
      pinHash: "",
      labelName: "",
      locationName: "",
      itemsInside: "",
      notes: "",
      photos: [],
      activatedFromReservation: true,
      activatedByAdmin: true,
      lastEditedBy: "admin-smart-labels",
      lastEditedByEmail: adminEmail,
      createdAt: now,
      createdAtIso: new Date().toISOString(),
      updatedAt: now,
    };

    transaction.set(labelRef, newLabelData);
    transaction.update(reservationRef, {
      status: "Activated",
      activatedAt: now,
      activatedByAdmin: true,
      updatedAt: now,
    });

    return { alreadyActive: false, data: newLabelData };
  });
}

export async function POST(request: Request) {
  try {
    const adminEmail = await verifyAdmin(request);
    if (!adminEmail) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as UpdateLabelBody;
    const code = normalizeSmartLabelCode(body.code || "") || extractSmartLabelCode(body.query || "");
    if (!code) return NextResponse.json({ ok: false, error: "Missing label code." }, { status: 400 });
    if (!body.action || !["resetPin", "archive", "restore", "activate"].includes(body.action)) {
      return NextResponse.json({ ok: false, error: "Unsupported label action." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();

    if (body.action === "activate") {
      const activated = await activateReservedLabel(code, adminEmail);
      if (!activated) return NextResponse.json({ ok: false, error: "Reserved label not found." }, { status: 404 });
      return NextResponse.json({ ok: true, message: activated.alreadyActive ? `${code} is already active.` : `Activated ${code}. You can now manage it like a normal Smart Label.` });
    }

    const labelRef = db.collection("smartLabels").doc(code);
    const snapshot = await labelRef.get();
    if (!snapshot.exists) return NextResponse.json({ ok: false, error: "Active label not found. If this is a sticker-order code, activate it first." }, { status: 404 });

    const data = (snapshot.data() || {}) as Record<string, unknown>;
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      lastEditedBy: "admin-smart-labels",
      lastEditedByEmail: adminEmail,
    };
    let message = "Label updated.";

    if (body.action === "resetPin") {
      updates.pinEnabled = false;
      updates.pinHash = "";
      updates.pinUpdatedAt = FieldValue.serverTimestamp();
      message = `PIN reset for ${code}. The label is now OFF / no PIN.`;
    }

    if (body.action === "archive") {
      updates.status = "Archived";
      updates.archivedAt = FieldValue.serverTimestamp();
      message = `Archived ${code}.`;
    }

    if (body.action === "restore") {
      updates.status = hasContent(data) ? "In use" : "Ready";
      updates.restoredAt = FieldValue.serverTimestamp();
      message = `Restored ${code}.`;
    }

    await labelRef.update(updates);
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error("Smart label admin update failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update label." }, { status: 500 });
  }
}
