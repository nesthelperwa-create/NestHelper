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
import { getSmartLabelOrderCsvRows, getSmartLabelQrImageUrl, getSmartLabelUrl } from "@/lib/smartLabels";

type SmartLabelBatch = {
  id: string;
  batchId?: string;
  batchName?: string;
  customerName?: string;
  customerEmail?: string;
  quantity?: number;
  labelCount?: number;
  activeLabelCount?: number;
  reservedLabelCount?: number;
  status?: string;
  mode?: string;
  csvOnly?: boolean;
  codes?: string[];
  printPath?: string;
  notes?: string;
  createdAt?: { toDate?: () => Date; seconds?: number };
  createdAtIso?: string;
  updatedAt?: { toDate?: () => Date; seconds?: number };
};

type SmartLabelAction = "resetPin" | "archive" | "restore" | "activate";

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
  mode?: string;
  reservedOnly?: boolean;
  updatedAt?: { toDate?: () => Date; seconds?: number };
  updatedAtIso?: string;
  createdAtIso?: string;
};

type LookupLabelResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  code?: string;
  reservedOnly?: boolean;
  label?: SmartLabelAdmin;
};

type GeneratedBatchResponse = {
  ok?: boolean;
  error?: string;
  batchId?: string;
  batchName?: string;
  quantity?: number;
  labelCount?: number;
  codes?: string[];
  mode?: string;
  csvOnly?: boolean;
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
  const date = label.updatedAt?.toDate?.() || (typeof label.updatedAt?.seconds === "number" ? new Date(label.updatedAt.seconds * 1000) : null) || (label.updatedAtIso ? new Date(label.updatedAtIso) : null);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function hasLabelContent(label: SmartLabelAdmin) {
  return Boolean(label.labelName || label.locationName || label.location || label.itemsInside || label.notes || (Array.isArray(label.photos) && label.photos.length > 0));
}

function isCsvOnlyBatch(batch: SmartLabelBatch | null) {
  return Boolean(batch?.csvOnly || batch?.mode === "csv-only" || batch?.status === "CSV Only");
}

function getBatchCodes(batch: SmartLabelBatch | null, fallbackLabels: SmartLabelAdmin[] = []) {
  if (Array.isArray(batch?.codes) && batch.codes.length > 0) return batch.codes.map((code) => String(code));
  return fallbackLabels.map((label) => getCode(label)).filter(Boolean);
}

function safeCsvFilename(value: string) {
  return `${value || "nesthelper-smart-labels"}`.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "nesthelper-smart-labels";
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
  const [quantity, setQuantity] = useState("10");
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
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLabel, setLookupLabel] = useState<SmartLabelAdmin | null>(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);

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
  const selectedBatchIsCsvOnly = isCsvOnlyBatch(selectedBatch);
  const quantityHelp = useMemo(() => {
    const count = Number(quantity) || 10;
    if (count === 500 || count === 1000) return "Sticker order CSV only. Codes are reserved, but they will not flood the active customer label list.";
    if (count === 50) return "Largest active kit. Good when you want labels ready to assign or manage now.";
    if (count === 30) return "Full setup size for garages, pantry systems, playrooms, moving boxes, and storage areas.";
    if (count === 20) return "Standard setup size for organizing-heavy resets.";
    return "Basic setup size. Up to 10 labels are included with qualifying resets.";
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
      const csvOnlyRequest = quantity === "500" || quantity === "1000";
      const response = await fetch("/api/admin/smart-labels/generate-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ batchName, customerName, customerEmail, notes, quantity, mode: csvOnlyRequest ? "csv-only" : "active" }),
      });
      const result = (await response.json().catch(() => null)) as GeneratedBatchResponse | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to generate this label sheet.");

      if (result.csvOnly && Array.isArray(result.codes)) {
        downloadCsv(`${safeCsvFilename(result.batchName || `nesthelper-sticker-order-${result.quantity || quantity}`)}.csv`, getSmartLabelOrderCsvRows(result.codes));
        setMessage(`Created sticker order CSV with ${result.quantity || quantity} reserved Smart Label codes. Labels will activate when scanned or assigned.`);
      } else {
        setMessage(`Generated ${result.quantity || quantity} active Smart Labels.`);
      }
      setLastPrintPath(result.csvOnly ? "" : result.printPath || "");
      if (result.batchId) setSelectedBatchId(result.batchId);
      setBatchName("");
      setCustomerName("");
      setCustomerEmail("");
      setNotes("Weather-resistant sticker set. Default no PIN unless customer turns one on.");
      setQuantity("10");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate this label sheet.");
    } finally {
      setBusy(false);
    }
  }

  async function lookupSmartLabel(rawQuery: string, options: { silent?: boolean } = {}) {
    const queryText = rawQuery.trim();
    if (!queryText) {
      setLookupMessage("Enter the code printed under the QR label or paste the full QR link.");
      setLookupLabel(null);
      return;
    }

    if (!options.silent) {
      setLookupBusy(true);
      setLookupMessage("");
      setError("");
      setMessage("");
    }

    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("Sign back in to admin before looking up labels.");
      const token = await getIdToken(user, true);
      const response = await fetch("/api/admin/smart-labels/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: queryText }),
      });
      const result = (await response.json().catch(() => null)) as LookupLabelResponse | null;
      if (!response.ok || !result?.ok || !result.label) throw new Error(result?.error || "Unable to find this label.");

      setLookupLabel(result.label);
      setLookupMessage(result.message || (result.reservedOnly ? "Reserved sticker-order code found." : `Active label found: ${getCode(result.label)}.`));
    } catch (err) {
      setLookupLabel(null);
      setLookupMessage(err instanceof Error ? err.message : "Unable to look up this label.");
    } finally {
      if (!options.silent) setLookupBusy(false);
    }
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await lookupSmartLabel(lookupInput);
  }

  async function updateLabel(code: string, action: SmartLabelAction) {
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
      if (lookupLabel && getCode(lookupLabel) === code) {
        await lookupSmartLabel(code, { silent: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this label.");
    }
  }

  function exportStickerOrderCsv() {
    const codes = getBatchCodes(selectedBatch, labels);
    const filename = `${safeCsvFilename(selectedBatch?.batchName || selectedBatch?.id || "nesthelper-sticker-order")}.csv`;
    downloadCsv(filename, getSmartLabelOrderCsvRows(codes));
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
    const filename = `${safeCsvFilename(selectedBatch?.batchName || selectedBatch?.id || "nesthelper-smart-labels-admin")}-admin.csv`;
    downloadCsv(filename || "nesthelper-smart-labels-admin.csv", rows);
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
                Create active Smart Label kits for customers, or create larger sticker-order CSV files for the printer. Bulk CSV orders reserve the codes without filling the active dashboard.
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
                <h3 className="text-2xl font-black text-[#075c58]">Create Smart Labels</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Use 10–50 for active customer labels. Use 500 or 1000 only when you need a sticker-company CSV for ordering inventory.</p>
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
                <span className="text-sm font-black text-[#075c58]">Quantity / action</span>
                <select className="input" value={quantity} onChange={(event) => setQuantity(event.target.value)}>
                  <optgroup label="Create active labels">
                    <option value="10">10 active labels</option>
                    <option value="20">20 active labels</option>
                    <option value="30">30 active labels</option>
                    <option value="50">50 active labels</option>
                  </optgroup>
                  <optgroup label="Sticker order CSV only">
                    <option value="500">500 reserved codes / CSV only</option>
                    <option value="1000">1000 reserved codes / CSV only</option>
                  </optgroup>
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
                {busy ? <Loader2 className="animate-spin" size={18} /> : <QrCode size={18} />} {quantity === "500" || quantity === "1000" ? "Create order CSV" : "Generate QR labels"}
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
              <HowStep step="1" title="Choose the right action" text="Use 10, 20, 30, or 50 for active customer labels. Use 500 or 1000 for sticker-order CSV files only." />
              <HowStep step="2" title="Order sticker inventory" text="Bulk CSVs include only URL and Label columns for the sticker company and reserve those codes." />
              <HowStep step="3" title="Use during resets" text="Scan each sticker and add bin, closet, room, item list, notes, and photos." />
              <HowStep step="4" title="Keep the dashboard clean" text="CSV-only labels become active only after they are scanned or assigned, so the admin list stays usable." />
            </div>
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              Offer note: include up to 10 Smart Labels with qualifying resets, and up to 30 when a larger organizing project needs them. Charge setup labor separately: $49 up to 10, $79 up to 20, $109 up to 30, then $2 for each extra standard label setup.
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-lg shadow-[#075c58]/5">
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[#e8f5ef] p-3 text-[#075c58]"><Search size={22} /></div>
                <div>
                  <h3 className="text-2xl font-black text-[#075c58]">Find one label by QR/code</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Use this for bulk sticker orders so you do not need a long active list. Enter the printed code or paste the full QR link to reset PINs, open the label, copy the URL, archive, or restore.</p>
                </div>
              </div>
              <form onSubmit={handleLookup} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  className="input"
                  value={lookupInput}
                  onChange={(event) => setLookupInput(event.target.value)}
                  placeholder="Example: ABC1234 or https://www.nesthelperwa.com/labels/ABC1234"
                />
                <button type="submit" disabled={lookupBusy} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#075c58] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                  {lookupBusy ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Find label
                </button>
              </form>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-500">Tip: for 500/1000 sticker orders, the dashboard stays clean. Look up only the label you need by entering its code.</p>
              {lookupMessage && (
                <p className={`mt-4 rounded-3xl border p-4 text-sm font-bold leading-6 ${lookupLabel ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                  {lookupMessage}
                </p>
              )}
            </div>
            <div>
              {lookupLabel ? (
                <SmartLabelCard label={lookupLabel} onUpdate={updateLabel} onMessage={setMessage} lookupMode />
              ) : (
                <div className="grid min-h-[13rem] place-items-center rounded-3xl border border-dashed border-[#eadfc8] bg-[#fbf6ea] p-6 text-center">
                  <div>
                    <QrCode className="mx-auto text-[#075c58]" size={34} />
                    <p className="mt-3 font-black text-[#075c58]">No label selected</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Find a label above to manage it without scrolling through a sheet.</p>
                  </div>
                </div>
              )}
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
                  const csvOnly = isCsvOnlyBatch(batch);
                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => setSelectedBatchId(batch.id)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${selectedBatchId === batch.id ? "border-[#075c58] bg-[#e9f4f1]" : "border-[#eadfc8] bg-white hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-black text-[#075c58]">{batch.batchName || "Smart Label Sheet"}</p>
                        {csvOnly && <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wide text-amber-800">CSV only</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{csvOnly ? "Sticker inventory / reserved codes" : batch.customerName || "NestHelper Customer"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                        <span>{batch.quantity || batch.labelCount || codes.length || 0} labels</span>
                        <span>•</span>
                        <span>{getBatchDate(batch)}</span>
                        {csvOnly && <><span>•</span><span>not active until scanned</span></>}
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
                {selectedBatch && <p className="mt-1 text-sm text-slate-600">{selectedBatchIsCsvOnly ? "Sticker order CSV only · reserved codes become active when scanned" : `${selectedBatch.customerName || "NestHelper Customer"} · ${selectedBatch.customerEmail || "No email saved"}`}</p>}
              </div>
              {selectedBatch && (
                <div className="flex flex-wrap gap-2">
                  {!selectedBatchIsCsvOnly && (
                    <Link href={selectedBatch.printPath || `/admin/smart-labels/print/${selectedBatch.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#075c58] px-4 py-2 text-sm font-black text-white">
                      <Printer size={16} /> Print labels
                    </Link>
                  )}
                  <button type="button" onClick={exportStickerOrderCsv} className="inline-flex items-center gap-2 rounded-full border border-[#075c58]/20 px-4 py-2 text-sm font-black text-[#075c58]">
                    <Download size={16} /> Order CSV
                  </button>
                  {!selectedBatchIsCsvOnly && (
                    <button type="button" onClick={exportSelectedCsv} className="inline-flex items-center gap-2 rounded-full border border-[#075c58]/20 px-4 py-2 text-sm font-black text-[#075c58]">
                      <Download size={16} /> Admin CSV
                    </button>
                  )}
                </div>
              )}
            </div>

            {selectedBatch ? (
              selectedBatchIsCsvOnly ? (
                <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-900">
                  <p className="text-lg font-black text-[#075c58]">Sticker order CSV only</p>
                  <p className="mt-2">This batch has {selectedBatch.quantity || selectedBatch.labelCount || getBatchCodes(selectedBatch).length} reserved Smart Label codes for ordering stickers. It does not create hundreds of active customer label cards in the dashboard.</p>
                  <p className="mt-2">When one of these QR stickers is scanned, the label page activates automatically and becomes manageable like a normal Smart Label.</p>
                  <button type="button" onClick={exportStickerOrderCsv} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#075c58] px-4 py-2 text-sm font-black text-white">
                    <Download size={16} /> Download printer CSV
                  </button>
                  {loadingLabels ? (
                    <p className="mt-4 rounded-2xl bg-white/70 p-3 text-sm font-bold text-[#075c58]"><Loader2 className="mr-2 inline animate-spin" size={16} /> Checking activated labels...</p>
                  ) : labels.length > 0 ? (
                    <div className="mt-5 rounded-3xl border border-[#eadfc8] bg-white p-4 text-slate-700">
                      <p className="font-black text-[#075c58]">Activated from this sticker order</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">These reserved labels have already been scanned and are now active.</p>
                      <label className="mt-4 flex items-center gap-3 rounded-3xl border border-[#eadfc8] bg-white px-4 py-3">
                        <Search className="text-[#075c58]" size={20} />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activated codes, locations, items, notes..." className="min-w-0 flex-1 outline-none" />
                      </label>
                      <div className="mt-4 grid gap-3">
                        {filteredLabels.length === 0 ? (
                          <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">No activated labels match this search.</p>
                        ) : (
                          filteredLabels.map((label) => <SmartLabelCard key={getCode(label)} label={label} onUpdate={updateLabel} onMessage={setMessage} />)
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
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
              )
            ) : (
              <p className="mt-4 rounded-3xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Generate a sheet or choose an existing sheet to manage its labels.</p>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function SmartLabelCard({ label, onUpdate, onMessage, lookupMode = false }: { label: SmartLabelAdmin; onUpdate: (code: string, action: SmartLabelAction) => void; onMessage: (value: string) => void; lookupMode?: boolean }) {
  const code = getCode(label);
  const url = getLabelUrl(label);
  const status = label.status || "Ready";
  const reservedOnly = Boolean(label.reservedOnly || status === "Reserved");
  const archived = status === "Archived";
  const name = reservedOnly ? "Reserved sticker code" : label.labelName || (hasLabelContent(label) ? "Untitled label" : "Blank label");
  const location = reservedOnly ? label.batchName || "Sticker order CSV only" : label.locationName || label.location || "No location yet";
  const photoCount = Array.isArray(label.photos) ? label.photos.length : 0;

  return (
    <div className={`grid gap-4 rounded-3xl border p-4 sm:grid-cols-[86px_1fr] ${archived ? "border-slate-200 bg-slate-50 opacity-75" : "border-[#eadfc8] bg-white"}`}>
      <div className="flex items-start gap-3 sm:block">
        <img src={getSmartLabelQrImageUrl(url, 220)} alt={`QR code for ${code}`} className="h-20 w-20 rounded-2xl border border-slate-200 bg-white p-1" />
        <div className="sm:mt-2 sm:text-center">
          <p className="font-mono text-xs font-black text-[#075c58]">{code}</p>
          {lookupMode && <p className="mt-1 inline-flex rounded-full bg-[#fff6df] px-2 py-0.5 text-[0.68rem] font-black text-[#8a641a]">Lookup</p>}
          {label.pinEnabled && <p className="mt-1 inline-flex rounded-full bg-[#e9f4f1] px-2 py-0.5 text-[0.68rem] font-black text-[#075c58]">PIN</p>}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-[#075c58]">{name}</p>
            <p className="mt-1 truncate text-sm text-slate-600">{location}</p>
            <p className="mt-1 max-h-12 overflow-hidden text-sm text-slate-500">{reservedOnly ? "Reserved for printed sticker inventory. Activate it when you are ready to manage this label." : label.itemsInside || "Not filled out yet."}</p>
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
          {reservedOnly ? (
            <button type="button" onClick={() => onUpdate(code, "activate")} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
              <Plus size={14} /> Activate label
            </button>
          ) : (
            <>
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
            </>
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
