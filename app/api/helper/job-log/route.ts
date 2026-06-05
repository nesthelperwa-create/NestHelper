import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanTime(value: unknown) {
  const raw = cleanText(value, 20);
  if (!raw) return "";
  return /^\d{2}:\d{2}$/.test(raw) ? raw : "";
}

function cleanNumber(value: unknown, max = 100000) {
  const next = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  if (!Number.isFinite(next)) return 0;
  if (next < 0) return 0;
  return Math.min(next, max);
}

async function findRequestByToken(token: string) {
  const db = getFirebaseAdminDb();
  const snap = await db.collection("serviceRequests").where("helperOpsToken", "==", token).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() || {} };
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  const next = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(next) ? next : 0;
}

function getAddress(data: Record<string, unknown>) {
  return getString(data.serviceAddress) || [data.serviceAddressLine1 || data.address || data.address1, data.serviceAddressLine2 || data.address2, data.serviceCity || data.city, data.serviceState || data.state, data.serviceZip || data.zip].map(getString).filter(Boolean).join(", ");
}

function getServiceLabel(data: Record<string, unknown>) {
  return getString(data.selectedServiceTitle) || getString(data.packageType) || getString(data.serviceLabel) || getString(data.service) || "NestHelper service";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = cleanText(url.searchParams.get("token"), 160);
    if (!token) return NextResponse.json({ ok: false, error: "Missing helper link token." }, { status: 400 });

    const result = await findRequestByToken(token);
    if (!result) return NextResponse.json({ ok: false, error: "This helper entry link was not found or is no longer active." }, { status: 404 });

    const data = result.data;
    return NextResponse.json({
      ok: true,
      job: {
        customerName: getString(data.fullName) || getString(data.name) || "Customer",
        serviceLabel: getServiceLabel(data),
        address: getAddress(data),
        cityZip: [getString(data.serviceCity) || getString(data.city), getString(data.serviceZip) || getString(data.zip)].filter(Boolean).join(" "),
        scheduledDate: getString(data.helperOpsScheduledDate || data.scheduledDate || data.preferredDate),
        scheduledStartTime: getString(data.helperOpsScheduledStartTime),
        scheduledEndTime: getString(data.helperOpsScheduledEndTime),
        expectedHours: toNumber(data.helperOpsExpectedHours),
        estimatedMiles: toNumber(data.helperOpsApprovedMiles || data.helperOpsEstimatedMiles),
        mileagePolicy: getString(data.helperOpsMileagePolicy) || "Admin site-to-site estimate only",
        mileageFromLabel: getString(data.helperOpsMileageFromLabel),
        mileageToLabel: getString(data.helperOpsMileageToLabel),
        assignmentNotes: getString(data.helperOpsAssignmentNotes),
        assignedHelperName: getString(data.assignedHelperName),
        submittedAt: data.helperWorkLogSubmittedAt || null,
        actualStartTime: getString(data.helperActualStartTime),
        actualEndTime: getString(data.helperActualEndTime),
        breakMinutes: toNumber(data.helperBreakMinutes),
        reportedExpenses: toNumber(data.helperReportedExpenses),
        notes: getString(data.helperWorkLogNotes),
      },
    });
  } catch (error) {
    console.error("Unable to load helper job log", error);
    return NextResponse.json({ ok: false, error: "Unable to load helper job." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = cleanText(body.token, 160);
    if (!token) return NextResponse.json({ ok: false, error: "Missing helper link token." }, { status: 400 });

    const result = await findRequestByToken(token);
    if (!result) return NextResponse.json({ ok: false, error: "This helper entry link was not found or is no longer active." }, { status: 404 });

    const start = cleanTime(body.actualStartTime);
    const end = cleanTime(body.actualEndTime);
    const breakMinutes = cleanNumber(body.breakMinutes, 720);
    const reportedExpenses = cleanNumber(body.reportedExpenses, 10000);

    let reportedHours = cleanNumber(body.reportedHours, 24);
    if (!reportedHours && start && end) {
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute) - breakMinutes;
      if (minutes < 0) minutes += 24 * 60;
      reportedHours = Math.max(0, minutes / 60);
    }

    await result.ref.update({
      helperActualStartTime: start,
      helperActualEndTime: end,
      helperBreakMinutes: breakMinutes,
      helperReportedHours: reportedHours,
      helperReportedMiles: FieldValue.delete(),
      helperReportedExpenses: reportedExpenses,
      helperMileagePurpose: FieldValue.delete(),
      helperMileageVarianceMiles: FieldValue.delete(),
      helperMileageVariancePercent: FieldValue.delete(),
      helperMileageFlag: "Admin estimate only",
      helperWorkLogNotes: cleanText(body.notes, 2000),
      helperWorkLogSubmittedAt: FieldValue.serverTimestamp(),
      helperOpsPayrollStatus: "Submitted by helper",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, reportedHours });
  } catch (error) {
    console.error("Unable to submit helper job log", error);
    return NextResponse.json({ ok: false, error: "Unable to submit helper job log." }, { status: 500 });
  }
}
