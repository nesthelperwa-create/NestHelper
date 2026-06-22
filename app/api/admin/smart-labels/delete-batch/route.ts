import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type DeleteBatchBody = {
  batchId?: string;
};

async function verifyAdmin(request: Request) {
  getFirebaseAdminDb();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token || !getApps().length) return null;
  const decoded = await getAuth().verifyIdToken(token);
  if (!isAllowedAdminEmail(decoded.email)) return null;
  return decoded.email || "";
}

function cleanBatchId(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 180);
}

export async function POST(request: Request) {
  try {
    const adminEmail = await verifyAdmin(request);
    if (!adminEmail) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as DeleteBatchBody;
    const batchId = cleanBatchId(body.batchId);
    if (!batchId) return NextResponse.json({ ok: false, error: "Missing Smart Label sheet ID." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const batchRef = db.collection("smartLabelBatches").doc(batchId);
    const removedRef = db.collection("smartLabelRemovedBatches").doc(batchId);

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(batchRef);
      if (!snapshot.exists) throw new Error("Smart Label sheet was not found or was already removed.");

      transaction.set(removedRef, {
        ...(snapshot.data() || {}),
        originalBatchId: batchId,
        removedFromDashboard: true,
        removedByEmail: adminEmail,
        removedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // This only removes the sheet/list record. It intentionally does not delete
      // smartLabels or smartLabelReservations so printed QR stickers keep working,
      // PINs/photos/notes stay intact, and labels can still be managed by code lookup.
      transaction.delete(batchRef);
    });

    return NextResponse.json({
      ok: true,
      message: "Removed this QR sheet from the dashboard list. QR codes, reservations, active labels, photos, notes, and PIN controls were kept. Use Find one label by QR/code to manage them.",
    });
  } catch (error) {
    console.error("Smart label batch removal failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to remove this sheet from the dashboard." }, { status: 500 });
  }
}
