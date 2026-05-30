"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, Building2, CheckCircle2, ClipboardCheck, CreditCard, ShieldCheck } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import { PhotoUploadField, photoUploadSummary, type PhotoUpload } from "@/components/forms/PhotoUploadField";

const defaultState = {
  businessName: "",
  contactName: "",
  roleTitle: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip: "",
  businessType: "",
  squareFootage: "",
  bathrooms: "",
  frequency: "",
  preferredDate: "",
  preferredDaysTimes: "",
  supplies: "NestHelper supplies preferred",
  flooringTypes: "",
  accessInstructions: "",
  specialNotes: "",
  photoNotes: "",
  consent: false,
  textConsent: false,
  photoUploads: [] as PhotoUpload[],
};

type CommercialResetFormState = typeof defaultState;
type Status = "idle" | "loading" | "success" | "error";

const businessTypes = [
  "Small office",
  "Studio / gym / wellness space",
  "Salon / barbershop",
  "Church / nonprofit",
  "Therapy / professional office",
  "Real estate / insurance office",
  "Daycare common areas",
  "Schools / learning studios",
  "Other small business",
];

const frequencies = [
  "One-time commercial reset",
  "Weekly service",
  "Twice weekly service",
  "Three times weekly service",
  "Five times weekly service",
  "Not sure yet — help me choose",
];

function buildPayload(form: CommercialResetFormState) {
  return {
    fullName: form.contactName,
    email: form.email,
    phone: form.phone,
    address: form.address,
    city: form.city,
    zip: form.zip,
    service: "commercial-reset",
    selectedServiceTitle: "Commercial Reset Quote",
    packageType: "Commercial Reset",
    requestType: "Commercial Reset",
    businessName: form.businessName,
    contactName: form.contactName,
    roleTitle: form.roleTitle,
    businessType: form.businessType,
    squareFootage: form.squareFootage,
    bathrooms: form.bathrooms,
    frequency: form.frequency,
    preferredDate: form.preferredDate,
    preferredWindow: form.preferredDaysTimes,
    preferredDaysTimes: form.preferredDaysTimes,
    supplies: form.supplies,
    flooringTypes: form.flooringTypes,
    accessInstructions: form.accessInstructions,
    specialNotes: form.specialNotes,
    photoNotes: form.photoNotes,
    ...(form.photoUploads.length ? {
      photoUploadCount: form.photoUploads.length,
      photoUploadSummary: photoUploadSummary(form.photoUploads),
      photoUploads: form.photoUploads,
    } : {}),
    consent: form.consent,
    textConsent: form.textConsent,
    requestedAt: new Date().toISOString(),
  };
}

export function CommercialResetForm() {
  const [form, setForm] = useState(defaultState);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  function update(name: keyof CommercialResetFormState, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }) as CommercialResetFormState);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form)),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Commercial Reset submission failed");

      setStatus("success");
      setMessage("Commercial Reset quote request received. We’ll review the address, scope, frequency, access notes, and service fit before sending next steps or a custom checkout link.");
      setForm(defaultState);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Something went wrong. Please try again or contact NestHelper directly.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-nest-cream via-white to-nest-mint/35 p-5 shadow-sm sm:p-7">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-nest-gold/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">No payment due yet</p>
          <h2 className="mt-2 text-2xl font-black text-nest-teal sm:text-3xl">Request a Commercial Reset quote</h2>
          <p className="mt-3 max-w-2xl leading-7 text-nest-ink/72">
            Tell us about the business space, schedule, photos, and cleaning scope. NestHelper reviews commercial requests before quoting so pricing fits the real job instead of forcing every space into one package.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Step icon={<ClipboardCheck className="h-5 w-5" />} title="1. Scope review" text="Business type, square footage, bathrooms, and frequency." />
            <Step icon={<ShieldCheck className="h-5 w-5" />} title="2. Service fit" text="Address, access, timing, supply preferences, and boundaries." />
            <Step icon={<CreditCard className="h-5 w-5" />} title="3. Quote + next steps" text="Custom quote first, secure payment link after approval." />
          </div>
        </div>
      </div>

      <Section title="1. Business contact" description="Who should NestHelper contact about the walkthrough, quote, and service details?">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name"><input className="input" required value={form.businessName} onChange={(e) => update("businessName", e.target.value)} /></Field>
          <Field label="Contact name"><input className="input" required autoComplete="name" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></Field>
          <Field label="Role/title (optional)"><input className="input" placeholder="Owner, manager, office admin, etc." value={form.roleTitle} onChange={(e) => update("roleTitle", e.target.value)} /></Field>
          <Field label="Business type">
            <select className="input" required value={form.businessType} onChange={(e) => update("businessType", e.target.value)}>
              <option value="">Choose one</option>
              {businessTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Email"><input type="email" className="input" required autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
          <Field label="Phone"><input className="input" required autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => update("phone", formatPhoneNumber(e.target.value))} /></Field>
        </div>
      </Section>

      <Section title="2. Cleaning address" description="Commercial Reset availability depends on schedule, scope, address, and any local licensing or endorsement requirements.">
        <Field label="Street address"><input className="input" required autoComplete="street-address" value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City / community"><input className="input" required autoComplete="address-level2" value={form.city} onChange={(e) => update("city", e.target.value)} /></Field>
          <Field label="ZIP"><input className="input" required autoComplete="postal-code" inputMode="numeric" value={form.zip} onChange={(e) => update("zip", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="3. Space and schedule" description="These details help us estimate labor time, quote range, and whether a walkthrough is needed first.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Approx. square footage"><input className="input" required inputMode="numeric" placeholder="Example: 1,200 sq ft" value={form.squareFootage} onChange={(e) => update("squareFootage", e.target.value)} /></Field>
          <Field label="Bathrooms"><input className="input" required placeholder="Example: 2 bathrooms" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} /></Field>
          <Field label="Cleaning frequency">
            <select className="input" required value={form.frequency} onChange={(e) => update("frequency", e.target.value)}>
              <option value="">Choose one</option>
              {frequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}
            </select>
          </Field>
          <Field label="Preferred start date"><input type="date" className="input" value={form.preferredDate} onChange={(e) => update("preferredDate", e.target.value)} /></Field>
        </div>
        <Field label="Preferred days/times"><input className="input" required placeholder="Example: after 6pm weekdays, Saturday morning, before opening" value={form.preferredDaysTimes} onChange={(e) => update("preferredDaysTimes", e.target.value)} /></Field>
      </Section>

      <Section title="4. Scope, access, and supplies" description="Commercial Reset starts with routine janitorial cleaning. Specialty work is quoted separately when available.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Supplies preference">
            <select className="input" value={form.supplies} onChange={(e) => update("supplies", e.target.value)}>
              <option>NestHelper supplies preferred</option>
              <option>Non-toxic / low-odor options requested where appropriate</option>
              <option>Fragrance-free products requested where appropriate</option>
              <option>Business provides supplies</option>
              <option>Not sure yet</option>
            </select>
          </Field>
          <Field label="Flooring types"><input className="input" placeholder="Example: LVP, tile, carpet, concrete" value={form.flooringTypes} onChange={(e) => update("flooringTypes", e.target.value)} /></Field>
        </div>
        <Field label="Access instructions"><textarea className="input min-h-28" required placeholder="Keys, lockbox, alarm, parking, suite number, after-hours entry, who will be onsite, etc." value={form.accessInstructions} onChange={(e) => update("accessInstructions", e.target.value)} /></Field>
        <Field label="Cleaning needs / special notes"><textarea className="input min-h-32" required placeholder="Tell us what needs to be cleaned, current condition, priority areas, trash/recycling, restrooms, breakroom, waiting room, daycare/common-area notes, add-ons, or anything sensitive." value={form.specialNotes} onChange={(e) => update("specialNotes", e.target.value)} /></Field>
        <div className="rounded-2xl border border-nest-gold/15 bg-nest-mint/20 p-4 text-sm font-semibold leading-6 text-nest-ink/72">
          For daycare common areas, churches, studios, and family-facing spaces, non-toxic, low-odor, or fragrance-free product options can be requested where appropriate for the surface and scope. NestHelper still reviews each request before confirming products, timing, and boundaries.
        </div>
        <PhotoUploadField
          photos={form.photoUploads}
          onChange={(photos) => update("photoUploads", photos)}
          label="Upload walkthrough photos (optional)"
          description="Add up to 4 optional photos of the space, flooring, restrooms, trash/recycling area, priority areas, access points, or anything that helps us quote accurately."
        />
        <Field label="Photo links or walkthrough notes (optional)"><textarea className="input min-h-24" placeholder="Paste a link to additional photos or describe anything a walkthrough should cover." value={form.photoNotes} onChange={(e) => update("photoNotes", e.target.value)} /></Field>
      </Section>

      <div className="grid gap-4 rounded-[1.75rem] border border-nest-teal/15 bg-nest-mint/20 p-5">
        <h3 className="text-xl font-black text-nest-teal">Before you submit</h3>
        <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
          <input type="checkbox" required checked={form.consent} onChange={(e) => update("consent", e.target.checked)} className="mt-1 h-4 w-4" />
          <span>I understand this is a quote request, not a confirmed booking. Commercial Reset availability depends on address, scope, schedule, licensing/endorsement requirements, and service fit.</span>
        </label>
        <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
          <input type="checkbox" checked={form.textConsent} onChange={(e) => update("textConsent", e.target.checked)} className="mt-1 h-4 w-4" />
          <span>I agree NestHelper may text/email me about this quote request, walkthrough, scheduling, checkout, and service updates.</span>
        </label>
      </div>

      <button disabled={status === "loading"} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-4 text-lg font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift disabled:opacity-60">
        {status === "loading" ? "Submitting..." : "Submit Commercial Quote Request"}
        {status !== "loading" && <ArrowRight size={19} />}
      </button>
      {message && <p className={`rounded-2xl p-4 font-semibold ${status === "success" ? "bg-nest-mint/45 text-nest-teal" : "bg-red-50 text-red-700"}`}>{message}</p>}
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const match = title.match(/^(\d+)\.\s*(.*)$/);
  const step = match?.[1];
  const cleanTitle = match?.[2] || title;

  return (
    <section className="relative grid gap-5 overflow-hidden rounded-[1.9rem] border border-nest-gold/15 bg-gradient-to-br from-white via-white to-nest-cream/30 p-5 shadow-sm sm:p-6">
      <div className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-nest-mint/35 blur-3xl" />
      <div className="relative flex gap-4">
        {step ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-nest-teal text-lg font-black text-white shadow-sm">
            {step}
          </div>
        ) : null}
        <div>
          <h3 className="text-xl font-black text-nest-teal sm:text-2xl">{cleanTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-nest-ink/68">{description}</p>
        </div>
      </div>
      <div className="relative grid gap-5">
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2"><span className="label">{label}</span>{children}</label>;
}

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <div className="text-nest-gold">{icon}</div>
      <p className="mt-2 font-black text-nest-teal">{title}</p>
      <p className="mt-1 text-sm leading-5 text-nest-ink/65">{text}</p>
    </div>
  );
}

export function CommercialQuoteMiniCard() {
  return (
    <div className="rounded-[1.75rem] border border-nest-gold/16 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nest-mint/45 text-nest-teal">
          <Building2 size={23} />
        </div>
        <div>
          <h3 className="text-xl font-black text-nest-teal">Quote-first commercial requests</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-nest-ink/68">
            Commercial Reset requests are reviewed before checkout because every business has different square footage, frequency, access, supplies, and after-hours needs.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm font-black text-nest-teal">
            <CheckCircle2 size={16} /> Custom quote before payment
          </div>
        </div>
      </div>
    </div>
  );
}
