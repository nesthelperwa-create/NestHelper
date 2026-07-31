import { NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { cleanOptionalEmail, cleanSmartLabelText } from "@/lib/smartLabels";

export const runtime = "nodejs";

type Body = { query?: string };

type SmartLabelPackLookupRecord = {
  id: string;
  packId?: unknown;
  etsyOrderNumber?: unknown;
  buyerEmail?: unknown;
  ownerEmail?: unknown;
  activationCodeLastFour?: unknown;
  trackingNumber?: unknown;
  sheetNumbers?: unknown;
  purchasedQuantity?: unknown;
  claimedQuantity?: unknown;
  remainingQuantity?: unknown;
  status?: unknown;
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
    const query = cleanSmartLabelText(body.query, 120).toLowerCase();
    if (!query) return NextResponse.json({ ok: false, error: "Enter a pack id, Etsy order number, or buyer email." }, { status: 400 });
    const snapshot = await getFirebaseAdminDb().collection("smartLabelPacks").limit(50).get();
    const matches = snapshot.docs
      .map((doc): SmartLabelPackLookupRecord => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .filter((pack) => [pack.packId, pack.etsyOrderNumber, pack.buyerEmail, pack.ownerEmail, pack.activationCodeLastFour]
        .some((value) => String(value || "").toLowerCase().includes(query)))
      .map((pack) => ({
        id: pack.id,
        packId: cleanSmartLabelText(pack.packId, 120) || pack.id,
        buyerEmail: cleanOptionalEmail(pack.buyerEmail),
        ownerEmail: cleanOptionalEmail(pack.ownerEmail),
        etsyOrderNumber: cleanSmartLabelText(pack.etsyOrderNumber, 120),
        trackingNumber: cleanSmartLabelText(pack.trackingNumber, 120),
        sheetNumbers: cleanSmartLabelText(pack.sheetNumbers, 240),
        activationCodeLastFour: cleanSmartLabelText(pack.activationCodeLastFour, 8),
        purchasedQuantity: Number(pack.purchasedQuantity || 0),
        claimedQuantity: Number(pack.claimedQuantity || 0),
        remainingQuantity: Number(pack.remainingQuantity || 0),
        status: cleanSmartLabelText(pack.status, 60),
      }));

    return NextResponse.json({ ok: true, packs: matches });
  } catch (error) {
    console.error("Lookup smart label packs failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to search packs." }, { status: 500 });
  }
}
