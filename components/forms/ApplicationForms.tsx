"use client";

import { useState } from "react";
import { saveForm } from "@/lib/formHelpers";

type Status = "idle" | "loading" | "success" | "error";

export function HelperApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ fullName:"", email:"", phone:"", city:"", availability:"", services:"", experience:"", transportation:"", backgroundConsent:false, references:"", notes:"" });
  const update = (name:string, value:unknown) => setForm(prev=>({...prev,[name]:value}));
  async function submit(e:React.FormEvent){
    e.preventDefault(); setStatus("loading"); setMessage("");
    try { await saveForm("helperApplications", form); setStatus("success"); setMessage("Application received. We’ll review it and follow up about next steps. Sensitive ID/background-check steps happen through secure providers, not this form."); }
    catch(err){ console.error(err); setStatus("error"); setMessage("Something went wrong. Please try again."); }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[2rem] border border-nest-gold/20 bg-white p-5 shadow-soft sm:p-8">
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
    try { await saveForm("partnerApplications", form); setStatus("success"); setMessage("Partner application received. We’ll review service fit, standards, insurance/business information, and availability before next steps."); }
    catch(err){ console.error(err); setStatus("error"); setMessage("Something went wrong. Please try again."); }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[2rem] border border-nest-gold/20 bg-white p-5 shadow-soft sm:p-8">
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
