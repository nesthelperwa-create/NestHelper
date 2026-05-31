"use client";

import { useEffect, useMemo, useState } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";

type AdminDoc = { id: string; [key: string]: any };

type FamilyLineItem = {
  id: string;
  preset: string;
  label: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  amount: string;
  note: string;
};

type FamilyBreakdownBuilderProps = {
  item: AdminDoc;
  formatMoney: (value: number) => string;
  onSaved: (updates: Record<string, unknown>) => void;
  onApplyCheckout: (payload: { amount: number; title: string; note: string }) => void;
  onApplyAdditionalPayment: (payload: { amount: number; reason: string; note: string }) => void;
};

const PACKAGE_PRESETS = [
  {
    id: "parent-reset-standard",
    label: "2-Hour Parent Reset",
    description: "One-time 2-hour Parent Reset package.",
    unit: "flat",
    rate: "129",
    amount: "129",
  },
  {
    id: "family-reset-standard",
    label: "3-Hour Family Reset",
    description: "One-time 3-hour Family Reset package.",
    unit: "flat",
    rate: "179",
    amount: "179",
  },
  {
    id: "helper-block-standard",
    label: "4-Hour Helper Block",
    description: "One-time 4-hour Helper Block package.",
    unit: "flat",
    rate: "239",
    amount: "239",
  },
  {
    id: "errand-helper-standard",
    label: "Errand Helper",
    description: "Errand Helper base visit, before approved extra stops, mileage, reimbursements, or wait time.",
    unit: "flat",
    rate: "109",
    amount: "109",
  },
  {
    id: "laundry-deposit-standard",
    label: "Laundry Rescue deposit / minimum",
    description: "Laundry Rescue deposit or minimum. Final balance may be sent after dry weight, deposit credit, and add-ons are reviewed.",
    unit: "flat",
    rate: "59",
    amount: "59",
  },
  {
    id: "extra-half-hour",
    label: "Approved extra 30 minutes",
    description: "Approved extra time added to the original family service scope.",
    unit: "half-hour",
    rate: "30",
    amount: "30",
  },
  {
    id: "extra-hour",
    label: "Approved extra hour",
    description: "Approved extra time added to the original family service scope.",
    unit: "hour",
    rate: "60",
    amount: "60",
  },
  {
    id: "recurring-weekly-family",
    label: "Recurring Family Reset visit",
    description: "Per-visit recurring family service. Weekly or biweekly schedule confirmed after review.",
    unit: "visit",
    rate: "169",
    amount: "169",
  },
  {
    id: "errand-extra-stop",
    label: "Approved extra errand stop",
    description: "Extra stop or route change approved before the errand begins.",
    unit: "stop",
    rate: "15",
    amount: "15",
  },
  {
    id: "custom-approved-line",
    label: "Custom approved line item",
    description: "Custom approved NestHelper family service charge.",
    unit: "flat",
    rate: "0",
    amount: "0",
  },
];

function cleanNumber(value: unknown) {
  const next = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(next) ? next : 0;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getServiceLabel(item: AdminDoc) {
  const raw = String(item.service || item.selectedServiceTitle || "").toLowerCase();
  if (raw.includes("laundry")) return "Laundry Rescue";
  if (raw.includes("errand")) return "Errand Helper";
  if (raw.includes("helper")) return "Helper Block";
  if (raw.includes("family")) return "Family Reset";
  if (raw.includes("parent")) return "Parent Reset";
  return getString(item.selectedServiceTitle) || "NestHelper family service";
}

function getSuggestedPresetId(item: AdminDoc) {
  const raw = String(item.service || item.selectedServiceTitle || "").toLowerCase();
  if (raw.includes("laundry")) return "laundry-deposit-standard";
  if (raw.includes("errand")) return "errand-helper-standard";
  if (raw.includes("helper")) return "helper-block-standard";
  if (raw.includes("family")) return "family-reset-standard";
  return "parent-reset-standard";
}

function createLineFromPreset(presetId: string): FamilyLineItem {
  const preset = PACKAGE_PRESETS.find((item) => item.id === presetId) || PACKAGE_PRESETS[0];
  return {
    id: makeId(),
    preset: preset.id,
    label: preset.label,
    description: preset.description,
    quantity: "1",
    unit: preset.unit,
    rate: preset.rate,
    amount: preset.amount,
    note: "",
  };
}

function calculateLineAmount(line: FamilyLineItem) {
  const unit = line.unit.toLowerCase();
  if (unit === "flat") return Math.max(0, cleanNumber(line.amount));
  return Math.max(0, cleanNumber(line.quantity) * cleanNumber(line.rate));
}

function formatQuantity(line: FamilyLineItem) {
  if (line.unit === "flat") return "Flat amount";
  return `${cleanNumber(line.quantity) || 0} ${line.unit}${cleanNumber(line.quantity) === 1 ? "" : "s"} × $${cleanNumber(line.rate).toFixed(2)}`;
}

function buildCustomerBreakdownText({
  quoteTitle,
  serviceLabel,
  paymentPlan,
  lineItems,
  subtotal,
  discountCredit,
  amountDueNow,
  laterAmount,
  customerNote,
  formatMoney,
}: {
  quoteTitle: string;
  serviceLabel: string;
  paymentPlan: string;
  lineItems: FamilyLineItem[];
  subtotal: number;
  discountCredit: number;
  amountDueNow: number;
  laterAmount: number;
  customerNote: string;
  formatMoney: (value: number) => string;
}) {
  const lines = lineItems
    .filter((line) => calculateLineAmount(line) > 0 || line.label.trim())
    .map((line) => {
      const amount = calculateLineAmount(line);
      const details = [line.description, line.note ? `Note: ${line.note}` : ""].filter(Boolean).join(" ");
      return `• ${line.label} — ${formatMoney(amount)}\n  ${formatQuantity(line)}${details ? `\n  ${details}` : ""}`;
    })
    .join("\n");

  return [
    quoteTitle || `${serviceLabel} payment breakdown`,
    `Service: ${serviceLabel}`,
    `Payment type: ${paymentPlan}`,
    "",
    lines,
    "",
    `Subtotal: ${formatMoney(subtotal)}`,
    discountCredit > 0 ? `Discount / credit: -${formatMoney(discountCredit)}` : "",
    `Amount due now: ${formatMoney(amountDueNow)}`,
    laterAmount > 0 ? `Possible later/add-on amount: ${formatMoney(laterAmount)}` : "Possible later/add-on amount: None listed right now",
    customerNote ? `\nCustomer note: ${customerNote}` : "",
    "",
    "Final timing, access, and service notes are confirmed by NestHelper before the visit. Any added work, route changes, laundry final balance, or extra time is reviewed before a separate payment link is sent.",
  ]
    .filter((part) => part !== "")
    .join("\n");
}

export default function FamilyPaymentBreakdownBuilder({
  item,
  formatMoney,
  onSaved,
  onApplyCheckout,
  onApplyAdditionalPayment,
}: FamilyBreakdownBuilderProps) {
  const serviceLabel = getServiceLabel(item);
  const saved = (item.familyPaymentBreakdown || {}) as Record<string, any>;
  const [quoteTitle, setQuoteTitle] = useState(getString(saved.quoteTitle) || `${serviceLabel} payment breakdown`);
  const [paymentPlan, setPaymentPlan] = useState(getString(saved.paymentPlan) || "One-time family service");
  const [selectedPreset, setSelectedPreset] = useState(getSuggestedPresetId(item));
  const [lineItems, setLineItems] = useState<FamilyLineItem[]>(
    Array.isArray(saved.lineItems) && saved.lineItems.length
      ? saved.lineItems.map((line: any) => ({
          id: getString(line.id) || makeId(),
          preset: getString(line.preset) || "custom-approved-line",
          label: getString(line.label) || "Custom approved line item",
          description: getString(line.description),
          quantity: getString(line.quantity) || "1",
          unit: getString(line.unit) || "flat",
          rate: getString(line.rate) || "0",
          amount: getString(line.amount) || "0",
          note: getString(line.note),
        }))
      : [createLineFromPreset(getSuggestedPresetId(item))]
  );
  const [discountCredit, setDiscountCredit] = useState(getString(saved.discountCredit) || "0");
  const [laterAmount, setLaterAmount] = useState(getString(saved.laterAmount) || "0");
  const [customerNote, setCustomerNote] = useState(
    getString(saved.customerNote) ||
      (String(item.service || "").includes("laundry")
        ? "Laundry deposit/minimum is credited toward the final balance. A final balance link may be sent after dry weight, add-ons, bulky items, or approved changes are reviewed."
        : "Any added time, errands, mileage, or scope changes are reviewed before a separate payment link is sent.")
  );
  const [internalNotes, setInternalNotes] = useState(getString(saved.internalNotes));
  const [refundStatus, setRefundStatus] = useState(getString(item.familyRefundTracking?.refundStatus) || "No refund due");
  const [refundAmount, setRefundAmount] = useState(getString(item.familyRefundTracking?.refundAmount) || "0");
  const [refundReason, setRefundReason] = useState(getString(item.familyRefundTracking?.refundReason));
  const [customerNotified, setCustomerNotified] = useState(Boolean(item.familyRefundTracking?.customerNotified));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const nextSaved = (item.familyPaymentBreakdown || {}) as Record<string, any>;
    setQuoteTitle(getString(nextSaved.quoteTitle) || `${getServiceLabel(item)} payment breakdown`);
    setPaymentPlan(getString(nextSaved.paymentPlan) || "One-time family service");
    setSelectedPreset(getSuggestedPresetId(item));
    setLineItems(
      Array.isArray(nextSaved.lineItems) && nextSaved.lineItems.length
        ? nextSaved.lineItems.map((line: any) => ({
            id: getString(line.id) || makeId(),
            preset: getString(line.preset) || "custom-approved-line",
            label: getString(line.label) || "Custom approved line item",
            description: getString(line.description),
            quantity: getString(line.quantity) || "1",
            unit: getString(line.unit) || "flat",
            rate: getString(line.rate) || "0",
            amount: getString(line.amount) || "0",
            note: getString(line.note),
          }))
        : [createLineFromPreset(getSuggestedPresetId(item))]
    );
    setDiscountCredit(getString(nextSaved.discountCredit) || "0");
    setLaterAmount(getString(nextSaved.laterAmount) || "0");
    setCustomerNote(getString(nextSaved.customerNote) || "Any added time, errands, mileage, or scope changes are reviewed before a separate payment link is sent.");
    setInternalNotes(getString(nextSaved.internalNotes));
    setRefundStatus(getString(item.familyRefundTracking?.refundStatus) || "No refund due");
    setRefundAmount(getString(item.familyRefundTracking?.refundAmount) || "0");
    setRefundReason(getString(item.familyRefundTracking?.refundReason));
    setCustomerNotified(Boolean(item.familyRefundTracking?.customerNotified));
    setMessage("");
    setError("");
  }, [item.id]);

  const subtotal = useMemo(() => lineItems.reduce((total, line) => total + calculateLineAmount(line), 0), [lineItems]);
  const discount = Math.max(0, cleanNumber(discountCredit));
  const amountDueNow = Math.max(0, subtotal - discount);
  const possibleLaterAmount = Math.max(0, cleanNumber(laterAmount));
  const customerBreakdownText = useMemo(
    () =>
      buildCustomerBreakdownText({
        quoteTitle,
        serviceLabel,
        paymentPlan,
        lineItems,
        subtotal,
        discountCredit: discount,
        amountDueNow,
        laterAmount: possibleLaterAmount,
        customerNote,
        formatMoney,
      }),
    [quoteTitle, serviceLabel, paymentPlan, lineItems, subtotal, discount, amountDueNow, possibleLaterAmount, customerNote, formatMoney]
  );

  function addLineFromPreset() {
    setLineItems((prev) => [...prev, createLineFromPreset(selectedPreset)]);
  }

  function updateLine(id: string, updates: Partial<FamilyLineItem>) {
    setLineItems((prev) => prev.map((line) => (line.id === id ? { ...line, ...updates } : line)));
  }

  function removeLine(id: string) {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((line) => line.id !== id) : prev));
  }

  async function copyBreakdown() {
    await navigator.clipboard.writeText(customerBreakdownText);
    setMessage("Family payment breakdown copied.");
  }

  function downloadBreakdown() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${quoteTitle}</title><style>body{font-family:Arial,sans-serif;line-height:1.55;color:#233;padding:28px;max-width:760px;margin:0 auto;}h1{color:#075c58;}pre{white-space:pre-wrap;font-family:Arial,sans-serif;border:1px solid #eadfc8;background:#fbf6ea;border-radius:16px;padding:18px;}</style></head><body><h1>${quoteTitle}</h1><pre>${customerBreakdownText.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nesthelper-family-breakdown-${item.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function printBreakdown() {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${quoteTitle}</title><style>body{font-family:Arial,sans-serif;line-height:1.55;color:#233;padding:28px;}h1{color:#075c58;}pre{white-space:pre-wrap;font-family:Arial,sans-serif;border:1px solid #eadfc8;background:#fbf6ea;border-radius:16px;padding:18px;}</style></head><body><h1>${quoteTitle}</h1><pre>${customerBreakdownText.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre></body></html>`);
    doc.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => iframe.remove(), 1000);
  }

  async function saveDraft() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/update-family-payment-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId: item.id,
          amountDueNow,
          additionalAmount: possibleLaterAmount,
          paymentPlan,
          quoteTitle,
          customerNote,
          internalNotes,
          paymentBreakdown: {
            quoteTitle,
            serviceLabel,
            paymentPlan,
            lineItems,
            subtotal: Number(subtotal.toFixed(2)),
            discountCredit: Number(discount.toFixed(2)),
            amountDueNow: Number(amountDueNow.toFixed(2)),
            laterAmount: Number(possibleLaterAmount.toFixed(2)),
            customerNote,
            internalNotes,
            customerBreakdownText,
          },
          refundTracking: {
            refundStatus,
            refundAmount: Number(Math.max(0, cleanNumber(refundAmount)).toFixed(2)),
            refundReason,
            customerNotified,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to save family payment breakdown.");
      const updates = {
        familyPaymentBreakdown: {
          quoteTitle,
          serviceLabel,
          paymentPlan,
          lineItems,
          subtotal: Number(subtotal.toFixed(2)),
          discountCredit: Number(discount.toFixed(2)),
          amountDueNow: Number(amountDueNow.toFixed(2)),
          laterAmount: Number(possibleLaterAmount.toFixed(2)),
          customerNote,
          internalNotes,
          customerBreakdownText,
        },
        familyPaymentStatus: "Breakdown saved",
        familyInitialAmount: Number(amountDueNow.toFixed(2)),
        familyAdditionalAmount: Number(possibleLaterAmount.toFixed(2)),
        familyRefundTracking: {
          refundStatus,
          refundAmount: Number(Math.max(0, cleanNumber(refundAmount)).toFixed(2)),
          refundReason,
          customerNotified,
        },
      };
      onSaved(updates);
      setMessage("Family payment breakdown saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save family payment breakdown.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-5 rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Family payment breakdown</p>
          <h4 className="mt-1 text-xl font-black text-[#075c58]">Simple quote/payment builder for family requests</h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Use this when the customer needs a clear payment summary, a custom approved amount, recurring family help estimate, Laundry Rescue deposit/final-balance note, or refund/credit tracking. It is intentionally simpler than Commercial Reset.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#075c58] shadow-sm">
          Amount due now: {formatMoney(amountDueNow)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Breakdown title
          <input value={quoteTitle} onChange={(e) => setQuoteTitle(e.target.value)} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Payment type
          <select value={paymentPlan} onChange={(e) => setPaymentPlan(e.target.value)} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]">
            <option>One-time family service</option>
            <option>Recurring weekly family service</option>
            <option>Recurring every 2 weeks</option>
            <option>Laundry Rescue deposit</option>
            <option>Laundry final balance</option>
            <option>Custom approved family payment</option>
            <option>Refund / credit record</option>
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-3xl border border-[#eadfc8] bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="grid flex-1 gap-2 text-sm font-bold text-slate-700">
            Add line item
            <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]">
              {PACKAGE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={addLineFromPreset} className="min-h-11 rounded-2xl bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064b48]">Add line</button>
        </div>

        <div className="mt-4 space-y-3">
          {lineItems.map((line, index) => {
            const amount = calculateLineAmount(line);
            return (
              <div key={line.id} className="rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Line {index + 1}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#075c58]">{formatMoney(amount)}</span>
                    <button type="button" onClick={() => removeLine(line.id)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-black text-red-700">Remove</button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Customer-facing line title
                    <input value={line.label} onChange={(e) => updateLine(line.id, { label: e.target.value })} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Description
                    <input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Qty
                    <input value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: e.target.value })} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Unit
                    <select value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value })} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                      <option>flat</option>
                      <option>hour</option>
                      <option>half-hour</option>
                      <option>visit</option>
                      <option>stop</option>
                      <option>mile</option>
                      <option>lb</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Rate
                    <input value={line.rate} onChange={(e) => updateLine(line.id, { rate: e.target.value })} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Flat amount
                    <input value={line.amount} onChange={(e) => updateLine(line.id, { amount: e.target.value })} inputMode="decimal" disabled={line.unit !== "flat"} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#075c58]" />
                  </label>
                </div>
                <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                  Optional line note
                  <input value={line.note} onChange={(e) => updateLine(line.id, { note: e.target.value })} placeholder="Example: Customer approved by text; final timing still needs confirmation." className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Discount / credit
          <input value={discountCredit} onChange={(e) => setDiscountCredit(e.target.value)} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Possible later/add-on amount
          <input value={laterAmount} onChange={(e) => setLaterAmount(e.target.value)} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
        </label>
        <div className="rounded-2xl border border-[#d8c18f] bg-white p-4 text-sm font-black text-[#075c58]">
          <p>Subtotal: {formatMoney(subtotal)}</p>
          <p>Due now: {formatMoney(amountDueNow)}</p>
          {possibleLaterAmount > 0 && <p>Later/add-on: {formatMoney(possibleLaterAmount)}</p>}
        </div>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
        Customer note
        <textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} rows={3} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
      </label>

      <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
        Private admin notes
        <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} placeholder="Private notes. Not shown to customer." className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
      </label>

      <div className="mt-4 rounded-3xl border border-red-100 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Refund / credit tracking</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Refund status
            <select value={refundStatus} onChange={(e) => setRefundStatus(e.target.value)} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]">
              <option>No refund due</option>
              <option>Full refund due</option>
              <option>Partial refund due</option>
              <option>Refund issued</option>
              <option>Credit toward next visit</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Refund / credit amount
            <input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-2">
            Reason
            <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Example: Customer overpaid final laundry balance." className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-3 rounded-2xl bg-[#fbf6ea] px-4 py-3 text-sm font-bold text-slate-700">
          <input type="checkbox" checked={customerNotified} onChange={(e) => setCustomerNotified(e.target.checked)} className="h-5 w-5 rounded border-[#075c58] accent-[#075c58]" />
          Customer has been notified about the refund/credit.
        </label>
      </div>

      <div className="mt-4 rounded-3xl border border-[#eadfc8] bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Customer-facing preview</p>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#fbf6ea] p-4 text-xs leading-5 text-slate-700">{customerBreakdownText}</pre>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={saving} onClick={saveDraft} className="min-h-11 rounded-2xl bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064b48] disabled:opacity-55">
          {saving ? "Saving..." : "Save family breakdown"}
        </button>
        <button type="button" onClick={copyBreakdown} className="min-h-11 rounded-2xl border-2 border-[#075c58] bg-white px-5 py-3 text-sm font-black text-[#075c58] transition hover:bg-[#f4ecdc]">Copy</button>
        <button type="button" onClick={downloadBreakdown} className="min-h-11 rounded-2xl border border-[#d8c18f] bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-[#075c58] hover:text-[#075c58]">Download</button>
        <button type="button" onClick={printBreakdown} className="min-h-11 rounded-2xl border border-[#d8c18f] bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-[#075c58] hover:text-[#075c58]">Print</button>
        <button type="button" onClick={() => onApplyCheckout({ amount: amountDueNow, title: quoteTitle || `${serviceLabel} approved payment`, note: customerNote })} className="min-h-11 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800">Use due now for custom checkout</button>
        {possibleLaterAmount > 0 && (
          <button type="button" onClick={() => onApplyAdditionalPayment({ amount: possibleLaterAmount, reason: "Additional approved family balance", note: customerNote })} className="min-h-11 rounded-2xl border-2 border-emerald-700 bg-white px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50">Use later amount for additional link</button>
        )}
      </div>
      {message && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p>}
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
    </div>
  );
}
