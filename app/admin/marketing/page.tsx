"use client";

import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { Copy, Mail, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";

type AudienceKey = "daycare" | "church" | "shortTermRental" | "salonStudioOffice" | "familyPartner" | "generalCommercial";

type OutreachLead = {
  id: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  category?: AudienceKey;
  city?: string;
  personalNote?: string;
  videoLink?: string;
  status?: string;
  followUpDate?: string;
  lastSubject?: string;
  lastMessagePreview?: string;
  lastSentAtIso?: string;
  emailCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const categoryLabels: Record<AudienceKey, string> = {
  daycare: "Daycare / preschool",
  church: "Church / family ministry",
  shortTermRental: "Short-term rental / Airbnb",
  salonStudioOffice: "Salon / studio / small office",
  familyPartner: "Family referral partner",
  generalCommercial: "General commercial lead",
};

const statusOptions = [
  "New lead",
  "Ready to send",
  "Intro sent",
  "Follow-up needed",
  "Follow-up sent",
  "Interested",
  "Requested through site",
  "Not a fit",
  "Do not contact",
  "Archived",
];

const emptyForm = {
  businessName: "",
  contactName: "",
  email: "",
  category: "daycare" as AudienceKey,
  city: "",
  personalNote: "",
  videoLink: "",
  status: "New lead",
  followUpDate: "",
};

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function firstName(value?: string) {
  const name = (value || "").trim();
  return name ? name.split(/\s+/)[0] : "";
}

function leadName(lead: Partial<OutreachLead>) {
  return lead.businessName?.trim() || lead.contactName?.trim() || lead.email?.trim() || "New outreach lead";
}

function isFamilyReferral(category?: AudienceKey) {
  return category === "familyPartner";
}

function actionLink(category?: AudienceKey) {
  if (isFamilyReferral(category)) return "https://www.nesthelperwa.com/request";
  return "https://www.nesthelperwa.com/commercial-reset/request";
}

function actionLabel(category?: AudienceKey) {
  if (isFamilyReferral(category)) return "Request family help";
  return "Request a Commercial Reset quote";
}

function introAngle(category: AudienceKey) {
  switch (category) {
    case "daycare":
      return {
        subject: "Local reset support for daycare and family spaces",
        why: "I noticed you serve families locally, and I wanted to introduce NestHelper in case reset support could be helpful for your families, staff, classrooms, common areas, or high-use spaces.",
        services: "low-odor reset support, common-area cleaning, light organizing, staff-space resets, and quote-based Commercial Reset help",
      };
    case "church":
      return {
        subject: "Local reset support for church and family spaces",
        why: "I noticed your church serves local families, and I wanted to introduce NestHelper in case reset support could be helpful for nurseries, classrooms, events, family programs, or shared spaces.",
        services: "event-area resets, nursery/classroom resets, common-area support, and quote-based Commercial Reset help",
      };
    case "shortTermRental":
      return {
        subject: "Local turnover and reset support for short-term rentals",
        why: "I wanted to introduce NestHelper in case you ever need extra support with guest-ready resets, turnover help, laundry coordination, or backup cleaning coverage.",
        services: "quote-based turnover/reset support, laundry rescue, light restocking coordination, and backup reset help for guest spaces",
      };
    case "salonStudioOffice":
      return {
        subject: "Local reset support for small business spaces",
        why: "I noticed your business is local to the Eastside/Northshore area, and I wanted to introduce NestHelper in case reliable reset-style support could ever be helpful for your space.",
        services: "quote-based Commercial Reset support for small offices, studios, salons, therapy offices, churches, and local business spaces",
      };
    case "familyPartner":
      return {
        subject: "Local parent-support resource for families",
        why: "I wanted to introduce NestHelper because you work with families, and we may be a helpful resource when parents need practical support at home.",
        services: "parent-focused home resets, laundry support, errands, and practical household help for families who need a little breathing room",
      };
    default:
      return {
        subject: "Quick introduction from NestHelper",
        why: "I wanted to introduce NestHelper in case practical reset support could ever be helpful for your team, space, families, guests, or clients.",
        services: "home reset support, laundry help, errands, and quote-based Commercial Reset support for small local spaces",
      };
  }
}

function buildEmail(lead: Partial<OutreachLead>) {
  const category = (lead.category || "generalCommercial") as AudienceKey;
  const angle = introAngle(category);
  const greeting = lead.contactName?.trim() ? `Hi ${firstName(lead.contactName)},` : "Hi there,";
  const location = lead.city?.trim() ? ` in ${lead.city.trim()}` : "";
  const personal = lead.personalNote?.trim() ? `\n\n${lead.personalNote.trim()}` : "";
  const video = lead.videoLink?.trim() ? `\n\nHere’s a short intro from us: ${lead.videoLink.trim()}` : "";
  const link = actionLink(category);
  const cta = actionLabel(category);
  const subject = lead.lastSubject?.trim() || angle.subject;

  const message = `${greeting}

My name is Leo, and my wife Gen and I are the owners of NestHelper, a local Eastside/Northshore service built around practical reset support${location}.

${angle.why}${personal}

We help with ${angle.services}. We’re growing carefully and only accepting a limited number of requests so the service stays reliable, thoughtful, and trust-first.${video}

The easiest next step is to submit a quick request through our site so we can review the address, scope, timing, and fit before confirming anything:

${cta}: ${link}

You can also learn more here:
https://www.nesthelperwa.com

If this is not relevant, no worries at all — just reply “remove” and we won’t follow up.

Thank you,

Leo & Gen
NestHelper
hello@nesthelperwa.com
(425) 790-1330`;
  return { subject, message, link, cta };
}

function formatDate(value: unknown) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleString();
  }
  return String(value);
}

export default function AdminMarketingPage() {
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [manualSubject, setManualSubject] = useState("");
  const [manualMessage, setManualMessage] = useState("");

  useEffect(() => {
    const q = query(collection(firestoreDb, "marketingOutreach"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setLeads(snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<OutreachLead, "id">) })));
    });
  }, []);

  const selectedLead = useMemo(() => leads.find((item) => item.id === selectedId) || null, [leads, selectedId]);
  const previewLead = selectedLead || form;
  const generated = useMemo(() => buildEmail(previewLead), [previewLead]);
  const subject = manualSubject || generated.subject;
  const message = manualMessage || generated.message;

  useEffect(() => {
    if (selectedLead) {
      const next = buildEmail(selectedLead);
      setManualSubject(selectedLead.lastSubject || next.subject);
      setManualMessage(next.message);
    }
  }, [selectedLead]);

  const counts = useMemo(() => {
    return leads.reduce(
      (acc, lead) => {
        acc.total += 1;
        if (lead.status === "Intro sent") acc.sent += 1;
        if (lead.status === "Follow-up needed") acc.followUp += 1;
        if (lead.status === "Interested") acc.interested += 1;
        if (lead.status === "Requested through site") acc.requested += 1;
        return acc;
      },
      { total: 0, sent: 0, followUp: 0, interested: 0, requested: 0 }
    );
  }, [leads]);

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setSaving(true);
    try {
      if (!form.businessName.trim() && !form.email.trim()) throw new Error("Add at least a business name or email.");
      await addDoc(collection(firestoreDb, "marketingOutreach"), {
        ...form,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: firebaseAuth.currentUser?.email || "admin",
        emailCount: 0,
      });
      setForm(emptyForm);
      setNotice("Lead added.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not add lead.");
    } finally {
      setSaving(false);
    }
  }

  async function updateLead(id: string, payload: Partial<OutreachLead>) {
    setNotice("");
    await updateDoc(doc(firestoreDb, "marketingOutreach", id), {
      ...payload,
      updatedAt: serverTimestamp(),
      updatedBy: firebaseAuth.currentUser?.email || "admin",
    });
  }

  async function sendEmail() {
    if (!selectedLead) {
      setNotice("Select a lead before sending.");
      return;
    }
    setNotice("");
    setSending(true);
    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/send-marketing-outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: selectedLead.id, subject, message }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "Email was not sent.");
      setNotice(`Email sent to ${result.to}. Follow-up set for ${result.followUpDate || "later"}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send email.");
    } finally {
      setSending(false);
    }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${message}`);
    setNotice("Email copied.");
  }

  return (
    <AdminShell>
      <section className="space-y-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#075c58] to-[#0b7b73] p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#f1c96b]">Marketing Dashboard</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Local outreach</h2>
          <p className="mt-3 max-w-3xl text-white/82">
            Build targeted outreach lists, generate audience-specific emails, and guide leads to request help through the NestHelper site.
          </p>
        </div>

        {notice && <div className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] shadow-sm">{notice}</div>}

        <div className="grid gap-4 sm:grid-cols-5">
          <Stat label="Total leads" value={counts.total} />
          <Stat label="Intro sent" value={counts.sent} />
          <Stat label="Follow-up needed" value={counts.followUp} />
          <Stat label="Interested" value={counts.interested} />
          <Stat label="Requested on site" value={counts.requested} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <form onSubmit={createLead} className="rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-lg shadow-[#075c58]/5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Add lead</p>
                  <h3 className="mt-1 text-2xl font-black text-[#075c58]">Targeted contact</h3>
                </div>
                <Plus className="text-[#075c58]" />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Business / organization">
                  <input className="input" value={form.businessName} onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))} placeholder="ABC Preschool" />
                </Field>
                <Field label="Contact name">
                  <input className="input" value={form.contactName} onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))} placeholder="Optional" />
                </Field>
                <Field label="Email">
                  <input className="input" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="hello@example.com" />
                </Field>
                <Field label="City / area">
                  <input className="input" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} placeholder="Woodinville" />
                </Field>
                <Field label="Audience type">
                  <select className="input" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as AudienceKey }))}>
                    {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Intro video link">
                  <input className="input" value={form.videoLink} onChange={(e) => setForm((prev) => ({ ...prev, videoLink: e.target.value }))} placeholder="Optional YouTube/website link" />
                </Field>
              </div>

              <Field label="Personal note / why this lead fits" className="mt-4">
                <textarea className="input min-h-[86px]" value={form.personalNote} onChange={(e) => setForm((prev) => ({ ...prev, personalNote: e.target.value }))} placeholder="Example: I saw that you host family programs and wanted to introduce a local support option." />
              </Field>

              <button disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01] disabled:opacity-60 sm:w-auto">
                <Plus size={17} /> {saving ? "Adding..." : "Add lead"}
              </button>
            </form>

            <div className="rounded-[2rem] border border-[#eadfc8] bg-white p-4 shadow-lg shadow-[#075c58]/5 sm:p-5">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Lead list</p>
                  <h3 className="text-2xl font-black text-[#075c58]">Outreach contacts</h3>
                </div>
                <p className="text-xs font-bold text-slate-500">Send small, targeted batches. Avoid mass blasting.</p>
              </div>

              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {leads.length === 0 && <div className="rounded-2xl bg-[#fbf6ea] p-4 text-sm font-semibold text-slate-600">No marketing leads yet.</div>}
                {leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedId(lead.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                      selectedId === lead.id ? "border-[#075c58] bg-[#e9f4f1]" : "border-[#eadfc8] bg-white hover:border-[#075c58]/30"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-[#075c58]">{leadName(lead)}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">{lead.email || "No email"} • {lead.city || "No city"}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#b98a2f]">{categoryLabels[(lead.category || "generalCommercial") as AudienceKey]}</p>
                      </div>
                      <span className="w-fit rounded-full bg-[#fbf6ea] px-3 py-1 text-xs font-black text-[#075c58]">{lead.status || "New lead"}</span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-500">Follow-up: {lead.followUpDate || "not set"} • Emails: {lead.emailCount || 0}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-lg shadow-[#075c58]/5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Email generator</p>
                  <h3 className="mt-1 text-2xl font-black text-[#075c58]">{selectedLead ? leadName(selectedLead) : "Preview before selecting"}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Goal: get the lead to submit a request through the site so you can review fit, scope, and availability.</p>
                </div>
                {selectedLead && (
                  <button onClick={() => deleteDoc(doc(firestoreDb, "marketingOutreach", selectedLead.id))} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
                    <Trash2 size={15} /> Delete
                  </button>
                )}
              </div>

              {selectedLead && (
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Field label="Status">
                    <select className="input" value={selectedLead.status || "New lead"} onChange={(e) => updateLead(selectedLead.id, { status: e.target.value })}>
                      {statusOptions.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </Field>
                  <Field label="Follow-up date">
                    <input className="input" type="date" value={selectedLead.followUpDate || ""} onChange={(e) => updateLead(selectedLead.id, { followUpDate: e.target.value })} />
                  </Field>
                  <Field label="Quick action">
                    <button onClick={() => updateLead(selectedLead.id, { status: "Follow-up needed", followUpDate: todayPlus(5) })} className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#fbf6ea] px-4 text-sm font-black text-[#075c58] transition hover:bg-[#e9f4f1]">
                      <RefreshCw size={15} /> Set follow-up
                    </button>
                  </Field>
                </div>
              )}

              <div className="mt-5 grid gap-4">
                <Field label="Subject">
                  <input className="input" value={subject} onChange={(e) => setManualSubject(e.target.value)} />
                </Field>
                <Field label="Message">
                  <textarea className="input min-h-[420px] font-mono text-sm leading-6" value={message} onChange={(e) => setManualMessage(e.target.value)} />
                </Field>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button onClick={sendEmail} disabled={!selectedLead || sending} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01] disabled:opacity-60">
                  <Mail size={17} /> {sending ? "Sending..." : "Send email"}
                </button>
                <button onClick={copyMessage} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#075c58]/20 bg-white px-5 py-3 text-sm font-black text-[#075c58] transition hover:bg-[#e9f4f1]">
                  <Copy size={17} /> Copy email
                </button>
                {selectedLead && (
                  <button onClick={() => updateLead(selectedLead.id, { lastSubject: subject, lastMessagePreview: message.slice(0, 500), updatedAt: undefined })} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfc8] bg-[#fbf6ea] px-5 py-3 text-sm font-black text-[#075c58] transition hover:bg-[#e9f4f1]">
                    <Save size={17} /> Save draft note
                  </button>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4 text-sm font-semibold leading-6 text-slate-600">
                <p className="font-black text-[#075c58]">Built-in fail-safes</p>
                <p className="mt-1">Each template points to the correct request page, includes a remove/opt-out line, and is meant for small targeted outreach — not bulk spam.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-[#eadfc8] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98a2f]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#075c58]">{value}</p>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
