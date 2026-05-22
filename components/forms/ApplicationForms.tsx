"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";


type Status = "idle" | "loading" | "success" | "error";


type ApplicationPath = "helper" | "partner";

const applicationOptions: Array<{
  key: ApplicationPath;
  eyebrow: string;
  title: string;
  text: string;
  bullets: string[];
  button: string;
}> = [
  {
    key: "helper",
    eyebrow: "Individual helper",
    title: "I want to be a NestHelper helper",
    text: "For people who want to help families with parent-reset visits, laundry folding, errands, organizing, and home reset support.",
    bullets: ["Individual application", "Gold Star Checked onboarding", "Part-time / flexible availability"],
    button: "Show helper form",
  },
  {
    key: "partner",
    eyebrow: "Business or provider",
    title: "I’m a partner business or contractor",
    text: "For cleaners, laundromats, errand providers, organizers, and local service businesses that want to partner with NestHelper.",
    bullets: ["Business/provider application", "Partner-vetted review", "Capacity, insurance, and service standards"],
    button: "Show partner form",
  },
];

export function ApplicationFormChooser() {
  const [selected, setSelected] = useState<ApplicationPath | null>(null);
  const selectedOption = applicationOptions.find((option) => option.key === selected);

  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-nest-gold">Choose your application path</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-nest-teal sm:text-4xl">Which best describes you?</h2>
          <p className="mt-3 text-nest-ink/70">
            Select one of the two cards below. The selected card will animate and the correct application will open underneath.
          </p>
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-nest-gold/25 bg-nest-cream px-4 py-2 text-sm font-black text-nest-teal shadow-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-nest-gold motion-safe:animate-pulse" />
            Click or tap a card to continue
          </div>
        </div>

        <div className="mt-8 grid items-start gap-5 lg:grid-cols-2">
          {applicationOptions.map((option) => {
            const isSelected = selected === option.key;
            return (
              <motion.button
                key={option.key}
                type="button"
                layout
                whileHover={{ y: -6, scale: 1.01 }}
                whileTap={{ scale: 0.975 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                onClick={() => setSelected(option.key)}
                className={`group relative flex min-h-[330px] cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border-2 p-5 text-left shadow-soft outline-none transition-colors duration-200 ease-out focus-visible:ring-4 focus-visible:ring-nest-gold/25 sm:p-6 ${
                  isSelected
                    ? "border-nest-gold bg-nest-cream ring-4 ring-nest-gold/15"
                    : "border-nest-gold/20 bg-white hover:border-nest-gold/70 hover:bg-nest-cream/45"
                }`}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <motion.div
                    layoutId="application-selected-glow"
                    className="pointer-events-none absolute inset-0 rounded-[1.65rem] bg-gradient-to-br from-nest-gold/18 via-white/20 to-nest-mint/35"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.22 }}
                  />
                )}

                <motion.div
                  animate={isSelected ? { rotate: 360, scale: 1.08 } : { rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 18 }}
                  className={`absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border text-lg font-black transition-colors ${
                    isSelected
                      ? "border-nest-gold bg-nest-gold text-white shadow-soft"
                      : "border-nest-gold/25 bg-white text-nest-teal group-hover:border-nest-gold group-hover:bg-nest-gold group-hover:text-white"
                  }`}
                >
                  {isSelected ? "✓" : "→"}
                </motion.div>

                <div className="relative z-10 flex flex-1 flex-col pr-8">
                  <span className="w-fit rounded-full bg-nest-mint/55 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-nest-teal">
                    {option.eyebrow}
                  </span>

                  <h3 className="mt-5 text-2xl font-black leading-tight text-nest-teal">{option.title}</h3>
                  <p className="mt-3 leading-7 text-nest-ink/72">{option.text}</p>

                  <ul className="mt-4 grid gap-2 text-sm font-semibold text-nest-ink/75">
                    {option.bullets.map((bullet, index) => (
                      <motion.li
                        key={bullet}
                        className="flex gap-2"
                        animate={isSelected ? { x: [0, 4, 0] } : { x: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.26 }}
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-nest-gold/15 text-xs font-black text-nest-gold">✓</span>
                        <span>{bullet}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <motion.div
                  layout
                  className={`relative z-10 mt-6 flex w-full items-center justify-center rounded-full px-5 py-4 text-sm font-black shadow-soft transition-colors ${
                    isSelected
                      ? "bg-nest-gold text-white"
                      : "bg-nest-teal text-white group-hover:bg-nest-teal2 group-hover:tracking-wide"
                  }`}
                >
                  {isSelected ? "Selected — form shown below" : option.button}
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedOption ? (
          <motion.div
            key={selectedOption.key}
            className="mt-8"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="mb-4 flex flex-col gap-3 rounded-[1.5rem] border border-nest-gold/20 bg-nest-cream p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-nest-gold">Now showing</p>
                <p className="text-xl font-black text-nest-teal">{selectedOption.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-nest-teal/20 bg-white px-5 py-3 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold hover:text-nest-gold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nest-gold/20"
              >
                Change selection
              </button>
            </div>
            {selected === "helper" ? <HelperApplicationForm /> : <PartnerApplicationForm />}
          </motion.div>
        ) : (
          <motion.div
            key="empty-selection"
            className="mt-8 rounded-[1.5rem] border border-dashed border-nest-gold/45 bg-white/70 p-6 text-center text-sm font-semibold text-nest-ink/70"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            Select one of the two animated cards above to open the correct application form.
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function HelperApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ fullName:"", email:"", phone:"", city:"", availability:"", services:"", experience:"", transportation:"", backgroundConsent:false, references:"", notes:"" });
  const update = (name:string, value:unknown) => setForm(prev=>({...prev,[name]:value}));
  async function submit(e:React.FormEvent){
    e.preventDefault(); setStatus("loading"); setMessage("");
    try {
      const response = await fetch("/api/submit-helper-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Helper application failed");

      setStatus("success");
      setMessage("Application received. We’ll review it and follow up about next steps. Sensitive ID/background-check steps happen through secure providers, not this form.");
      setForm({ fullName:"", email:"", phone:"", city:"", availability:"", services:"", experience:"", transportation:"", backgroundConsent:false, references:"", notes:"" });
    }
    catch(err){ console.error(err); setStatus("error"); setMessage("Something went wrong. Please try again."); }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-5 shadow-soft backdrop-blur sm:p-8">
      <h2 className="text-2xl font-black text-nest-teal">Part-Time Helper Application</h2>
      <p className="text-nest-ink/70">For individuals interested in becoming a NestHelper Gold Star Checked helper.</p>
      <Grid>
        <Input label="Full name" value={form.fullName} onChange={(v)=>update('fullName',v)} required />
        <Input label="Phone" value={form.phone} onChange={(v)=>update('phone',v)} required />
        <Input label="Email" type="email" value={form.email} onChange={(v)=>update('email',v)} required />
        <Input label="City" value={form.city} onChange={(v)=>update('city',v)} required />
      </Grid>
      <Textarea label="Availability" value={form.availability} onChange={(v)=>update('availability',v)} placeholder="Days/times you could work" />
      <Textarea label="Services you’re comfortable with" value={form.services} onChange={(v)=>update('services',v)} placeholder="Home reset, laundry folding, errands, organizing, etc." />
      <Textarea label="Relevant experience" value={form.experience} onChange={(v)=>update('experience',v)} />
      <Input label="Reliable transportation?" value={form.transportation} onChange={(v)=>update('transportation',v)} placeholder="Yes/no/details" />
      <Textarea label="References" value={form.references} onChange={(v)=>update('references',v)} placeholder="Names/contact info or 'available upon request'" />
      <Textarea label="Anything else?" value={form.notes} onChange={(v)=>update('notes',v)} />
      <label className="flex gap-3 rounded-2xl bg-nest-cream p-4 text-sm font-semibold"><input type="checkbox" required className="mt-1" checked={form.backgroundConsent} onChange={(e)=>update('backgroundConsent',e.target.checked)} /> I understand Gold Star Checked onboarding may include identity review, background screening, references, service standards, and role-specific checks. I will not submit SSN/ID photos through this website form.</label>
      <Submit status={status}>Submit Helper Application</Submit>
      {message && <Message status={status}>{message}</Message>}
    </form>
  );
}

export function PartnerApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ businessName:"", ownerName:"", email:"", phone:"", serviceType:"", website:"", serviceArea:"", licenseInfo:"", insuranceInfo:"", capacity:"", notes:"", consent:false });
  const update = (name:string, value:unknown) => setForm(prev=>({...prev,[name]:value}));
  async function submit(e:React.FormEvent){
    e.preventDefault(); setStatus("loading"); setMessage("");
    try {
      const response = await fetch("/api/submit-partner-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Partner application failed");

      setStatus("success");
      setMessage("Partner application received. We’ll review service fit, standards, insurance/business information, and availability before next steps.");
      setForm({ businessName:"", ownerName:"", email:"", phone:"", serviceType:"", website:"", serviceArea:"", licenseInfo:"", insuranceInfo:"", capacity:"", notes:"", consent:false });
    }
    catch(err){ console.error(err); setStatus("error"); setMessage("Something went wrong. Please try again."); }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-5 shadow-soft backdrop-blur sm:p-8">
      <h2 className="text-2xl font-black text-nest-teal">Independent Contractor / Partner Provider Application</h2>
      <p className="text-nest-ink/70">For cleaners, laundromats, errand providers, and local businesses interested in partnering with NestHelper.</p>
      <Grid>
        <Input label="Business name" value={form.businessName} onChange={(v)=>update('businessName',v)} required />
        <Input label="Owner/contact name" value={form.ownerName} onChange={(v)=>update('ownerName',v)} required />
        <Input label="Phone" value={form.phone} onChange={(v)=>update('phone',v)} required />
        <Input label="Email" type="email" value={form.email} onChange={(v)=>update('email',v)} required />
      </Grid>
      <Input label="Service type" value={form.serviceType} onChange={(v)=>update('serviceType',v)} placeholder="Cleaning, laundromat, errands, organizing, etc." required />
      <Input label="Website/social link" value={form.website} onChange={(v)=>update('website',v)} />
      <Textarea label="Service area" value={form.serviceArea} onChange={(v)=>update('serviceArea',v)} />
      <Textarea label="Business license / UBI / insurance info" value={form.licenseInfo} onChange={(v)=>update('licenseInfo',v)} placeholder="Basic info only. We’ll request documents securely later if needed." />
      <Textarea label="Insurance / bonding details" value={form.insuranceInfo} onChange={(v)=>update('insuranceInfo',v)} />
      <Textarea label="Capacity and availability" value={form.capacity} onChange={(v)=>update('capacity',v)} />
      <Textarea label="Anything else?" value={form.notes} onChange={(v)=>update('notes',v)} />
      <label className="flex gap-3 rounded-2xl bg-nest-cream p-4 text-sm font-semibold"><input type="checkbox" required className="mt-1" checked={form.consent} onChange={(e)=>update('consent',e.target.checked)} /> I understand this application does not guarantee partnership. NestHelper may review business records, insurance, service quality, reliability, and customer standards.</label>
      <Submit status={status}>Submit Partner Application</Submit>
      {message && <Message status={status}>{message}</Message>}
    </form>
  );
}

function Input({label,value,onChange,type="text",required=false,placeholder=""}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean;placeholder?:string}){return <label className="grid gap-2"><span className="label">{label}</span><input type={type} required={required} value={value} placeholder={placeholder} onChange={(e)=>onChange(e.target.value)} className="input" /></label>}
function Textarea({label,value,onChange,placeholder=""}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string}){return <label className="grid gap-2"><span className="label">{label}</span><textarea value={value} placeholder={placeholder} onChange={(e)=>onChange(e.target.value)} className="input min-h-28" /></label>}
function Grid({children}:{children:React.ReactNode}){return <div className="grid gap-4 sm:grid-cols-2">{children}</div>}
function Submit({status,children}:{status:Status;children:React.ReactNode}){return <button disabled={status==="loading"} className="rounded-full bg-nest-teal px-6 py-4 font-black text-white shadow-soft transition hover:bg-nest-teal2 disabled:opacity-60">{status==="loading"?"Submitting...":children}</button>}
function Message({status,children}:{status:Status;children:React.ReactNode}){return <p className={`rounded-2xl p-4 font-semibold ${status==="success"?"bg-nest-mint/45 text-nest-teal":"bg-red-50 text-red-700"}`}>{children}</p>}
