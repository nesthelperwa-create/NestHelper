import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { cleanOptionalEmail } from "@/lib/smartLabels";
import { SMART_LABELS_PER_KIT, cleanActivationNotes, cleanEtsyOrderNumber, cleanSheetNumbers, cleanTrackingNumber, getActivationCodeLastFour, hashSmartLabelActivationCode, makeSmartLabelActivationCode, makeSmartLabelPackId } from "@/lib/smartLabelCustomer";

export const runtime = "nodejs";

type Body = {
  buyerEmail?: string;
  etsyOrderNumber?: string;
  packType?: string;
  kitQuantity?: number | string;
  complimentaryQuantity?: number | string;
  sheetNumbers?: string;
  trackingNumber?: string;
  notes?: string;
  status?: string;
  activationCode?: string;
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
    const packType = body.packType === "complimentary" ? "complimentary" : "retail";
    const rawKitQuantity = Number(body.kitQuantity || 1);
    const rawComplimentaryQuantity = Number(body.complimentaryQuantity || 1);

    if (packType === "retail" && (!Number.isInteger(rawKitQuantity) || rawKitQuantity < 1 || rawKitQuantity > 4)) {
      return NextResponse.json({ ok: false, error: "Retail kit quantity must be between 1 and 4." }, { status: 400 });
    }
    if (packType === "complimentary" && (!Number.isInteger(rawComplimentaryQuantity) || rawComplimentaryQuantity < 1 || rawComplimentaryQuantity > 12)) {
      return NextResponse.json({ ok: false, error: "Complimentary label quantity must be between 1 and 12." }, { status: 400 });
    }

    const kitQuantity = packType === "retail" ? rawKitQuantity : 0;
    const complimentaryQuantity = packType === "complimentary" ? rawComplimentaryQuantity : 0;
    const purchasedQuantity = packType === "complimentary" ? complimentaryQuantity : kitQuantity * SMART_LABELS_PER_KIT;
    const activationCode = (body.activationCode || makeSmartLabelActivationCode()).toUpperCase();
    const now = FieldValue.serverTimestamp();
    const db = getFirebaseAdminDb();
    const ref = db.collection("smartLabelPacks").doc();
    const packId = makeSmartLabelPackId();
    await ref.set({
      packId,
      buyerEmail: cleanOptionalEmail(body.buyerEmail),
      ownerUid: "",
      ownerEmail: "",
      etsyOrderNumber: cleanEtsyOrderNumber(body.etsyOrderNumber),
      sheetNumbers: cleanSheetNumbers(body.sheetNumbers),
      trackingNumber: cleanTrackingNumber(body.trackingNumber),
      notes: cleanActivationNotes(body.notes),
      activationCodeHash: hashSmartLabelActivationCode(activationCode),
      activationCodeLastFour: getActivationCodeLastFour(activationCode),
      packType,
      complimentaryQuantity,
      labelsPerKit: packType === "retail" ? SMART_LABELS_PER_KIT : 0,
      kitQuantity,
      purchasedQuantity,
      claimedQuantity: 0,
      remainingQuantity: purchasedQuantity,
      status: body.status === "draft" ? "draft" : body.status === "claimed" ? "claimed_open" : "shipped_unclaimed",
      createdByEmail: adminEmail,
      createdAt: now,
      updatedAt: now,
      shippedAt: body.status === "draft" ? null : now,
    });

    return NextResponse.json({
      ok: true,
      pack: {
        id: ref.id,
        packId,
        buyerEmail: cleanOptionalEmail(body.buyerEmail),
        etsyOrderNumber: cleanEtsyOrderNumber(body.etsyOrderNumber),
        packType,
        complimentaryQuantity,
        kitQuantity,
        purchasedQuantity,
        remainingQuantity: purchasedQuantity,
        status: body.status === "draft" ? "draft" : "shipped_unclaimed",
        activationCodeLastFour: getActivationCodeLastFour(activationCode),
        trackingNumber: cleanTrackingNumber(body.trackingNumber),
        sheetNumbers: cleanSheetNumbers(body.sheetNumbers),
      },
      activationCode,
      message: packType === "complimentary"
        ? `Created ${packId} with ${purchasedQuantity} complimentary label claim${purchasedQuantity === 1 ? "" : "s"}.`
        : `Created ${packId} with ${purchasedQuantity} available label claims.`,
    });
  } catch (error) {
    console.error("Create smart label pack failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create this pack." }, { status: 500 });
  }
}
