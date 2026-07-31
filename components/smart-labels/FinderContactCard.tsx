"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, LocateFixed, Mail, MapPin, MessageCircle, Phone, Send, ShieldCheck, UserRound } from "lucide-react";

type FinderContactCardProps = {
  code: string;
  itemName: string;
  allowLocation: boolean;
};

type FinderForm = {
  finderName: string;
  finderEmail: string;
  finderPhone: string;
  message: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  consent: boolean;
  website: string;
};

const emptyForm: FinderForm = {
  finderName: "",
  finderEmail: "",
  finderPhone: "",
  message: "",
  locationText: "",
  latitude: null,
  longitude: null,
  consent: false,
  website: "",
};

export function FinderContactCard({ code, itemName, allowLocation }: FinderContactCardProps) {
  const [form, setForm] = useState<FinderForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function update<K extends keyof FinderForm>(key: K, value: FinderForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function useCurrentLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("Location sharing is not available in this browser. You can type a nearby address or landmark instead.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Math.round(position.coords.latitude * 1_000_000) / 1_000_000;
        const longitude = Math.round(position.coords.longitude * 1_000_000) / 1_000_000;
        setForm((previous) => ({
          ...previous,
          latitude,
          longitude,
          locationText: previous.locationText || "Current location shared from phone",
        }));
        setLocating(false);
      },
      () => {
        setError("Your location could not be added. You can type a nearby address or landmark instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/smart-labels/${encodeURIComponent(code)}/finder-contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; message?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to send your message.");
      setSent(true);
      setForm(emptyForm);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to send your message.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <section className="min-w-0 rounded-[1.8rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <div className="flex items-start gap-3 text-emerald-800">
          <div className="rounded-full bg-white p-2 shadow-sm"><CheckCircle2 size={22} /></div>
          <div className="min-w-0">
            <h3 className="break-words text-xl font-black">Message sent privately</h3>
            <p className="mt-2 break-words text-sm font-semibold leading-6">The message was saved for the owner. Their private email address and saved label contents were not shown.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.8rem] border border-nest-gold/16 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="shrink-0 rounded-2xl bg-nest-mint/35 p-3 text-nest-teal"><MessageCircle size={22} /></div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Private owner contact</p>
          <h3 className="mt-1 break-words text-xl font-black text-nest-teal">Send a message about {itemName || "this item"}</h3>
          <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">NestHelper will privately relay your message. The owner&apos;s email address, home location, notes, and label contents stay hidden.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 grid min-w-0 gap-4">
        <label className="grid min-w-0 gap-2">
          <span className="flex items-center gap-2 text-sm font-black text-nest-teal"><UserRound size={16} /> Your name</span>
          <input className="input min-w-0" autoComplete="name" maxLength={80} value={form.finderName} onChange={(event) => update("finderName", event.target.value)} placeholder="Your name" required />
        </label>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="grid min-w-0 gap-2">
            <span className="flex items-center gap-2 text-sm font-black text-nest-teal"><Mail size={16} /> Email</span>
            <input className="input min-w-0" type="email" inputMode="email" autoComplete="email" maxLength={160} value={form.finderEmail} onChange={(event) => update("finderEmail", event.target.value)} placeholder="you@example.com" />
          </label>
          <label className="grid min-w-0 gap-2">
            <span className="flex items-center gap-2 text-sm font-black text-nest-teal"><Phone size={16} /> Phone</span>
            <input className="input min-w-0" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} value={form.finderPhone} onChange={(event) => update("finderPhone", event.target.value)} placeholder="Phone number" />
          </label>
        </div>
        <p className="-mt-2 text-xs font-semibold leading-5 text-slate-500">Enter at least one way for the owner to respond: email or phone.</p>

        <label className="grid min-w-0 gap-2">
          <span className="flex items-center gap-2 text-sm font-black text-nest-teal"><MessageCircle size={16} /> Message to owner</span>
          <textarea className="input min-h-28 min-w-0" rows={4} maxLength={600} value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="I found this item near... Here is the best way to arrange a return." required />
          <span className="text-right text-xs font-semibold text-slate-400">{form.message.length}/600</span>
        </label>

        {allowLocation && (
          <div className="grid min-w-0 gap-3 rounded-2xl border border-nest-gold/14 bg-[#fbf6ea] p-4">
            <label className="grid min-w-0 gap-2">
              <span className="flex items-center gap-2 text-sm font-black text-nest-teal"><MapPin size={16} /> Where was it found? <span className="font-semibold text-slate-500">Optional</span></span>
              <input className="input min-w-0 bg-white" maxLength={240} value={form.locationText} onChange={(event) => update("locationText", event.target.value)} placeholder="Nearby address, park, business, or landmark" />
            </label>
            <button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-nest-teal/20 bg-white px-4 py-3 text-sm font-black text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-nest-teal/35 hover:bg-nest-mint/25 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60">
              {locating ? <Loader2 className="animate-spin" size={16} /> : <LocateFixed size={16} />} {form.latitude !== null ? "Current location added" : "Use my current location"}
            </button>
          </div>
        )}

        <label className="flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border border-nest-gold/14 bg-[#fbf6ea] p-4 text-sm font-semibold leading-6 text-slate-700">
          <input type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#075c58]" required />
          <span className="min-w-0 break-words">I understand NestHelper will privately relay my contact information and message to the label owner. NestHelper does not verify either party or arrange the return.</span>
        </label>

        <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          Website
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} />
        </label>

        {error && <div className="min-w-0 break-words rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{error}</div>}

        <button type="submit" disabled={busy} className="btn-primary w-full min-w-0 justify-center whitespace-normal text-center disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Send private message to owner
        </button>

        <div className="flex min-w-0 items-start gap-2 text-xs font-semibold leading-5 text-slate-500">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-nest-teal" />
          <span className="min-w-0 break-words">For safety, do not include passwords, payment information, door codes, or other sensitive information.</span>
        </div>
      </form>
    </section>
  );
}
