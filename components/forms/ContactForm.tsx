"use client";

import { useState } from "react";
import type { FormEvent, HTMLAttributes } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";

type Status = "idle" | "loading" | "success" | "error";

const defaultForm = { name: "", email: "", phone: "", subject: "", message: "" };

export function ContactForm() {
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const update = (name: keyof typeof defaultForm, value: string) => setForm((prev) => ({ ...prev, [name]: value }));

  async function submit(e: FormEvent) {
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
    <form onSubmit={submit} className="overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/90 shadow-soft backdrop-blur">
      <div className="bg-gradient-to-br from-nest-cream via-white to-nest-mint/30 p-6 sm:p-8">
        <div className="inline-flex rounded-2xl bg-white p-3 text-nest-teal shadow-sm">
          <MessageCircle />
        </div>
        <h2 className="mt-4 text-2xl font-black text-nest-teal sm:text-3xl">Send a message</h2>
        <p className="mt-2 leading-7 text-nest-ink/68">
          Ask a quick question or tell us what you are trying to figure out before submitting a request.
        </p>
      </div>

      <div className="grid gap-5 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" required value={form.name} onChange={(value) => update("name", value)} autoComplete="name" />
          <Input label="Phone" value={form.phone} onChange={(value) => update("phone", formatPhoneNumber(value))} inputMode="tel" autoComplete="tel" placeholder="555-555-5555" />
          <Input label="Email" required type="email" value={form.email} onChange={(value) => update("email", value)} autoComplete="email" />
          <Input label="Subject" required value={form.subject} onChange={(value) => update("subject", value)} />
        </div>
        <label className="grid gap-2">
          <span className="label">How can we help?</span>
          <textarea className="input min-h-36" required placeholder="Tell us what you’re looking for, where you’re located, or what question you have." value={form.message} onChange={(e) => update("message", e.target.value)} />
        </label>
        <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-4 font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift disabled:opacity-60" disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : "Send Message"}
          {status !== "loading" && <ArrowRight size={18} />}
        </button>
        {message && <p className={`rounded-2xl p-4 font-semibold ${status === "success" ? "bg-nest-mint/45 text-nest-teal" : "bg-red-50 text-red-700"}`}>{message}</p>}
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <input
        className="input"
        required={required}
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
