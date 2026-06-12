"use client";

import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { Copy, Mail, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";

type AudienceKey = "daycare" | "church" | "shortTermRental" | "salonStudioOffice" | "familyPartner" | "generalCommercial";
type EmailMode = "intro" | "followup";

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
  noResponseReviewDate?: string;
  lastSubject?: string;
  lastMessagePreview?: string;
  lastSentAtIso?: string;
  lastFollowUpSentAtIso?: string;
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
  "No response",
  "Try different channel",
  "Interested",
  "Requested through site",
  "Remove requested",
  "Do not contact",
  "Not a fit",
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isDue(date?: string) {
  if (!date) return false;
  return date <= todayIso();
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

function campaignSourceForAudience(category?: AudienceKey) {
  switch (category) {
    case "daycare":
      return "daycare_email";
    case "church":
      return "church_email";
    case "shortTermRental":
      return "airbnb_email";
    case "salonStudioOffice":
      return "small_business_email";
    case "familyPartner":
      return "partner_referral_email";
    default:
      return "local_outreach_email";
  }
}

function buildCampaignUrl(path: string, source: string, medium: string, campaign: string, content = "") {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (medium) params.set("utm_medium", medium);
  if (campaign) params.set("utm_campaign", campaign);
  if (content) params.set("utm_content", content);
  return `https://www.nesthelperwa.com${path}?${params.toString()}`;
}

function campaignForLink(path: string, source: string) {
  const month = new Date().toLocaleString("en-US", { month: "short" }).toLowerCase();
  const year = new Date().getFullYear();

  if (path === "/") {
    if (source.includes("flyer")) return `main_landing_flyer_${month}_${year}`;
    if (source.includes("instagram")) return `main_landing_instagram_${month}_${year}`;
    if (source.includes("facebook")) return `main_landing_facebook_group_${month}_${year}`;
    if (source.includes("nextdoor")) return `main_landing_nextdoor_${month}_${year}`;
    if (source.includes("google")) return `main_landing_google_profile_${month}_${year}`;
    if (source.includes("partner")) return `main_landing_partner_referral_${month}_${year}`;
    return `main_landing_awareness_${month}_${year}`;
  }

  if (path === "/helpers") return `helper_recruiting_${month}_${year}`;
  if (path === "/contact") return `general_contact_${month}_${year}`;

  if (path === "/commercial-reset/request") {
    if (source.includes("daycare")) return `daycare_commercial_reset_intro_${month}_${year}`;
    if (source.includes("church")) return `church_commercial_reset_intro_${month}_${year}`;
    if (source.includes("airbnb")) return `short_term_rental_turnover_intro_${month}_${year}`;
    if (source.includes("flyer")) return `commercial_reset_flyer_${month}_${year}`;
    if (source.includes("google")) return `commercial_reset_google_profile_${month}_${year}`;
    return `commercial_reset_intro_${month}_${year}`;
  }

  if (source.includes("daycare")) return `daycare_parent_reset_intro_${month}_${year}`;
  if (source.includes("church")) return `church_parent_reset_intro_${month}_${year}`;
  if (source.includes("flyer")) return `parent_reset_flyer_${month}_${year}`;
  if (source.includes("instagram")) return `parent_reset_instagram_${month}_${year}`;
  if (source.includes("facebook")) return `parent_reset_facebook_group_${month}_${year}`;
  if (source.includes("nextdoor")) return `parent_reset_nextdoor_${month}_${year}`;
  if (source.includes("partner")) return `parent_reset_partner_referral_${month}_${year}`;
  if (source.includes("google")) return `parent_reset_google_profile_${month}_${year}`;
  return `parent_reset_openings_${month}_${year}`;
}

function actionLink(category?: AudienceKey) {
  const path = isFamilyReferral(category) ? "/request" : "/commercial-reset/request";
  return buildCampaignUrl(path, campaignSourceForAudience(category), "email", "marketing_outreach", category || "general");
}

function actionLabel(category?: AudienceKey) {
  return isFamilyReferral(category) ? "Request family help" : "Request a Commercial Reset quote";
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

function buildIntroEmail(lead: Partial<OutreachLead>) {
  const category = (lead.category || "generalCommercial") as AudienceKey;
  const angle = introAngle(category);
  const greeting = lead.contactName?.trim() ? `Hi ${firstName(lead.contactName)},` : "Hi there,";
  const location = lead.city?.trim() ? ` in ${lead.city.trim()}` : "";
  const personal = lead.personalNote?.trim() ? `\n\n${lead.personalNote.trim()}` : "";
  const video = lead.videoLink?.trim() ? `\n\nHere’s a short intro from us: ${lead.videoLink.trim()}` : "";
  const link = actionLink(category);
  const cta = actionLabel(category);

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
  return { subject: lead.lastSubject?.trim() || angle.subject, message, link, cta };
}

function buildFollowUpEmail(lead: Partial<OutreachLead>) {
  const category = (lead.category || "generalCommercial") as AudienceKey;
  const greeting = lead.contactName?.trim() ? `Hi ${firstName(lead.contactName)},` : "Hi there,";
  const link = actionLink(category);
  const cta = actionLabel(category);
  const subject = isFamilyReferral(category) ? "Following up from NestHelper" : "Following up on NestHelper reset support";
  const business = lead.businessName?.trim() ? ` for ${lead.businessName.trim()}` : "";

  const message = `${greeting}

I just wanted to follow up once on my note about NestHelper${business}.

We’re a local Eastside/Northshore service focused on practical reset support. Depending on the fit, we help with parent-focused home resets, laundry support, errands, and quote-based Commercial Reset support for small local spaces.

No pressure at all — the easiest next step, if it would be helpful, is to submit a request through our site so we can review the address, timing, scope, and availability before confirming anything:

${cta}: ${link}

If now is not the right time, no worries. If this is not relevant, just reply “remove” and we won’t follow up again.

Thank you,

Leo & Gen
NestHelper
hello@nesthelperwa.com
(425) 790-1330`;
  return { subject, message, link, cta };
}

function buildEmail(lead: Partial<OutreachLead>, mode: EmailMode) {
  return mode === "followup" ? buildFollowUpEmail(lead) : buildIntroEmail(lead);
}

function isRemoveStatus(status?: string) {
  return status === "Remove requested" || status === "Do not contact";
}

export default function AdminMarketingPage() {
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState("");
  const [emailMode, setEmailMode] = useState<EmailMode>("intro");
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
  const generated = useMemo(() => buildEmail(previewLead, emailMode), [previewLead, emailMode]);
  const subject = manualSubject || generated.subject;
  const message = manualMessage || generated.message;

  useEffect(() => {
    if (!selectedLead) return;
    const nextMode: EmailMode = selectedLead.status === "Intro sent" || selectedLead.status === "Follow-up needed" ? "followup" : "intro";
    setEmailMode(nextMode);
    const next = buildEmail(selectedLead, nextMode);
    setManualSubject(next.subject);
    setManualMessage(next.message);
  }, [selectedLead]);

  useEffect(() => {
    const next = buildEmail(previewLead, emailMode);
    setManualSubject(next.subject);
    setManualMessage(next.message);
  }, [emailMode]);

  const followUpDueLeads = useMemo(
    () => leads.filter((lead) => (lead.status === "Intro sent" || lead.status === "Follow-up needed") && isDue(lead.followUpDate)),
    [leads]
  );
  const removeLeads = useMemo(() => leads.filter((lead) => isRemoveStatus(lead.status)), [leads]);

  const counts = useMemo(() => {
    return leads.reduce(
      (acc, lead) => {
        acc.total += 1;
        if (lead.status === "Intro sent") acc.sent += 1;
        if (lead.status === "Follow-up needed" || ((lead.status === "Intro sent" || lead.status === "Follow-up needed") && isDue(lead.followUpDate))) acc.followUp += 1;
        if (lead.status === "Follow-up sent") acc.followUpSent += 1;
        if (lead.status === "No response") acc.noResponse += 1;
        if (lead.status === "Interested") acc.interested += 1;
        if (lead.status === "Requested through site") acc.requested += 1;
        if (isRemoveStatus(lead.status)) acc.remove += 1;
        return acc;
      },
      { total: 0, sent: 0, followUp: 0, followUpSent: 0, noResponse: 0, interested: 0, requested: 0, remove: 0 }
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

  async function sendEmail(mode: EmailMode) {
    if (!selectedLead) {
      setNotice("Select a lead before sending.");
      return;
    }
    if (isRemoveStatus(selectedLead.status)) {
      setNotice("This lead requested removal or is marked Do not contact. Email sending is blocked.");
      return;
    }
    if (mode === "followup" && (selectedLead.emailCount || 0) >= 2) {
      setNotice("Two emails have already been sent. Stop emailing this lead unless they respond.");
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
        body: JSON.stringify({ id: selectedLead.id, subject, message, mode }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "Email was not sent.");
      setNotice(`${mode === "followup" ? "Follow-up" : "Intro"} email sent to ${result.to}. ${result.followUpDate ? `Next follow-up set for ${result.followUpDate}.` : "No further email follow-up is scheduled."}`);
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

  async function markNoResponse() {
    if (!selectedLead) return;
    await updateLead(selectedLead.id, { status: "No response", followUpDate: "", noResponseReviewDate: todayPlus(60) });
    setNotice("Marked no response. Optional 60-day review date saved.");
  }

  async function markTryDifferentChannel() {
    if (!selectedLead) return;
    await updateLead(selectedLead.id, { status: "Try different channel", followUpDate: "" });
    setNotice("Marked for a different channel. Try phone, flyer drop-off, Facebook/Instagram, or local networking instead of more emails.");
  }

  async function markRemoveRequested() {
    if (!selectedLead) return;
    await updateLead(selectedLead.id, { status: "Remove requested", followUpDate: "" });
    setNotice("Marked Remove requested. Do not email this lead again.");
  }

  async function markDoNotContact() {
    if (!selectedLead) return;
    await updateLead(selectedLead.id, { status: "Do not contact", followUpDate: "" });
    setNotice("Marked Do not contact. Email sending is blocked for this lead.");
  }

  const selectedBlocked = isRemoveStatus(selectedLead?.status);

  return (
    <AdminShell>
      <section className="space-y-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#075c58] to-[#0b7b73] p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#f1c96b]">Marketing Dashboard</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Local outreach</h2>
          <p className="mt-3 max-w-3xl text-white/82">
            Run a simple two-touch outreach flow: send one personal intro, send one follow-up 4–7 days later, then stop or try a different channel.
          </p>
        </div>

        {notice && <div className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] shadow-sm">{notice}</div>}

        {removeLeads.length > 0 && (
          <div className="rounded-[1.75rem] border-2 border-rose-300 bg-rose-50 p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Removal / do-not-contact list</p>
            <p className="mt-1 text-sm font-bold text-rose-900">
              {removeLeads.length} lead{removeLeads.length === 1 ? "" : "s"} requested removal or are marked do not contact. Keep them off future outreach lists.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-8">
          <Stat label="Total leads" value={counts.total} />
          <Stat label="Intro sent" value={counts.sent} />
          <Stat label="Follow-up due" value={counts.followUp} />
          <Stat label="Follow-up sent" value={counts.followUpSent} />
          <Stat label="No response" value={counts.noResponse} />
          <Stat label="Interested" value={counts.interested} />
          <Stat label="Requested on site" value={counts.requested} />
          <Stat label="Remove/DNC" value={counts.remove} alert={counts.remove > 0} />
        </div>

        <CampaignLinkBuilder onNotice={setNotice} />

        {followUpDueLeads.length > 0 && (
          <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Follow-up queue</p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {followUpDueLeads.length} lead{followUpDueLeads.length === 1 ? "" : "s"} due for the second and final email follow-up.
            </p>
          </div>
        )}

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
                <p className="text-xs font-bold text-slate-500">Two emails max unless they respond.</p>
              </div>

              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {leads.length === 0 && <div className="rounded-2xl bg-[#fbf6ea] p-4 text-sm font-semibold text-slate-600">No marketing leads yet.</div>}
                {leads.map((lead) => {
                  const due = (lead.status === "Intro sent" || lead.status === "Follow-up needed") && isDue(lead.followUpDate);
                  const removed = isRemoveStatus(lead.status);
                  return (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                        selectedId === lead.id
                          ? "border-[#075c58] bg-[#e9f4f1]"
                          : removed
                            ? "border-rose-300 bg-rose-50"
                            : due
                              ? "border-amber-300 bg-amber-50"
                              : "border-[#eadfc8] bg-white hover:border-[#075c58]/30"
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className={`font-black ${removed ? "text-rose-700" : "text-[#075c58]"}`}>{leadName(lead)}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-600">{lead.email || "No email"} • {lead.city || "No city"}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#b98a2f]">{categoryLabels[(lead.category || "generalCommercial") as AudienceKey]}</p>
                        </div>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                          removed ? "bg-rose-200 text-rose-900" : due ? "bg-amber-200 text-amber-900" : "bg-[#fbf6ea] text-[#075c58]"
                        }`}>
                          {removed ? "Remove / DNC" : due ? "Follow-up due" : lead.status || "New lead"}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        Follow-up: {lead.followUpDate || "not set"} • Emails: {lead.emailCount || 0}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-[2rem] border p-5 shadow-lg shadow-[#075c58]/5 sm:p-6 ${selectedBlocked ? "border-rose-300 bg-rose-50" : "border-[#eadfc8] bg-white"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Two-touch email flow</p>
                  <h3 className={`mt-1 text-2xl font-black ${selectedBlocked ? "text-rose-700" : "text-[#075c58]"}`}>{selectedLead ? leadName(selectedLead) : "Preview before selecting"}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Goal: get them to request through the site. Send one intro, one follow-up, then stop or try a different channel.</p>
                </div>
                {selectedLead && (
                  <button onClick={() => deleteDoc(doc(firestoreDb, "marketingOutreach", selectedLead.id))} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
                    <Trash2 size={15} /> Delete
                  </button>
                )}
              </div>

              {selectedBlocked && (
                <div className="mt-4 rounded-2xl border-2 border-rose-300 bg-white p-4 text-sm font-black text-rose-700">
                  Do not email this lead again. Keep them off future outreach lists.
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setEmailMode("intro")}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${emailMode === "intro" ? "border-[#075c58] bg-[#e9f4f1] text-[#075c58]" : "border-[#eadfc8] bg-white text-slate-600 hover:bg-[#fbf6ea]"}`}
                >
                  Email 1: Intro
                  <span className="mt-1 block text-xs font-semibold">Personal introduction + request-site CTA</span>
                </button>
                <button
                  onClick={() => setEmailMode("followup")}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${emailMode === "followup" ? "border-[#075c58] bg-[#e9f4f1] text-[#075c58]" : "border-[#eadfc8] bg-white text-slate-600 hover:bg-[#fbf6ea]"}`}
                >
                  Email 2: Final follow-up
                  <span className="mt-1 block text-xs font-semibold">One polite follow-up, then stop</span>
                </button>
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
                    <button onClick={() => updateLead(selectedLead.id, { status: "Follow-up needed", followUpDate: todayPlus(5) })} disabled={selectedBlocked} className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#fbf6ea] px-4 text-sm font-black text-[#075c58] transition hover:bg-[#e9f4f1] disabled:opacity-50">
                      <RefreshCw size={15} /> Set follow-up
                    </button>
                  </Field>
                </div>
              )}

              <div className="mt-5 grid gap-4">
                <Field label="Subject">
                  <input className="input" value={subject} onChange={(e) => setManualSubject(e.target.value)} disabled={selectedBlocked} />
                </Field>
                <Field label="Message">
                  <textarea className="input min-h-[420px] font-mono text-sm leading-6" value={message} onChange={(e) => setManualMessage(e.target.value)} disabled={selectedBlocked} />
                </Field>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button onClick={() => sendEmail(emailMode)} disabled={!selectedLead || sending || selectedBlocked} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01] disabled:opacity-60">
                  <Mail size={17} /> {sending ? "Sending..." : emailMode === "followup" ? "Send final follow-up" : "Send intro"}
                </button>
                <button onClick={copyMessage} disabled={selectedBlocked} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#075c58]/20 bg-white px-5 py-3 text-sm font-black text-[#075c58] transition hover:bg-[#e9f4f1] disabled:opacity-50">
                  <Copy size={17} /> Copy email
                </button>
                {selectedLead && (
                  <button onClick={() => updateLead(selectedLead.id, { lastSubject: subject, lastMessagePreview: message.slice(0, 500) })} disabled={selectedBlocked} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfc8] bg-[#fbf6ea] px-5 py-3 text-sm font-black text-[#075c58] transition hover:bg-[#e9f4f1] disabled:opacity-50">
                    <Save size={17} /> Save draft note
                  </button>
                )}
              </div>

              {selectedLead && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button onClick={markNoResponse} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50">
                    Mark no response
                  </button>
                  <button onClick={markTryDifferentChannel} className="rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] px-4 py-3 text-sm font-black text-[#075c58] transition hover:bg-[#e9f4f1]">
                    Try different channel
                  </button>
                  <button onClick={markRemoveRequested} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-100">
                    Mark remove requested
                  </button>
                  <button onClick={markDoNotContact} className="rounded-2xl border border-rose-300 bg-rose-100 px-4 py-3 text-sm font-black text-rose-800 transition hover:bg-rose-200">
                    Mark do not contact
                  </button>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4 text-sm font-semibold leading-6 text-slate-600">
                <p className="font-black text-[#075c58]">Built-in fail-safes</p>
                <p className="mt-1">Two emails max unless they respond. Leads marked Remove requested or Do not contact are highlighted red and blocked from email sending.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}


function CampaignLinkBuilder({ onNotice }: { onNotice: (message: string) => void }) {
  const [path, setPath] = useState("/request");
  const [source, setSource] = useState("facebook_group");
  const [medium, setMedium] = useState("social");
  const [campaign, setCampaign] = useState(() => campaignForLink("/request", "facebook_group"));
  const [content, setContent] = useState("");
  const [campaignEdited, setCampaignEdited] = useState(false);
  const suggestedCampaign = useMemo(() => campaignForLink(path, source), [path, source]);
  const url = buildCampaignUrl(path, source, medium, campaign, content);

  function updatePath(nextPath: string) {
    setPath(nextPath);
    if (!campaignEdited) setCampaign(campaignForLink(nextPath, source));
  }

  function updateSource(nextSource: string) {
    setSource(nextSource);
    if (!campaignEdited) setCampaign(campaignForLink(path, nextSource));
  }

  function useSuggestedCampaign() {
    setCampaign(suggestedCampaign);
    setCampaignEdited(false);
    onNotice("Campaign field auto-filled.");
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    onNotice("Campaign link copied.");
  }

  return (
    <div className="rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-lg shadow-[#075c58]/5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Campaign links</p>
          <h3 className="mt-1 text-2xl font-black text-[#075c58]">Create trackable request links</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">Use these for flyers, QR codes, emails, Facebook groups, Instagram, Nextdoor, churches, daycares, and partner posts.</p>
        </div>
        <button onClick={copyUrl} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01]">
          <Copy size={17} /> Copy link
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Destination">
          <select className="input" value={path} onChange={(e) => updatePath(e.target.value)}>
            <option value="/">Main landing page</option>
            <option value="/request">Parent Reset request</option>
            <option value="/commercial-reset/request">Commercial Reset quote</option>
            <option value="/helpers">Helper / partner application</option>
            <option value="/contact">Contact page</option>
          </select>
        </Field>
        <Field label="Source">
          <select className="input" value={source} onChange={(e) => updateSource(e.target.value)}>
            <option value="facebook_group">Facebook group</option>
            <option value="instagram_bio">Instagram bio</option>
            <option value="instagram_post">Instagram post</option>
            <option value="nextdoor_post">Nextdoor post</option>
            <option value="flyer_qr">Flyer / QR</option>
            <option value="daycare_email">Daycare email</option>
            <option value="church_email">Church email</option>
            <option value="airbnb_email">Airbnb email</option>
            <option value="partner_referral">Referral partner</option>
            <option value="google_business_profile">Google Business Profile</option>
          </select>
        </Field>
        <Field label="Medium">
          <select className="input" value={medium} onChange={(e) => setMedium(e.target.value)}>
            <option value="social">Social</option>
            <option value="email">Email</option>
            <option value="print">Print / flyer</option>
            <option value="qr">QR code</option>
            <option value="referral">Referral</option>
            <option value="local_group">Local group</option>
          </select>
        </Field>
        <Field label="Campaign">
          <input
            className="input"
            value={campaign}
            onChange={(e) => {
              setCampaign(e.target.value);
              setCampaignEdited(true);
            }}
            placeholder={suggestedCampaign}
          />
        </Field>
        <Field label="Content">
          <input className="input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Optional: june_flyer" />
        </Field>
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Suggested campaign: <span className="font-black text-[#075c58]">{suggestedCampaign}</span>
        </span>
        <button onClick={useSuggestedCampaign} className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#075c58] shadow-sm transition hover:bg-[#e9f4f1]">
          Auto-fill campaign
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4 text-sm font-bold text-[#075c58] break-all">
        {url}
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500">When someone submits a form from this link, the source/campaign saves into the request, application, or contact record and appears in the Marketing source CSV.</p>
    </div>
  );
}

function Stat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-sm ${alert ? "border-rose-300 bg-rose-50" : "border-[#eadfc8] bg-white"}`}>
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${alert ? "text-rose-700" : "text-[#b98a2f]"}`}>{label}</p>
      <p className={`mt-2 text-3xl font-black ${alert ? "text-rose-700" : "text-[#075c58]"}`}>{value}</p>
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
