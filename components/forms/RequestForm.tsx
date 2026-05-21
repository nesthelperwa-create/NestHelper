"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { saveForm } from "@/lib/formHelpers";
import { services, laundryAddOns } from "@/lib/services";

const defaultState = {
  fullName: "", email: "", phone: "", address: "", city: "", zip: "", service: "", preferredDate: "", preferredWindow: "", promoCode: "", pets: "", parkingAccess: "", requestDetails: "", detergent: "Standard detergent", dryPreference: "Standard dry", laundryAddOns: [] as string[], consent: false, textConsent: false
};

export function RequestForm() {
  const params = useSearchParams();
  const requestedService = params.get("service") || "";
  const [form, setForm] = useState({ ...defaultState, service: requestedService });
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [message, setMessage] = useState("");
  const isLaundry = useMemo(() => form.service === "laundry-rescue", [form.service]);

  function update(name: string, value: unknown) { setForm((prev) => ({ ...prev, [name]: value })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await saveForm("customerRequests", { ...form, requestedAt: new Date().toISOString() });
      setStatus("success");
      setMessage("Request received. NestHelper will review service area, scope, safety, and availability before sending your secure Stripe checkout link.");
      setForm({ ...defaultState, service: requestedService });
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Something went wrong. Please try again or contact us directly.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-[2rem] border border-nest-gold/20 bg-white p-5 shadow-soft sm:p-8">
      <div className="rounded-3xl bg-nest-cream p-5">
        <h2 className="text-2xl font-black text-nest-teal">Request NestHelper service</h2>
        <p className="mt-2 text-nest-ink/70">This is a request, not a confirmed booking. Once approved, we’ll send your secure Stripe checkout link by text/email.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><input className="input" required value={form.fullName} onChange={(e)=>update('fullName', e.target.value)} /></Field>
        <Field label="Phone"><input className="input" required value={form.phone} onChange={(e)=>update('phone', e.target.value)} /></Field>
        <Field label="Email"><input type="email" className="input" required value={form.email} onChange={(e)=>update('email', e.target.value)} /></Field>
        <Field label="Promo/referral code (optional)"><input className="input" placeholder="Optional code" value={form.promoCode} onChange={(e)=>update('promoCode', e.target.value.toUpperCase())} /></Field>
      </div>

      <Field label="Service address"><input className="input" required value={form.address} onChange={(e)=>update('address', e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City"><input className="input" required value={form.city} onChange={(e)=>update('city', e.target.value)} /></Field>
        <Field label="ZIP"><input className="input" required value={form.zip} onChange={(e)=>update('zip', e.target.value)} /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service requested">
          <select className="input" required value={form.service} onChange={(e)=>update('service', e.target.value)}>
            <option value="">Choose a service</option>
            {services.map((s)=><option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </Field>
        <Field label="Preferred date"><input type="date" className="input" required value={form.preferredDate} onChange={(e)=>update('preferredDate', e.target.value)} /></Field>
      </div>
      <Field label="Preferred time window"><input className="input" placeholder="Example: Friday morning, Saturday after 1pm" value={form.preferredWindow} onChange={(e)=>update('preferredWindow', e.target.value)} /></Field>

      {isLaundry && (
        <div className="grid gap-5 rounded-3xl border border-nest-teal/15 bg-nest-mint/25 p-5">
          <div>
            <h3 className="text-xl font-black text-nest-teal">Laundry Rescue preferences</h3>
            <p className="mt-1 text-sm text-nest-ink/70">Laundry is billed by dry weight at pickup. Deposit applies to your final total. Final balance is sent after weigh-in.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Detergent preference">
              <select className="input" value={form.detergent} onChange={(e)=>update('detergent', e.target.value)}>
                <option>Standard detergent</option>
                <option>Baby & Sensitive Skin Detergent +$5</option>
                <option>Fragrance-free detergent +$5</option>
                <option>Customer-provided detergent</option>
                <option>No preference</option>
              </select>
            </Field>
            <Field label="Dryer preference">
              <select className="input" value={form.dryPreference} onChange={(e)=>update('dryPreference', e.target.value)}>
                <option>Standard dry</option>
                <option>Low heat +$3</option>
                <option>Hang dry selected items</option>
              </select>
            </Field>
          </div>
          <div>
            <div className="label mb-2">Laundry add-ons to consider</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {laundryAddOns.map((item) => (
                <label key={item} className="flex items-center gap-2 rounded-2xl bg-white/70 p-3 text-sm font-semibold">
                  <input type="checkbox" className="h-4 w-4" onChange={(e)=> {
                    const checked = e.target.checked;
                    update('laundryAddOns', checked ? [...form.laundryAddOns, item] : form.laundryAddOns.filter((x)=>x!==item));
                  }} /> {item}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <Field label="Pets in home"><input className="input" placeholder="Example: 1 friendly dog, 2 cats, no pets" value={form.pets} onChange={(e)=>update('pets', e.target.value)} /></Field>
      <Field label="Parking/access notes"><input className="input" placeholder="Door code, parking, apartment info, stairs, etc." value={form.parkingAccess} onChange={(e)=>update('parkingAccess', e.target.value)} /></Field>
      <Field label="What would you like help with?"><textarea className="input min-h-32" required value={form.requestDetails} onChange={(e)=>update('requestDetails', e.target.value)} /></Field>

      <label className="flex gap-3 rounded-2xl bg-nest-cream p-4 text-sm font-semibold text-nest-ink/82">
        <input type="checkbox" required checked={form.consent} onChange={(e)=>update('consent', e.target.checked)} className="mt-1 h-4 w-4" />
        <span>I understand this is a request, not a confirmed booking. I agree to NestHelper’s Terms, Privacy Policy, Service Scope, Cancellation, Safety, Laundry, and Reset Promise policies.</span>
      </label>
      <label className="flex gap-3 rounded-2xl bg-nest-cream p-4 text-sm font-semibold text-nest-ink/82">
        <input type="checkbox" checked={form.textConsent} onChange={(e)=>update('textConsent', e.target.checked)} className="mt-1 h-4 w-4" />
        <span>I agree NestHelper may text/email me about this request, checkout, prep notes, and service updates.</span>
      </label>

      <button disabled={status === "loading"} className="rounded-full bg-nest-teal px-6 py-4 font-black text-white shadow-soft transition hover:bg-nest-teal2 disabled:opacity-60">
        {status === "loading" ? "Submitting..." : "Submit Request"}
      </button>
      {message && <p className={`rounded-2xl p-4 font-semibold ${status === "success" ? "bg-nest-mint/45 text-nest-teal" : "bg-red-50 text-red-700"}`}>{message}</p>}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><span className="label">{label}</span>{children}</label>;
}
