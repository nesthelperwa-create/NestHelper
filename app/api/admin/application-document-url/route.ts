import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { createApplicationDocumentSignedUrl } from "@/lib/applicationDocuments";

export const runtime = "nodejs";

const allowedCollections = new Set(["helperApplications", "partnerApplications"]);

type Body = {
  collection?: string;
  id?: string;
  storagePath?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const { collection, id, storagePath } = (await request.json().catch(() => ({}))) as Body;
    const safeCollection = getString(collection);
    const safeId = getString(id);
    const safeStoragePath = getString(storagePath);

    if (!allowedCollections.has(safeCollection) || !safeId || !safeStoragePath) {
      return NextResponse.json({ ok: false, error: "Missing application document details." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const docSnap = await db.collection(safeCollection).doc(safeId).get();
    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: "Application not found." }, { status: 404 });
    }

    const data = docSnap.data() || {};
    const documents = Array.isArray(data.applicationDocuments) ? data.applicationDocuments : [];
    const matchesRecord = documents.some((document) => {
      if (!document || typeof document !== "object") return false;
      return getString((document as { storagePath?: unknown }).storagePath) === safeStoragePath;
    });

    if (!matchesRecord) {
      return NextResponse.json({ ok: false, error: "This document is not attached to the selected application." }, { status: 403 });
    }

    const url = await createApplicationDocumentSignedUrl(safeStoragePath);
    return NextResponse.json({ ok: true, url, expiresInMinutes: 15 });
  } catch (error) {
    console.error("Application document URL failed", error);
    return NextResponse.json({ ok: false, error: "Unable to open this document." }, { status: 500 });
  }
}
