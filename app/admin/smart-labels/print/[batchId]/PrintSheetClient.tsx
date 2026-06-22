"use client";

import Image from "next/image";
import Link from "next/link";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2, Printer, QrCode, ShieldCheck } from "lucide-react";
import { firestoreDb } from "@/lib/firebaseClient";
import { getSmartLabelQrImageUrl, getSmartLabelUrl } from "@/lib/smartLabels";
import { siteConfig } from "@/lib/siteConfig";

type SmartLabel = {
  id: string;
  code?: string;
  labelUrl?: string;
  publicUrl?: string;
  sequence?: number;
  labelIndex?: number;
  batchName?: string;
  customerName?: string;
};

type SmartLabelBatch = {
  batchName?: string;
  customerName?: string;
  customerEmail?: string;
  quantity?: number;
  labelCount?: number;
  notes?: string;
  status?: string;
  createdAt?: { toDate?: () => Date; seconds?: number };
};

function formatDate(value?: { toDate?: () => Date; seconds?: number }) {
  const date = value?.toDate?.() || (typeof value?.seconds === "number" ? new Date(value.seconds * 1000) : null);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function downloadHtml(filename: string) {
  const html = `<!doctype html>${document.documentElement.outerHTML}`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function safeFilename(value: string) {
  return `${value || "nesthelper-smart-labels"}`.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "nesthelper-smart-labels";
}

export default function SmartLabelPrintSheet({ batchId }: { batchId: string }) {
  const [batch, setBatch] = useState<SmartLabelBatch | null>(null);
  const [labels, setLabels] = useState<SmartLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    const batchUnsub = onSnapshot(
      doc(firestoreDb, "smartLabelBatches", batchId),
      (snap) => {
        setBatch(snap.exists() ? (snap.data() as SmartLabelBatch) : null);
      },
      (err) => {
        console.error(err);
        setError("Unable to load this smart label sheet.");
      }
    );
    unsubs.push(batchUnsub);

    const labelsUnsub = onSnapshot(
      query(collection(firestoreDb, "smartLabels"), where("batchId", "==", batchId)),
      (snap) => {
        const nextLabels = snap.docs
          .map((labelDoc) => ({ id: labelDoc.id, ...(labelDoc.data() as Omit<SmartLabel, "id">) }))
          .sort((a, b) => Number(a.sequence || a.labelIndex || 0) - Number(b.sequence || b.labelIndex || 0));
        setLabels(nextLabels);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Unable to load labels for this sheet. Check Firestore rules after deploy.");
        setLoading(false);
      }
    );
    unsubs.push(labelsUnsub);

    return () => unsubs.forEach((unsub) => unsub());
  }, [batchId]);

  const title = batch?.batchName || "NestHelper Smart Label Sheet";
  const customer = batch?.customerName || "Customer-owned labels";
  const labelCount = labels.length || batch?.quantity || batch?.labelCount || 0;

  const printHint = useMemo(() => {
    if (labelCount >= 40) return "45-label sheet style. Save as PDF for your sticker company or print one test page first.";
    if (labelCount >= 30) return "30+ labels. Good for one family reset sheet.";
    return "Sample/test sheet. Generate 30–45 labels for vendor production.";
  }, [labelCount]);

  return (
    <section className="smart-print-page space-y-6">
      <style jsx global>{`
        @page {
          margin: 0.22in;
          size: letter;
        }
        @media print {
          body {
            background: white !important;
          }
          body > header,
          header,
          footer,
          .no-print {
            display: none !important;
          }
          main {
            max-width: none !important;
            padding: 0 !important;
          }
          .smart-print-page {
            background: white !important;
            padding: 0 !important;
          }
          .smart-label-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 2.5in) !important;
            gap: 0.08in !important;
            justify-content: center !important;
          }
          .smart-sticker {
            width: 2.5in !important;
            height: 3in !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="no-print rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-lg shadow-[#075c58]/5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <Link href="/admin/smart-labels" className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#075c58]/20 text-[#075c58] transition hover:bg-[#e8f5ef]">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#b98a2f]">Printable Sheet</p>
              <h2 className="mt-2 text-3xl font-black text-[#075c58]">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{customer} • {labelCount} unique labels • {printHint}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#075c58] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01]"><Printer size={18} /> Print / save PDF</button>
            <button onClick={() => downloadHtml(`${safeFilename(title)}.html`)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#075c58]/20 px-5 py-3 text-sm font-bold text-[#075c58] transition hover:bg-[#e8f5ef]"><Download size={18} /> Download HTML</button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 rounded-3xl bg-[#fbf6ea] p-4 text-sm font-bold leading-6 text-slate-600 sm:grid-cols-4">
          <div><span className="text-[#075c58]">Size:</span> each sticker is designed as 2.5&quot; × 3&quot;.</div>
          <div><span className="text-[#075c58]">Material:</span> waterproof vinyl or polyester.</div>
          <div><span className="text-[#075c58]">Finish:</span> UV/weather-resistant laminate.</div>
          <div><span className="text-[#075c58]">Adhesive:</span> removable low-residue if repositioning.</div>
        </div>
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">
          Keep QR codes black-on-white with high contrast. Order one proof first, scan several labels, then approve the full run.
        </div>
        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-6 font-bold text-[#075c58] shadow-sm"><Loader2 className="mr-2 inline animate-spin" size={18} /> Loading labels...</div>
      ) : labels.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 font-bold text-slate-600 shadow-sm">No labels were found for this sheet.</div>
      ) : (
        <div className="smart-label-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labels.map((label) => <Sticker key={label.id} label={label} />)}
        </div>
      )}

      <footer className="no-print rounded-[1.5rem] border border-[#eadfc8] bg-white p-4 text-xs font-bold leading-5 text-slate-500 shadow-sm">
        Sheet info: {customer} · {labelCount} labels · {formatDate(batch?.createdAt) || "created recently"}. Customer-owned after NestHelper setup · optional 4-digit PIN · default no PIN.
      </footer>
    </section>
  );
}

function Sticker({ label }: { label: SmartLabel }) {
  const code = (label.code || label.id).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const labelUrl = label.labelUrl || label.publicUrl || getSmartLabelUrl(code);
  const qrUrl = getSmartLabelQrImageUrl(labelUrl, 860);

  return (
    <article className="smart-sticker flex h-[3in] w-[2.5in] flex-col overflow-hidden rounded-[0.18in] border border-[#d9c9a9] bg-white p-[0.12in] shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-[#eadfc8] pb-[0.07in]">
        <div className="flex items-center gap-2">
          <Image src={siteConfig.assets.icon} alt="NestHelper" width={34} height={34} className="h-[0.32in] w-[0.32in]" />
          <div>
            <p className="text-[0.12in] font-black leading-none text-[#075c58]">NestHelper</p>
            <p className="mt-[0.02in] text-[0.07in] font-black uppercase tracking-[0.12em] text-[#b98a2f]">Smart Label</p>
          </div>
        </div>
        <QrCode size={18} className="text-[#075c58]" />
      </div>

      <div className="grid flex-1 place-items-center py-[0.1in]">
        <img src={qrUrl} alt={`QR code ${code}`} className="h-[1.63in] w-[1.63in]" crossOrigin="anonymous" />
      </div>

      <div className="rounded-[0.13in] border border-[#eadfc8] bg-[#fbf6ea] p-[0.08in] text-center">
        <p className="font-mono text-[0.2in] font-black leading-none tracking-[0.05em] text-[#111827]">{code}</p>
        <p className="mt-[0.04in] text-[0.075in] font-black uppercase tracking-[0.14em] text-[#075c58]">Scan. Organize. Reset.</p>
      </div>

      <div className="mt-[0.08in] grid grid-cols-2 gap-[0.06in] text-[0.066in] font-bold leading-tight text-[#075c58]">
        <div className="flex items-center gap-1 rounded-full bg-[#e8f5ef] px-[0.06in] py-[0.04in]"><ShieldCheck size={10} /> Customer-owned</div>
        <div className="rounded-full bg-[#e8f5ef] px-[0.06in] py-[0.04in] text-center">Optional 4-digit PIN</div>
      </div>
    </article>
  );
}
