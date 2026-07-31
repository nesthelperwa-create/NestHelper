"use client";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { getIdToken } from "firebase/auth";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Copy, Loader2, Search } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";

type SmartLabelPack = {
  id: string;
  packId?: string;
  buyerEmail?: string;
  ownerEmail?: string;
  etsyOrderNumber?: string;
  sheetNumbers?: string;
  trackingNumber?: string;
  labelsPerKit?: number;
  kitQuantity?: number;
  purchasedQuantity?: number;
  claimedQuantity?: number;
  remainingQuantity?: number;
  status?: string;
  activationCodeLastFour?: string;
};

type CreateResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  activationCode?: string;
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function AdminSmartLabelPacksPage() {
  const [packs, setPacks] = useState<SmartLabelPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [createdActivationCode, setCreatedActivationCode] = useState("");
  const [queryText, setQueryText] = useState("");
  const [searchResults, setSearchResults] = useState<SmartLabelPack[]>([]);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [etsyOrderNumber, setEtsyOrderNumber] = useState("");
  const [sheetNumbers, setSheetNumbers] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [kitQuantity, setKitQuantity] = useState("1");

  useEffect(() => {
    const q = query(collection(firestoreDb, "smartLabelPacks"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setPacks(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<SmartLabelPack, "id">) })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Unable to load label packs. Check Firestore rules after deploy.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const displayed = useMemo(() => (searchResults.length ? searchResults : packs), [packs, searchResults]);

  async function createPack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setCreatedActivationCode("");
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("Sign back in to admin first.");
      const token = await getIdToken(user, true);
      const response = await fetch("/api/admin/smart-label-packs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ buyerEmail, etsyOrderNumber, sheetNumbers, trackingNumber, notes, kitQuantity, status: "shipped_unclaimed" }),
      });
      const result = (await response.json().catch(() => null)) as CreateResponse | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to create this label pack.");
      setMessage(result?.message || "Pack created.");
      setCreatedActivationCode(result?.activationCode || "");
      setBuyerEmail("");
      setEtsyOrderNumber("");
      setSheetNumbers("");
      setTrackingNumber("");
      setNotes("");
      setKitQuantity("1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create this label pack.");
    } finally {
      setBusy(false);
    }
  }

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("Sign back in to admin first.");
      const token = await getIdToken(user, true);
      const response = await fetch("/api/admin/smart-label-packs/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: queryText }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; packs?: SmartLabelPack[] } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to search packs.");
      setSearchResults(result.packs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to search packs.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePackStatus(id: string, nextStatus: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("Sign back in to admin first.");
      const token = await getIdToken(user, true);
      const response = await fetch("/api/admin/smart-label-packs/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; message?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to update pack.");
      setMessage(result?.message || "Pack updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update pack.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#b98a2f]">Smart Label Packs</p>
          <h2 className="mt-2 text-3xl font-bold text-[#075c58]">Create activation packs</h2>
          <p className="mt-2 text-slate-600">Create the Etsy order pack, copy the activation code, and include it with the shipped labels. One standard kit gives the customer 24 label claims.</p>

          <form onSubmit={createPack} className="mt-6 grid gap-4">
            <label className="block"><span className="text-sm font-semibold text-slate-700">Buyer email</span><input value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" placeholder="optional" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-semibold text-slate-700">Etsy order #</span><input value={etsyOrderNumber} onChange={(event) => setEtsyOrderNumber(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" placeholder="optional" /></label>
              <label className="block"><span className="text-sm font-semibold text-slate-700">Kit quantity</span><select value={kitQuantity} onChange={(event) => setKitQuantity(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]"><option value="1">1 kit (24 labels)</option><option value="2">2 kits (48 labels)</option><option value="3">3 kits (72 labels)</option><option value="4">4 kits (96 labels)</option></select></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-semibold text-slate-700">Sheet numbers</span><input value={sheetNumbers} onChange={(event) => setSheetNumbers(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" placeholder="optional" /></label>
              <label className="block"><span className="text-sm font-semibold text-slate-700">Tracking number</span><input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" placeholder="optional" /></label>
            </div>
            <label className="block"><span className="text-sm font-semibold text-slate-700">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-24 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" placeholder="optional order notes" /></label>
            <button disabled={busy} className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#075c58] px-5 py-3 font-bold text-white shadow-lg shadow-[#075c58]/20 transition-all hover:-translate-y-0.5 hover:bg-[#043f3c] hover:shadow-xl active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b98a2f]/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">{busy ? <Loader2 className="animate-spin" size={18} /> : "Create activation pack"}</button>
          </form>

          {(error || message || createdActivationCode) && <div className="mt-4 grid gap-3">{error && <div className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}{message && <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}{createdActivationCode && <div className="rounded-[1.4rem] border border-[#eadfc8] bg-[#fbf6ea] p-4"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Activation code — copy this now</p><div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="font-mono text-2xl font-bold text-[#075c58]">{createdActivationCode}</p><button type="button" onClick={async () => { const copied = await copyText(createdActivationCode); setMessage(copied ? "Activation code copied." : "Could not copy. Please select and copy manually."); }} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#075c58]/20 bg-white px-4 py-2 text-sm font-semibold text-[#075c58] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#075c58]/40 hover:bg-[#e9f4f1] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b98a2f]/50"><Copy size={16} /> Copy code</button></div></div>}</div>}
        </section>

        <section className="rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-bold uppercase tracking-[0.25em] text-[#b98a2f]">Recent packs</p><h2 className="mt-2 text-3xl font-bold text-[#075c58]">Track claimed vs remaining</h2></div>
            <form onSubmit={runSearch} className="flex w-full max-w-md items-center gap-2 rounded-full border border-[#eadfc8] px-3 py-2"><Search size={16} className="text-[#075c58]" /><input value={queryText} onChange={(event) => setQueryText(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search pack id, Etsy order, buyer email" /></form>
          </div>
          <div className="mt-5 grid gap-3">
            {loading ? <div className="rounded-2xl bg-[#fbf6ea] p-4 text-[#075c58]">Loading packs...</div> : displayed.length ? displayed.map((pack) => <div key={pack.id} className="rounded-[1.4rem] border border-[#eadfc8] bg-[#fbf6ea] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b98a2f]">{pack.status || "draft"}</p><h3 className="mt-1 text-xl font-bold text-[#075c58]">{pack.packId || pack.id}</h3></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => updatePackStatus(pack.id, "shipped_unclaimed")} className="cursor-pointer rounded-full border border-[#075c58]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#075c58] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#075c58]/40 hover:bg-[#e9f4f1] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b98a2f]/50">Mark shipped</button><button type="button" onClick={() => updatePackStatus(pack.id, "support_hold")} className="cursor-pointer rounded-full border border-[#075c58]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#075c58] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#075c58]/40 hover:bg-[#e9f4f1] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b98a2f]/50">Support hold</button></div></div><div className="mt-3 grid gap-1 text-sm text-slate-600"><p><span className="font-semibold text-slate-800">Etsy order:</span> {pack.etsyOrderNumber || "—"}</p><p><span className="font-semibold text-slate-800">Buyer:</span> {pack.buyerEmail || "—"}</p><p><span className="font-semibold text-slate-800">Owner:</span> {pack.ownerEmail || "Unclaimed"}</p><p><span className="font-semibold text-slate-800">Claimed:</span> {pack.claimedQuantity || 0} / {pack.purchasedQuantity || 0} &nbsp; <span className="font-semibold text-slate-800">Remaining:</span> {pack.remainingQuantity || 0}</p><p><span className="font-semibold text-slate-800">Activation code ending:</span> {pack.activationCodeLastFour || "—"}</p>{pack.sheetNumbers ? <p><span className="font-semibold text-slate-800">Sheet numbers:</span> {pack.sheetNumbers}</p> : null}{pack.trackingNumber ? <p><span className="font-semibold text-slate-800">Tracking:</span> {pack.trackingNumber}</p> : null}</div></div>) : <div className="rounded-2xl bg-[#fbf6ea] p-4 text-slate-600">No packs found.</div>}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
