import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { normalizeReferralCode, REFERRAL_PROGRAM } from "@/lib/referrals";

type UpdateReferralBody = {
  id?: string;
  referralCode?: string;
  referralCreditStatus?: string;
  referralReferrerName?: string;
  referralNewCustomerCreditAmount?: number | string;
  referralReferrerCreditAmount?: number | string;
  referralAdminNotes?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toSafeAmount(value: unknown, fallback: number) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 500) return fallback;
  return Math.round(amount * 100) / 100;
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as UpdateReferralBody;
    const id = getString(body.id);
    if (!id) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });

    const status = getString(body.referralCreditStatus) || "Pending review";
    if (!REFERRAL_PROGRAM.statuses.includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid referral status." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const docRef = db.collection("serviceRequests").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
    }

    const current = docSnap.data() || {};
    const serviceKey = String(current.service || current.selectedServiceTitle || current.packageType || current.requestType || "").toLowerCase();
    if (serviceKey.includes("commercial")) {
      return NextResponse.json({ ok: false, error: "Family referrals are not enabled for Commercial Reset requests yet." }, { status: 400 });
    }

    const existingCode = normalizeReferralCode(getString(current.referralCode));
    const nextCode = normalizeReferralCode(body.referralCode || existingCode);
    if (!nextCode) {
      return NextResponse.json({ ok: false, error: "Missing referral code." }, { status: 400 });
    }

    const defaultAmount = current.service === "laundry-rescue" ? REFERRAL_PROGRAM.laundryCredit : REFERRAL_PROGRAM.defaultNewCustomerCredit;
    const updates = {
      referralCode: nextCode,
      referralProgram: REFERRAL_PROGRAM.programName,
      referralCreditStatus: status,
      referralReferrerName: getString(body.referralReferrerName).slice(0, 120),
      referralNewCustomerCreditAmount: toSafeAmount(body.referralNewCustomerCreditAmount, defaultAmount),
      referralReferrerCreditAmount: toSafeAmount(body.referralReferrerCreditAmount, defaultAmount),
      referralAdminNotes: getString(body.referralAdminNotes).slice(0, 1200),
      referralUpdatedAt: FieldValue.serverTimestamp(),
      referralUpdatedBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    await docRef.update(updates);

    return NextResponse.json({ ok: true, updates });
  } catch (error) {
    console.error("Unable to update referral tracking", error);
    return NextResponse.json({ ok: false, error: "Unable to update referral tracking." }, { status: 500 });
  }
}
