"use client";

import { useState } from "react";
import { saveForm } from "@/lib/formHelpers";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle");
  const update = (name:string,value:string) => setForm(prev=>({...prev,[name]:value}));
  async function submit(e:React.FormEvent){ e.preventDefault(); setStatus("loading"); await saveForm("contactMessages", form); setStatus("success"); }
  return <form onSubmit={submit} className="grid gap-4 rounded-[2rem] border border-nest-gold/20 bg-white p-6 shadow-soft">
    <h2 className="text-2xl font-black text-nest-teal">Send a message</h2>
    <input className="input" required placeholder="Name" value={form.name} onChange={(e)=>update('name',e.target.value)} />
    <input className="input" required type="email" placeholder="Email" value={form.email} onChange={(e)=>update('email',e.target.value)} />
    <input className="input" placeholder="Phone" value={form.phone} onChange={(e)=>update('phone',e.target.value)} />
    <textarea className="input min-h-32" required placeholder="How can we help?" value={form.message} onChange={(e)=>update('message',e.target.value)} />
    <button className="rounded-full bg-nest-teal px-6 py-4 font-black text-white shadow-soft" disabled={status==="loading"}>{status==="success"?"Message Sent":"Send Message"}</button>
  </form>
}
