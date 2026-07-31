"use client";

import { useEffect, useState } from "react";
import { Layers3, Loader2, PackagePlus } from "lucide-react";
import { CustomerAuthCard, getUserToken, SignedInBadge, useCustomerAuth } from "@/components/smart-labels/SmartLabelsAuth";
import { SmartLabelsShell } from "@/components/smart-labels/SmartLabelsShell";
import type { DashboardLabel } from "@/components/smart-labels/MyLabelsDashboard";

type DashboardResponse = {
  ok?: boolean;
  error?: string;
  labels: DashboardLabel[];
  packs: Array<{ id: string; packId: string; activationCodeLastFour: string; buyerEmail: string; ownerEmail: string; etsyOrderNumber: string; sheetNumbers: string; trackingNumber: string; purchasedQuantity: number; claimedQuantity: number; remainingQuantity: number; status: string; }>;
  collections: Array<{ id: string; collectionId: string; name: string; description: string }>;
};

export default function LabelSetsPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getUserToken(user);
      const response = await fetch("/api/smart-labels/dashboard", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = (await response.json().catch(() => null)) as DashboardResponse | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to load your label sets.");
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your label sets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
    else setData(null);
  }, [user]);

  async function createCollection(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const token = await getUserToken(user);
      const response = await fetch("/api/smart-labels/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string; message?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to create this collection.");
      setMessage(result?.message || "Collection created.");
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create this collection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SmartLabelsShell title="Label Sets & Collections" subtitle="Review your activated packs, create collection groups, and see how many labels you still have ready to claim.">
      {authLoading ? (
        <div className="grid place-items-center py-16"><div className="flex items-center gap-3 rounded-3xl bg-white px-5 py-4 font-black text-nest-teal shadow-soft"><Loader2 className="animate-spin" size={18} /> Loading account…</div></div>
      ) : !user ? (
        <CustomerAuthCard title="Sign in to manage your label sets" subtitle="Label sets keep your Etsy purchase history and storage collections organized in one place." compact />
      ) : (
        <div className="grid gap-5">
          <div className="flex justify-end"><SignedInBadge user={user} /></div>
          {(error || message) && (
            <div className="grid gap-3">
              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
              {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>}
            </div>
          )}
          <section className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3 text-nest-teal"><Layers3 size={20} /><h2 className="text-xl font-black">Activated label packs</h2></div>
              <p className="mt-2 text-sm font-semibold text-slate-600">Each pack represents an Etsy order or activation card. One standard kit gives you 24 label claims.</p>
              <div className="mt-4 grid gap-3">
                {(data?.packs || []).length ? data?.packs.map((pack) => (
                  <div key={pack.id} className="rounded-[1.4rem] border border-nest-gold/14 bg-[#fbf6ea] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">{pack.status.replace(/_/g, " ")}</p>
                        <h3 className="mt-1 text-lg font-black text-nest-teal">{pack.packId}</h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-nest-teal shadow-sm">{pack.remainingQuantity} left</span>
                    </div>
                    <div className="mt-3 grid gap-1 text-sm font-semibold text-slate-600">
                      <p><span className="font-black text-slate-800">Etsy order:</span> {pack.etsyOrderNumber || "Not saved"}</p>
                      <p><span className="font-black text-slate-800">Claimed:</span> {pack.claimedQuantity} of {pack.purchasedQuantity}</p>
                      <p><span className="font-black text-slate-800">Activation code ending:</span> {pack.activationCodeLastFour || "—"}</p>
                      {pack.sheetNumbers && <p><span className="font-black text-slate-800">Sheet numbers:</span> {pack.sheetNumbers}</p>}
                      {pack.trackingNumber && <p><span className="font-black text-slate-800">Tracking:</span> {pack.trackingNumber}</p>}
                    </div>
                  </div>
                )) : <div className="rounded-[1.4rem] border border-dashed border-nest-gold/18 bg-nest-cream/50 p-5 text-sm font-semibold text-slate-600">No packs yet. Activate the code card included with your order to begin.</div>}
              </div>
            </div>
            <div className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-black text-nest-teal">Create a collection</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">Collections help separate labels by space, project, or family need. Example: Garage, Holiday Decor, or Travel Items.</p>
              <form onSubmit={createCollection} className="mt-4 grid gap-3">
                <input className="input" placeholder="Garage" value={name} onChange={(event) => setName(event.target.value)} />
                <textarea className="input min-h-28" placeholder="Optional description" value={description} onChange={(event) => setDescription(event.target.value)} />
                <button type="submit" disabled={busy} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={18} /> : <PackagePlus size={18} />} Create collection</button>
              </form>
              <div className="mt-5 grid gap-3">
                {(data?.collections || []).length ? data?.collections.map((collection) => (
                  <div key={collection.id} className="rounded-[1.2rem] border border-nest-gold/14 bg-[#fbf6ea] p-4">
                    <h3 className="text-base font-black text-nest-teal">{collection.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{collection.description || "No description added."}</p>
                  </div>
                )) : <p className="text-sm font-semibold text-slate-500">No collections yet.</p>}
              </div>
            </div>
          </section>
          {loading && <div className="text-sm font-semibold text-slate-500">Refreshing…</div>}
        </div>
      )}
    </SmartLabelsShell>
  );
}
