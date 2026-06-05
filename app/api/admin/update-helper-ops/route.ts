import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

export const runtime = "nodejs";

type Body = {
  requestId?: string;
  createHelperLink?: boolean;
  approveForPayroll?: boolean;
  assignedHelperId?: string;
  assignedHelperName?: string;
  assignedHelperEmail?: string;
  assignedHelperPhone?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  expectedHours?: unknown;
  hourlyRate?: unknown;
  mileageRate?: unknown;
  estimatedMiles?: unknown;
  estimatedDurationMinutes?: unknown;
  mileageFromRequestId?: string;
  mileageFromLabel?: string;
  mileageFromAddress?: string;
  mileageToRequestId?: string;
  mileageToLabel?: string;
  mileageToAddress?: string;
  mileageEstimateSource?: string;
  assignmentNotes?: string;
  approvedHours?: unknown;
  approvedMiles?: unknown;
  approvedExpenseReimbursement?: unknown;
  payrollStatus?: string;
};

const PAYROLL_STATUSES = new Set(["Not ready", "Helper assigned", "Submitted by helper", "Needs review", "Approved for payroll", "Exported to QuickBooks", "Paid", "Hold"]);

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanDate(value: unknown) {
  const raw = cleanText(value, 30);
  if (!raw) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
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

function buildOrigin(request: Request) {
  const headerOrigin = request.headers.get("origin") || "";
  if (headerOrigin) return headerOrigin.replace(/\/$/, "");
  const host = request.headers.get("host") || "www.nesthelperwa.com";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

function createToken() {
  return randomBytes(24).toString("hex");
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as Body;
    const requestId = cleanText(body.requestId, 160);
    if (!requestId) return NextResponse.json({ ok: false, error: "Missing service request ID." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const docRef = db.collection("serviceRequests").doc(requestId);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });

    const existing = snap.data() || {};
    const assignedHelperId = cleanText(body.assignedHelperId, 160);
    const payrollStatus = PAYROLL_STATUSES.has(cleanText(body.payrollStatus, 80)) ? cleanText(body.payrollStatus, 80) : assignedHelperId ? "Helper assigned" : "Not ready";
    const approvedHours = cleanNumber(body.approvedHours, 24);
    const estimatedMiles = cleanNumber(body.estimatedMiles, 1000);
    const approvedMiles = cleanNumber(body.approvedMiles, 1000) || estimatedMiles;
    const mileageRate = cleanNumber(body.mileageRate, 10) || 0.725;
    const approvedExpenseReimbursement = cleanNumber(body.approvedExpenseReimbursement, 10000);

    let helperOpsToken = cleanText(existing.helperOpsToken, 160);
    if (body.createHelperLink && !helperOpsToken) helperOpsToken = createToken();

    const helperEntryUrl = helperOpsToken ? `${buildOrigin(request)}/helper/job/${helperOpsToken}` : "";

    const updatePayload: Record<string, unknown> = {
      assignedHelperId,
      assignedHelperName: cleanText(body.assignedHelperName, 160),
      assignedHelperEmail: cleanText(body.assignedHelperEmail, 200),
      assignedHelperPhone: cleanText(body.assignedHelperPhone, 80),
      helperOpsScheduledDate: cleanDate(body.scheduledDate),
      helperOpsScheduledStartTime: cleanTime(body.scheduledStartTime),
      helperOpsScheduledEndTime: cleanTime(body.scheduledEndTime),
      helperOpsExpectedHours: cleanNumber(body.expectedHours, 24),
      helperOpsHourlyRate: cleanNumber(body.hourlyRate, 500),
      helperOpsMileageRate: mileageRate,
      helperOpsMileagePolicy: "Admin site-to-site estimate only",
      helperOpsMileageFromRequestId: cleanText(body.mileageFromRequestId, 160),
      helperOpsMileageFromLabel: cleanText(body.mileageFromLabel, 300),
      helperOpsMileageFromAddress: cleanText(body.mileageFromAddress, 500),
      helperOpsMileageToRequestId: cleanText(body.mileageToRequestId, 160),
      helperOpsMileageToLabel: cleanText(body.mileageToLabel, 300),
      helperOpsMileageToAddress: cleanText(body.mileageToAddress, 500),
      helperOpsEstimatedMiles: estimatedMiles,
      helperOpsEstimatedDurationMinutes: cleanNumber(body.estimatedDurationMinutes, 10000),
      helperOpsMileageEstimateSource: cleanText(body.mileageEstimateSource, 120) || (estimatedMiles ? "Admin estimate" : "No reimbursable mileage"),
      helperOpsAssignmentNotes: cleanText(body.assignmentNotes, 1200),
      helperOpsApprovedHours: approvedHours,
      helperOpsApprovedMiles: approvedMiles,
      helperOpsApprovedExpenseReimbursement: approvedExpenseReimbursement,
      helperOpsPayrollStatus: body.approveForPayroll ? "Approved for payroll" : payrollStatus,
      helperOpsApprovedLaborAmount: approvedHours * cleanNumber(body.hourlyRate, 500),
      helperOpsApprovedMileageAmount: approvedMiles * mileageRate,
      helperOpsApprovedPayrollAmount: approvedHours * cleanNumber(body.hourlyRate, 500) + approvedMiles * mileageRate + approvedExpenseReimbursement,
      helperOpsUpdatedAt: FieldValue.serverTimestamp(),
      helperOpsUpdatedBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    if (helperOpsToken) {
      updatePayload.helperOpsToken = helperOpsToken;
      updatePayload.helperOpsEntryUrl = helperEntryUrl;
      updatePayload.helperOpsLinkCreatedAt = existing.helperOpsLinkCreatedAt || FieldValue.serverTimestamp();
    }

    if (body.approveForPayroll) {
      updatePayload.helperOpsApprovedAt = FieldValue.serverTimestamp();
      updatePayload.helperOpsApprovedBy = decoded.email || "admin";
    }

    await docRef.update(updatePayload);

    return NextResponse.json({ ok: true, helperEntryUrl, helperOpsToken });
  } catch (error) {
    console.error("Helper ops update failed", error);
    return NextResponse.json({ ok: false, error: "Unable to save helper operations." }, { status: 500 });
  }
}
