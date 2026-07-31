"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, PackageSearch, Search } from "lucide-react";
import { CustomerAuthCard, getUserToken, SignedInBadge, useCustomerAuth } from "@/components/smart-labels/SmartLabelsAuth";
import { SmartLabelsShell } from "@/components/smart-labels/SmartLabelsShell";
import type { DashboardLabel } from "@/components/smart-labels/MyLabelsDashboard";

export default function FindMyItemPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<DashboardLabel[]>([]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await getUserToken(user);
      const response = await fetch(`/api/smart-labels/search?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; labels?: DashboardLabel[] } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to search your labels.");
      setResults(result.labels || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to search your labels.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SmartLabelsShell title="Find My Item" subtitle="Search your saved labels to see which box, bin, or tote has what you need.">
      {authLoading ? (
        <div className="grid place-items-center py-16"><div className="flex items-center gap-3 rounded-3xl bg-white px-5 py-4 font-black text-nest-teal shadow-soft"><Loader2 className="animate-spin" size={18} /> Loading account…</div></div>
      ) : !user ? (
        <CustomerAuthCard title="Sign in to use Find My Item" subtitle="Search works across labels you already own. Sign in first, then search by item name, label name, or location." compact />
      ) : (
        <div className="grid gap-5">
          <div className="flex justify-end"><SignedInBadge user={user} /></div>
          <section className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
            <form onSubmit={search} className="grid gap-4">
              <div>
                <h2 className="text-2xl font-black text-nest-teal">Search My Labels</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Search label name, location, contents, or notes. Example: <span className="font-black">work gloves</span>.</p>
              </div>
              <div className="flex items-center gap-3 rounded-[1.3rem] border border-nest-gold/16 bg-nest-cream/50 px-4 py-3">
                <Search size={18} className="text-nest-teal" />
                <input className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="work gloves" />
              </div>
              <button type="submit" disabled={loading || !query.trim()} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <PackageSearch size={18} />} Search My Labels
              </button>
            </form>
            {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
          </section>

          {results.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-2">
              {results.map((label) => (
                <Link key={label.code} href={`/my-labels/label/${encodeURIComponent(label.code)}`} className="group cursor-pointer rounded-[1.6rem] border border-nest-gold/14 bg-white p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-nest-teal/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">Found in</p>
                      <h3 className="mt-1 text-xl font-black text-nest-teal">{label.labelName || label.code}</h3>
                    </div>
                    <span className="rounded-full bg-nest-mint/35 px-3 py-1 text-xs font-black text-nest-teal">{label.code}</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-slate-600">
                    <p><span className="font-black text-slate-800">Location:</span> {label.locationName || "Not saved yet"}</p>
                    <p><span className="font-black text-slate-800">Container:</span> {label.containerType || "Not saved yet"}</p>
                    <p><span className="font-black text-slate-800">Collection:</span> {label.collectionName || "Not assigned"}</p>
                    <p><span className="font-black text-slate-800">Contents preview:</span> {label.contentsPreview || "No contents saved yet."}</p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-nest-teal transition-transform group-hover:translate-x-1">Open label <ArrowRight size={14} /></span>
                </Link>
              ))}
            </section>
          ) : query.trim() && !loading ? (
            <section className="rounded-[1.8rem] border border-dashed border-nest-gold/18 bg-white p-8 text-center shadow-soft">
              <PackageSearch className="mx-auto text-nest-teal" size={28} />
              <h3 className="mt-3 text-xl font-black text-nest-teal">No matching labels found. Try another item name.</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">Try a different keyword, location, or label name.</p>
            </section>
          ) : null}
        </div>
      )}
    </SmartLabelsShell>
  );
}
