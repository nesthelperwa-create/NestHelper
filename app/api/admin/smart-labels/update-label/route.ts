import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { normalizeSmartLabelCode } from "@/lib/smartLabels";

export const runtime = "nodejs";

type UpdateLabelBody = {
  code?: string;
  action?: "resetPin" | "archive" | "restore";
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

export async function POST(request: Request) {
  try {
    const adminEmail = await verifyAdmin(request);
    if (!adminEmail) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as UpdateLabelBody;
    const code = normalizeSmartLabelCode(body.code || "");
    if (!code) return NextResponse.json({ ok: false, error: "Missing label code." }, { status: 400 });
    if (!body.action || !["resetPin", "archive", "restore"].includes(body.action)) {
      return NextResponse.json({ ok: false, error: "Unsupported label action." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const labelRef = db.collection("smartLabels").doc(code);
    const snapshot = await labelRef.get();
    if (!snapshot.exists) return NextResponse.json({ ok: false, error: "Label not found." }, { status: 404 });

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
