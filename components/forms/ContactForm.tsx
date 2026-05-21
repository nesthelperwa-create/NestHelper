"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

const defaultForm = { name: "", email: "", phone: "", subject: "", message: "" };

export function ContactForm() {
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const update = (name: keyof typeof defaultForm, value: string) => setForm((prev) => ({ ...prev, [name]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/submit-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Contact submission failed");

      setStatus("success");
      setMessage("Message received. We’ll follow up as soon as we can.");
      setForm(defaultForm);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Something went wrong. Please try again or email NestHelper directly.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[2rem] border border-nest-gold/20 bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-black text-nest-teal">Send a message</h2>
      <input className="input" required placeholder="Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
      <input className="input" required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
      <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
      <input className="input" required placeholder="Subject" value={form.subject} onChange={(e) => update("subject", e.target.value)} />
      <textarea className="input min-h-32" required placeholder="How can we help?" value={form.message} onChange={(e) => update("message", e.target.value)} />
      <button className="rounded-full bg-nest-teal px-6 py-4 font-black text-white shadow-soft" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
      {message && <p className={`rounded-2xl p-4 font-semibold ${status === "success" ? "bg-nest-mint/45 text-nest-teal" : "bg-red-50 text-red-700"}`}>{message}</p>}
    </form>
  );
}
