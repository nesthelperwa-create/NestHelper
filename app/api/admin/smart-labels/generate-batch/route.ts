import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import {
  cleanOptionalEmail,
  cleanSmartLabelQuantity,
  cleanSmartLabelText,
  getSmartLabelUrl,
  normalizeSmartLabelCode,
  smartLabelLimits,
} from "@/lib/smartLabels";
import { makeSmartLabelCode } from "@/lib/smartLabelsServer";

export const runtime = "nodejs";

type Body = {
  quantity?: number | string;
  batchName?: string;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
};

async function makeUniqueCodes(quantity: number) {
  const db = getFirebaseAdminDb();
  const codes: string[] = [];
  const seen = new Set<string>();
  let attempts = 0;

  while (codes.length < quantity && attempts < quantity * 30) {
    attempts += 1;
    const code = normalizeSmartLabelCode(makeSmartLabelCode(7));
    if (!code || seen.has(code)) continue;
    const exists = await db.collection("smartLabels").doc(code).get();
    if (exists.exists) continue;
    seen.add(code);
    codes.push(code);
  }

  if (codes.length !== quantity) {
    throw new Error("Unable to create enough unique label codes. Try again.");
  }

  return codes;
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as Body;
    const quantity = cleanSmartLabelQuantity(body.quantity);
    const batchName = cleanSmartLabelText(body.batchName, smartLabelLimits.maxBatchName) || `Smart Label Sheet — ${quantity} labels`;
    const customerName = cleanSmartLabelText(body.customerName, smartLabelLimits.maxCustomerName);
    const customerEmail = cleanOptionalEmail(body.customerEmail);
    const notes = cleanSmartLabelText(body.notes, 500);
    const codes = await makeUniqueCodes(quantity);
    const db = getFirebaseAdminDb();
    const batchRef = db.collection("smartLabelBatches").doc();
    const batchId = batchRef.id;
    const now = FieldValue.serverTimestamp();
    const createdAtIso = new Date().toISOString();
    const batchWrite = db.batch();

    batchWrite.set(batchRef, {
      batchId,
      status: "Ready",
      batchName,
      customerName,
      customerEmail,
      notes,
      quantity,
      labelCount: quantity,
      codes,
      printPath: `/admin/smart-labels/print/${batchId}`,
      createdByEmail: decoded.email || "",
      createdAt: now,
      createdAtIso,
      updatedAt: now,
    });

    codes.forEach((code, index) => {
      const labelUrl = getSmartLabelUrl(code);
      batchWrite.set(db.collection("smartLabels").doc(code), {
        code,
        batchId,
        batchName,
        customerName,
        customerEmail,
        labelUrl,
        publicUrl: labelUrl,
        sequence: index + 1,
        labelIndex: index + 1,
        status: "Ready",
        ownerMode: "customer-owned",
        pinEnabled: false,
        pinHash: "",
        labelName: "",
        locationName: "",
        itemsInside: "",
        notes: "",
        photos: [],
        createdByEmail: decoded.email || "",
        lastEditedBy: "admin-batch-generator",
        createdAt: now,
        createdAtIso,
        updatedAt: now,
      });
    });

    await batchWrite.commit();

    return NextResponse.json({
      ok: true,
      batchId,
      batchName,
      quantity,
      labelCount: quantity,
      codes,
      printPath: `/admin/smart-labels/print/${batchId}`,
    });
  } catch (error) {
    console.error("Smart label batch generation failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to generate label sheet." }, { status: 500 });
  }
}
