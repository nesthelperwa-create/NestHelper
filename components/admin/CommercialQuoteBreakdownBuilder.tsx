"use client";

import { useEffect, useMemo, useState } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";

export type QuoteLineItem = {
  id: string;
  preset: string;
  label: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  minimum: string;
  recurring: boolean;
  note: string;
};

type AdminDoc = { id: string; [key: string]: any };

type QuoteBuilderProps = {
  item: AdminDoc;
  formatMoney: (value: number) => string;
  onSaved?: (updates: Record<string, unknown>) => void;
  onApplyFirstPayment?: (amount: number, title: string, note: string) => void;
  onApplyAdditionalPayment?: (amount: number, note: string) => void;
};

const LINE_PRESETS: Record<string, Omit<QuoteLineItem, "id" | "note">> = {
  routineVisit: {
    preset: "routineVisit",
    label: "Routine Commercial Reset visit",
    description: "Routine business cleaning visit based on reviewed scope.",
    quantity: "1",
    unit: "visit",
    rate: "175",
    minimum: "175",
    recurring: false,
  },
  recurringMonthly: {
    preset: "recurringMonthly",
    label: "Recurring Commercial Reset plan",
    description: "Monthly recurring service plan based on approved frequency and scope.",
    quantity: "1",
    unit: "month",
    rate: "499",
    minimum: "499",
    recurring: true,
  },
  laborHours: {
    preset: "laborHours",
    label: "Additional commercial labor",
    description: "Approved extra labor time for added scope, setup, or detailed reset work.",
    quantity: "1",
    unit: "hour",
    rate: "85",
    minimum: "75",
    recurring: false,
  },
  firstTimeReset: {
    preset: "firstTimeReset",
    label: "First-time commercial reset",
    description: "Heavier initial reset before recurring service begins.",
    quantity: "1000",
    unit: "sq ft",
    rate: "0.35",
    minimum: "249",
    recurring: false,
  },
  carpetDeepCleaning: {
    preset: "carpetDeepCleaning",
    label: "Carpet deep cleaning",
    description: "Carpeted-area deep cleaning based on carpet square footage and condition.",
    quantity: "500",
    unit: "carpet sq ft",
    rate: "0.50",
    minimum: "249",
    recurring: false,
  },
  spotTreatment: {
    preset: "spotTreatment",
    label: "Spot treatment",
    description: "Spot or stain treatment for reviewed areas.",
    quantity: "1",
    unit: "area",
    rate: "45",
    minimum: "25",
    recurring: false,
  },
  floorScrub: {
    preset: "floorScrub",
    label: "Floor scrub",
    description: "Hard-floor scrub based on reviewed floor area, material, and condition.",
    quantity: "500",
    unit: "hard-floor sq ft",
    rate: "0.45",
    minimum: "0",
    recurring: false,
  },
  buffShine: {
    preset: "buffShine",
    label: "Buff / shine",
    description: "Hard-floor buff or shine service for reviewed floor area.",
    quantity: "500",
    unit: "hard-floor sq ft",
    rate: "0.70",
    minimum: "0",
    recurring: false,
  },
  waxFinish: {
    preset: "waxFinish",
    label: "Wax / finish",
    description: "Floor finish/wax for cleared hard-floor areas.",
    quantity: "500",
    unit: "hard-floor sq ft",
    rate: "1.00",
    minimum: "299",
    recurring: false,
  },
  stripWax: {
    preset: "stripWax",
    label: "Strip & wax",
    description: "Strip and wax for cleared hard-floor areas; final quote depends on buildup and condition.",
    quantity: "500",
    unit: "hard-floor sq ft",
    rate: "2.10",
    minimum: "499",
    recurring: false,
  },
  turnover: {
    preset: "turnover",
    label: "Short-term rental turnover",
    description: "Host-managed turnover reset based on size, timing, linens/restock, and scope.",
    quantity: "1",
    unit: "turnover",
    rate: "129",
    minimum: "129",
    recurring: false,
  },
  linenRestock: {
    preset: "linenRestock",
    label: "Linen / restock handling",
    description: "Approved linen, supply restock, or host checklist add-on.",
    quantity: "1",
    unit: "set",
    rate: "25",
    minimum: "0",
    recurring: false,
  },
  customFlat: {
    preset: "customFlat",
    label: "Custom approved line item",
    description: "Custom line reviewed with the customer before payment.",
    quantity: "1",
    unit: "flat",
    rate: "0",
    minimum: "0",
    recurring: false,
  },
};

const PRESET_ORDER = [
  "routineVisit",
  "recurringMonthly",
  "laborHours",
  "firstTimeReset",
  "carpetDeepCleaning",
  "spotTreatment",
  "floorScrub",
  "buffShine",
  "waxFinish",
  "stripWax",
  "turnover",
  "linenRestock",
  "customFlat",
];

const QUOTE_STATUSES = ["Quote drafted", "Quote sent", "Quote approved", "Initial paid", "Additional sent", "Additional paid", "Completed"];
const QUOTE_TYPES = ["Flat visit quote", "Recurring monthly plan", "Reviewed price range", "Add-on quote", "Short-term rental turnover"];
const REFUND_STATUSES = ["No refund due", "Reviewing refund", "Partial refund due", "Full refund due", "Partial refund issued", "Full refund issued", "Credit offered"];
const REFUND_REASONS = ["Service canceled", "Customer overpaid", "Add-on removed", "Partial service completed", "Service issue / make-it-right", "Duplicate payment", "Laundry or balance adjustment", "Other"];

function makeId() {
  return `line-${Math.random().toString(36).slice(2, 9)}`;
}

function toNumber(value: unknown) {
  const next = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(next) ? next : 0;
}

function money(value: number) {
  return Number(Math.max(0, value).toFixed(2));
}

function makeLine(presetKey = "routineVisit"): QuoteLineItem {
  const preset = LINE_PRESETS[presetKey] || LINE_PRESETS.routineVisit;
  return { id: makeId(), ...preset, note: "" };
}

function calculateLineAmount(line: QuoteLineItem) {
  const quantity = Math.max(0, toNumber(line.quantity));
  const rate = Math.max(0, toNumber(line.rate));
  const minimum = Math.max(0, toNumber(line.minimum));
  const raw = line.unit === "flat" ? rate : quantity * rate;
  return money(Math.max(raw, minimum));
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getInitialLines(item: AdminDoc) {
  const existing = item.commercialQuoteBreakdown?.lineItems;
  if (Array.isArray(existing) && existing.length) {
    return existing.map((line: any) => ({
      id: safeString(line.id) || makeId(),
      preset: safeString(line.preset) || "customFlat",
      label: safeString(line.label) || "Custom approved line item",
      description: safeString(line.description),
      quantity: String(line.quantity ?? "1"),
      unit: safeString(line.unit) || "flat",
      rate: String(line.rate ?? line.amount ?? "0"),
      minimum: String(line.minimum ?? "0"),
      recurring: Boolean(line.recurring),
      note: safeString(line.note),
    }));
  }

  const frequency = String(item.frequency || "").toLowerCase();
  const businessType = String(item.businessType || "").toLowerCase();
  if (businessType.includes("rental") || businessType.includes("turnover")) return [makeLine("turnover")];
  if (frequency.includes("weekly") || frequency.includes("monthly") || frequency.includes("recurring") || frequency.includes("twice") || frequency.includes("three") || frequency.includes("five")) return [makeLine("recurringMonthly")];
  return [makeLine("routineVisit")];
}

function buildCustomerBreakdownText({
  item,
  quoteTitle,
  quoteStatus,
  quoteType,
  lineItems,
  subtotal,
  discountCredit,
  amountDueNow,
  additionalAmount,
  customerNote,
  validUntil,
}: {
  item: AdminDoc;
  quoteTitle: string;
  quoteStatus: string;
  quoteType: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountCredit: number;
  amountDueNow: number;
  additionalAmount: number;
  customerNote: string;
  validUntil: string;
}) {
  const customerName = item.fullName || item.name || item.contactName || "Customer";
  const lines = lineItems.map((line) => {
    const qty = line.unit === "flat" ? "" : `${line.quantity} ${line.unit} × ${line.rate}`;
    return `- ${line.label}${qty ? ` (${qty})` : ""}: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(calculateLineAmount(line))}${line.note ? `\n  Note: ${line.note}` : ""}`;
  });

  return [
    "NestHelper Commercial Reset quote breakdown",
    `Customer: ${customerName}`,
    `Quote: ${quoteTitle}`,
    `Status: ${quoteStatus}`,
    `Pricing style: ${quoteType}`,
    validUntil ? `Valid through: ${validUntil}` : "",
    "",
    "Line items:",
    ...lines,
    "",
    `Subtotal: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(subtotal)}`,
    discountCredit > 0 ? `Discount / credit: -${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(discountCredit)}` : "",
    `Amount due now: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountDueNow)}`,
    additionalAmount > 0 ? `Possible later/add-on amount: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(additionalAmount)}` : "",
    "",
    "Notes:",
    customerNote || "Final service is based on the approved quote, access, condition, schedule, and any reviewed add-ons.",
    "",
    "Sales tax, if applicable, is shown at checkout or invoice. Heavy furniture, equipment, fragile items, or blocked areas may require customer preparation or a separate labor quote.",
  ].filter(Boolean).join("\n");
}

export default function CommercialQuoteBreakdownBuilder({ item, formatMoney, onSaved, onApplyFirstPayment, onApplyAdditionalPayment }: QuoteBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quoteTitle, setQuoteTitle] = useState("Commercial Reset quote");
  const [quoteStatus, setQuoteStatus] = useState("Quote drafted");
  const [quoteType, setQuoteType] = useState("Flat visit quote");
  const [validUntil, setValidUntil] = useState("");
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>(() => getInitialLines(item));
  const [discountCredit, setDiscountCredit] = useState("0");
  const [additionalAmount, setAdditionalAmount] = useState("0");
  const [customerNote, setCustomerNote] = useState("Final service is based on the approved quote, access, condition, schedule, and any reviewed add-ons. Sales tax, if applicable, is shown at checkout or invoice.");
  const [internalNotes, setInternalNotes] = useState("");
  const [refundStatus, setRefundStatus] = useState("No refund due");
  const [refundAmount, setRefundAmount] = useState("0");
  const [refundReason, setRefundReason] = useState("Service canceled");
  const [refundDate, setRefundDate] = useState("");
  const [refundCustomerNotified, setRefundCustomerNotified] = useState(false);
  const [refundNotes, setRefundNotes] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const breakdown = item.commercialQuoteBreakdown || {};
    const refund = item.commercialRefundTracking || {};
    setQuoteTitle(safeString(breakdown.quoteTitle) || "Commercial Reset quote");
    setQuoteStatus(safeString(item.commercialQuoteStatus) || safeString(breakdown.quoteStatus) || "Quote drafted");
    setQuoteType(safeString(item.commercialQuoteType) || safeString(breakdown.quoteType) || "Flat visit quote");
    setValidUntil(safeString(breakdown.validUntil));
    setLineItems(getInitialLines(item));
    setDiscountCredit(String(breakdown.discountCredit ?? "0"));
    setAdditionalAmount(String(item.commercialAdditionalAmount ?? breakdown.additionalAmount ?? "0"));
    setCustomerNote(safeString(item.commercialCustomerQuoteNote) || safeString(breakdown.customerNote) || "Final service is based on the approved quote, access, condition, schedule, and any reviewed add-ons. Sales tax, if applicable, is shown at checkout or invoice.");
    setInternalNotes(safeString(item.commercialInternalQuoteNotes) || safeString(breakdown.internalNotes));
    setRefundStatus(safeString(refund.status) || "No refund due");
    setRefundAmount(String(refund.amount ?? "0"));
    setRefundReason(safeString(refund.reason) || "Service canceled");
    setRefundDate(safeString(refund.date));
    setRefundCustomerNotified(Boolean(refund.customerNotified));
    setRefundNotes(safeString(refund.notes));
    setDirty(false);
    setMessage("");
    setError("");
  }, [item.id]);

  const subtotal = useMemo(() => money(lineItems.reduce((sum, line) => sum + calculateLineAmount(line), 0)), [lineItems]);
  const discount = money(toNumber(discountCredit));
  const amountDueNow = money(Math.max(0, subtotal - discount));
  const laterAmount = money(toNumber(additionalAmount));
  const totalQuoted = money(amountDueNow + laterAmount);

  function markDirty() {
    setDirty(true);
    setMessage("");
    setError("");
  }

  function updateLine(id: string, patch: Partial<QuoteLineItem>) {
    setLineItems((prev) => prev.map((line) => line.id === id ? { ...line, ...patch } : line));
    markDirty();
  }

  function changePreset(id: string, presetKey: string) {
    const preset = LINE_PRESETS[presetKey] || LINE_PRESETS.customFlat;
    setLineItems((prev) => prev.map((line) => line.id === id ? { ...line, ...preset } : line));
    markDirty();
  }

  function addLine(preset = "customFlat") {
    setLineItems((prev) => [...prev, makeLine(preset)]);
    markDirty();
  }

  function removeLine(id: string) {
    setLineItems((prev) => prev.filter((line) => line.id !== id));
    markDirty();
  }

  function attemptClose() {
    if (dirty && !window.confirm("You have unsaved quote changes. Close without saving?")) return;
    setIsOpen(false);
  }

  const customerBreakdownText = useMemo(() => buildCustomerBreakdownText({
    item,
    quoteTitle,
    quoteStatus,
    quoteType,
    lineItems,
    subtotal,
    discountCredit: discount,
    amountDueNow,
    additionalAmount: laterAmount,
    customerNote,
    validUntil,
  }), [item, quoteTitle, quoteStatus, quoteType, lineItems, subtotal, discount, amountDueNow, laterAmount, customerNote, validUntil]);

  async function copyBreakdown() {
    await navigator.clipboard.writeText(customerBreakdownText);
    setMessage("Customer breakdown copied.");
  }

  function downloadBreakdown() {
    const blob = new Blob([customerBreakdownText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nesthelper-commercial-quote-${item.id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage("Breakdown downloaded.");
  }

  function printBreakdown() {
    const html = `<!doctype html><html><head><title>NestHelper Commercial Reset quote</title><style>body{font-family:Arial,sans-serif;color:#123;line-height:1.45;padding:32px}.card{max-width:760px;margin:auto;border:1px solid #ddd;border-radius:18px;padding:28px}h1{color:#075c58;margin:0 0 6px}.muted{color:#64748b}.row{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:10px 0}.total{font-size:20px;font-weight:800;color:#075c58}.note{background:#fbf6ea;border-radius:14px;padding:14px;margin-top:16px;white-space:pre-wrap}</style></head><body><div class="card"><h1>NestHelper Commercial Reset quote</h1><p class="muted">${quoteTitle}</p>${lineItems.map((line) => `<div class="row"><div><strong>${line.label}</strong><br><span class="muted">${line.description || ""}${line.note ? `<br>${line.note}` : ""}</span></div><div>${formatMoney(calculateLineAmount(line))}</div></div>`).join("")}<div class="row"><strong>Subtotal</strong><strong>${formatMoney(subtotal)}</strong></div>${discount > 0 ? `<div class="row"><strong>Discount / credit</strong><strong>-${formatMoney(discount)}</strong></div>` : ""}<div class="row total"><span>Amount due now</span><span>${formatMoney(amountDueNow)}</span></div>${laterAmount > 0 ? `<div class="row"><strong>Possible later/add-on amount</strong><strong>${formatMoney(laterAmount)}</strong></div>` : ""}<div class="note">${customerNote.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div><p class="muted">Sales tax, if applicable, is shown at checkout or invoice. Final service is based on approved scope and access.</p></div><script>window.print();</script></body></html>`;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setError("Pop-up blocked. Allow pop-ups to print the quote.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  }

  async function saveBreakdown() {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const quoteBreakdown = {
        quoteTitle,
        quoteStatus,
        quoteType,
        validUntil,
        lineItems: lineItems.map((line) => ({ ...line, amount: calculateLineAmount(line) })),
        subtotal,
        discountCredit: discount,
        amountDueNow,
        additionalAmount: laterAmount,
        totalQuoted,
        customerNote,
        internalNotes,
        customerBreakdownText,
        taxNote: "Sales tax, if applicable, is shown at checkout or invoice.",
      };
      const refundTracking = {
        status: refundStatus,
        amount: money(toNumber(refundAmount)),
        reason: refundReason,
        date: refundDate,
        customerNotified: refundCustomerNotified,
        notes: refundNotes,
      };

      const res = await fetch("/api/admin/update-commercial-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId: item.id,
          quoteStatus,
          quoteType,
          initialAmount: amountDueNow,
          additionalAmount: laterAmount,
          customerQuoteNote: customerNote,
          internalQuoteNotes: internalNotes,
          quoteBreakdown,
          refundTracking,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to save quote breakdown.");

      onSaved?.({
        status: data.mappedStatus || item.status,
        commercialQuoteStatus: quoteStatus,
        commercialQuoteType: quoteType,
        commercialInitialAmount: amountDueNow,
        commercialAdditionalAmount: laterAmount,
        commercialCustomerQuoteNote: customerNote,
        commercialInternalQuoteNotes: internalNotes,
        commercialQuoteBreakdown: quoteBreakdown,
        commercialRefundTracking: refundTracking,
      });
      setDirty(false);
      setMessage("Quote breakdown saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save quote breakdown.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-cyan-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Professional quote builder</p>
          <h5 className="mt-1 text-base font-black text-[#075c58]">Build a customer-ready breakdown</h5>
          <p className="mt-1 text-sm leading-6 text-slate-700">Use dropdown line items and built-in calculators for routine service, recurring plans, add-ons, credits, and refund notes.</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          className="rounded-2xl bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/15 transition hover:-translate-y-0.5 hover:bg-[#064b48]"
        >
          Open quote / breakdown builder
        </button>
      </div>
      {item.commercialQuoteBreakdown?.amountDueNow !== undefined && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-cyan-50/60 p-4 text-sm md:grid-cols-3">
          <div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#b98a2f]">Saved amount due now</p><p className="mt-1 text-lg font-black text-[#075c58]">{formatMoney(toNumber(item.commercialQuoteBreakdown.amountDueNow))}</p></div>
          <div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#b98a2f]">Saved later/add-on</p><p className="mt-1 text-lg font-black text-[#075c58]">{formatMoney(toNumber(item.commercialQuoteBreakdown.additionalAmount))}</p></div>
          <div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#b98a2f]">Refund status</p><p className="mt-1 text-sm font-black text-[#075c58]">{item.commercialRefundTracking?.status || "No refund due"}</p></div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 p-3 sm:p-6" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto max-w-6xl rounded-[2rem] bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Commercial quote breakdown builder">
            <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-[#eadfc8] bg-white/95 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Commercial Reset quote builder</p>
                <h3 className="text-2xl font-black text-[#075c58]">Professional breakdown</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">Clicking outside will not close this. Use Save draft or Close.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copyBreakdown} className="rounded-full border border-[#075c58] px-4 py-2 text-xs font-black text-[#075c58]">Copy</button>
                <button type="button" onClick={downloadBreakdown} className="rounded-full border border-[#075c58] px-4 py-2 text-xs font-black text-[#075c58]">Download</button>
                <button type="button" onClick={printBreakdown} className="rounded-full border border-[#075c58] px-4 py-2 text-xs font-black text-[#075c58]">Print</button>
                <button type="button" disabled={busy} onClick={saveBreakdown} className="rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white disabled:opacity-60">{busy ? "Saving..." : "Save draft"}</button>
                <button type="button" onClick={attemptClose} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white">Close</button>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="space-y-5">
                <div className="rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Quote title<input value={quoteTitle} onChange={(e) => { setQuoteTitle(e.target.value); markDirty(); }} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-normal outline-none focus:border-[#075c58]" /></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Valid until / review date<input type="date" value={validUntil} onChange={(e) => { setValidUntil(e.target.value); markDirty(); }} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-normal outline-none focus:border-[#075c58]" /></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Quote progress<select value={quoteStatus} onChange={(e) => { setQuoteStatus(e.target.value); markDirty(); }} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-bold text-[#075c58] outline-none focus:border-[#075c58]">{QUOTE_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Pricing style<select value={quoteType} onChange={(e) => { setQuoteType(e.target.value); markDirty(); }} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-bold text-[#075c58] outline-none focus:border-[#075c58]">{QUOTE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-200 bg-white p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Line items</p><h4 className="text-lg font-black text-[#075c58]">Dropdowns + built-in calculators</h4></div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => addLine("routineVisit")} className="rounded-full border border-cyan-700 px-3 py-2 text-xs font-black text-cyan-800">+ Routine</button>
                      <button type="button" onClick={() => addLine("carpetDeepCleaning")} className="rounded-full border border-cyan-700 px-3 py-2 text-xs font-black text-cyan-800">+ Carpet</button>
                      <button type="button" onClick={() => addLine("customFlat")} className="rounded-full bg-[#075c58] px-3 py-2 text-xs font-black text-white">+ Additional line</button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    {lineItems.map((line, index) => (
                      <div key={line.id} className="rounded-3xl border border-cyan-100 bg-cyan-50/35 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <p className="text-sm font-black text-[#075c58]">Line {index + 1}: {line.label}</p>
                          <div className="text-right"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#b98a2f]">Calculated amount</p><p className="text-lg font-black text-[#075c58]">{formatMoney(calculateLineAmount(line))}</p></div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Type<select value={line.preset} onChange={(e) => changePreset(line.id, e.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#075c58] outline-none focus:border-[#075c58]">{PRESET_ORDER.map((key) => <option key={key} value={key}>{LINE_PRESETS[key].label}</option>)}</select></label>
                          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Quantity / area<input value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: e.target.value })} inputMode="decimal" className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Rate<input value={line.rate} onChange={(e) => updateLine(line.id, { rate: e.target.value })} inputMode="decimal" className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Minimum<input value={line.minimum} onChange={(e) => updateLine(line.id, { minimum: e.target.value })} inputMode="decimal" className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Customer label<input value={line.label} onChange={(e) => updateLine(line.id, { label: e.target.value })} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Unit<input value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value })} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <button type="button" onClick={() => removeLine(line.id)} className="self-end rounded-2xl border border-red-200 bg-white px-4 py-2 text-xs font-black text-red-700">Remove</button>
                        </div>
                        <label className="mt-3 grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Line note<textarea value={line.note} onChange={(e) => updateLine(line.id, { note: e.target.value })} rows={2} placeholder="Example: Assumes floor area is cleared before service." className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-[#eadfc8] bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Discount / credit<input value={discountCredit} onChange={(e) => { setDiscountCredit(e.target.value); markDirty(); }} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-normal outline-none focus:border-[#075c58]" /></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Possible later/add-on amount<input value={additionalAmount} onChange={(e) => { setAdditionalAmount(e.target.value); markDirty(); }} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-normal outline-none focus:border-[#075c58]" /></label>
                  </div>
                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">Customer-facing notes<textarea value={customerNote} onChange={(e) => { setCustomerNote(e.target.value); markDirty(); }} rows={4} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-normal outline-none focus:border-[#075c58]" /></label>
                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">Private admin notes<textarea value={internalNotes} onChange={(e) => { setInternalNotes(e.target.value); markDirty(); }} rows={3} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-normal outline-none focus:border-[#075c58]" /></label>
                </div>

                <div className="rounded-3xl border border-rose-200 bg-rose-50/45 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">Refund tracking</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">This does not send money. Issue the refund in Stripe, then record what happened here.</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Refund status<select value={refundStatus} onChange={(e) => { setRefundStatus(e.target.value); markDirty(); }} className="rounded-2xl border border-rose-200 bg-white px-4 py-3 font-bold text-rose-800 outline-none focus:border-rose-500">{REFUND_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Refund amount<input value={refundAmount} onChange={(e) => { setRefundAmount(e.target.value); markDirty(); }} inputMode="decimal" className="rounded-2xl border border-rose-200 bg-white px-4 py-3 font-normal outline-none focus:border-rose-500" /></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Reason<select value={refundReason} onChange={(e) => { setRefundReason(e.target.value); markDirty(); }} className="rounded-2xl border border-rose-200 bg-white px-4 py-3 font-bold text-rose-800 outline-none focus:border-rose-500">{REFUND_REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Refund date<input type="date" value={refundDate} onChange={(e) => { setRefundDate(e.target.value); markDirty(); }} className="rounded-2xl border border-rose-200 bg-white px-4 py-3 font-normal outline-none focus:border-rose-500" /></label>
                  </div>
                  <label className="mt-3 flex items-center gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={refundCustomerNotified} onChange={(e) => { setRefundCustomerNotified(e.target.checked); markDirty(); }} className="h-4 w-4" /> Customer notified about refund / credit</label>
                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">Refund notes<textarea value={refundNotes} onChange={(e) => { setRefundNotes(e.target.value); markDirty(); }} rows={3} placeholder="Example: Partial refund issued in Stripe on 6/2 for removed carpet add-on. Customer notified by email." className="rounded-2xl border border-rose-200 bg-white px-4 py-3 font-normal outline-none focus:border-rose-500" /></label>
                </div>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-3xl border border-[#d8c18f] bg-[#fbf6ea] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Calculated summary</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
                    <div className="flex justify-between gap-3"><span>Discount / credit</span><strong>-{formatMoney(discount)}</strong></div>
                    <div className="border-t border-[#d8c18f] pt-3 text-lg font-black text-[#075c58] flex justify-between gap-3"><span>Amount due now</span><span>{formatMoney(amountDueNow)}</span></div>
                    {laterAmount > 0 && <div className="flex justify-between gap-3"><span>Possible later/add-on</span><strong>{formatMoney(laterAmount)}</strong></div>}
                    <div className="flex justify-between gap-3"><span>Total tracked</span><strong>{formatMoney(totalQuoted)}</strong></div>
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">Sales tax, if applicable, is still shown in Stripe checkout/invoice. The quote builder tracks service scope and customer-facing breakdown.</p>
                  <div className="mt-4 grid gap-2">
                    <button type="button" onClick={() => onApplyFirstPayment?.(amountDueNow, quoteTitle, customerNote)} className="rounded-2xl bg-[#075c58] px-4 py-3 text-xs font-black text-white">Use amount due now for first payment</button>
                    <button type="button" onClick={() => onApplyAdditionalPayment?.(laterAmount, customerNote)} className="rounded-2xl border-2 border-[#075c58] bg-white px-4 py-3 text-xs font-black text-[#075c58]">Use later amount for add-on link</button>
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-200 bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Customer preview</p>
                  <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-white">{customerBreakdownText}</pre>
                </div>

                {message && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p>}
                {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
