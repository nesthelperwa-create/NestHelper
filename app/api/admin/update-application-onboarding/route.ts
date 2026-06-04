import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

export const runtime = "nodejs";

const allowedCollections = new Set(["helperApplications", "partnerApplications"]);
const allowedChecklistItems = new Set([
  "applicationReviewed",
  "phoneScreenComplete",
  "referencesChecked",
  "backgroundCheckStarted",
  "backgroundCheckCleared",
  "licenseInsuranceReviewed",
  "trialJobComplete",
  "approved",
  "backupOnly",
  "notApproved",
  "archived",
]);

const allowedTextFields = [
  "internalNotes",
  "bestFitServices",
  "strengths",
  "concerns",
  "approvedBio",
  "doNotAssignNotes",
  "reliabilityRating",
];

type Body = {
  collection?: string;
  id?: string;
  status?: string;
  onboardingChecklist?: Record<string, unknown>;
  internalNotes?: string;
  bestFitServices?: string;
  strengths?: string;
  concerns?: string;
  approvedBio?: string;
  doNotAssignNotes?: string;
  reliabilityRating?: string;
};

function cleanText(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanChecklist(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => allowedChecklistItems.has(key))
      .map(([key, item]) => [key, Boolean(item)])
  );
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as Body;
    const collection = cleanText(body.collection, 80);
    const id = cleanText(body.id, 160);
    if (!allowedCollections.has(collection) || !id) {
      return NextResponse.json({ ok: false, error: "Missing or invalid application update request." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const docRef = db.collection(collection).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: "Application not found." }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      onboardingUpdatedAt: FieldValue.serverTimestamp(),
      onboardingUpdatedBy: decoded.email || "admin",
      onboardingChecklist: cleanChecklist(body.onboardingChecklist),
    };

    const status = cleanText(body.status, 80);
    if (status) updatePayload.status = status;

    for (const field of allowedTextFields) {
      updatePayload[field] = cleanText((body as Record<string, unknown>)[field], field === "reliabilityRating" ? 80 : 2000);
    }

    await docRef.update(updatePayload);

    return NextResponse.json({ ok: true, updates: updatePayload });
  } catch (error) {
    console.error("Application onboarding update failed", error);
    return NextResponse.json({ ok: false, error: "Unable to update application onboarding." }, { status: 500 });
  }
}
