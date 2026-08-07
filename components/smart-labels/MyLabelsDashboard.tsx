"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Boxes, Layers3, Loader2, MessageCircle, PackagePlus, ScanLine, Search, ShieldAlert, Sparkles } from "lucide-react";
import { CustomerAuthCard, getUserToken, SignedInBadge, useCustomerAuth } from "@/components/smart-labels/SmartLabelsAuth";
import type { SmartLabelPhoto } from "@/lib/smartLabels";
import { SmartLabelsShell } from "@/components/smart-labels/SmartLabelsShell";

export type DashboardLabel = {
  code: string;
  labelUrl: string;
  labelName: string;
  locationName: string;
  itemsInside: string;
  notes: string;
  photos: SmartLabelPhoto[];
  collectionId: string;
  collectionName: string;
  containerType: string;
  useMode: "storage" | "lost_and_found";
  lostStatus: "not_lost" | "lost" | "recovered";
  publicItemName: string;
  publicMessage: string;
  allowFinderContact: boolean;
  allowFinderLocation: boolean;
  searchText: string;
  archived: boolean;
  updatedAtIso: string;
  contentsPreview: string;
  status: string;
  finderMessageCount: number;
  unreadFinderMessageCount: number;
  lastFinderMessageAtIso: string;
};

type DashboardResponse = {
  ok?: boolean;
  error?: string;
  account?: { email: string; uid: string };
  labels: DashboardLabel[];
  packs: Array<{ id: string; packId: string; purchasedQuantity: number; remainingQuantity: number; claimedQuantity: number; status: string; activationCodeLastFour: string; etsyOrderNumber: string; }>; 
  collections: Array<{ id: string; collectionId: string; name: string; description: string }>;
  summary: {
    purchasedLabels: number;
    claimedLabels: number;
    remainingLabels: number;
    counts: { all: number; storage: number; lostAndFound: number; archived: number };
  };
};

function formatUpdated(value?: string) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return `Updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export default function MyLabelsDashboard() {
  const { user, loading: authLoading } = useCustomerAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "storage" | "lost" | "archived">("all");
  const [query, setQuery] = useState("");

  async function loadDashboard() {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await getUserToken(user);
      const response = await fetch("/api/smart-labels/dashboard", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = (await response.json().catch(() => null)) as DashboardResponse | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to load your labels.");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your labels.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadDashboard();
    else setData(null);
  }, [user]);

  async function handleActivation(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const token = await getUserToken(user);
      const response = await fetch("/api/smart-labels/activate-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activationCode }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string; message?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to activate this pack.");
      setMessage(result?.message || "Your pack is active.");
      setActivationCode("");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to activate this pack.");
    } finally {
      setBusy(false);
    }
  }

  const filteredLabels = useMemo(() => {
    const labels = data?.labels || [];
    const term = query.trim().toLowerCase();
    return labels.filter((label) => {
      if (filter === "storage" && label.useMode !== "storage") return false;
      if (filter === "lost" && label.useMode !== "lost_and_found") return false;
      if (filter === "archived" && !label.archived) return false;
      if (filter !== "archived" && filter !== "all" && label.archived) return false;
      if (filter === "all" && label.archived) return false;
      if (!term) return true;
      return [label.code, label.labelName, label.collectionName, label.locationName, label.contentsPreview, label.containerType].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [data?.labels, filter, query]);

  return (
    <SmartLabelsShell title="My Labels" subtitle="Claim your label pack, add labels as you scan them, and keep every box, bin, or tote easy to find later.">
      {authLoading ? (
        <div className="grid place-items-center py-16"><div className="flex items-center gap-3 rounded-3xl bg-white px-5 py-4 font-black text-nest-teal shadow-soft"><Loader2 className="animate-spin" size={18} /> Loading account…</div></div>
      ) : !user ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
          <CustomerAuthCard />
          <section className="rounded-[1.8rem] border border-nest-gold/16 bg-gradient-to-br from-white via-nest-cream to-nest-mint/16 p-6 shadow-soft">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">How it works</p>
            <ol className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-700">
              <li className="rounded-2xl bg-white/80 p-4"><span className="font-black text-nest-teal">1.</span> Sign in and activate the code that came with your Etsy order.</li>
              <li className="rounded-2xl bg-white/80 p-4"><span className="font-black text-nest-teal">2.</span> Scan any unclaimed NestHelper Smart Label from your pack.</li>
              <li className="rounded-2xl bg-white/80 p-4"><span className="font-black text-nest-teal">3.</span> Name the label, save the contents, and find it later with Find My Item.</li>
            </ol>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"><ShieldAlert className="mr-2 inline-block" size={16} /> Do not store passwords, financial information, security codes, or other sensitive private information in label notes.</div>
          </section>
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
            <section className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">Welcome back</p>
                  <h2 className="mt-1 text-2xl font-black text-nest-teal">Your Smart Label dashboard</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-600">Most families scan a new sticker, tap Add Label, then fill in the box name, location, and contents.</p>
                </div>
                <SignedInBadge user={user} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatCard label="Purchased" value={String(data?.summary.purchasedLabels || 0)} helper="Total label credits" icon={<Boxes size={18} />} />
                <StatCard label="Added" value={String(data?.summary.claimedLabels || 0)} helper="Labels already claimed" icon={<PackagePlus size={18} />} />
                <StatCard label="Remaining" value={String(data?.summary.remainingLabels || 0)} helper="Ready for scanning" icon={<Sparkles size={18} />} />
              </div>
            </section>

            <section className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">Activate a new pack</p>
              <h3 className="mt-1 text-xl font-black text-nest-teal">Enter your activation code</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Bought another 24-label pack? Redeem the activation code included with that order. Multiple packs add to the same account.</p>
              <form onSubmit={handleActivation} className="mt-4 grid gap-3">
                <input className="input font-mono tracking-[0.18em]" value={activationCode} onChange={(event) => setActivationCode(event.target.value.toUpperCase())} placeholder="NH-7K3P9Q" />
                <button type="submit" disabled={busy} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60">
                  {busy ? <Loader2 className="animate-spin" size={18} /> : <PackagePlus size={18} />} Activate label pack
                </button>
              </form>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">After activation, scan any unclaimed NestHelper label from your package to add it to your dashboard.</p>
            </section>
          </div>

          {(error || message) && (
            <div className="grid gap-3">
              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
              {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>}
            </div>
          )}

          <section className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-black text-nest-teal">Your labels</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">Use the tabs below to separate storage labels, lost-and-found labels, and archived labels.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ["all", `All (${data?.summary.counts.all || 0})`],
                  ["storage", `Storage (${data?.summary.counts.storage || 0})`],
                  ["lost", `Lost & Found (${data?.summary.counts.lostAndFound || 0})`],
                  ["archived", `Archived (${data?.summary.counts.archived || 0})`],
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setFilter(value)} className={`cursor-pointer rounded-full px-4 py-2 text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/50 ${filter === value ? "bg-nest-teal text-white shadow-md hover:-translate-y-0.5 hover:bg-nest-teal3" : "border border-nest-gold/20 bg-white text-nest-teal shadow-sm hover:-translate-y-0.5 hover:border-nest-teal/30 hover:bg-nest-mint/30 hover:shadow-md"}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-[1.2rem] border border-nest-gold/14 bg-nest-cream/60 px-4 py-3">
              <Search size={18} className="text-nest-teal" />
              <input className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" placeholder="Search label name, location, contents, or collection..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            {loading ? (
              <div className="grid place-items-center py-12"><div className="flex items-center gap-3 rounded-3xl bg-[#fbf6ea] px-5 py-4 font-black text-nest-teal"><Loader2 className="animate-spin" size={18} /> Loading labels…</div></div>
            ) : filteredLabels.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredLabels.map((label) => (
                  <Link key={label.code} href={`/my-labels/label/${encodeURIComponent(label.code)}`} className="group cursor-pointer rounded-[1.5rem] border border-nest-gold/14 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-nest-teal/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">{label.useMode === "lost_and_found" ? "Lost & Found" : "Storage"}</p>
                        <h4 className="mt-1 text-lg font-black text-nest-teal">{label.labelName || label.publicItemName || label.code}</h4>
                      </div>
                      <span className="rounded-full bg-nest-mint/35 px-3 py-1 text-xs font-black text-nest-teal">{label.code}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
                      {label.collectionName && <p><span className="font-black text-slate-800">Collection:</span> {label.collectionName}</p>}
                      {label.locationName && <p><span className="font-black text-slate-800">Location:</span> {label.locationName}</p>}
                      {label.containerType && <p><span className="font-black text-slate-800">Container:</span> {label.containerType}</p>}
                      <p className="line-clamp-3">{label.contentsPreview || "No contents saved yet."}</p>
                    </div>
                    {label.unreadFinderMessageCount > 0 && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-xs font-black text-amber-800">
                        <MessageCircle size={14} /> {label.unreadFinderMessageCount} new finder {label.unreadFinderMessageCount === 1 ? "message" : "messages"}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between text-xs font-black text-slate-500">
                      <span>{formatUpdated(label.updatedAtIso)}</span>
                      <span className="inline-flex items-center gap-1 text-nest-teal group-hover:translate-x-0.5 transition">Open <ArrowRight size={14} /></span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.6rem] border border-dashed border-nest-gold/18 bg-nest-cream/50 p-8 text-center">
                <ScanLine className="mx-auto text-nest-teal" size={28} />
                <h4 className="mt-3 text-lg font-black text-nest-teal">No labels here yet</h4>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Activate a label pack, then scan a NestHelper Smart Label with your phone camera to add it to your dashboard.</p>
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <QuickLink href="/my-labels/find" title="Find My Item" body="Search your saved labels to see which box, bin, or tote has what you need." />
            <QuickLink href="/my-labels/sets" title="Label Sets & Collections" body="Review your activated packs, collection groups, and remaining label counts." icon={<Layers3 size={18} />} />
          </section>
        </div>
      )}
    </SmartLabelsShell>
  );
}

function StatCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.4rem] border border-nest-gold/14 bg-[#fbf6ea] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-nest-teal">{label}</p>
        <div className="rounded-full bg-white p-2 text-nest-teal shadow-sm">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function QuickLink({ href, title, body, icon = <Search size={18} /> }: { href: string; title: string; body: string; icon?: React.ReactNode }) {
  return (
    <Link href={href} className="group cursor-pointer rounded-[1.7rem] border border-nest-gold/16 bg-white p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-nest-teal/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/50">
      <div className="flex items-center gap-3 text-nest-teal">
        <div className="rounded-full bg-nest-mint/35 p-2">{icon}</div>
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-nest-teal transition-transform group-hover:translate-x-1">Open <ArrowRight size={14} /></span>
    </Link>
  );
}
