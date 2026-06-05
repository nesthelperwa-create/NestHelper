"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";

type AdminRecord = { id: string; [key: string]: any };
type HelperRecord = { id: string; [key: string]: any };
type SaveState = Record<string, "idle" | "saving" | "saved" | "error">;

type HelperOpsDraft = {
  assignedHelperId: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  expectedHours: string;
  helperHourlyRate: string;
  mileageRate: string;
  estimatedMiles: string;
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

function getHelperName(helper: HelperRecord) {
  return getString(helper.fullName) || getString(helper.name) || getString(helper.businessName) || "Unnamed helper";
}

function getHelperServices(helper: HelperRecord) {
  const raw = helper.services || helper.bestFitServices || helper.serviceType || helper.preferredWork;
  return Array.isArray(raw) ? raw.filter(Boolean).join(", ") : getString(raw) || "—";
}

function isActiveRequest(item: AdminRecord) {
  const status = getString(item.status).toLowerCase();
  return !["canceled", "cancelled", "declined", "archived"].includes(status);
}

function isApprovedHelper(item: HelperRecord) {
  const status = getString(item.status).toLowerCase();
  return status.includes("approved") || status.includes("backup");
}

function draftFromRecord(item: AdminRecord): HelperOpsDraft {
  return {
    assignedHelperId: getString(item.assignedHelperId),
    scheduledDate: getString(item.helperOpsScheduledDate || item.scheduledDate || item.preferredDate),
    scheduledStartTime: getString(item.helperOpsScheduledStartTime),
    scheduledEndTime: getString(item.helperOpsScheduledEndTime),
    expectedHours: String(item.helperOpsExpectedHours ?? ""),
    helperHourlyRate: String(item.helperOpsHourlyRate ?? ""),
    mileageRate: String(item.helperOpsMileageRate ?? DEFAULT_MILEAGE_RATE),
    estimatedMiles: String(item.helperOpsEstimatedMiles ?? ""),
    assignmentNotes: getString(item.helperOpsAssignmentNotes),
    approvedHours: String(item.helperOpsApprovedHours ?? item.helperReportedHours ?? ""),
    approvedMiles: String(item.helperOpsApprovedMiles ?? item.helperReportedMiles ?? ""),
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
  const miles = toNumber(item.helperOpsApprovedMiles || item.helperReportedMiles);
  const mileageRate = toNumber(item.helperOpsMileageRate || DEFAULT_MILEAGE_RATE);
  const expenses = toNumber(item.helperOpsApprovedExpenseReimbursement || item.helperReportedExpenses);
  return {
    labor: hours * hourly,
    mileage: miles * mileageRate,
    expenses,
    total: hours * hourly + miles * mileageRate + expenses,
  };
}

function varianceLabel(item: AdminRecord) {
  const estimated = toNumber(item.helperOpsEstimatedMiles);
  const reported = toNumber(item.helperReportedMiles);
  if (!estimated || !reported) return "—";
  const variance = reported - estimated;
  const percent = estimated ? (variance / estimated) * 100 : 0;
  if (variance <= 2 && percent <= 20) return `OK (${variance >= 0 ? "+" : ""}${variance.toFixed(1)} mi)`;
  return `Review (${variance >= 0 ? "+" : ""}${variance.toFixed(1)} mi / ${percent.toFixed(0)}%)`;
}

function googleMapsDirectionsUrl(item: AdminRecord) {
  const destination = getAddress(item);
  if (!destination) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export default function HelperOpsDashboard() {
  const [requests, setRequests] = useState<AdminRecord[]>([]);
  const [helpers, setHelpers] = useState<HelperRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, HelperOpsDraft>>({});
  const [saveState, setSaveState] = useState<SaveState>({});
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
    const unsubHelpers = onSnapshot(query(collection(firestoreDb, "helperApplications"), orderBy("createdAt", "desc")), (snap) => {
      setHelpers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubRequests();
      unsubHelpers();
    };
  }, []);

  const approvedHelpers = useMemo(() => helpers.filter(isApprovedHelper), [helpers]);

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

  async function saveHelperOps(item: AdminRecord, options: { createHelperLink?: boolean; approveForPayroll?: boolean } = {}) {
    const draft = drafts[item.id] || draftFromRecord(item);
    const helper = approvedHelpers.find((entry) => entry.id === draft.assignedHelperId);
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
        scheduledDate: draft.scheduledDate,
        scheduledStartTime: draft.scheduledStartTime,
        scheduledEndTime: draft.scheduledEndTime,
        expectedHours: draft.expectedHours,
        hourlyRate: draft.helperHourlyRate,
        mileageRate: draft.mileageRate,
        estimatedMiles: draft.estimatedMiles,
        assignmentNotes: draft.assignmentNotes,
        approvedHours: draft.approvedHours,
        approvedMiles: draft.approvedMiles,
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
      return {
        Employee: getString(item.assignedHelperName),
        "Employee email": getString(item.assignedHelperEmail),
        "Work date": getString(item.helperOpsScheduledDate || item.scheduledDate || item.preferredDate),
        Customer: getName(item),
        Service: getServiceLabel(item),
        "Customer city/ZIP": getCityZip(item),
        "Regular hours": toNumber(item.helperOpsApprovedHours || item.helperReportedHours).toFixed(2),
        "Hourly rate": toNumber(item.helperOpsHourlyRate).toFixed(2),
        "Labor amount": cost.labor.toFixed(2),
        "Mileage miles": toNumber(item.helperOpsApprovedMiles || item.helperReportedMiles).toFixed(2),
        "Mileage rate": toNumber(item.helperOpsMileageRate || DEFAULT_MILEAGE_RATE).toFixed(3),
        "Mileage reimbursement": cost.mileage.toFixed(2),
        "Expense reimbursement": cost.expenses.toFixed(2),
        "Total payroll/reimbursements": cost.total.toFixed(2),
        "Payroll status": getString(item.helperOpsPayrollStatus),
        Notes: getString(item.helperOpsPayrollNotes || item.helperMileagePurpose || item.helperWorkLogNotes),
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
      const miles = toNumber(item.helperOpsApprovedMiles || item.helperReportedMiles);
      const rate = toNumber(item.helperOpsMileageRate || DEFAULT_MILEAGE_RATE);
      return {
        Employee: getString(item.assignedHelperName),
        Date: getString(item.helperOpsScheduledDate || item.scheduledDate || item.preferredDate),
        Customer: getName(item),
        Service: getServiceLabel(item),
        "Estimated miles": toNumber(item.helperOpsEstimatedMiles).toFixed(2),
        "Reported miles": toNumber(item.helperReportedMiles).toFixed(2),
        "Approved miles": miles.toFixed(2),
        "Mileage rate": rate.toFixed(3),
        "Reimbursement amount": (miles * rate).toFixed(2),
        "Variance check": varianceLabel(item),
        Purpose: getString(item.helperMileagePurpose),
        Notes: getString(item.helperWorkLogNotes),
      };
    });
    downloadCsv("nesthelper-mileage-reimbursements.csv", rows);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-[#075c58] to-[#0b7b73] p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f1c96b]">Helper Operations</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Hours, mileage, payroll prep</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/85 sm:text-base">
          Assign helpers, send a simple self-entry link, compare reported mileage against your estimate, approve records, then export clean QuickBooks-friendly CSVs.
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
          Use these as review/import sheets for QuickBooks Payroll or QuickBooks Time. QuickBooks remains your official payroll/tax system; NestHelper keeps the job context, approval, mileage check, and backup record.
        </p>
      </details>

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
          No approved helpers yet. Approve a helper application first, then return here to assign them to requests.
        </div>
      )}

      <div className="space-y-4">
        {filteredRequests.map((item) => {
          const draft = drafts[item.id] || draftFromRecord(item);
          const state = saveState[item.id] || "idle";
          const mapsUrl = googleMapsDirectionsUrl(item);
          const cost = payrollCost(item);
          const helperEntryUrl = getString(item.helperOpsEntryUrl);
          const reportedAt = item.helperWorkLogSubmittedAt;
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
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mileage check</p>
                    <p className={`mt-1 font-bold ${varianceLabel(item).startsWith('Review') ? 'text-rose-700' : 'text-slate-900'}`}>{varianceLabel(item)}</p>
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
                    {approvedHelpers.map((helper) => <option key={helper.id} value={helper.id}>{getHelperName(helper)} — {getHelperServices(helper)}</option>)}
                  </select>
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

              <details className="mt-4 rounded-[1.5rem] border border-[#eadfc8] bg-[#fffdf8] p-4">
                <summary className="cursor-pointer text-sm font-bold text-[#075c58]">Schedule, estimate, and approval details</summary>
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
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Estimated reimbursable miles</span>
                    <input inputMode="decimal" value={draft.estimatedMiles} onChange={(event) => updateDraft(item.id, "estimatedMiles", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Mileage rate</span>
                    <input inputMode="decimal" value={draft.mileageRate} onChange={(event) => updateDraft(item.id, "mileageRate", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Approved hours</span>
                    <input inputMode="decimal" value={draft.approvedHours} onChange={(event) => updateDraft(item.id, "approvedHours", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Approved miles</span>
                    <input inputMode="decimal" value={draft.approvedMiles} onChange={(event) => updateDraft(item.id, "approvedMiles", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block lg:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Approved expenses/receipts</span>
                    <input inputMode="decimal" value={draft.approvedExpenseReimbursement} onChange={(event) => updateDraft(item.id, "approvedExpenseReimbursement", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="block lg:col-span-2">
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
                      <p><strong>Miles:</strong> {toNumber(item.helperReportedMiles).toFixed(2)}</p>
                      <p><strong>Expenses:</strong> {formatMoney(item.helperReportedExpenses)}</p>
                      <p className="sm:col-span-2"><strong>Mileage purpose:</strong> {getString(item.helperMileagePurpose) || '—'}</p>
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
                {mapsUrl && (
                  <Link href={mapsUrl} target="_blank" className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                    Estimate in Maps
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
