import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

const allowedCollections = new Set(["serviceRequests", "helperApplications", "partnerApplications", "contactMessages"]);

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb(); // initialize admin app
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const { collection, id, status, notes } = await request.json();
    if (!allowedCollections.has(collection) || !id || !status) {
      return NextResponse.json({ ok: false, error: "Missing or invalid update fields." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    await db.collection(collection).doc(id).update({
      status,
      adminNotes: notes || "",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to update status." }, { status: 500 });
  }
}
