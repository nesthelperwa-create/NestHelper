"use client";

import { useEffect, useMemo, useState } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";
import StatusBadge from "./StatusBadge";

type AdminDoc = { id: string; status?: string; email?: string; fullName?: string; name?: string; [key: string]: any };

type ReviewRequestPanelProps = {
  selected: AdminDoc;
  onRecordUpdate: (updates: Record<string, unknown>) => void;
};

const defaultReviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "";

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFirstName(item: AdminDoc) {
  const raw = getString(item.fullName) || getString(item.name) || "there";
  if (raw.toLowerCase() === "there") return "there";
  return raw.split(/\s+/).filter(Boolean)[0] || "there";
}

function formatDate(value: unknown) {
  if (!value) return "—";
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "—";
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function buildDefaultMessage(firstName: string, reviewUrl: string) {
  return `Hi ${firstName},

Thank you for trusting NestHelper with your family reset. If the visit helped your home feel calmer or made your week a little lighter, would you mind leaving a quick Google review?

Your honest feedback helps other local families know what to expect from NestHelper.

${reviewUrl || "[Paste Google review link here]"}

Thank you,
Leo & Gen
NestHelper`;
}

function getActionClass(kind: "primary" | "secondary" | "quiet" = "secondary") {
  const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-55";
  if (kind === "primary") return `${base} bg-[#075c58] text-white hover:-translate-y-0.5 hover:bg-[#064b48]`;
  if (kind === "quiet") return `${base} border border-[#eadfc8] bg-white text-slate-700 hover:bg-[#fbf6ea]`;
  return `${base} border border-[#075c58]/20 bg-white text-[#075c58] hover:bg-[#eef8f6]`;
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;
}

export default function ReviewRequestPanel({ selected, onRecordUpdate }: ReviewRequestPanelProps) {
  const firstName = useMemo(() => getFirstName(selected), [selected]);
  const existingReviewUrl = getString(selected.googleReviewRequestUrl) || getString(selected.reviewRequestUrl) || defaultReviewUrl;
  const [reviewUrl, setReviewUrl] = useState(existingReviewUrl);
  const [subject, setSubject] = useState(getString(selected.googleReviewRequestLastSubject) || "Thank you from NestHelper");
  const [message, setMessage] = useState(buildDefaultMessage(firstName, existingReviewUrl));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const isCompleted = String(selected.status || "").trim().toLowerCase() === "completed";
  const customerEmail = getString(selected.email);
  const sentAt = selected.googleReviewRequestSentAtIso || selected.googleReviewRequestSentAt;
  const sentCount = Number(selected.googleReviewRequestCount || 0);

  useEffect(() => {
    const nextUrl = getString(selected.googleReviewRequestUrl) || getString(selected.reviewRequestUrl) || defaultReviewUrl;
    const nextSubject = getString(selected.googleReviewRequestLastSubject) || "Thank you from NestHelper";
    setReviewUrl(nextUrl);
    setSubject(nextSubject);
    setMessage(buildDefaultMessage(getFirstName(selected), nextUrl));
    setNotice("");
    setError("");
  }, [selected.id]);

  function updateReviewUrl(value: string) {
    setReviewUrl(value);
    setMessage((current) => {
      const placeholder = "[Paste Google review link here]";
      if (current.includes(reviewUrl) && reviewUrl) return current.replaceAll(reviewUrl, value);
      if (current.includes(placeholder)) return current.replaceAll(placeholder, value || placeholder);
      return current;
    });
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message.includes(reviewUrl) || !reviewUrl ? message : `${message}\n\n${reviewUrl}`);
    setNotice("Review request message copied. You can paste it into text, email, or Messenger.");
    setError("");
  }

  async function copyLink() {
    if (!reviewUrl) return;
    await navigator.clipboard.writeText(reviewUrl);
    setNotice("Google review link copied.");
    setError("");
  }

  async function sendReviewRequest() {
    setBusy(true);
    setNotice("");
    setError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/send-review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ collection: "serviceRequests", id: selected.id, reviewUrl, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to send review request.");

      const sentAtIso = data.sentAtIso || new Date().toISOString();
      onRecordUpdate({
        googleReviewRequestStatus: "Sent",
        googleReviewRequestSentAtIso: sentAtIso,
        googleReviewRequestUrl: data.reviewUrl || reviewUrl,
        googleReviewRequestLastSubject: subject,
        googleReviewRequestLastMessagePreview: message.slice(0, 500),
        googleReviewRequestCount: sentCount + 1,
      });
      setNotice(`Review request emailed to ${data.to || customerEmail}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send review request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-5 rounded-3xl border border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50/50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Google review request</p>
          <h4 className="mt-1 text-xl font-black text-[#075c58]">Ask happy completed customers for a real review</h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Send this only after the job is complete and the customer had a genuine NestHelper experience. No discounts, gifts, or credits should be offered for reviews.
          </p>
        </div>
        <StatusBadge status={getString(selected.googleReviewRequestStatus) || (sentAt ? "Sent" : isCompleted ? "Ready" : "Complete first")} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="rounded-2xl border border-[#eadfc8] bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Review link setup</p>
          <label className="mt-3 block text-sm font-black text-[#075c58]">
            Google review link
            <input
              value={reviewUrl}
              onChange={(e) => updateReviewUrl(e.target.value)}
              placeholder="Paste the Get more reviews link from Google Business Profile"
              className="mt-2 min-h-12 w-full rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#075c58] focus:ring-4 focus:ring-[#075c58]/15"
            />
          </label>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            Best link: Google Business Profile → Read Reviews → Get more reviews → Copy. You can also save it as <span className="font-black text-[#075c58]">NEXT_PUBLIC_GOOGLE_REVIEW_URL</span> in Vercel later so this field preloads.
          </p>

          <div className="mt-4 rounded-2xl bg-[#fbf6ea] p-3 text-xs font-bold leading-5 text-slate-700">
            <p>Customer email: <span className="text-[#075c58]">{customerEmail || "No email on file"}</span></p>
            <p>Status: <span className="text-[#075c58]">{selected.status || "New"}</span></p>
            <p>Last review request: <span className="text-[#075c58]">{sentAt ? formatDate(sentAt) : "Not sent yet"}</span></p>
            {sentCount > 0 && <p>Times sent: <span className="text-[#075c58]">{sentCount}</span></p>}
          </div>

          {!isCompleted && (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">
              Mark this request Completed before emailing a review request. You can still copy the message manually if needed.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[#eadfc8] bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Message</p>
          <label className="mt-3 block text-sm font-black text-[#075c58]">
            Email subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#075c58] focus:ring-4 focus:ring-[#075c58]/15"
            />
          </label>
          <label className="mt-3 block text-sm font-black text-[#075c58]">
            Review request copy
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="mt-2 w-full rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal leading-6 text-slate-800 outline-none focus:border-[#075c58] focus:ring-4 focus:ring-[#075c58]/15"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !isCompleted || !customerEmail || !reviewUrl || !subject.trim() || !message.trim()}
              onClick={sendReviewRequest}
              className={getActionClass("primary")}
            >
              {busy ? <><Spinner /> Sending...</> : "Email review request"}
            </button>
            <button type="button" onClick={copyMessage} className={getActionClass("secondary")}>Copy message</button>
            <button type="button" disabled={!reviewUrl} onClick={copyLink} className={getActionClass("quiet")}>Copy review link</button>
          </div>

          {notice && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{notice}</p>}
          {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
