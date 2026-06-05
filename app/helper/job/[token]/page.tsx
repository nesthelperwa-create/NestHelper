"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type HelperJob = {
  customerName?: string;
  serviceLabel?: string;
  address?: string;
  cityZip?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  expectedHours?: number;
  estimatedMiles?: number;
  mileagePolicy?: string;
  mileageFromLabel?: string;
  mileageToLabel?: string;
  assignmentNotes?: string;
  assignedHelperName?: string;
  submittedAt?: unknown;
  actualStartTime?: string;
  actualEndTime?: string;
  breakMinutes?: number;
  reportedExpenses?: number;
  notes?: string;
};

function toNumber(value: unknown) {
  const next = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(next) ? next : 0;
}

function calculateHours(start: string, end: string, breakMinutes: string) {
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return "";
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute) - toNumber(breakMinutes);
  if (minutes < 0) minutes += 24 * 60;
  return Math.max(0, minutes / 60).toFixed(2);
}

export default function HelperJobLogPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";
  const [job, setJob] = useState<HelperJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    actualStartTime: "",
    actualEndTime: "",
    breakMinutes: "0",
    reportedHours: "",
    reportedExpenses: "0",
    notes: "",
  });

  useEffect(() => {
    let active = true;
    async function loadJob() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/helper/job-log?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const result = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to load this job link.");
        const nextJob = result.job as HelperJob;
        setJob(nextJob);
        setForm({
          actualStartTime: nextJob.actualStartTime || nextJob.scheduledStartTime || "",
          actualEndTime: nextJob.actualEndTime || nextJob.scheduledEndTime || "",
          breakMinutes: String(nextJob.breakMinutes ?? 0),
          reportedHours: nextJob.actualStartTime && nextJob.actualEndTime ? calculateHours(nextJob.actualStartTime, nextJob.actualEndTime, String(nextJob.breakMinutes ?? 0)) : "",
          reportedExpenses: nextJob.reportedExpenses ? String(nextJob.reportedExpenses) : "0",
          notes: nextJob.notes || "",
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load this job link.");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (token) loadJob();
    return () => {
      active = false;
    };
  }, [token]);

  const calculatedHours = useMemo(() => calculateHours(form.actualStartTime, form.actualEndTime, form.breakMinutes), [form.actualStartTime, form.actualEndTime, form.breakMinutes]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitLog(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/helper/job-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, token, reportedHours: form.reportedHours || calculatedHours }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to submit your job log.");
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit your job log.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-[#fbf6ea] p-6 text-[#075c58]">Loading NestHelper job...</main>;
  }

  if (error && !job) {
    return (
      <main className="min-h-screen bg-[#fbf6ea] px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-rose-200 bg-white p-6 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-600">Link issue</p>
          <h1 className="mt-2 text-2xl font-bold text-[#075c58]">We could not open this helper job link.</h1>
          <p className="mt-3 text-slate-600">{error}</p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#fbf6ea] px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[#eadfc8] bg-white p-6 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Submitted</p>
          <h1 className="mt-2 text-3xl font-bold text-[#075c58]">Thanks — your job log was sent.</h1>
          <p className="mt-3 text-slate-600">NestHelper will review hours and approved expenses before payroll. Mileage is handled by NestHelper using the admin site-to-site estimate.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf6ea] px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-5">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#075c58] to-[#0b7b73] p-6 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f1c96b]">NestHelper helper log</p>
          <h1 className="mt-2 text-3xl font-bold">Submit job hours</h1>
          <p className="mt-3 text-sm text-white/85">Enter actual work time, breaks, approved expenses, and job notes. NestHelper calculates reimbursable site-to-site mileage in admin before payroll.</p>
        </section>

        {job && (
          <section className="rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-lg shadow-[#075c58]/5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Assigned job</p>
            <h2 className="mt-2 text-2xl font-bold text-[#075c58]">{job.serviceLabel}</h2>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p><strong>Helper:</strong> {job.assignedHelperName || "Assigned helper"}</p>
              <p><strong>Customer:</strong> {job.customerName || "Customer"}</p>
              <p><strong>Date/time:</strong> {job.scheduledDate || "—"} {job.scheduledStartTime ? `• ${job.scheduledStartTime}` : ""}{job.scheduledEndTime ? `–${job.scheduledEndTime}` : ""}</p>
              <p><strong>Address:</strong> {job.address || job.cityZip || "See admin instructions"}</p>
              <p><strong>Expected hours:</strong> {job.expectedHours ? job.expectedHours.toFixed(2) : "—"}</p>
              <p><strong>Reimbursable mileage:</strong> {job.estimatedMiles ? `${job.estimatedMiles.toFixed(2)} miles estimated by NestHelper` : "None / admin will review"}</p>
              {job.mileageFromLabel && job.mileageToLabel && <p><strong>Mileage route:</strong> {job.mileageFromLabel} → {job.mileageToLabel}</p>}
              <p className="rounded-2xl bg-[#fbf6ea] p-3 text-xs leading-relaxed text-slate-600"><strong>Mileage policy:</strong> Normal home-to-first-job and last-job-to-home commuting is not reimbursable unless NestHelper approves an exception. NestHelper calculates approved site-to-site mileage in admin.</p>
              {job.assignmentNotes && <p><strong>Notes:</strong> {job.assignmentNotes}</p>}
            </div>
          </section>
        )}

        <form onSubmit={submitLog} className="rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-lg shadow-[#075c58]/5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Actual start time</span>
              <input required type="time" value={form.actualStartTime} onChange={(event) => updateField("actualStartTime", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Actual end time</span>
              <input required type="time" value={form.actualEndTime} onChange={(event) => updateField("actualEndTime", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Unpaid break minutes</span>
              <input inputMode="numeric" value={form.breakMinutes} onChange={(event) => updateField("breakMinutes", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Paid hours</span>
              <input inputMode="decimal" value={form.reportedHours || calculatedHours} onChange={(event) => updateField("reportedHours", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" />
              <span className="mt-1 block text-xs text-slate-500">Auto-calculated from start/end unless you adjust it.</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-700">Approved expenses</span>
              <input inputMode="decimal" value={form.reportedExpenses} onChange={(event) => updateField("reportedExpenses", event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" />
              <span className="mt-1 block text-xs text-slate-500">Parking, tolls, or pre-approved supplies only. Mileage is calculated separately by NestHelper.</span>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-bold text-slate-700">Job notes</span>
            <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={4} placeholder="Anything NestHelper should know before payroll/customer follow-up?" className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" />
          </label>

          <div className="mt-4 rounded-2xl bg-[#fbf6ea] p-4 text-sm text-slate-700">
            <p className="font-bold text-[#075c58]">Mileage handled by NestHelper</p>
            <p className="mt-1">You do not need to enter miles here. NestHelper pays approved reimbursable mileage from the admin site-to-site estimate, usually only when traveling between assigned job locations or other approved work stops.</p>
          </div>

          {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

          <button disabled={saving} className="mt-5 w-full rounded-full bg-[#075c58] px-5 py-3 font-bold text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01] disabled:opacity-60">
            {saving ? "Submitting..." : "Submit job log"}
          </button>
        </form>
      </div>
    </main>
  );
}
