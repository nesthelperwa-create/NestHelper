import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { cleanOptionalEmail, cleanSmartLabelText } from "@/lib/smartLabels";
import { cleanActivationNotes, cleanEtsyOrderNumber, cleanSheetNumbers, cleanTrackingNumber } from "@/lib/smartLabelCustomer";

export const runtime = "nodejs";

type Body = {
  id?: string;
  status?: string;
  trackingNumber?: string;
  buyerEmail?: string;
  etsyOrderNumber?: string;
  sheetNumbers?: string;
  notes?: string;
};

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
    const body = (await request.json().catch(() => ({}))) as Body;
    const id = cleanSmartLabelText(body.id, 120);
    if (!id) return NextResponse.json({ ok: false, error: "Missing pack id." }, { status: 400 });
    const ref = getFirebaseAdminDb().collection("smartLabelPacks").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: "Pack not found." }, { status: 404 });

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      lastEditedByEmail: adminEmail,
    };
    if (body.trackingNumber !== undefined) updates.trackingNumber = cleanTrackingNumber(body.trackingNumber);
    if (body.buyerEmail !== undefined) updates.buyerEmail = cleanOptionalEmail(body.buyerEmail);
    if (body.etsyOrderNumber !== undefined) updates.etsyOrderNumber = cleanEtsyOrderNumber(body.etsyOrderNumber);
    if (body.sheetNumbers !== undefined) updates.sheetNumbers = cleanSheetNumbers(body.sheetNumbers);
    if (body.notes !== undefined) updates.notes = cleanActivationNotes(body.notes);
    if (body.status) {
      updates.status = cleanSmartLabelText(body.status, 60);
      if (String(body.status).startsWith("shipped")) updates.shippedAt = FieldValue.serverTimestamp();
    }

    await ref.set(updates, { merge: true });
    return NextResponse.json({ ok: true, message: "Pack updated." });
  } catch (error) {
    console.error("Update smart label pack failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update this pack." }, { status: 500 });
  }
}
