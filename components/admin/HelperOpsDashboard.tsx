"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";

type AdminRecord = { id: string; [key: string]: any };
type HelperRecord = { id: string; sourceCollection?: "helperApplications" | "partnerApplications"; sourceDocId?: string; helperType?: "Individual" | "Business/Partner"; [key: string]: any };
type SaveState = Record<string, "idle" | "saving" | "saved" | "error">;
type EstimateState = Record<string, "idle" | "calculating" | "done" | "error">;

type HelperOpsDraft = {
  assignedHelperId: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  expectedHours: string;
  helperHourlyRate: string;
  mileageRate: string;
  mileageFromRequestId: string;
  mileageToRequestId: string;
  estimatedMiles: string;
  estimatedDurationMinutes: string;
  mileageEstimateSource: string;
  assignmentNotes: string;
  approvedHours: string;
  approvedMiles: string;
  approvedExpenseReimbursement: string;
  payrollStatus: string;
};

const DEFAULT_MILEAGE_RATE = "0.725";
const PAYROLL_STATUSES = ["Not ready", "Helper assigned", "Submitted by helper", "Needs review", "Approved for payroll", "Exported to QuickBooks", "Paid", "Hold"];

function getDateObject(value: unknown) {
  if (!value) return null;
  if (typeof value === "object" && value && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    const next = (value as { toDate: () => Date }).toDate();
    return next instanceof Date && !Number.isNaN(next.getTime()) ? next : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const next = new Date(value);
    return Number.isNaN(next.getTime()) ? null : next;
  }
  return null;
}

function formatDate(value: unknown) {
  const date = getDateObject(value);
  if (date) return date.toLocaleDateString();
  if (typeof value === "string" && value.trim()) return value;
  return "—";
}

function formatDateTime(value: unknown) {
  const date = getDateObject(value);
  if (date) return date.toLocaleString();
  if (typeof value === "string" && value.trim()) return value;
  return "—";
}

function toNumber(value: unknown) {
  const next = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(next) ? next : 0;
}

function formatMoney(value: unknown) {
  const amount = toNumber(value);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getName(item: AdminRecord) {
  return getString(item.fullName) || getString(item.name) || getString(item.customerName) || "Unnamed customer";
}

function getServiceLabel(item: AdminRecord) {
  return getString(item.selectedServiceTitle) || getString(item.packageType) || getString(item.serviceLabel) || getString(item.service) || "Service";
}

function getAddress(item: AdminRecord) {
  return getString(item.serviceAddress) || [item.serviceAddressLine1 || item.address || item.address1, item.serviceAddressLine2 || item.address2, item.serviceCity || item.city, item.serviceState || item.state, item.serviceZip || item.zip].map(getString).filter(Boolean).join(", ");
}

function getCityZip(item: AdminRecord) {
  return [getString(item.serviceCity) || getString(item.city), getString(item.serviceZip) || getString(item.zip)].filter(Boolean).join(" ") || "—";
}

function getRequestDate(item: AdminRecord) {
  return getString(item.helperOpsScheduledDate || item.scheduledDate || item.preferredDate);
}

function getHelperName(helper: HelperRecord) {
  const business = getString(helper.businessName);
  const person = getString(helper.fullName) || getString(helper.name) || getString(helper.ownerName);
  if (business && person) return `${business} (${person})`;
  return person || business || "Unnamed helper";
}

function getHelperServices(helper: HelperRecord) {
  const raw = helper.services || helper.bestFitServices || helper.serviceType || helper.preferredWork;
  return Array.isArray(raw) ? raw.filter(Boolean).join(", ") : getString(raw) || "—";
}

function getHelperStatus(helper: HelperRecord) {
  return getString(helper.status || helper.applicationStatus || helper.onboardingStatus) || "New";
}

function getHelperRosterType(helper: HelperRecord) {
  return getString(helper.helperType) || (helper.sourceCollection === "partnerApplications" ? "Business/Partner" : "Individual");
}

function getArrayValues(value: unknown) {
  if (Array.isArray(value)) return value.map(getString).filter(Boolean);
  const text = getString(value);
  if (!text) return [];
  return text.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
}

function lowerBag(values: unknown[]) {
  return values.flatMap(getArrayValues).join(" | ").toLowerCase();
}

function requestServiceKeywords(item: AdminRecord) {
  const service = getServiceLabel(item).toLowerCase();
  if (service.includes("laundry")) return ["laundry", "fold", "wash"];
  if (service.includes("errand")) return ["errand", "pickup", "drop", "driving"];
  if (service.includes("commercial")) return ["commercial", "janitorial", "office", "turnover", "cleaning"];
  if (service.includes("helper")) return ["helper", "organizing", "reset", "laundry", "errand", "light cleaning"];
  return ["family reset", "parent reset", "home reset", "reset", "light cleaning", "tidying", "dishes", "laundry", "organizing"];
}

function availabilityMatchesDate(helper: HelperRecord, item: AdminRecord) {
  const availability = lowerBag([helper.availability, helper.capacity]);
  if (!availability) return false;
  const date = getRequestDate(item);
  if (!date) return false;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const day = parsed.getDay();
  const isWeekend = day === 0 || day === 6;
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return availability.includes(dayNames[day]) || (isWeekend && availability.includes("weekend")) || (!isWeekend && availability.includes("weekday"));
}

function helperMatchScore(item: AdminRecord, helper: HelperRecord) {
  let score = 0;
  const reasons: string[] = [];
  const helperServices = lowerBag([helper.services, helper.bestFitServices, helper.serviceType, helper.preferredWork]);
  const keywords = requestServiceKeywords(item);
  if (helperServices && keywords.some((keyword) => helperServices.includes(keyword))) {
    score += 6;
    reasons.push("service fit");
  }

  const requestCity = (getString(item.serviceCity) || getString(item.city)).toLowerCase();
  const helperCity = (getString(helper.city) || getString(helper.businessCity)).toLowerCase();
  const helperAreas = lowerBag([helper.serviceArea, helper.serviceAreas, helper.serviceAreaDetails, helper.travelRadius, helper.notes, helper.capacity]);
  if (requestCity && helperCity && requestCity === helperCity) {
    score += 3;
    reasons.push("same city");
  } else if (requestCity && helperAreas.includes(requestCity)) {
    score += 3;
    reasons.push("service area");
  }

  if (availabilityMatchesDate(helper, item)) {
    score += 2;
    reasons.push("availability");
  }

  const transportation = lowerBag([helper.transportation]);
  if (transportation.includes("reliable") || transportation.includes("car") || transportation.includes("vehicle") || transportation.includes("drive")) {
    score += 2;
    reasons.push("transportation");
  }

  const notWilling = lowerBag([helper.notWillingToDo]);
  const service = getServiceLabel(item).toLowerCase();
  if (service.includes("errand") && notWilling.includes("driving")) score -= 5;
  if (service.includes("laundry") && notWilling.includes("laundry")) score -= 5;

  return { score, reasons };
}

function helperOptionLabel(item: AdminRecord, helper: HelperRecord) {
  const match = helperMatchScore(item, helper);
  const reasonText = match.reasons.length ? ` • ${match.reasons.slice(0, 3).join(", ")}` : "";
  return `${getHelperName(helper)} — ${getHelperRosterType(helper)} — ${getHelperStatus(helper)} — match ${match.score}${reasonText} — ${getHelperServices(helper)}`;
}

function sortedHelpersForRequest(item: AdminRecord, helperList: HelperRecord[]) {
  return [...helperList].sort((a, b) => {
    const diff = helperMatchScore(item, b).score - helperMatchScore(item, a).score;
    if (diff) return diff;
    return getHelperName(a).localeCompare(getHelperName(b));
  });
}

function isActiveRequest(item: AdminRecord) {
  const status = getString(item.status).toLowerCase();
  return !["canceled", "cancelled", "declined", "archived"].includes(status);
}

function isApprovedHelper(item: HelperRecord) {
  const status = getHelperStatus(item).toLowerCase().replace(/[\s_-]+/g, " ").trim();
  if (!status) return false;
  if (["rejected", "declined", "inactive", "archived", "not approved", "on hold", "new", "reviewing", "needs documents", "need documents", "background check needed"].some((blocked) => status === blocked || status.includes(blocked))) {
    return false;
  }
  return [
    "approved",
    "approved helper",
    "approved partner",
    "backup",
    "backup list",
    "backup partner",
    "trial job approved",
    "trial approved",
  ].some((allowed) => status === allowed || status.includes(allowed));
}

function draftFromRecord(item: AdminRecord): HelperOpsDraft {
  const estimatedMiles = String(item.helperOpsEstimatedMiles ?? "");
  return {
    assignedHelperId: getString(item.assignedHelperId),
    scheduledDate: getRequestDate(item),
    scheduledStartTime: getString(item.helperOpsScheduledStartTime),
    scheduledEndTime: getString(item.helperOpsScheduledEndTime),
    expectedHours: String(item.helperOpsExpectedHours ?? ""),
    helperHourlyRate: String(item.helperOpsHourlyRate ?? ""),
    mileageRate: String(item.helperOpsMileageRate ?? DEFAULT_MILEAGE_RATE),
    mileageFromRequestId: getString(item.helperOpsMileageFromRequestId),
    mileageToRequestId: getString(item.helperOpsMileageToRequestId || item.id),
    estimatedMiles,
    estimatedDurationMinutes: String(item.helperOpsEstimatedDurationMinutes ?? ""),
    mileageEstimateSource: getString(item.helperOpsMileageEstimateSource) || "Admin estimate",
    assignmentNotes: getString(item.helperOpsAssignmentNotes),
    approvedHours: String(item.helperOpsApprovedHours ?? item.helperReportedHours ?? ""),
    approvedMiles: String(item.helperOpsApprovedMiles ?? item.helperOpsEstimatedMiles ?? ""),
    approvedExpenseReimbursement: String(item.helperOpsApprovedExpenseReimbursement ?? item.helperReportedExpenses ?? ""),
    payrollStatus: getString(item.helperOpsPayrollStatus) || (item.assignedHelperId ? "Helper assigned" : "Not ready"),
  };
}

function buildCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const raw = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = buildCsv(rows);
  if (!csv) {
    alert("No rows to export yet.");
    return;
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function payrollCost(item: AdminRecord) {
  const hours = toNumber(item.helperOpsApprovedHours || item.helperReportedHours);
  const hourly = toNumber(item.helperOpsHourlyRate);
  const miles = toNumber(item.helperOpsApprovedMiles || item.helperOpsEstimatedMiles);
  const mileageRate = toNumber(item.helperOpsMileageRate || DEFAULT_MILEAGE_RATE);
  const expenses = toNumber(item.helperOpsApprovedExpenseReimbursement || item.helperReportedExpenses);
  return {
    labor: hours * hourly,
    mileage: miles * mileageRate,
    expenses,
    total: hours * hourly + miles * mileageRate + expenses,
  };
}

function mileageLabel(item: AdminRecord) {
  const miles = toNumber(item.helperOpsApprovedMiles || item.helperOpsEstimatedMiles);
  if (!miles) return "No reimbursable miles";
  const source = getString(item.helperOpsMileageEstimateSource) || "Admin estimate";
  return `${miles.toFixed(1)} mi • ${source}`;
}

function googleMapsDirectionsUrl(originAddress: string, destinationAddress: string) {
  if (!destinationAddress) return "";
  if (originAddress) return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(destinationAddress)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}`;
}

function requestOptionLabel(item: AdminRecord) {
  return `${getName(item)} — ${getServiceLabel(item)} — ${getCityZip(item)}${getRequestDate(item) ? ` — ${getRequestDate(item)}` : ""}`;
}

function locationScore(base: AdminRecord, candidate: AdminRecord) {
  let score = 0;
  const baseZip = getString(base.serviceZip || base.zip);
  const candidateZip = getString(candidate.serviceZip || candidate.zip);
  const baseCity = getString(base.serviceCity || base.city).toLowerCase();
  const candidateCity = getString(candidate.serviceCity || candidate.city).toLowerCase();
  const baseDate = getRequestDate(base);
  const candidateDate = getRequestDate(candidate);
  if (baseZip && candidateZip && baseZip === candidateZip) score += 5;
  if (baseCity && candidateCity && baseCity === candidateCity) score += 3;
  if (baseDate && candidateDate && baseDate === candidateDate) score += 3;
  if (getString(base.assignedHelperId) && getString(base.assignedHelperId) === getString(candidate.assignedHelperId)) score += 2;
  return score;
}

export default function HelperOpsDashboard() {
  const [requests, setRequests] = useState<AdminRecord[]>([]);
  const [helpers, setHelpers] = useState<HelperRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, HelperOpsDraft>>({});
  const [saveState, setSaveState] = useState<SaveState>({});
  const [estimateState, setEstimateState] = useState<EstimateState>({});
  const [statusFilter, setStatusFilter] = useState("Active");
  const [helperFilter, setHelperFilter] = useState("All");
  const [queryText, setQueryText] = useState("");

  useEffect(() => {
    const unsubRequests = onSnapshot(query(collection(firestoreDb, "serviceRequests"), orderBy("createdAt", "desc")), (snap) => {
      const next = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRequests(next);
      setDrafts((prev) => {
        const updated = { ...prev };
        next.forEach((item) => {
          if (!updated[item.id]) updated[item.id] = draftFromRecord(item);
        });
        return updated;
      });
    });
    const helperCache: Record<string, HelperRecord[]> = { helperApplications: [], partnerApplications: [] };
    const publishHelpers = () => setHelpers([...helperCache.helperApplications, ...helperCache.partnerApplications]);
    const unsubHelpers = onSnapshot(query(collection(firestoreDb, "helperApplications"), orderBy("createdAt", "desc")), (snap) => {
      helperCache.helperApplications = snap.docs.map((doc) => ({
        id: `helperApplications:${doc.id}`,
        sourceDocId: doc.id,
        sourceCollection: "helperApplications",
        helperType: "Individual",
        ...doc.data(),
      }));
      publishHelpers();
    });
    const unsubPartners = onSnapshot(query(collection(firestoreDb, "partnerApplications"), orderBy("createdAt", "desc")), (snap) => {
      helperCache.partnerApplications = snap.docs.map((doc) => ({
        id: `partnerApplications:${doc.id}`,
        sourceDocId: doc.id,
        sourceCollection: "partnerApplications",
        helperType: "Business/Partner",
        ...doc.data(),
      }));
      publishHelpers();
    });
    return () => {
      unsubRequests();
      unsubHelpers();
      unsubPartners();
    };
  }, []);

  const approvedHelpers = useMemo(() => helpers.filter(isApprovedHelper), [helpers]);
  const requestChoices = useMemo(() => requests.filter((item) => isActiveRequest(item) && getAddress(item)), [requests]);

  const filteredRequests = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return requests.filter((item) => {
      if (statusFilter === "Active" && !isActiveRequest(item)) return false;
      if (statusFilter === "Assigned" && !item.assignedHelperId) return false;
      if (statusFilter === "Submitted" && !item.helperWorkLogSubmittedAt) return false;
      if (statusFilter === "Approved for payroll" && getString(item.helperOpsPayrollStatus) !== "Approved for payroll") return false;
      if (helperFilter !== "All" && item.assignedHelperId !== helperFilter) return false;
      if (!q) return true;
      return [getName(item), getServiceLabel(item), getCityZip(item), getString(item.assignedHelperName), getString(item.status)].join(" ").toLowerCase().includes(q);
    });
  }, [requests, statusFilter, helperFilter, queryText]);

  const pendingReview = requests.filter((item) => item.helperWorkLogSubmittedAt && getString(item.helperOpsPayrollStatus) !== "Approved for payroll" && getString(item.helperOpsPayrollStatus) !== "Paid");
  const approvedForPayroll = requests.filter((item) => getString(item.helperOpsPayrollStatus) === "Approved for payroll");
  const estimatedPayroll = approvedForPayroll.reduce((sum, item) => sum + payrollCost(item).total, 0);

  function updateDraft(id: string, field: keyof HelperOpsDraft, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || draftFromRecord({ id })), [field]: value } }));
  }

  function getRequest(id: string) {
    return requests.find((item) => item.id === id);
  }

  async function calculateEstimatedMiles(item: AdminRecord) {
    const draft = drafts[item.id] || draftFromRecord(item);
    const origin = getRequest(draft.mileageFromRequestId);
    const destination = getRequest(draft.mileageToRequestId || item.id) || item;
    const originAddress = origin ? getAddress(origin) : "";
    const destinationAddress = getAddress(destination);

    if (!originAddress || !destinationAddress) {
      alert("Choose a from-request and a to-request with saved addresses first.");
      return;
    }

    setEstimateState((prev) => ({ ...prev, [item.id]: "calculating" }));
    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      if (!token) throw new Error("Admin login expired. Please sign in again.");
      const response = await fetch("/api/admin/helper-ops-distance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ originAddress, destinationAddress }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to calculate mileage.");
      const miles = Number(result.miles || 0);
      const minutes = Number(result.durationMinutes || 0);
      setDrafts((prev) => ({
        ...prev,
        [item.id]: {
          ...(prev[item.id] || draft),
          estimatedMiles: miles ? miles.toFixed(1) : "",
          approvedMiles: miles ? miles.toFixed(1) : "",
          estimatedDurationMinutes: minutes ? Math.round(minutes).toString() : "",
          mileageEstimateSource: result.source || "Google Routes API",
        },
      }));
      setEstimateState((prev) => ({ ...prev, [item.id]: "done" }));
      setTimeout(() => setEstimateState((prev) => ({ ...prev, [item.id]: "idle" })), 1800);
    } catch (error) {
      console.error(error);
      setEstimateState((prev) => ({ ...prev, [item.id]: "error" }));
      alert(error instanceof Error ? error.message : "Unable to calculate mileage.");
    }
  }

  async function saveHelperOps(item: AdminRecord, options: { createHelperLink?: boolean; approveForPayroll?: boolean } = {}) {
    const draft = drafts[item.id] || draftFromRecord(item);
    const helper = approvedHelpers.find((entry) => entry.id === draft.assignedHelperId);
    const mileageFromRequest = getRequest(draft.mileageFromRequestId);
    const mileageToRequest = getRequest(draft.mileageToRequestId || item.id) || item;
    const estimatedMiles = draft.estimatedMiles;
    const approvedMiles = draft.approvedMiles || estimatedMiles;

    setSaveState((prev) => ({ ...prev, [item.id]: "saving" }));
    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      if (!token) throw new Error("Admin login expired. Please sign in again.");
      const payload = {
        requestId: item.id,
        createHelperLink: Boolean(options.createHelperLink),
        approveForPayroll: Boolean(options.approveForPayroll),
        assignedHelperId: draft.assignedHelperId,
        assignedHelperName: helper ? getHelperName(helper) : getString(item.assignedHelperName),
        assignedHelperEmail: helper ? getString(helper.email) : getString(item.assignedHelperEmail),
        assignedHelperPhone: helper ? getString(helper.phone) : getString(item.assignedHelperPhone),
        assignedHelperSource: helper ? getString(helper.sourceCollection) : getString(item.assignedHelperSource),
        assignedHelperApplicationId: helper ? getString(helper.sourceDocId) : getString(item.assignedHelperApplicationId),
        assignedHelperType: helper ? getHelperRosterType(helper) : getString(item.assignedHelperType),
        scheduledDate: draft.scheduledDate,
        scheduledStartTime: draft.scheduledStartTime,
        scheduledEndTime: draft.scheduledEndTime,
        expectedHours: draft.expectedHours,
        hourlyRate: draft.helperHourlyRate,
        mileageRate: draft.mileageRate,
        mileageFromRequestId: draft.mileageFromRequestId,
        mileageFromLabel: mileageFromRequest ? requestOptionLabel(mileageFromRequest) : "",
        mileageFromAddress: mileageFromRequest ? getAddress(mileageFromRequest) : "",
        mileageToRequestId: draft.mileageToRequestId || item.id,
        mileageToLabel: requestOptionLabel(mileageToRequest),
        mileageToAddress: getAddress(mileageToRequest),
        estimatedMiles,
        estimatedDurationMinutes: draft.estimatedDurationMinutes,
        mileageEstimateSource: draft.mileageEstimateSource,
        assignmentNotes: draft.assignmentNotes,
        approvedHours: draft.approvedHours,
        approvedMiles,
        approvedExpenseReimbursement: draft.approvedExpenseReimbursement,
        payrollStatus: options.approveForPayroll ? "Approved for payroll" : draft.payrollStatus,
      };
      const response = await fetch("/api/admin/update-helper-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to save helper ops.");
      setSaveState((prev) => ({ ...prev, [item.id]: "saved" }));
      if (options.createHelperLink && result.helperEntryUrl) {
        await navigator.clipboard?.writeText(result.helperEntryUrl).catch(() => undefined);
        alert("Helper entry link copied. You can text/email it to the helper.");
      }
      setTimeout(() => setSaveState((prev) => ({ ...prev, [item.id]: "idle" })), 1800);
    } catch (error) {
      console.error(error);
      setSaveState((prev) => ({ ...prev, [item.id]: "error" }));
      alert(error instanceof Error ? error.message : "Unable to save helper ops.");
    }
  }

  function exportPayrollSummary() {
    const rows = approvedForPayroll.map((item) => {
      const cost = payrollCost(item);
      const miles = toNumber(item.helperOpsApprovedMiles || item.helperOpsEstimatedMiles);
      return {
        Employee: getString(item.assignedHelperName),
        "Employee email": getString(item.assignedHelperEmail),
        "Helper type": getString(item.assignedHelperType),
        "Work date": getString(item.helperOpsScheduledDate || item.scheduledDate || item.preferredDate),
        Customer: getName(item),
        Service: getServiceLabel(item),
        "Customer city/ZIP": getCityZip(item),
        "Regular hours": toNumber(item.helperOpsApprovedHours || item.helperReportedHours).toFixed(2),
        "Hourly rate": toNumber(item.helperOpsHourlyRate).toFixed(2),
        "Labor amount": cost.labor.toFixed(2),
        "Reimbursable miles": miles.toFixed(2),
        "Mileage rate": toNumber(item.helperOpsMileageRate || DEFAULT_MILEAGE_RATE).toFixed(3),
        "Mileage reimbursement": cost.mileage.toFixed(2),
        "Mileage basis": "Admin site-to-site estimate",
        "Expense reimbursement": cost.expenses.toFixed(2),
        "Total payroll/reimbursements": cost.total.toFixed(2),
        "Payroll status": getString(item.helperOpsPayrollStatus),
        Notes: getString(item.helperOpsPayrollNotes || item.helperWorkLogNotes || item.helperOpsAssignmentNotes),
      };
    });
    downloadCsv("nesthelper-quickbooks-payroll-summary.csv", rows);
  }

  function exportQuickBooksTimeRows() {
    const rows = approvedForPayroll.map((item) => ({
      Employee: getString(item.assignedHelperName),
      Date: getString(item.helperOpsScheduledDate || item.scheduledDate || item.preferredDate),
      Customer: getName(item),
      Project: `${getServiceLabel(item)} - ${getCityZip(item)}`,
      "Service item": "NestHelper service labor",
      Hours: toNumber(item.helperOpsApprovedHours || item.helperReportedHours).toFixed(2),
      Billable: "No",
      Notes: getString(item.helperWorkLogNotes || item.helperOpsAssignmentNotes),
    }));
    downloadCsv("nesthelper-quickbooks-time-rows.csv", rows);
  }

  function exportMileageReimbursements() {
    const rows = approvedForPayroll.map((item) => {
      const miles = toNumber(item.helperOpsApprovedMiles || item.helperOpsEstimatedMiles);
      const rate = toNumber(item.helperOpsMileageRate || DEFAULT_MILEAGE_RATE);
      return {
        Employee: getString(item.assignedHelperName),
        Date: getString(item.helperOpsScheduledDate || item.scheduledDate || item.preferredDate),
        Customer: getName(item),
        Service: getServiceLabel(item),
        "From request/location": getString(item.helperOpsMileageFromLabel),
        "To request/location": getString(item.helperOpsMileageToLabel),
        "Estimated site-to-site miles": toNumber(item.helperOpsEstimatedMiles).toFixed(2),
        "Approved miles": miles.toFixed(2),
        "Mileage rate": rate.toFixed(3),
        "Reimbursement amount": (miles * rate).toFixed(2),
        "Estimate source": getString(item.helperOpsMileageEstimateSource),
        "Estimated drive minutes": toNumber(item.helperOpsEstimatedDurationMinutes).toFixed(0),
        Notes: getString(item.helperWorkLogNotes || item.helperOpsAssignmentNotes),
      };
    });
    downloadCsv("nesthelper-mileage-reimbursements.csv", rows);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-[#075c58] to-[#0b7b73] p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f1c96b]">Helper Operations</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Hours, site-to-site mileage, payroll prep</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/85 sm:text-base">
          Assign only approved helpers/partners, send a simple self-entry link, calculate estimated job-to-job mileage from saved request addresses, approve records, then export clean QuickBooks-friendly CSVs.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[#eadfc8] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Approved helpers</p>
          <p className="mt-2 text-3xl font-bold text-[#075c58]">{approvedHelpers.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[#eadfc8] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Assigned jobs</p>
          <p className="mt-2 text-3xl font-bold text-[#075c58]">{requests.filter((item) => item.assignedHelperId).length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[#eadfc8] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Needs review</p>
          <p className="mt-2 text-3xl font-bold text-[#075c58]">{pendingReview.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[#eadfc8] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Approved payroll</p>
          <p className="mt-2 text-3xl font-bold text-[#075c58]">{formatMoney(estimatedPayroll)}</p>
        </div>
      </div>

      <details className="rounded-[1.5rem] border border-[#eadfc8] bg-white p-4 shadow-sm" open>
        <summary className="cursor-pointer text-sm font-bold text-[#075c58]">QuickBooks exports</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button onClick={exportPayrollSummary} className="rounded-full bg-[#075c58] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:scale-[1.01]">
            Payroll summary CSV
          </button>
          <button onClick={exportQuickBooksTimeRows} className="rounded-full border border-[#075c58]/25 bg-white px-4 py-3 text-sm font-bold text-[#075c58] transition hover:bg-[#e9f4f1]">
            Time rows CSV
          </button>
          <button onClick={exportMileageReimbursements} className="rounded-full border border-[#075c58]/25 bg-white px-4 py-3 text-sm font-bold text-[#075c58] transition hover:bg-[#e9f4f1]">
            Mileage reimbursement CSV
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Mileage export uses the admin-approved site-to-site estimate, not helper-entered miles. QuickBooks remains your official payroll/tax system; NestHelper keeps job context, approval, and backup records.
        </p>
      </details>

      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <p className="font-bold">Mileage policy built into this dashboard</p>
        <p className="mt-1">Normal home-to-first-job and last-job-to-home commuting is excluded. Reimbursable mileage is based on admin-approved site-to-site business travel between customer jobs, supply pickups, errands, or other required work stops.</p>
      </div>

      <div className="rounded-[1.5rem] border border-[#d7ebe7] bg-[#f5fbf9] p-4 text-sm leading-relaxed text-slate-700">
        <p className="font-bold text-[#075c58]">Approved roster rule</p>
        <p className="mt-1">Helper Ops only lists applications marked as Approved Helper, Approved Partner, Trial Job Approved, Backup List, or Backup Partner. New, reviewing, rejected, inactive, and archived applicants stay out of assignment dropdowns.</p>
      </div>

      <div className="grid gap-3 rounded-[1.5rem] border border-[#eadfc8] bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_220px]">
        <input
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          placeholder="Search customer, helper, service, city..."
          className="rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#075c58]">
          {['Active', 'Assigned', 'Submitted', 'Approved for payroll', 'All'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={helperFilter} onChange={(event) => setHelperFilter(event.target.value)} className="rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#075c58]">
          <option value="All">All helpers</option>
          {approvedHelpers.map((helper) => <option key={helper.id} value={helper.id}>{getHelperName(helper)}</option>)}
        </select>
      </div>

      {approvedHelpers.length === 0 && (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No approved helpers or partners yet. Mark an application as Approved Helper, Approved Partner, Trial Job Approved, Backup List, or Backup Partner first, then return here to assign them to requests.
        </div>
      )}

      <div className="space-y-4">
        {filteredRequests.map((item) => {
          const draft = drafts[item.id] || draftFromRecord(item);
          const state = saveState[item.id] || "idle";
          const estimate = estimateState[item.id] || "idle";
          const cost = payrollCost(item);
          const helperEntryUrl = getString(item.helperOpsEntryUrl);
          const reportedAt = item.helperWorkLogSubmittedAt;
          const fromRequest = getRequest(draft.mileageFromRequestId);
          const toRequest = getRequest(draft.mileageToRequestId || item.id) || item;
          const routeMapsUrl = googleMapsDirectionsUrl(fromRequest ? getAddress(fromRequest) : "", getAddress(toRequest));
          const helperMatches = sortedHelpersForRequest(item, approvedHelpers);
          const suggestions = requests
            .filter((candidate) => candidate.id !== item.id && isActiveRequest(candidate) && getAddress(candidate) && locationScore(item, candidate) > 0)
            .sort((a, b) => locationScore(item, b) - locationScore(item, a))
            .slice(0, 4);
          return (
            <article key={item.id} className="rounded-[2rem] border border-[#eadfc8] bg-white p-4 shadow-lg shadow-[#075c58]/5 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#e9f4f1] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#075c58]">{getServiceLabel(item)}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{getString(item.status) || 'No status'}</span>
                    {reportedAt && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Helper submitted</span>}
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-[#075c58]">{getName(item)}</h3>
                  <p className="text-sm text-slate-600">{getAddress(item) || getCityZip(item)}</p>
                  <p className="mt-1 text-xs text-slate-500">Preferred/scheduled: {formatDate(item.helperOpsScheduledDate || item.scheduledDate || item.preferredDate)}</p>
                </div>
                <div className="grid gap-2 text-left text-sm sm:grid-cols-3 lg:min-w-[360px]">
                  <div className="rounded-2xl bg-[#fbf6ea] p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Reported hours</p>
                    <p className="mt-1 font-bold text-slate-900">{toNumber(item.helperReportedHours).toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fbf6ea] p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Approved miles</p>
                    <p className="mt-1 font-bold text-slate-900">{mileageLabel(item)}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fbf6ea] p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Approved cost</p>
                    <p className="mt-1 font-bold text-slate-900">{formatMoney(cost.total)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <label className="block lg:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Assigned helper</span>
                  <select value={draft.assignedHelperId} onChange={(event) => updateDraft(item.id, "assignedHelperId", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]">
                    <option value="">Unassigned</option>
                    {draft.assignedHelperId && !helperMatches.some((helper) => helper.id === draft.assignedHelperId) && (
                      <option value={draft.assignedHelperId}>{getString(item.assignedHelperName) || "Previously assigned helper"} — not in approved roster</option>
                    )}
                    {helperMatches.map((helper) => <option key={helper.id} value={helper.id}>{helperOptionLabel(item, helper)}</option>)}
                  </select>
                  <span className="mt-1 block text-xs text-slate-500">Only approved/back-up helpers and partners appear here. Best matches are sorted from application profile: services, city/service area, availability, and transportation.</span>
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Work date</span>
                  <input type="date" value={draft.scheduledDate} onChange={(event) => updateDraft(item.id, "scheduledDate", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Payroll status</span>
                  <select value={draft.payrollStatus} onChange={(event) => updateDraft(item.id, "payrollStatus", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]">
                    {PAYROLL_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </div>

              {suggestions.length > 0 && (
                <details className="mt-4 rounded-[1.5rem] border border-[#d7ebe7] bg-[#f5fbf9] p-4">
                  <summary className="cursor-pointer text-sm font-bold text-[#075c58]">Route-fit suggestions near this request</summary>
                  <div className="mt-3 grid gap-2">
                    {suggestions.map((candidate) => (
                      <div key={candidate.id} className="rounded-2xl bg-white p-3 text-sm text-slate-700 shadow-sm">
                        <p className="font-bold text-[#075c58]">{requestOptionLabel(candidate)}</p>
                        <p className="mt-1 text-xs text-slate-500">Match: {getString(candidate.serviceZip || candidate.zip) === getString(item.serviceZip || item.zip) ? "same ZIP" : getString(candidate.serviceCity || candidate.city).toLowerCase() === getString(item.serviceCity || item.city).toLowerCase() ? "same city" : "same date/helper area"}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => updateDraft(item.id, "mileageFromRequestId", candidate.id)} className="rounded-full border border-[#075c58]/25 px-3 py-2 text-xs font-bold text-[#075c58]">Use as mileage from</button>
                          <button type="button" onClick={() => updateDraft(item.id, "mileageToRequestId", candidate.id)} className="rounded-full border border-[#075c58]/25 px-3 py-2 text-xs font-bold text-[#075c58]">Use as mileage to</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <details className="mt-4 rounded-[1.5rem] border border-[#eadfc8] bg-[#fffdf8] p-4">
                <summary className="cursor-pointer text-sm font-bold text-[#075c58]">Schedule, site-to-site mileage, and approval details</summary>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Start time</span>
                    <input type="time" value={draft.scheduledStartTime} onChange={(event) => updateDraft(item.id, "scheduledStartTime", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">End time</span>
                    <input type="time" value={draft.scheduledEndTime} onChange={(event) => updateDraft(item.id, "scheduledEndTime", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Expected hours</span>
                    <input inputMode="decimal" value={draft.expectedHours} onChange={(event) => updateDraft(item.id, "expectedHours", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Helper hourly rate</span>
                    <input inputMode="decimal" value={draft.helperHourlyRate} onChange={(event) => updateDraft(item.id, "helperHourlyRate", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                </div>

                <div className="mt-4 rounded-[1.25rem] bg-white p-4">
                  <p className="font-bold text-[#075c58]">Mileage estimate from saved request addresses</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Use this when a helper goes from one assigned NestHelper job/site to another. Do not include normal commuting.</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">From request/site</span>
                      <select value={draft.mileageFromRequestId} onChange={(event) => updateDraft(item.id, "mileageFromRequestId", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]">
                        <option value="">No reimbursable mileage / commute only</option>
                        {requestChoices.map((choice) => <option key={choice.id} value={choice.id}>{requestOptionLabel(choice)}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">To request/site</span>
                      <select value={draft.mileageToRequestId || item.id} onChange={(event) => updateDraft(item.id, "mileageToRequestId", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]">
                        {requestChoices.map((choice) => <option key={choice.id} value={choice.id}>{requestOptionLabel(choice)}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Estimated miles</span>
                      <input inputMode="decimal" value={draft.estimatedMiles} onChange={(event) => {
                        updateDraft(item.id, "estimatedMiles", event.target.value);
                        updateDraft(item.id, "approvedMiles", event.target.value);
                      }} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Approved miles</span>
                      <input inputMode="decimal" value={draft.approvedMiles || draft.estimatedMiles} onChange={(event) => updateDraft(item.id, "approvedMiles", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                      <span className="mt-1 block text-xs text-slate-500">Normally same as estimate.</span>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Mileage rate</span>
                      <input inputMode="decimal" value={draft.mileageRate} onChange={(event) => updateDraft(item.id, "mileageRate", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Drive minutes</span>
                      <input inputMode="decimal" value={draft.estimatedDurationMinutes} onChange={(event) => updateDraft(item.id, "estimatedDurationMinutes", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button type="button" onClick={() => calculateEstimatedMiles(item)} className="rounded-full bg-[#075c58] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:scale-[1.01]">
                      {estimate === "calculating" ? "Calculating..." : estimate === "done" ? "Calculated" : "Calculate site-to-site miles"}
                    </button>
                    <button type="button" onClick={() => {
                      updateDraft(item.id, "mileageFromRequestId", "");
                      updateDraft(item.id, "estimatedMiles", "0");
                      updateDraft(item.id, "approvedMiles", "0");
                      updateDraft(item.id, "mileageEstimateSource", "No reimbursable mileage");
                    }} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                      No mileage reimbursement
                    </button>
                    {routeMapsUrl && (
                      <Link href={routeMapsUrl} target="_blank" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                        Open route in Maps
                      </Link>
                    )}
                    {estimate === "error" && <span className="self-center text-sm font-semibold text-rose-700">Mileage calculation failed</span>}
                  </div>
                  {draft.mileageEstimateSource && <p className="mt-2 text-xs text-slate-500">Estimate source: {draft.mileageEstimateSource}</p>}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Approved hours</span>
                    <input inputMode="decimal" value={draft.approvedHours} onChange={(event) => updateDraft(item.id, "approvedHours", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block lg:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Approved expenses/receipts</span>
                    <input inputMode="decimal" value={draft.approvedExpenseReimbursement} onChange={(event) => updateDraft(item.id, "approvedExpenseReimbursement", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block lg:col-span-1">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Assignment/admin notes</span>
                    <input value={draft.assignmentNotes} onChange={(event) => updateDraft(item.id, "assignmentNotes", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                </div>

                {item.helperWorkLogSubmittedAt && (
                  <div className="mt-4 rounded-[1.25rem] bg-white p-4 text-sm text-slate-700">
                    <p className="font-bold text-[#075c58]">Helper submission</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <p><strong>Submitted:</strong> {formatDateTime(item.helperWorkLogSubmittedAt)}</p>
                      <p><strong>Start/end:</strong> {getString(item.helperActualStartTime) || '—'}–{getString(item.helperActualEndTime) || '—'}</p>
                      <p><strong>Break:</strong> {toNumber(item.helperBreakMinutes)} min</p>
                      <p><strong>Hours:</strong> {toNumber(item.helperReportedHours).toFixed(2)}</p>
                      <p><strong>Expenses:</strong> {formatMoney(item.helperReportedExpenses)}</p>
                      <p className="sm:col-span-2 lg:col-span-4"><strong>Notes:</strong> {getString(item.helperWorkLogNotes) || '—'}</p>
                    </div>
                  </div>
                )}
              </details>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button onClick={() => saveHelperOps(item)} className="rounded-full bg-[#075c58] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:scale-[1.01]">
                  {state === "saving" ? "Saving..." : state === "saved" ? "Saved" : "Save ops"}
                </button>
                <button onClick={() => saveHelperOps(item, { createHelperLink: true })} className="rounded-full border border-[#075c58]/25 bg-white px-5 py-3 text-sm font-bold text-[#075c58] transition hover:bg-[#e9f4f1]">
                  Create/copy helper entry link
                </button>
                <button onClick={() => saveHelperOps(item, { approveForPayroll: true })} className="rounded-full border border-emerald-600 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100">
                  Approve for payroll
                </button>
                {helperEntryUrl && (
                  <Link href={helperEntryUrl} target="_blank" className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                    Open helper link
                  </Link>
                )}
                {state === "error" && <span className="self-center text-sm font-semibold text-rose-700">Save failed</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
