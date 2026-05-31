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
  multiplier: string;
  multiplierLabel: string;
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


type BuilderButtonVariant = "primary" | "secondary" | "quiet" | "danger";

function getBuilderButtonClass(variant: BuilderButtonVariant = "primary") {
  const base = "inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-black shadow-sm transition-all duration-150 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-55";
  const variants: Record<BuilderButtonVariant, string> = {
    primary: "bg-[#075c58] text-white hover:-translate-y-0.5 hover:bg-[#064b48] focus:ring-[#075c58]/25 active:translate-y-0 active:scale-[0.99]",
    secondary: "border-2 border-[#075c58] bg-white text-[#075c58] hover:-translate-y-0.5 hover:bg-[#f4ecdc] focus:ring-[#075c58]/20 active:translate-y-0 active:scale-[0.99]",
    quiet: "border border-[#d8c18f] bg-white text-slate-700 hover:-translate-y-0.5 hover:border-[#075c58] hover:text-[#075c58] focus:ring-[#075c58]/15 active:translate-y-0 active:scale-[0.99]",
    danger: "border border-red-200 bg-white text-red-700 hover:-translate-y-0.5 hover:bg-red-50 focus:ring-red-700/15 active:translate-y-0 active:scale-[0.99]",
  };
  return `${base} ${variants[variant]}`;
}

function BuilderSpinner() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;
}

const LINE_PRESETS: Record<string, Omit<QuoteLineItem, "id" | "note">> = {
  routineVisit: {
    preset: "routineVisit",
    label: "Routine Commercial Reset — by sq ft",
    description: "Routine business cleaning calculated from reviewed square footage and selected rate, with a minimum visit charge.",
    quantity: "1000",
    unit: "sq ft",
    rate: "0.18",
    minimum: "175",
    multiplier: "1",
    multiplierLabel: "visit",
    recurring: false,
  },
  recurringMonthly: {
    preset: "recurringMonthly",
    label: "Recurring Commercial Reset — monthly by sq ft",
    description: "Monthly plan calculated from reviewed square footage, per-visit sq ft rate, and expected visits per month, with a monthly minimum.",
    quantity: "1000",
    unit: "sq ft",
    rate: "0.18",
    minimum: "499",
    multiplier: "4.33",
    multiplierLabel: "visits/month",
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
    multiplier: "1",
    multiplierLabel: "hour",
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
    multiplier: "1",
    multiplierLabel: "service",
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
    multiplier: "1",
    multiplierLabel: "service",
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
    multiplier: "1",
    multiplierLabel: "area",
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
    multiplier: "1",
    multiplierLabel: "service",
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
    multiplier: "1",
    multiplierLabel: "service",
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
    multiplier: "1",
    multiplierLabel: "service",
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
    multiplier: "1",
    multiplierLabel: "service",
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
    multiplier: "1",
    multiplierLabel: "turnover",
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
    multiplier: "1",
    multiplierLabel: "service",
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
    multiplier: "1",
    multiplierLabel: "service",
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
const QUOTE_TYPES = ["Sq-ft visit quote", "Sq-ft recurring monthly plan", "Flat visit quote", "Reviewed price range", "Add-on quote", "Short-term rental turnover"];
const REFUND_STATUSES = ["No refund due", "Reviewing refund", "Partial refund due", "Full refund due", "Partial refund issued", "Full refund issued", "Credit offered"];
const REFUND_REASONS = ["Service canceled", "Customer overpaid", "Add-on removed", "Partial service completed", "Service issue / make-it-right", "Duplicate payment", "Laundry or balance adjustment", "Other"];

function getSubmittedSqFtValue(item: AdminDoc) {
  const raw = String(item.squareFootage || item.squareFeet || item.sqFt || item.spaceSize || "");
  if (!raw || raw.toLowerCase().includes("not sure")) return "1000";
  const normalized = raw.replace(/,/g, "");
  if (/under\s*750/i.test(normalized)) return "750";
  const matches = normalized.match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) return "1000";
  if (/over/i.test(normalized)) return matches[matches.length - 1];
  return matches[matches.length - 1];
}

function getSuggestedRoutineRate(item: AdminDoc) {
  const frequency = String(item.frequency || item.serviceFrequency || "").toLowerCase();
  const condition = String(item.spaceCondition || item.condition || "").toLowerCase();
  if (frequency.includes("five")) return "0.11";
  if (frequency.includes("three")) return "0.13";
  if (frequency.includes("twice") || frequency.includes("two")) return "0.15";
  if (frequency.includes("weekly")) return "0.18";
  if (frequency.includes("monthly") || frequency.includes("occasional")) return "0.22";
  if (condition.includes("heavy")) return "0.45";
  if (condition.includes("first-time") || condition.includes("catch-up")) return "0.35";
  if (frequency.includes("one-time")) return "0.30";
  return "0.18";
}

function getSuggestedMonthlyMultiplier(item: AdminDoc) {
  const frequency = String(item.frequency || item.serviceFrequency || "").toLowerCase();
  // Use simple billing visits/month by default so the admin quote is easy to explain.
  // Admin can still enter 4.33, 8.66, etc. manually when they want exact average-month math.
  if (frequency.includes("five")) return "20";
  if (frequency.includes("three")) return "12";
  if (frequency.includes("twice") || frequency.includes("two")) return "8";
  if (frequency.includes("weekly")) return "4";
  if (frequency.includes("monthly") || frequency.includes("occasional")) return "1";
  return "4";
}

function getInitialQuoteType(item: AdminDoc) {
  const existing = safeString(item.commercialQuoteType) || safeString(item.commercialQuoteBreakdown?.quoteType);
  if (existing) return existing;
  const frequency = String(item.frequency || "").toLowerCase();
  const businessType = String(item.businessType || "").toLowerCase();
  if (businessType.includes("rental") || businessType.includes("turnover")) return "Short-term rental turnover";
  if (frequency.includes("weekly") || frequency.includes("monthly") || frequency.includes("recurring") || frequency.includes("twice") || frequency.includes("three") || frequency.includes("five")) return "Sq-ft recurring monthly plan";
  return "Sq-ft visit quote";
}

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

function makeLine(presetKey = "routineVisit", item?: AdminDoc): QuoteLineItem {
  const preset = LINE_PRESETS[presetKey] || LINE_PRESETS.routineVisit;
  const line: QuoteLineItem = { id: makeId(), ...preset, note: "" };

  if (presetKey === "routineVisit") {
    line.quantity = item ? getSubmittedSqFtValue(item) : line.quantity;
    line.rate = item ? getSuggestedRoutineRate(item) : line.rate;
    line.minimum = "175";
    line.multiplier = "1";
    line.multiplierLabel = "visit";
    line.note = item?.squareFootage ? "Prefilled from the request square-footage range. Edit the square footage/rate after review if needed." : "Enter reviewed square footage and rate.";
  }

  if (presetKey === "recurringMonthly") {
    line.quantity = item ? getSubmittedSqFtValue(item) : line.quantity;
    line.rate = item ? getSuggestedRoutineRate(item) : line.rate;
    line.minimum = "499";
    line.multiplier = item ? getSuggestedMonthlyMultiplier(item) : line.multiplier;
    line.multiplierLabel = "visits/month";
    line.note = item?.frequency ? `Monthly plan uses the requested frequency (${item.frequency}) with rounded billing visits/month. Edit visits/month if the schedule changes or if you want exact average-month math.` : "Enter reviewed square footage, per-visit sq ft rate, and visits per month.";
  }

  if (presetKey === "firstTimeReset") {
    line.quantity = item ? getSubmittedSqFtValue(item) : line.quantity;
  }

  return line;
}

function calculateLineAmount(line: QuoteLineItem) {
  const quantity = Math.max(0, toNumber(line.quantity));
  const rate = Math.max(0, toNumber(line.rate));
  const minimum = Math.max(0, toNumber(line.minimum));
  const multiplier = Math.max(0, toNumber(line.multiplier || "1"));
  const raw = line.unit === "flat" ? rate : quantity * rate * multiplier;
  return money(Math.max(raw, minimum));
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      multiplier: String(line.multiplier ?? "1"),
      multiplierLabel: safeString(line.multiplierLabel) || "service",
      recurring: Boolean(line.recurring),
      note: safeString(line.note),
    }));
  }

  const frequency = String(item.frequency || "").toLowerCase();
  const businessType = String(item.businessType || "").toLowerCase();
  if (businessType.includes("rental") || businessType.includes("turnover")) return [makeLine("turnover", item)];
  if (frequency.includes("weekly") || frequency.includes("monthly") || frequency.includes("recurring") || frequency.includes("twice") || frequency.includes("three") || frequency.includes("five")) return [makeLine("recurringMonthly", item)];
  return [makeLine("routineVisit", item)];
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
    const multiplier = Math.max(0, toNumber(line.multiplier || "1"));
    const multiplierText = line.unit !== "flat" && multiplier !== 1 ? ` × ${line.multiplier} ${line.multiplierLabel || "multiplier"}` : "";
    const qty = line.unit === "flat" ? "" : `${line.quantity} ${line.unit} × ${line.rate}${multiplierText}`;
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
  const [quoteType, setQuoteType] = useState(() => getInitialQuoteType(item));
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
    setQuoteType(getInitialQuoteType(item));
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
    const nextLine = makeLine(presetKey, item);
    setLineItems((prev) => prev.map((line) => line.id === id ? { ...line, ...nextLine, id: line.id } : line));
    markDirty();
  }

  function addLine(preset = "customFlat") {
    setLineItems((prev) => [...prev, makeLine(preset, item)]);
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

  function getPrintableBreakdownHtml() {
    const rows = lineItems.map((line) => {
      const multiplier = toNumber(line.multiplier || "1");
      const mathText = line.unit !== "flat"
        ? `${line.quantity} ${line.unit} × ${line.rate}${multiplier !== 1 ? ` × ${line.multiplier} ${line.multiplierLabel || "multiplier"}` : ""}`
        : "Flat approved amount";
      return `<div class="line-row"><div><strong>${escapeHtml(line.label)}</strong><br/><span>${escapeHtml(line.description || "")}</span><br/><small>${escapeHtml(mathText)}</small>${line.note ? `<br/><small>${escapeHtml(line.note)}</small>` : ""}</div><div class="amount">${escapeHtml(formatMoney(calculateLineAmount(line)))}</div></div>`;
    }).join("");

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>NestHelper Commercial Reset quote</title>
  <style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#173b37;line-height:1.45;padding:32px;background:#faf7ef}.card{max-width:820px;margin:auto;background:#fff;border:1px solid #eadfc8;border-radius:24px;overflow:hidden}.header{background:#075c58;color:#fff;padding:26px}.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#f1c96b;font-weight:800}h1{margin:8px 0 4px;font-size:28px;line-height:1.15}.muted{color:#64748b}.body{padding:26px}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 22px}.meta div{background:#fbf6ea;border:1px solid #eadfc8;border-radius:16px;padding:12px}.meta strong{display:block;color:#075c58;font-size:12px;text-transform:uppercase;letter-spacing:.12em}.line-row{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid #e8e2d6;padding:15px 0}.line-row span,.line-row small{color:#64748b}.amount{font-weight:800;white-space:nowrap;color:#075c58}.summary{margin-top:18px;border:1px solid #eadfc8;border-radius:18px;overflow:hidden}.summary-row{display:flex;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #eadfc8}.summary-row:last-child{border-bottom:0}.total{background:#075c58;color:#fff;font-size:18px;font-weight:900}.note{background:#fbf6ea;border:1px solid #eadfc8;border-radius:16px;padding:16px;margin-top:18px;white-space:pre-wrap}.fine{font-size:12px;color:#64748b;margin-top:18px}@media print{body{background:#fff;padding:0}.card{border:0;border-radius:0}.no-print{display:none}}@media(max-width:640px){body{padding:14px}.meta{grid-template-columns:1fr}.line-row{display:block}.amount{margin-top:8px}}
  </style>
</head>
<body>
  <div class="card">
    <div class="header"><div class="eyebrow">NestHelper Commercial Reset</div><h1>Quote breakdown</h1><div>${escapeHtml(quoteTitle)}</div></div>
    <div class="body">
      <div class="meta">
        <div><strong>Customer</strong>${escapeHtml(item.fullName || item.name || item.contactName || "Customer")}</div>
        <div><strong>Pricing style</strong>${escapeHtml(quoteType)}</div>
        <div><strong>Status</strong>${escapeHtml(quoteStatus)}</div>
        <div><strong>Valid / review date</strong>${escapeHtml(validUntil || "Reviewed before scheduling")}</div>
      </div>
      ${rows}
      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><strong>${escapeHtml(formatMoney(subtotal))}</strong></div>
        ${discount > 0 ? `<div class="summary-row"><span>Discount / credit</span><strong>-${escapeHtml(formatMoney(discount))}</strong></div>` : ""}
        <div class="summary-row total"><span>Amount due now</span><span>${escapeHtml(formatMoney(amountDueNow))}</span></div>
        ${laterAmount > 0 ? `<div class="summary-row"><span>Possible later/add-on amount</span><strong>${escapeHtml(formatMoney(laterAmount))}</strong></div>` : ""}
      </div>
      <div class="note">${escapeHtml(customerNote)}</div>
      <p class="fine">Sales tax, if applicable, is shown at checkout or invoice. Final service is based on approved scope, access, condition, schedule, and any reviewed add-ons. Heavy furniture, equipment, fragile items, or blocked areas may require customer preparation or a separate labor quote.</p>
    </div>
  </div>
</body>
</html>`;
  }

  function downloadBreakdown() {
    const html = getPrintableBreakdownHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nesthelper-commercial-quote-${item.id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage("Printable quote downloaded as an HTML file. Open it in a browser to print or save as PDF.");
  }

  function printBreakdown() {
    const html = getPrintableBreakdownHtml();
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const printWindow = iframe.contentWindow;
    const printDocument = printWindow?.document;
    if (!printWindow || !printDocument) {
      iframe.remove();
      setError("Unable to open the print preview. Use Download, then print the downloaded quote from your browser.");
      return;
    }

    printDocument.open();
    printDocument.write(html);
    printDocument.close();

    window.setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        setMessage("Print dialog opened.");
      } catch {
        setError("Print did not open. Use Download, then print the downloaded quote from your browser.");
      }
      window.setTimeout(() => iframe.remove(), 1200);
    }, 400);
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
          <p className="mt-1 text-sm leading-6 text-slate-700">Use sq-ft calculators for routine commercial service, plus dropdown line items for recurring plans, add-ons, credits, and refund notes. Save the breakdown first. The admin can then create a Stripe invoice from it or use it with a quick checkout link when needed.</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          className={`${getBuilderButtonClass("primary")} w-full sm:w-auto px-5 py-3 text-sm`}
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
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Commercial quote breakdown builder">
            <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-[#eadfc8] bg-white/95 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Commercial Reset quote builder</p>
                <h3 className="text-2xl font-black text-[#075c58]">Professional breakdown</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">Clicking outside will not close this. Save the draft before creating a Stripe invoice or sending any payment link so the customer gets the latest breakdown.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copyBreakdown} className={getBuilderButtonClass("secondary")}>Copy breakdown</button>
                <button type="button" onClick={downloadBreakdown} className={getBuilderButtonClass("secondary")}>Download quote</button>
                <button type="button" onClick={printBreakdown} className={getBuilderButtonClass("secondary")}>Print</button>
                <button type="button" disabled={busy} onClick={saveBreakdown} className={getBuilderButtonClass("primary")}>{busy ? <><BuilderSpinner /> Saving...</> : "Save draft"}</button>
                <button type="button" onClick={attemptClose} className={getBuilderButtonClass("quiet")}>Close</button>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
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
                    <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Line items</p><h4 className="text-lg font-black text-[#075c58]">Sq-ft calculators + dropdown line items</h4></div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => addLine("routineVisit")} className={getBuilderButtonClass("quiet")}>+ Routine sq ft</button>
                      <button type="button" onClick={() => addLine("recurringMonthly")} className={getBuilderButtonClass("quiet")}>+ Monthly plan</button>
                      <button type="button" onClick={() => addLine("carpetDeepCleaning")} className={getBuilderButtonClass("quiet")}>+ Carpet</button>
                      <button type="button" onClick={() => addLine("customFlat")} className={getBuilderButtonClass("primary")}>+ Additional line</button>
                    </div>
                  </div>

                  <p className="mt-3 rounded-2xl bg-[#fbf6ea] px-4 py-3 text-xs font-semibold leading-5 text-slate-700">Routine commercial lines are sq-ft based by default. Use reviewed square footage × per-visit rate × billing visits/month when needed. For twice weekly, the builder now starts at 8 visits/month for a simple customer quote; enter 8.66 manually only if you want exact average-month math.</p>

                  <div className="mt-4 space-y-4">
                    {lineItems.map((line, index) => (
                      <div key={line.id} className="rounded-3xl border border-cyan-100 bg-cyan-50/35 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <p className="text-sm font-black text-[#075c58]">Line {index + 1}: {line.label}</p>
                          <div className="text-right"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#b98a2f]">Calculated amount</p><p className="text-lg font-black text-[#075c58]">{formatMoney(calculateLineAmount(line))}</p></div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          <label className="grid min-w-0 gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Line type<select value={line.preset} onChange={(e) => changePreset(line.id, e.target.value)} className="w-full min-w-0 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#075c58] outline-none focus:border-[#075c58]">{PRESET_ORDER.map((key) => <option key={key} value={key}>{LINE_PRESETS[key].label}</option>)}</select></label>
                          <label className="grid min-w-0 gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Area / qty<input value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: e.target.value })} inputMode="decimal" className="w-full min-w-0 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <label className="grid min-w-0 gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Rate<input value={line.rate} onChange={(e) => updateLine(line.id, { rate: e.target.value })} inputMode="decimal" className="w-full min-w-0 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <label className="grid min-w-0 gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Visits / multiplier<input value={line.multiplier} onChange={(e) => updateLine(line.id, { multiplier: e.target.value })} inputMode="decimal" className="w-full min-w-0 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <label className="grid min-w-0 gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Minimum<input value={line.minimum} onChange={(e) => updateLine(line.id, { minimum: e.target.value })} inputMode="decimal" className="w-full min-w-0 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.75fr)_minmax(0,0.9fr)_auto]">
                          <label className="grid min-w-0 gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Customer label<input value={line.label} onChange={(e) => updateLine(line.id, { label: e.target.value })} className="w-full min-w-0 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <label className="grid min-w-0 gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Unit<input value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value })} className="w-full min-w-0 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <label className="grid min-w-0 gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Multiplier label<input value={line.multiplierLabel} onChange={(e) => updateLine(line.id, { multiplierLabel: e.target.value })} className="w-full min-w-0 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#075c58]" /></label>
                          <button type="button" onClick={() => removeLine(line.id)} className={`${getBuilderButtonClass("danger")} self-end`}>Remove</button>
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
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">Sales tax, if applicable, is still shown in Stripe checkout/invoice. The quote builder tracks service scope, sq-ft math, and customer-facing breakdown.</p>
                  <div className="mt-4 grid gap-2">
                    <button type="button" onClick={() => onApplyFirstPayment?.(amountDueNow, quoteTitle, customerNote)} className={getBuilderButtonClass("primary")}>Use amount due now for first payment</button>
                    <button type="button" onClick={() => onApplyAdditionalPayment?.(laterAmount, customerNote)} className={getBuilderButtonClass("secondary")}>Use later amount for add-on link</button>
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
