"use client";

import { CheckCircle2, ExternalLink, Mail, MapPin, MessageCircle, Phone, RotateCcw, UserRound } from "lucide-react";

export type FinderMessage = {
  id: string;
  labelCode: string;
  publicItemName: string;
  finderName: string;
  finderEmail: string;
  finderPhone: string;
  message: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  status: "new" | "read" | "resolved";
  createdAtIso: string;
  updatedAtIso: string;
  resolvedAtIso: string;
  emailDeliveryStatus: string;
};

function formatDate(value: string) {
  if (!value) return "Recently received";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently received";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapUrl(message: FinderMessage) {
  if (message.latitude === null || message.longitude === null) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(`${message.latitude},${message.longitude}`)}`;
}

export function FinderMessagesPanel({
  messages,
  loading,
  busyId,
  onStatusChange,
}: {
  messages: FinderMessage[];
  loading: boolean;
  busyId: string;
  onStatusChange: (messageId: string, status: "read" | "resolved") => void;
}) {
  const activeCount = messages.filter((message) => message.status !== "resolved").length;

  return (
    <section className="min-w-0 rounded-[1.8rem] border border-nest-gold/16 bg-white p-4 shadow-soft sm:p-5">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">Private finder inbox</p>
          <h3 className="mt-1 break-words text-xl font-black text-nest-teal">Finder messages</h3>
          <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">Messages appear here and are also emailed to the account address. Your email, saved contents, notes, and home location are never shown on the public scan page.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-nest-mint/35 px-3 py-2 text-xs font-black text-nest-teal"><MessageCircle size={14} /> {activeCount} active</span>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl bg-[#fbf6ea] px-4 py-5 text-center text-sm font-black text-nest-teal">Loading finder messages…</div>
      ) : messages.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-nest-gold/20 bg-[#fbf6ea] p-5 text-center">
          <MessageCircle className="mx-auto text-nest-teal" size={24} />
          <h4 className="mt-3 font-black text-nest-teal">No finder messages yet</h4>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">When someone scans this label and sends a private message, it will appear here.</p>
        </div>
      ) : (
        <div className="mt-5 grid min-w-0 gap-4">
          {messages.map((finderMessage) => {
            const locationMapUrl = mapUrl(finderMessage);
            const resolved = finderMessage.status === "resolved";
            return (
              <article key={finderMessage.id} className={`min-w-0 rounded-[1.5rem] border p-4 ${resolved ? "border-slate-200 bg-slate-50" : "border-nest-gold/16 bg-[#fbf6ea]"}`}>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <UserRound size={17} className="shrink-0 text-nest-teal" />
                      <h4 className="min-w-0 break-words font-black text-nest-teal">{finderMessage.finderName || "Finder"}</h4>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(finderMessage.createdAtIso)}</p>
                  </div>
                  <span className={`inline-flex shrink-0 self-start rounded-full px-3 py-1 text-xs font-black ${resolved ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-800"}`}>{resolved ? "Resolved" : "Needs follow-up"}</span>
                </div>

                <div className="mt-4 min-w-0 rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
                  <p className="whitespace-pre-wrap break-words">{finderMessage.message}</p>
                </div>

                {(finderMessage.emailDeliveryStatus === "failed" || finderMessage.emailDeliveryStatus === "skipped") && (
                  <div className="mt-4 min-w-0 break-words rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">The email alert was not delivered, but this message is saved securely in your dashboard.</div>
                )}

                <div className="mt-4 grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                  {finderMessage.finderEmail && <a className="inline-flex min-w-0 cursor-pointer items-center gap-2 break-all text-nest-teal underline decoration-nest-gold/50 underline-offset-4 hover:text-nest-teal3" href={`mailto:${finderMessage.finderEmail}?subject=${encodeURIComponent(`NestHelper Smart Label ${finderMessage.labelCode}`)}`}><Mail size={16} className="shrink-0" /> {finderMessage.finderEmail}</a>}
                  {finderMessage.finderPhone && <a className="inline-flex min-w-0 cursor-pointer items-center gap-2 break-words text-nest-teal underline decoration-nest-gold/50 underline-offset-4 hover:text-nest-teal3" href={`tel:${finderMessage.finderPhone.replace(/[^+\d]/g, "")}`}><Phone size={16} className="shrink-0" /> {finderMessage.finderPhone}</a>}
                  {finderMessage.locationText && <p className="flex min-w-0 items-start gap-2"><MapPin size={16} className="mt-1 shrink-0 text-nest-teal" /><span className="min-w-0 break-words">{finderMessage.locationText}</span></p>}
                  {locationMapUrl && <a className="inline-flex cursor-pointer items-center gap-2 text-nest-teal underline decoration-nest-gold/50 underline-offset-4 hover:text-nest-teal3" href={locationMapUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open shared location</a>}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {resolved ? (
                    <button type="button" onClick={() => onStatusChange(finderMessage.id, "read")} disabled={busyId === finderMessage.id} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-nest-teal/20 bg-white px-4 py-3 text-sm font-black text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:bg-nest-mint/25 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"><RotateCcw size={16} /> Reopen message</button>
                  ) : (
                    <button type="button" onClick={() => onStatusChange(finderMessage.id, "resolved")} disabled={busyId === finderMessage.id} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-nest-teal px-4 py-3 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-nest-teal3 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle2 size={16} /> Mark resolved</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
