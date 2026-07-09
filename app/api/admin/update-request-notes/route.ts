import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

type UpdateRequestNotesBody = {
  requestId?: string;
  adminNotes?: string;
  laundryBagsUsed?: number | string;
  laundryBagsReturned?: number | string;
  laundryBagTrackingNotes?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSafeBagCount(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  const count = Number(String(value).replace(/[^0-9]/g, ""));
  if (!Number.isFinite(count) || count < 0 || count > 999) return "";
  return Math.round(count);
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as UpdateRequestNotesBody;
    const requestId = getString(body.requestId);
    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const docRef = db.collection("serviceRequests").doc(requestId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
    }

    const current = docSnap.data() || {};
    const service = getString(current.service).toLowerCase();
    const adminNotes = getString(body.adminNotes).slice(0, 5000);

    const updates: Record<string, unknown> = {
      adminNotes,
      internalNotesUpdatedAt: FieldValue.serverTimestamp(),
      internalNotesUpdatedBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    if (service === "laundry-rescue") {
      const laundryBagsUsed = getSafeBagCount(body.laundryBagsUsed);
      const laundryBagsReturned = getSafeBagCount(body.laundryBagsReturned);
      const usedNumber = typeof laundryBagsUsed === "number" ? laundryBagsUsed : 0;
      const returnedNumber = typeof laundryBagsReturned === "number" ? laundryBagsReturned : 0;

      updates.laundryBagsUsed = laundryBagsUsed;
      updates.laundryBagsReturned = laundryBagsReturned;
      updates.laundryBagsStillOut = Math.max(0, usedNumber - returnedNumber);
      updates.laundryBagTrackingNotes = getString(body.laundryBagTrackingNotes).slice(0, 240);
    }

    await docRef.update(updates);

    return NextResponse.json({ ok: true, updates });
  } catch (error) {
    console.error("Unable to update request notes", error);
    return NextResponse.json({ ok: false, error: "Unable to update request notes." }, { status: 500 });
  }
}
