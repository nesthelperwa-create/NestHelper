"use client";

import Link from "next/link";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getIdToken } from "firebase/auth";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Search,
  Undo2,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { getSmartLabelQrImageUrl, getSmartLabelUrl } from "@/lib/smartLabels";

type SmartLabelBatch = {
  id: string;
  batchId?: string;
  batchName?: string;
  customerName?: string;
  customerEmail?: string;
  quantity?: number;
  labelCount?: number;
  status?: string;
  codes?: string[];
  printPath?: string;
  notes?: string;
  createdAt?: { toDate?: () => Date; seconds?: number };
  createdAtIso?: string;
  updatedAt?: { toDate?: () => Date; seconds?: number };
};

type SmartLabelAdmin = {
  id: string;
  code?: string;
  labelUrl?: string;
  publicUrl?: string;
  sequence?: number;
  labelIndex?: number;
  batchId?: string;
  batchName?: string;
  customerName?: string;
  customerEmail?: string;
  labelName?: string;
  locationName?: string;
  location?: string;
  itemsInside?: string;
  notes?: string;
  photos?: unknown[];
  pinEnabled?: boolean;
  status?: string;
  updatedAt?: { toDate?: () => Date; seconds?: number };
};

type GeneratedBatchResponse = {
  ok?: boolean;
  error?: string;
  batchId?: string;
  batchName?: string;
  quantity?: number;
  codes?: string[];
  printPath?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getCode(label: SmartLabelAdmin) {
  return (label.code || label.id || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function getLabelUrl(label: SmartLabelAdmin) {
  const code = getCode(label);
  return getString(label.labelUrl) || getString(label.publicUrl) || getSmartLabelUrl(code);
}

function getBatchDate(batch: SmartLabelBatch) {
  const date = batch.createdAt?.toDate?.() || (typeof batch.createdAt?.seconds === "number" ? new Date(batch.createdAt.seconds * 1000) : null) || (batch.createdAtIso ? new Date(batch.createdAtIso) : null);
  if (!date || Number.isNaN(date.getTime())) return "Just created";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getUpdatedDate(label: SmartLabelAdmin) {
  const date = label.updatedAt?.toDate?.() || (typeof label.updatedAt?.seconds === "number" ? new Date(label.updatedAt.seconds * 1000) : null);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function hasLabelContent(label: SmartLabelAdmin) {
  return Boolean(label.labelName || label.locationName || label.location || label.itemsInside || label.notes || (Array.isArray(label.photos) && label.photos.length > 0));
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminSmartLabelsPage() {
  const [batchName, setBatchName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("Weather-resistant sticker set. Default no PIN unless customer turns one on.");
  const [quantity, setQuantity] = useState("45");
  const [batches, setBatches] = useState<SmartLabelBatch[]>([]);
  const [labels, setLabels] = useState<SmartLabelAdmin[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastPrintPath, setLastPrintPath] = useState("");

  useEffect(() => {
    const q = query(collection(firestoreDb, "smartLabelBatches"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<SmartLabelBatch, "id">) }));
        setBatches(next);
        setSelectedBatchId((current) => {
          if (current && next.some((batch) => batch.id === current)) return current;
          return next[0]?.id || "";
        });
        setLoadingBatches(false);
      },
      (err) => {
        console.error(err);
        setError("Unable to load smart label sheets. Deploy Firestore rules if this is the first Smart Labels update.");
        setLoadingBatches(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedBatchId) {
      setLabels([]);
      setLoadingLabels(false);
      return undefined;
    }

    setLoadingLabels(true);
    const q = query(collection(firestoreDb, "smartLabels"), where("batchId", "==", selectedBatchId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<SmartLabelAdmin, "id">) }));
        next.sort((a, b) => Number(a.sequence || a.labelIndex || 0) - Number(b.sequence || b.labelIndex || 0));
        setLabels(next);
        setLoadingLabels(false);
      },
      (err) => {
        console.error(err);
        setError("Unable to load labels for this sheet. Check Firestore rules after deploy.");
        setLoadingLabels(false);
      }
    );
    return () => unsub();
  }, [selectedBatchId]);

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) || null;
  const quantityHelp = useMemo(() => {
    const count = Number(quantity) || 45;
    if (count < 30) return "Good for a sample or test sheet before ordering stickers.";
    if (count > 45) return "Large internal batch. Sticker sheets usually work best at 30–45 labels.";
    return "Ready for a weather-resistant sticker sheet order.";
  }, [quantity]);

  const filteredLabels = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return labels;
    return labels.filter((label) =>
      [getCode(label), label.labelName, label.locationName, label.location, label.itemsInside, label.notes, label.customerName, label.batchName]
        .some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [labels, search]);

  const stats = useMemo(() => {
    const activeCount = labels.filter((label) => (label.status || "Ready") !== "Archived").length;
    const filledCount = labels.filter(hasLabelContent).length;
    const pinCount = labels.filter((label) => label.pinEnabled).length;
    const photoCount = labels.reduce((total, label) => total + (Array.isArray(label.photos) ? label.photos.length : 0), 0);
    return { activeCount, filledCount, pinCount, photoCount };
  }, [labels]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    setLastPrintPath("");

    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("Sign back in to admin before generating labels.");
      const token = await getIdToken(user, true);
      const response = await fetch("/api/admin/smart-labels/generate-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ batchName, customerName, customerEmail, notes, quantity }),
      });
      const result = (await response.json().catch(() => null)) as GeneratedBatchResponse | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to generate this label sheet.");

      setMessage(`Generated ${result.quantity || quantity} unique Smart Labels.`);
      setLastPrintPath(result.printPath || "");
      if (result.batchId) setSelectedBatchId(result.batchId);
      setBatchName("");
      setCustomerName("");
      setCustomerEmail("");
      setNotes("Weather-resistant sticker set. Default no PIN unless customer turns one on.");
      setQuantity("45");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate this label sheet.");
    } finally {
      setBusy(false);
    }
  }

  async function updateLabel(code: string, action: "resetPin" | "archive" | "restore") {
    setError("");
    setMessage("");
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("Sign back in to admin before updating labels.");
      const token = await getIdToken(user, true);
      const response = await fetch("/api/admin/smart-labels/update-label", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, action }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; message?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to update this label.");
      setMessage(result.message || "Label updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this label.");
    }
  }

  function exportSelectedCsv() {
    const rows = [
      ["Code", "URL", "Customer", "Sheet", "Label Name", "Location", "Items Inside", "Notes", "Photos", "PIN Enabled", "Status"],
      ...labels.map((label) => [
        getCode(label),
        getLabelUrl(label),
        label.customerName || selectedBatch?.customerName || "",
        label.batchName || selectedBatch?.batchName || "",
        label.labelName || "",
        label.locationName || label.location || "",
        label.itemsInside || "",
        label.notes || "",
        String(Array.isArray(label.photos) ? label.photos.length : 0),
        label.pinEnabled ? "Yes" : "No",
        label.status || "Ready",
      ]),
    ];
    const filename = `${(selectedBatch?.batchName || selectedBatch?.id || "nesthelper-smart-labels").replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}.csv`;
    downloadCsv(filename || "nesthelper-smart-labels.csv", rows);
  }

  return (
    <AdminShell>
      <section className="space-y-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#075c58] via-[#0b6f67] to-[#042f2c] text-white shadow-xl shadow-[#075c58]/20">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.26em] text-[#f1c96b]">Smart Labels</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">QR organization kits</h2>
              <p className="mt-4 max-w-2xl text-white/82">
                Generate unique QR sticker sheets for resets, moving boxes, garage bins, closets, pantry zones, and seasonal storage. NestHelper can set up the labels during the job, then the family keeps ownership and updates them anytime.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="font-black text-[#f1c96b]">Sticker company notes</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-white/82">
                <li>• Use waterproof vinyl or polyester labels.</li>
                <li>• Ask for UV/weather-resistant laminate.</li>
                <li>• Use removable/low-residue adhesive if you want to peel and reposition.</li>
                <li>• Keep QR codes black-on-white with high contrast.</li>
              </ul>
            </div>
          </div>
        </div>

        {(error || message) && (
          <div className={`rounded-3xl border p-4 text-sm font-bold ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {error || message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <form onSubmit={handleGenerate} className="rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-lg shadow-[#075c58]/5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#e8f5ef] p-3 text-[#075c58]"><Plus size={22} /></div>
              <div>
                <h3 className="text-2xl font-black text-[#075c58]">Generate a label sheet</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Each sticker gets a unique page on your website. Families can scan, fill it out, add photos, and turn on a 4-digit PIN later.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#075c58]">Sheet name</span>
                <input className="input" placeholder="Example: Johnson garage reset labels" value={batchName} onChange={(event) => setBatchName(event.target.value)} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#075c58]">Customer / family name</span>
                  <input className="input" placeholder="Optional" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#075c58]">Customer email</span>
                  <input className="input" type="email" placeholder="Optional" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#075c58]">Labels on this sheet</span>
                <select className="input" value={quantity} onChange={(event) => setQuantity(event.target.value)}>
                  <option value="30">30 labels</option>
                  <option value="36">36 labels</option>
                  <option value="45">45 labels</option>
                  <option value="12">12 labels / test sheet</option>
                  <option value="6">6 labels / sample</option>
                </select>
                <span className="text-xs font-bold text-slate-500">{quantityHelp}</span>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#075c58]">Internal notes</span>
                <textarea className="input min-h-24" placeholder="Optional admin note only" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#075c58] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? <Loader2 className="animate-spin" size={18} /> : <QrCode size={18} />} Generate QR labels
              </button>
              {lastPrintPath && (
                <Link href={lastPrintPath} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#075c58]/20 px-5 py-3 text-sm font-bold text-[#075c58] transition hover:bg-[#e8f5ef]">
                  <FileText size={18} /> Open print sheet
                </Link>
              )}
            </div>
          </form>

          <div className="rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-lg shadow-[#075c58]/5">
            <h3 className="text-2xl font-black text-[#075c58]">How this works</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <HowStep step="1" title="Generate unique codes" text="Every sticker points to its own record so different clients do not overlap." />
              <HowStep step="2" title="Print or save PDF" text="Open the print sheet and send the PDF or HTML proof to the sticker company." />
              <HowStep step="3" title="Use during resets" text="Scan each sticker and add bin, closet, room, item list, notes, and photos." />
              <HowStep step="4" title="Give family ownership" text="Customers can keep updating labels and add a PIN only if they want privacy." />
            </div>
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              Storage note: label text and compressed photos are stored on the NestHelper website, so this can become a paid Smart Labels add-on once usage grows.
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
          <aside className="rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-lg shadow-[#075c58]/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-[#075c58]">Sheets</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Pick a customer kit to manage labels.</p>
              </div>
              <span className="rounded-full bg-[#e9f4f1] px-3 py-1 text-xs font-black text-[#075c58]">{batches.length}</span>
            </div>

            {loadingBatches ? (
              <div className="mt-5 rounded-3xl bg-[#fbf6ea] p-5 font-bold text-[#075c58]">Loading label sheets...</div>
            ) : batches.length === 0 ? (
              <div className="mt-5 rounded-3xl bg-[#fbf6ea] p-5 font-bold text-slate-600">No smart label sheets generated yet.</div>
            ) : (
              <div className="mt-5 max-h-[38rem] space-y-3 overflow-y-auto pr-1">
                {batches.map((batch) => {
                  const codes = Array.isArray(batch.codes) ? batch.codes : [];
                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => setSelectedBatchId(batch.id)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${selectedBatchId === batch.id ? "border-[#075c58] bg-[#e9f4f1]" : "border-[#eadfc8] bg-white hover:bg-slate-50"}`}
                    >
                      <p className="font-black text-[#075c58]">{batch.batchName || "Smart Label Sheet"}</p>
                      <p className="mt-1 text-sm text-slate-600">{batch.customerName || "NestHelper Customer"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                        <span>{batch.quantity || batch.labelCount || codes.length || 0} labels</span>
                        <span>•</span>
                        <span>{getBatchDate(batch)}</span>
                      </div>
                      {codes.length > 0 && <p className="mt-2 truncate text-xs font-mono font-bold text-slate-400">{codes.slice(0, 4).join(" • ")}{codes.length > 4 ? " ..." : ""}</p>}
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <div className="rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-lg shadow-[#075c58]/5">
            <div className="flex flex-col gap-4 border-b border-[#eadfc8] pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Selected sheet</p>
                <h3 className="mt-1 text-2xl font-black text-[#075c58]">{selectedBatch ? selectedBatch.batchName || "Smart Label Sheet" : "Choose a sheet"}</h3>
                {selectedBatch && <p className="mt-1 text-sm text-slate-600">{selectedBatch.customerName || "NestHelper Customer"} · {selectedBatch.customerEmail || "No email saved"}</p>}
              </div>
              {selectedBatch && (
                <div className="flex flex-wrap gap-2">
                  <Link href={selectedBatch.printPath || `/admin/smart-labels/print/${selectedBatch.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#075c58] px-4 py-2 text-sm font-black text-white">
                    <Printer size={16} /> Print labels
                  </Link>
                  <button type="button" onClick={exportSelectedCsv} className="inline-flex items-center gap-2 rounded-full border border-[#075c58]/20 px-4 py-2 text-sm font-black text-[#075c58]">
                    <Download size={16} /> CSV
                  </button>
                </div>
              )}
            </div>

            {selectedBatch ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <SmartMetric title="Active" value={stats.activeCount} />
                  <SmartMetric title="Filled out" value={stats.filledCount} tone="gold" />
                  <SmartMetric title="PIN on" value={stats.pinCount} />
                  <SmartMetric title="Photos" value={stats.photoCount} tone="plain" />
                </div>

                <label className="mt-4 flex items-center gap-3 rounded-3xl border border-[#eadfc8] bg-white px-4 py-3">
                  <Search className="text-[#075c58]" size={20} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search codes, locations, items, notes..." className="min-w-0 flex-1 outline-none" />
                </label>

                <div className="mt-4 grid gap-3">
                  {loadingLabels ? (
                    <p className="rounded-3xl bg-[#fbf6ea] p-4 text-sm font-bold text-[#075c58]"><Loader2 className="mr-2 inline animate-spin" size={16} /> Loading labels...</p>
                  ) : filteredLabels.length === 0 ? (
                    <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">No labels match this search.</p>
                  ) : (
                    filteredLabels.map((label) => <SmartLabelCard key={getCode(label)} label={label} onUpdate={updateLabel} onMessage={setMessage} />)
                  )}
                </div>
              </>
            ) : (
              <p className="mt-4 rounded-3xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Generate a sheet or choose an existing sheet to manage its labels.</p>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function SmartLabelCard({ label, onUpdate, onMessage }: { label: SmartLabelAdmin; onUpdate: (code: string, action: "resetPin" | "archive" | "restore") => void; onMessage: (value: string) => void }) {
  const code = getCode(label);
  const url = getLabelUrl(label);
  const status = label.status || "Ready";
  const archived = status === "Archived";
  const name = label.labelName || (hasLabelContent(label) ? "Untitled label" : "Blank label");
  const location = label.locationName || label.location || "No location yet";
  const photoCount = Array.isArray(label.photos) ? label.photos.length : 0;

  return (
    <div className={`grid gap-4 rounded-3xl border p-4 sm:grid-cols-[86px_1fr] ${archived ? "border-slate-200 bg-slate-50 opacity-75" : "border-[#eadfc8] bg-white"}`}>
      <div className="flex items-start gap-3 sm:block">
        <img src={getSmartLabelQrImageUrl(url, 220)} alt={`QR code for ${code}`} className="h-20 w-20 rounded-2xl border border-slate-200 bg-white p-1" />
        <div className="sm:mt-2 sm:text-center">
          <p className="font-mono text-xs font-black text-[#075c58]">{code}</p>
          {label.pinEnabled && <p className="mt-1 inline-flex rounded-full bg-[#e9f4f1] px-2 py-0.5 text-[0.68rem] font-black text-[#075c58]">PIN</p>}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-[#075c58]">{name}</p>
            <p className="mt-1 truncate text-sm text-slate-600">{location}</p>
            <p className="mt-1 max-h-12 overflow-hidden text-sm text-slate-500">{label.itemsInside || "Not filled out yet."}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
              {photoCount > 0 && <span>{photoCount} photo{photoCount === 1 ? "" : "s"}</span>}
              {getUpdatedDate(label) && <span>Updated {getUpdatedDate(label)}</span>}
            </div>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${archived ? "bg-slate-200 text-slate-600" : status === "In use" ? "bg-[#e9f4f1] text-[#075c58]" : "bg-emerald-50 text-emerald-700"}`}>{status}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#075c58]/20 px-3 py-1.5 text-xs font-black text-[#075c58]">
            <ExternalLink size={14} /> Open
          </a>
          <button type="button" onClick={async () => onMessage(await copyText(url) ? "Label link copied." : "Could not copy label link.")} className="inline-flex items-center gap-1 rounded-full border border-[#075c58]/20 px-3 py-1.5 text-xs font-black text-[#075c58]">
            <Copy size={14} /> Copy URL
          </button>
          {label.pinEnabled && (
            <button type="button" onClick={() => onUpdate(code, "resetPin")} className="inline-flex items-center gap-1 rounded-full border border-[#075c58]/20 px-3 py-1.5 text-xs font-black text-[#075c58]">
              <RotateCcw size={14} /> Reset PIN
            </button>
          )}
          {archived ? (
            <button type="button" onClick={() => onUpdate(code, "restore")} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-black text-emerald-700">
              <Undo2 size={14} /> Restore
            </button>
          ) : (
            <button type="button" onClick={() => onUpdate(code, "archive")} className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-black text-rose-700">
              <Archive size={14} /> Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HowStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Step {step}</p>
      <h4 className="mt-1 font-black text-[#075c58]">{title}</h4>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function SmartMetric({ title, value, tone = "mint" }: { title: string; value: number; tone?: "mint" | "gold" | "plain" }) {
  const toneClass = tone === "gold" ? "bg-[#fff6df]" : tone === "plain" ? "bg-slate-50" : "bg-[#e9f4f1]";
  return (
    <div className={`rounded-3xl p-4 text-center ${toneClass}`}>
      <p className="text-3xl font-black text-[#075c58]">{value}</p>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
    </div>
  );
}
