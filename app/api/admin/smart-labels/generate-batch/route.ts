import { NextResponse } from "next/server";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import {
  cleanOptionalEmail,
  cleanSmartLabelText,
  getSmartLabelUrl,
  normalizeSmartLabelCode,
  parseSmartLabelQuantity,
  smartLabelActiveQuantities,
  smartLabelLimits,
  smartLabelStickerOrderQuantities,
} from "@/lib/smartLabels";
import { makeSmartLabelCode } from "@/lib/smartLabelsServer";

export const runtime = "nodejs";

type Body = {
  quantity?: number | string;
  mode?: string;
  batchName?: string;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
};

type WriteOperation = {
  ref: DocumentReference;
  data: Record<string, unknown>;
};

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function getBatchMode(body: Body, quantity: number) {
  if (body.mode === "csv-only") return "csv-only";
  if (smartLabelStickerOrderQuantities.includes(quantity)) return "csv-only";
  return "active";
}

function cleanRequestedQuantity(body: Body) {
  const requestedQuantity = parseSmartLabelQuantity(body.quantity);
  const mode = getBatchMode(body, requestedQuantity);
  const allowed = mode === "csv-only" ? smartLabelStickerOrderQuantities : smartLabelActiveQuantities;

  if (!allowed.includes(requestedQuantity)) {
    throw new Error(mode === "csv-only" ? "Sticker order CSV quantity must be 500 or 1000." : "Active Smart Label quantity must be 10, 20, 30, or 50.");
  }

  return { quantity: requestedQuantity, mode };
}

async function getExistingCodes(codes: string[]) {
  const db = getFirebaseAdminDb();
  const existing = new Set<string>();
  const refs = codes.flatMap((code) => [db.collection("smartLabels").doc(code), db.collection("smartLabelReservations").doc(code)]);

  for (const refChunk of chunkArray(refs, 250)) {
    const snapshots = await db.getAll(...refChunk);
    snapshots.forEach((snapshot) => {
      if (snapshot.exists) existing.add(snapshot.ref.id);
    });
  }

  return existing;
}

async function makeUniqueCodes(quantity: number) {
  const codes: string[] = [];
  const seen = new Set<string>();
  let attempts = 0;

  while (codes.length < quantity && attempts < quantity * 40) {
    attempts += 1;
    const needed = quantity - codes.length;
    const candidates: string[] = [];

    while (candidates.length < Math.min(Math.max(needed + 20, 50), 260) && attempts < quantity * 40) {
      attempts += 1;
      const code = normalizeSmartLabelCode(makeSmartLabelCode(7));
      if (!code || seen.has(code)) continue;
      seen.add(code);
      candidates.push(code);
    }

    const existing = await getExistingCodes(candidates);
    candidates.forEach((code) => {
      if (codes.length < quantity && !existing.has(code)) codes.push(code);
    });
  }

  if (codes.length !== quantity) {
    throw new Error("Unable to create enough unique label codes. Try again.");
  }

  return codes;
}

async function commitWriteOperations(operations: WriteOperation[]) {
  const db = getFirebaseAdminDb();
  for (const operationChunk of chunkArray(operations, 450)) {
    const writeBatch = db.batch();
    operationChunk.forEach((operation) => writeBatch.set(operation.ref, operation.data));
    await writeBatch.commit();
  }
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as Body;
    const { quantity, mode } = cleanRequestedQuantity(body);
    const csvOnly = mode === "csv-only";
    const batchName = cleanSmartLabelText(body.batchName, smartLabelLimits.maxBatchName) || (csvOnly ? `Sticker Order CSV — ${quantity} labels` : `Smart Label Kit — ${quantity} labels`);
    const customerName = csvOnly ? "" : cleanSmartLabelText(body.customerName, smartLabelLimits.maxCustomerName);
    const customerEmail = csvOnly ? "" : cleanOptionalEmail(body.customerEmail);
    const notes = cleanSmartLabelText(body.notes, 500) || (csvOnly ? "Sticker order CSV only. Codes are reserved, but labels become active when scanned or assigned." : "Customer-owned Smart Labels. Default no PIN unless the family turns one on.");
    const codes = await makeUniqueCodes(quantity);
    const db = getFirebaseAdminDb();
    const batchRef = db.collection("smartLabelBatches").doc();
    const batchId = batchRef.id;
    const now = FieldValue.serverTimestamp();
    const createdAtIso = new Date().toISOString();
    const printPath = csvOnly ? "" : `/admin/smart-labels/print/${batchId}`;
    const operations: WriteOperation[] = [];

    operations.push({
      ref: batchRef,
      data: {
        batchId,
        status: csvOnly ? "CSV Only" : "Ready",
        mode,
        csvOnly,
        batchName,
        customerName,
        customerEmail,
        notes,
        quantity,
        labelCount: quantity,
        activeLabelCount: csvOnly ? 0 : quantity,
        reservedLabelCount: csvOnly ? quantity : 0,
        codes,
        printPath,
        createdByEmail: decoded.email || "",
        createdAt: now,
        createdAtIso,
        updatedAt: now,
      },
    });

    if (csvOnly) {
      codes.forEach((code, index) => {
        const labelUrl = getSmartLabelUrl(code);
        operations.push({
          ref: db.collection("smartLabelReservations").doc(code),
          data: {
            code,
            batchId,
            batchName,
            labelUrl,
            publicUrl: labelUrl,
            sequence: index + 1,
            labelIndex: index + 1,
            status: "Reserved",
            mode: "csv-only",
            reservationType: "sticker-order-csv",
            createdByEmail: decoded.email || "",
            createdAt: now,
            createdAtIso,
            updatedAt: now,
          },
        });
      });
    } else {
      codes.forEach((code, index) => {
        const labelUrl = getSmartLabelUrl(code);
        operations.push({
          ref: db.collection("smartLabels").doc(code),
          data: {
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
          },
        });
      });
    }

    await commitWriteOperations(operations);

    return NextResponse.json({
      ok: true,
      batchId,
      batchName,
      quantity,
      labelCount: quantity,
      codes,
      mode,
      csvOnly,
      printPath,
    });
  } catch (error) {
    console.error("Smart label batch generation failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to generate label sheet." }, { status: 500 });
  }
}
