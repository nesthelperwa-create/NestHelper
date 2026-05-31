import { NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    getFirebaseAdminDb();

    const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
    if (!token || !getApps().length) {
      return NextResponse.json({ ok: false, authorized: false }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const email = decoded.email?.trim().toLowerCase() || "";
    const authorized = isAllowedAdminEmail(email);

    return NextResponse.json(
      {
        ok: true,
        authorized,
        email,
      },
      { status: authorized ? 200 : 403 }
    );
  } catch (error) {
    console.error("Admin authorization check failed", error);
    return NextResponse.json({ ok: false, authorized: false }, { status: 401 });
  }
}
