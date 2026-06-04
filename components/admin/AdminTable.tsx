"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import StatusBadge from "./StatusBadge";
import CommercialQuoteBreakdownBuilder from "./CommercialQuoteBreakdownBuilder";
import FamilyPaymentBreakdownBuilder from "./FamilyPaymentBreakdownBuilder";

type AdminDoc = { id: string; status?: string; createdAt?: unknown; checkoutUrl?: string; promoCode?: string; [key: string]: any };
type CustomerCredit = { id: string; status?: string; amount?: number; remainingAmount?: number; customerEmail?: string; customerEmailKey?: string; creditCode?: string; [key: string]: any };
type CheckoutMode = "standard" | "founding" | "custom";

const COMMERCIAL_QUOTE_STATUSES = [
  "Not quoted",
  "Quote drafted",
  "Quote sent",
  "Quote approved",
  "Initial paid",
  "Additional sent",
  "Additional paid",
  "Completed",
];

const COMMERCIAL_QUOTE_TYPES = [
  "Flat visit quote",
  "Recurring monthly plan",
  "Reviewed price range",
  "Add-on quote",
  "Short-term rental turnover",
];

function getDateObject(value: unknown) {
  if (!value) return null;
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    const next = value.toDate();
    return next instanceof Date && !Number.isNaN(next.getTime()) ? next : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const next = new Date(value);
    return Number.isNaN(next.getTime()) ? null : next;
  }
  return null;
}

function formatDate(value: unknown) {
  const date = getDateObject(value);
  if (date) return date.toLocaleString();
  if (!value) return "—";
  return String(value);
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatValue(key: string, value: unknown) {
  if (isPhotoDataField(key) && Array.isArray(value)) return `${value.length} uploaded photo${value.length === 1 ? "" : "s"}`;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key.toLowerCase().includes("created") || key.toLowerCase().includes("updated") || key.toLowerCase().includes("paidat")) return formatDate(value);
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function toNumber(value: unknown) {
  const next = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(next) ? next : 0;
}

function centsToDollars(value: unknown) {
  const cents = toNumber(value);
  return cents > 0 ? cents / 100 : 0;
}

function cleanEmailKey(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getCustomerCreditAmount(credit: CustomerCredit) {
  const amount = toNumber(credit.remainingAmount || credit.amount);
  return amount > 0 ? amount : 0;
}

function getAvailableCustomerCreditsForRequest(item: AdminDoc | null | undefined, credits: CustomerCredit[]) {
  const emailKey = cleanEmailKey(item?.email);
  if (!emailKey || isCommercialRequest(item)) return [];
  return credits.filter((credit) => {
    const status = String(credit.status || "").trim().toLowerCase();
    const creditEmail = cleanEmailKey(credit.customerEmailKey || credit.customerEmail);
    const selectedId = String(item?.id || "");
    const sourceReferrerId = String(credit.sourceReferrerRequestId || "");
    const sourceReferredId = String(credit.sourceReferredRequestId || "");
    if (selectedId && (sourceReferrerId === selectedId || sourceReferredId === selectedId)) return false;
    return status === "available" && creditEmail === emailKey && getCustomerCreditAmount(credit) > 0;
  });
}

function getAvailableCustomerCreditTotal(credits: CustomerCredit[]) {
  return credits.reduce((sum, credit) => sum + getCustomerCreditAmount(credit), 0);
}

function guessCheckoutMode(item: AdminDoc | null): CheckoutMode {
  const promo = String(item?.promoCode || "").toUpperCase();
  const paymentMode = String(item?.paymentMode || "").toLowerCase();
  const rawService = String(item?.service || item?.selectedServiceTitle || item?.packageType || item?.requestType || "").toLowerCase();
  if (rawService.includes("commercial")) return "custom";
  if (paymentMode === "custom" || paymentMode === "custom_initial" || item?.customInitialPayment) return "custom";
  return promo.includes("FOUNDING") || promo.includes("BETA") || paymentMode === "founding" ? "founding" : "standard";
}

function getLaundryDefaultDepositCredit(item: AdminDoc | null, mode: CheckoutMode) {
  if (!item || item.service !== "laundry-rescue") return 0;
  if (toNumber(item.laundryDepositCredit) > 0) return toNumber(item.laundryDepositCredit);
  if (toNumber(item.laundryDepositCreditCents) > 0) return centsToDollars(item.laundryDepositCreditCents);
  // Credit only the pre-tax non-refundable deposit/minimum toward the final invoice.
  // Tax is charged separately by Stripe on the deposit and then only on the final taxable balance.
  if (toNumber(item.laundryDepositAmountSubtotal) > 0) return centsToDollars(item.laundryDepositAmountSubtotal);
  if (toNumber(item.depositPaidAmountSubtotal) > 0) return centsToDollars(item.depositPaidAmountSubtotal);
  if (toNumber(item.laundryDepositExpectedAmountCents) > 0) return centsToDollars(item.laundryDepositExpectedAmountCents);
  if (toNumber(item.laundryDepositAmountTotal) > 0) return centsToDollars(item.laundryDepositAmountTotal);
  if (toNumber(item.depositPaidAmountTotal) > 0) return centsToDollars(item.depositPaidAmountTotal);
  const paymentStatus = String(item.paymentStatus || item.laundryPaymentStatus || item.status || "");
  if (toNumber(item.amountSubtotal) > 0 && ["Deposit Paid", "Deposit Paid - Final Pending", "Paid"].includes(paymentStatus)) return centsToDollars(item.amountSubtotal);
  if (toNumber(item.amountTotal) > 0 && ["Deposit Paid", "Deposit Paid - Final Pending", "Paid"].includes(paymentStatus)) return centsToDollars(item.amountTotal);
  return mode === "founding" ? 49 : 59;
}

function shouldNotifyByDefault(status: string) {
  return ["Approved", "Scheduled", "Declined", "Follow-Up Needed", "Needs Info", "Canceled", "Cancelled"].includes(status);
}

function getStatusNotePlaceholder(status: string) {
  if (status === "Declined") return "Example: Sorry, we are not servicing that area yet, or this request is outside our current service scope.";
  if (status === "Scheduled") return "Example: You are scheduled for Tuesday between 10am-12pm. Please have parking/access details ready.";
  if (status === "Follow-Up Needed" || status === "Needs Info") return "Example: Can you confirm parking, pets, access instructions, and which rooms/tasks matter most?";
  if (status === "Approved") return "Example: Your request looks like a good fit. We’ll send the secure checkout link next.";
  if (status === "Canceled" || status === "Cancelled") return "Example: This request has been canceled. Reply if this was unexpected.";
  return "Optional note to include in the customer email.";
}


const SERVICE_LOOKS: Record<string, { label: string; badge: string; row: string; dot: string }> = {
  "parent-reset-2hr": {
    label: "Parent Reset",
    badge: "border-emerald-700 bg-emerald-600 text-white shadow-sm shadow-emerald-900/25",
    row: "border-l-8 border-l-emerald-600 bg-emerald-50/40 hover:bg-emerald-100/80",
    dot: "bg-white ring-2 ring-emerald-100",
  },
  "family-reset-3hr": {
    label: "Family Reset",
    badge: "border-blue-700 bg-blue-600 text-white shadow-sm shadow-blue-900/25",
    row: "border-l-8 border-l-blue-600 bg-blue-50/40 hover:bg-blue-100/80",
    dot: "bg-white ring-2 ring-blue-100",
  },
  "helper-block-4hr": {
    label: "Helper Block",
    badge: "border-violet-700 bg-violet-600 text-white shadow-sm shadow-violet-900/25",
    row: "border-l-8 border-l-violet-600 bg-violet-50/40 hover:bg-violet-100/80",
    dot: "bg-white ring-2 ring-violet-100",
  },
  "errand-helper": {
    label: "Errand Helper",
    badge: "border-amber-600 bg-amber-400 text-slate-950 shadow-sm shadow-amber-900/20",
    row: "border-l-8 border-l-amber-500 bg-amber-50/60 hover:bg-amber-100/90",
    dot: "bg-slate-950 ring-2 ring-white",
  },
  "laundry-rescue": {
    label: "Laundry Rescue",
    badge: "border-rose-700 bg-rose-600 text-white shadow-sm shadow-rose-900/25",
    row: "border-l-8 border-l-rose-600 bg-rose-50/40 hover:bg-rose-100/80",
    dot: "bg-white ring-2 ring-rose-100",
  },
  "commercial-reset": {
    label: "Commercial Reset",
    badge: "border-cyan-800 bg-cyan-700 text-white shadow-sm shadow-cyan-900/25",
    row: "border-l-8 border-l-cyan-700 bg-cyan-50/50 hover:bg-cyan-100/80",
    dot: "bg-white ring-2 ring-cyan-100",
  },
};

const DEFAULT_SERVICE_LOOK = {
  label: "Unselected",
  badge: "border-slate-500 bg-slate-600 text-white shadow-sm shadow-slate-900/20",
  row: "border-l-8 border-l-slate-400 bg-slate-50/60 hover:bg-slate-100",
  dot: "bg-white ring-2 ring-slate-100",
};

function getServiceKey(item: AdminDoc | null | undefined) {
  const raw = String(item?.service || item?.selectedServiceTitle || item?.packageType || item?.requestType || "").toLowerCase();
  if (raw.includes("commercial")) return "commercial-reset";
  if (raw.includes("parent-reset") || raw.includes("parent reset") || raw.includes("2-hour")) return "parent-reset-2hr";
  if (raw.includes("family-reset") || raw.includes("family reset") || raw.includes("3-hour")) return "family-reset-3hr";
  if (raw.includes("helper-block") || raw.includes("helper block") || raw.includes("4-hour")) return "helper-block-4hr";
  if (raw.includes("errand")) return "errand-helper";
  if (raw.includes("laundry")) return "laundry-rescue";
  return "";
}

function getServiceLook(item: AdminDoc | null | undefined) {
  const key = getServiceKey(item);
  return key ? SERVICE_LOOKS[key] || DEFAULT_SERVICE_LOOK : DEFAULT_SERVICE_LOOK;
}

function isCommercialRequest(item: AdminDoc | null | undefined) {
  return getServiceKey(item) === "commercial-reset";
}

function isFamilyReferralEligibleRequest(item: AdminDoc | null | undefined) {
  return ["parent-reset-2hr", "family-reset-3hr", "helper-block-4hr", "errand-helper", "laundry-rescue"].includes(getServiceKey(item));
}

function isCompletedRequest(item: AdminDoc | null | undefined) {
  return String(item?.status || "").trim().toLowerCase() === "completed";
}

function getReferralStatusText(item: AdminDoc | null | undefined) {
  return String(item?.outgoingReferralStatus || item?.incomingReferralStatus || "Not started");
}

function getDefaultCommercialQuoteType(item: AdminDoc | null | undefined) {
  const combined = String(`${item?.businessType || ""} ${item?.frequency || ""}`).toLowerCase();
  if (combined.includes("rental") || combined.includes("vacation") || combined.includes("turnover")) return "Short-term rental turnover";
  if (combined.includes("weekly") || combined.includes("monthly") || combined.includes("recurring") || combined.includes("twice") || combined.includes("three times") || combined.includes("five times")) return "Recurring monthly plan";
  return "Flat visit quote";
}

function getCommercialQuoteStatus(item: AdminDoc | null | undefined) {
  return String(item?.commercialQuoteStatus || "Not quoted");
}

function ServicePill({ item }: { item: AdminDoc }) {
  const look = getServiceLook(item);
  const rawService = String(item.service || "");
  return (
    <span className={`inline-flex min-w-[132px] items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${look.badge}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${look.dot}`} />
      {look.label}
      {rawService && !rawService.toLowerCase().includes(look.label.toLowerCase().split(" ")[0]) && (
        <span className="font-bold opacity-60">{rawService}</span>
      )}
    </span>
  );
}


type AdminActionVariant = "primary" | "secondary" | "quiet" | "danger" | "success";

function getAdminActionClass(variant: AdminActionVariant = "primary") {
  const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition-all duration-150 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-55";
  const variants: Record<AdminActionVariant, string> = {
    primary: "bg-[#075c58] text-white shadow-[#075c58]/15 hover:-translate-y-0.5 hover:bg-[#064b48] focus:ring-[#075c58]/25 active:translate-y-0 active:scale-[0.99]",
    success: "bg-emerald-700 text-white shadow-emerald-900/15 hover:-translate-y-0.5 hover:bg-emerald-800 focus:ring-emerald-700/20 active:translate-y-0 active:scale-[0.99]",
    secondary: "border-2 border-[#075c58] bg-white text-[#075c58] hover:-translate-y-0.5 hover:bg-[#f4ecdc] focus:ring-[#075c58]/20 active:translate-y-0 active:scale-[0.99]",
    quiet: "border border-[#d8c18f] bg-white text-slate-700 hover:-translate-y-0.5 hover:border-[#075c58] hover:text-[#075c58] focus:ring-[#075c58]/15 active:translate-y-0 active:scale-[0.99]",
    danger: "bg-red-700 text-white shadow-red-900/15 hover:-translate-y-0.5 hover:bg-red-800 focus:ring-red-700/20 active:translate-y-0 active:scale-[0.99]",
  };
  return `${base} ${variants[variant]}`;
}

function ActionSpinner() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;
}

function AdminActionFeedback({ busy, activeAction, messages, errors }: { busy: boolean; activeAction: string; messages: string[]; errors: string[] }) {
  const cleanMessages = messages.filter(Boolean);
  const cleanErrors = errors.filter(Boolean);
  if (!busy && !cleanMessages.length && !cleanErrors.length) return null;

  return (
    <div className="rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4 shadow-sm" role="status" aria-live="polite">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98a2f]">Action feedback</p>
          <p className="mt-1 text-sm font-bold text-slate-700">
            {busy ? activeAction || "Working on the selected action..." : cleanErrors.length ? "Review the message below before continuing." : "Last action completed."}
          </p>
        </div>
        {busy && <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-[#075c58] ring-1 ring-[#eadfc8]"><ActionSpinner /> Processing</span>}
      </div>
      {cleanMessages.map((message, index) => (
        <p key={`message-${index}`} className="mt-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p>
      ))}
      {cleanErrors.map((error, index) => (
        <p key={`error-${index}`} className="mt-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>
      ))}
    </div>
  );
}

function AdminHelpCard() {
  return (
    <div className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98a2f]">Admin guide</p>
      <div className="mt-3 grid gap-3 text-xs leading-5 text-slate-600 md:grid-cols-4">
        <div className="rounded-2xl bg-[#f4ecdc] p-3"><span className="font-black text-[#075c58]">Green filled buttons</span> create, email, save, or update something.</div>
        <div className="rounded-2xl bg-[#f4ecdc] p-3"><span className="font-black text-[#075c58]">Outlined buttons</span> open, copy, fill, or create without emailing.</div>
        <div className="rounded-2xl bg-[#f4ecdc] p-3"><span className="font-black text-[#075c58]">Messages appear clearly</span> after a click so admins know if it worked.</div>
        <div className="rounded-2xl bg-[#f4ecdc] p-3"><span className="font-black text-[#075c58]">Detail windows</span> only close with the Close button to prevent lost work.</div>
      </div>
    </div>
  );
}

function AdminWorkflowGuide({ selectedIsCommercial, selectedService }: { selectedIsCommercial: boolean; selectedService?: string }) {
  const laundry = selectedService === "laundry-rescue";
  const steps = selectedIsCommercial
    ? ["Review request", "Build quote", "Save breakdown", "Send first payment", "Track add-ons/refunds"]
    : laundry
      ? ["Review request", "Send deposit", "Dry weigh laundry", "Send final balance", "Track extras/refunds"]
      : ["Review request", "Update status", "Send checkout", "Schedule visit", "Track extras/refunds"];
  return (
    <div className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98a2f]">Recommended flow</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step} className="rounded-2xl bg-[#fbf6ea] p-3 text-xs font-bold leading-5 text-slate-700">
            <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#075c58] text-white">{index + 1}</span>
            <span className="block">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function isPhotoDataField(key: string) {
  const normalized = key.trim().toLowerCase().replaceAll("_", "").replaceAll("-", "");
  return ["photouploads", "uploadedphotos", "photodataurls", "imagedataurls"].includes(normalized);
}

type UploadedPhoto = { name?: string; type?: string; size?: number; dataUrl?: string };

function getPhotoUploads(item: AdminDoc | null | undefined): UploadedPhoto[] {
  const value = item?.photoUploads;
  if (!Array.isArray(value)) return [];
  return value.filter((photo) => photo && typeof photo === "object" && typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:image/"));
}

function formatPhotoSize(bytes: unknown) {
  const next = Number(bytes);
  if (!Number.isFinite(next) || next <= 0) return "compressed preview";
  if (next < 1024) return `${Math.round(next)} B`;
  return `${Math.round(next / 1024)} KB`;
}

function AdminPhotoUploads({ photos }: { photos: UploadedPhoto[] }) {
  const [previewPhoto, setPreviewPhoto] = useState<{ photo: UploadedPhoto; index: number } | null>(null);

  if (!photos.length) return null;

  return (
    <div className="rounded-2xl border border-[#eadfc8] bg-white p-4 sm:col-span-2">
      <p className="text-xs font-bold uppercase tracking-widest text-[#b98a2f]">Uploaded photos</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Tap a photo to preview it here. This avoids blank browser tabs from long compressed image links.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={`${photo.name || "photo"}-${index}`}
            type="button"
            onClick={() => setPreviewPhoto({ photo, index })}
            className="group overflow-hidden rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <img src={photo.dataUrl} alt={`Uploaded request photo ${index + 1}`} className="h-32 w-full object-cover" />
            <div className="p-3">
              <p className="truncate text-xs font-black text-[#075c58]" title={photo.name || `Photo ${index + 1}`}>{photo.name || `Photo ${index + 1}`}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{formatPhotoSize(photo.size)} · View larger</p>
            </div>
          </button>
        ))}
      </div>

      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-label="Uploaded photo preview">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#eadfc8] bg-[#fbf6ea] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#075c58]">{previewPhoto.photo.name || `Uploaded photo ${previewPhoto.index + 1}`}</p>
                <p className="text-xs font-semibold text-slate-500">{formatPhotoSize(previewPhoto.photo.size)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={previewPhoto.photo.dataUrl}
                  download={previewPhoto.photo.name || `nesthelper-request-photo-${previewPhoto.index + 1}.jpg`}
                  className="rounded-full border border-[#0b6b66]/20 bg-white px-3 py-2 text-xs font-black text-[#075c58] transition hover:bg-[#eef8f6]"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="rounded-full bg-[#0b6b66] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#075c58]"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-[78vh] overflow-auto bg-slate-950 p-3">
              <img
                src={previewPhoto.photo.dataUrl}
                alt={`Uploaded request photo ${previewPhoto.index + 1}`}
                className="mx-auto max-h-[74vh] w-auto max-w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceLegend({ activeServiceFilter, onToggleServiceFilter, counts }: { activeServiceFilter: string; onToggleServiceFilter: (key: string) => void; counts: Record<string, number> }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Filter service requests by service type">
      {Object.entries(SERVICE_LOOKS).map(([key, look]) => {
        const active = activeServiceFilter === key;
        const count = counts[key] || 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggleServiceFilter(key)}
            aria-pressed={active}
            className={`inline-flex min-h-10 min-w-[142px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-wide shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#075c58]/20 ${active ? "scale-[1.02] ring-2 ring-[#075c58]" : "hover:-translate-y-0.5"} ${look.badge}`}
            title={active ? `Showing ${look.label}. Click again to clear.` : `Show only ${look.label}.`}
          >
            <span className={`h-2 w-2 rounded-full ${look.dot}`} />
            <span>{look.label}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function renderAdminCell(key: string, item: AdminDoc) {
  if (key === "service" || key === "selectedServiceTitle" || key === "packageType") return <ServicePill item={item} />;
  return formatValue(key, item[key]);
}

export default function AdminTable({
  collectionName,
  title,
  columns,
  statuses,
  enablePaymentActions = false,
}: {
  collectionName: string;
  title: string;
  columns: { key: string; label: string }[];
  statuses: string[];
  enablePaymentActions?: boolean;
}) {
  const [items, setItems] = useState<AdminDoc[]>([]);
  const [customerCredits, setCustomerCredits] = useState<CustomerCredit[]>([]);
  const [selected, setSelected] = useState<AdminDoc | null>(null);
  const [filter, setFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("standard");
  const [customInitialAmount, setCustomInitialAmount] = useState("");
  const [customInitialTitle, setCustomInitialTitle] = useState("");
  const [customInitialNote, setCustomInitialNote] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [includeCommercialQuoteBreakdown, setIncludeCommercialQuoteBreakdown] = useState(true);
  const [includeFamilyPaymentBreakdown, setIncludeFamilyPaymentBreakdown] = useState(true);
  const [commercialInvoiceBusy, setCommercialInvoiceBusy] = useState(false);
  const [commercialInvoiceMessage, setCommercialInvoiceMessage] = useState("");
  const [commercialInvoiceError, setCommercialInvoiceError] = useState("");
  const [commercialQuoteEmailBusy, setCommercialQuoteEmailBusy] = useState(false);
  const [commercialQuoteEmailMessage, setCommercialQuoteEmailMessage] = useState("");
  const [commercialQuoteEmailError, setCommercialQuoteEmailError] = useState("");
  const [familyInvoiceBusy, setFamilyInvoiceBusy] = useState(false);
  const [familyInvoiceMessage, setFamilyInvoiceMessage] = useState("");
  const [familyInvoiceError, setFamilyInvoiceError] = useState("");
  const [statusValue, setStatusValue] = useState("New");
  const [statusNote, setStatusNote] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [laundryDryWeightLbs, setLaundryDryWeightLbs] = useState("");
  const [laundryRatePerLb, setLaundryRatePerLb] = useState("2.99");
  const [laundryAddOnsAmount, setLaundryAddOnsAmount] = useState("0");
  const [laundryDepositCredit, setLaundryDepositCredit] = useState("59");
  const [laundryFinalNote, setLaundryFinalNote] = useState("");
  const [laundryFinalBusy, setLaundryFinalBusy] = useState(false);
  const [laundryFinalMessage, setLaundryFinalMessage] = useState("");
  const [laundryFinalError, setLaundryFinalError] = useState("");
  const [additionalPaymentAmount, setAdditionalPaymentAmount] = useState("");
  const [additionalPaymentReason, setAdditionalPaymentReason] = useState("Additional hours");
  const [additionalPaymentNote, setAdditionalPaymentNote] = useState("");
  const [additionalPaymentBusy, setAdditionalPaymentBusy] = useState(false);
  const [additionalPaymentMessage, setAdditionalPaymentMessage] = useState("");
  const [additionalPaymentError, setAdditionalPaymentError] = useState("");
  const [commercialQuoteStatus, setCommercialQuoteStatus] = useState("Not quoted");
  const [commercialQuoteType, setCommercialQuoteType] = useState("Flat visit quote");
  const [commercialInitialAmount, setCommercialInitialAmount] = useState("");
  const [commercialAdditionalAmount, setCommercialAdditionalAmount] = useState("");
  const [commercialCustomerQuoteNote, setCommercialCustomerQuoteNote] = useState("");
  const [commercialInternalQuoteNotes, setCommercialInternalQuoteNotes] = useState("");
  const [commercialQuoteBusy, setCommercialQuoteBusy] = useState(false);
  const [commercialQuoteMessage, setCommercialQuoteMessage] = useState("");
  const [commercialQuoteError, setCommercialQuoteError] = useState("");
  const [referralBusy, setReferralBusy] = useState(false);
  const [referralMessage, setReferralMessage] = useState("");
  const [referralError, setReferralError] = useState("");
  const [activeAction, setActiveAction] = useState("");

  useEffect(() => {
    const q = query(collection(firestoreDb, collectionName), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [collectionName]);


  useEffect(() => {
    if (!enablePaymentActions || collectionName !== "serviceRequests") {
      setCustomerCredits([]);
      return;
    }
    const q = query(collection(firestoreDb, "customerCredits"));
    const unsub = onSnapshot(q, (snap) => setCustomerCredits(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [collectionName, enablePaymentActions]);

  useEffect(() => {
    const nextStatus = selected?.status || "New";
    const nextMode = guessCheckoutMode(selected);
    setCheckoutMode(nextMode);
    setCheckoutMessage("");
    setCheckoutError("");
    setCommercialInvoiceMessage("");
    setCommercialInvoiceError("");
    setCommercialQuoteEmailMessage("");
    setCommercialQuoteEmailError("");
    setFamilyInvoiceMessage("");
    setFamilyInvoiceError("");
    setCustomInitialAmount(selected?.customInitialAmount ? String(selected.customInitialAmount) : "");
    setCustomInitialTitle(selected?.customInitialTitle ? String(selected.customInitialTitle) : "");
    setCustomInitialNote(selected?.customInitialNote ? String(selected.customInitialNote) : "");
    setIncludeCommercialQuoteBreakdown(Boolean(selected?.commercialQuoteBreakdown?.customerBreakdownText));
    setIncludeFamilyPaymentBreakdown(Boolean(selected?.familyPaymentBreakdown?.customerBreakdownText));
    setStatusValue(nextStatus);
    setStatusNote("");
    setNotifyCustomer(shouldNotifyByDefault(nextStatus));
    setStatusMessage("");
    setStatusError("");
    setLaundryDryWeightLbs(selected?.laundryDryWeightLbs ? String(selected.laundryDryWeightLbs) : "");
    setLaundryRatePerLb(selected?.laundryRatePerLb ? String(selected.laundryRatePerLb) : nextMode === "founding" ? "2.49" : "2.99");
    setLaundryAddOnsAmount(selected?.laundryAddOnsAmount ? String(selected.laundryAddOnsAmount) : "0");
    setLaundryDepositCredit(String(getLaundryDefaultDepositCredit(selected, nextMode) || 0));
    setLaundryFinalNote("");
    setLaundryFinalMessage("");
    setLaundryFinalError("");
    setAdditionalPaymentAmount(selected?.additionalPaymentAmount ? String(selected.additionalPaymentAmount) : "");
    setAdditionalPaymentReason(selected?.additionalPaymentReason ? String(selected.additionalPaymentReason) : isCommercialRequest(selected) ? "Commercial approved add-on / additional scope" : "Additional hours");
    setAdditionalPaymentNote("");
    setAdditionalPaymentMessage("");
    setAdditionalPaymentError("");
    setCommercialQuoteStatus(selected?.commercialQuoteStatus ? String(selected.commercialQuoteStatus) : "Not quoted");
    setCommercialQuoteType(selected?.commercialQuoteType ? String(selected.commercialQuoteType) : getDefaultCommercialQuoteType(selected));
    setCommercialInitialAmount(selected?.commercialInitialAmount ? String(selected.commercialInitialAmount) : selected?.customInitialAmount ? String(selected.customInitialAmount) : "");
    setCommercialAdditionalAmount(selected?.commercialAdditionalAmount ? String(selected.commercialAdditionalAmount) : selected?.additionalPaymentAmount ? String(selected.additionalPaymentAmount) : "");
    setCommercialCustomerQuoteNote(selected?.commercialCustomerQuoteNote ? String(selected.commercialCustomerQuoteNote) : selected?.customInitialNote ? String(selected.customInitialNote) : "");
    setCommercialInternalQuoteNotes(selected?.commercialInternalQuoteNotes ? String(selected.commercialInternalQuoteNotes) : "");
    setCommercialQuoteMessage("");
    setCommercialQuoteError("");
    setReferralMessage("");
    setReferralError("");
    setActiveAction("");
  }, [selected?.id]);

  const serviceCounts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = getServiceKey(item) || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const availableStatuses = useMemo(() => {
    const merged = new Set<string>([...statuses]);
    items.forEach((item) => {
      const status = String(item.status || "").trim();
      if (status) merged.add(status);
    });
    return Array.from(merged).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [items, statuses]);

  const filtered = useMemo(() => {
    const term = filter.toLowerCase().trim();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const cutoff7 = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const cutoff30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return items.filter((item) => {
      if (term && !JSON.stringify(item).toLowerCase().includes(term)) return false;
      if (serviceFilter && getServiceKey(item) !== serviceFilter) return false;
      if (statusFilter !== "all" && String(item.status || "") !== statusFilter) return false;

      const paymentStatus = String(item.paymentStatus || item.laundryPaymentStatus || item.additionalPaymentStatus || "").toLowerCase();
      if (paymentFilter === "paid" && !paymentStatus.includes("paid")) return false;
      if (paymentFilter === "sent" && !(paymentStatus.includes("sent") || paymentStatus.includes("checkout") || paymentStatus.includes("invoice"))) return false;
      if (paymentFilter === "unpaid" && (paymentStatus.includes("paid") || paymentStatus.includes("sent") || paymentStatus.includes("checkout") || paymentStatus.includes("invoice"))) return false;
      if (paymentFilter === "refund" && !JSON.stringify(item).toLowerCase().includes("refund")) return false;

      if (dateFilter !== "all") {
        const created = getDateObject(item.createdAt)?.getTime();
        if (!created) return false;
        if (dateFilter === "today" && created < todayStart) return false;
        if (dateFilter === "7d" && created < cutoff7) return false;
        if (dateFilter === "30d" && created < cutoff30) return false;
      }

      return true;
    });
  }, [items, filter, serviceFilter, statusFilter, paymentFilter, dateFilter]);

  const activeFilterCount = [filter.trim(), serviceFilter, statusFilter !== "all" ? statusFilter : "", paymentFilter !== "all" ? paymentFilter : "", dateFilter !== "all" ? dateFilter : ""].filter(Boolean).length;

  function clearAllFilters() {
    setFilter("");
    setServiceFilter("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFilter("all");
  }

  const laundrySubtotal = Math.max(0, toNumber(laundryDryWeightLbs) * toNumber(laundryRatePerLb) + toNumber(laundryAddOnsAmount));
  const laundryBalanceDue = Math.max(0, laundrySubtotal - toNumber(laundryDepositCredit));

  async function updateStatus(item: AdminDoc, status: string, options?: { notifyCustomer?: boolean; customerNote?: string }) {
    const token = await firebaseAuth.currentUser?.getIdToken();
    const res = await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        collection: collectionName,
        id: item.id,
        status,
        notifyCustomer: Boolean(options?.notifyCustomer),
        customerNote: options?.customerNote || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || "Unable to update status.");
    return data as { ok: boolean; emailSent?: boolean; emailSkipped?: boolean; emailError?: string; referralRewardEmailSent?: boolean; referralRewardEmailError?: string };
  }

  async function submitStatusUpdate() {
    if (!selected) return;
    setStatusBusy(true);
    setActiveAction(`Updating status to ${statusValue}...`);
    setStatusMessage("");
    setStatusError("");

    try {
      const data = await updateStatus(selected, statusValue, { notifyCustomer, customerNote: statusNote });
      setSelected((prev) => (prev ? { ...prev, status: statusValue, lastStatusEmailNote: notifyCustomer ? statusNote : prev.lastStatusEmailNote } : prev));

      if (data.referralRewardEmailSent) {
        setReferralMessage("Referral reward/credit email was automatically sent to the original referring family.");
      } else if (data.referralRewardEmailError) {
        setReferralError(data.referralRewardEmailError);
      }

      if (notifyCustomer && data.emailSent) {
        setStatusMessage("Status updated and customer email sent.");
      } else if (notifyCustomer && data.emailSkipped) {
        setStatusMessage(data.emailError || "Status updated, but no customer email was available.");
      } else if (notifyCustomer && data.emailError) {
        setStatusMessage(data.emailError);
      } else {
        setStatusMessage("Status updated. No customer email was sent.");
      }
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Unable to update status.");
    } finally {
      setStatusBusy(false);
      setActiveAction("");
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCheckoutMessage("Checkout link copied.");
  }

  async function copyLaundryLink(text: string) {
    await navigator.clipboard.writeText(text);
    setLaundryFinalMessage("Final balance checkout link copied.");
  }

  async function copyAdditionalPaymentLink(text: string) {
    await navigator.clipboard.writeText(text);
    setAdditionalPaymentMessage("Additional payment checkout link copied.");
  }

  async function copyReferralLink(text: string) {
    await navigator.clipboard.writeText(text);
    setReferralMessage("Referral link copied.");
  }

  async function createReferralLink(sendEmail = true) {
    if (!selected) return;
    setReferralBusy(true);
    setActiveAction(sendEmail ? "Creating and emailing family referral link..." : "Creating family referral link...");
    setReferralMessage("");
    setReferralError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/create-referral-link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: selected.id, sendEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to create referral link.");
      }

      setSelected((prev) => prev ? {
        ...prev,
        outgoingReferralCode: data.code,
        outgoingReferralLink: data.url,
        outgoingReferralStatus: data.status || prev.outgoingReferralStatus || "Active",
        outgoingReferralEmailSent: data.emailSent || prev.outgoingReferralEmailSent,
        outgoingReferralEmailError: data.emailWarning || "",
      } : prev);

      setReferralMessage(data.emailWarning
        ? `Referral link ready, but email warning: ${data.emailWarning}`
        : data.emailSent
          ? "Family referral link created and emailed to the customer."
          : data.reused
            ? "Existing family referral link loaded. Copy or resend it as needed."
            : "Family referral link created. Copy it or email it when ready.");
    } catch (error) {
      setReferralError(error instanceof Error ? error.message : "Unable to create referral link.");
    } finally {
      setReferralBusy(false);
      setActiveAction("");
    }
  }

  async function emailCommercialQuoteOnly() {
    if (!selected) return;
    setCommercialQuoteEmailBusy(true);
    setActiveAction("Emailing commercial quote for customer review...");
    setCommercialQuoteEmailMessage("");
    setCommercialQuoteEmailError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/send-commercial-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: selected.id }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to email commercial quote.");

      setSelected((prev) => prev ? {
        ...prev,
        status: data.status || "Quote Sent",
        commercialQuoteStatus: data.commercialQuoteStatus || "Quote sent",
        commercialQuoteEmailSent: data.emailSent,
        commercialQuoteEmailWarning: data.emailWarning,
        commercialQuoteEmailSentAt: data.emailSent ? new Date().toISOString() : prev.commercialQuoteEmailSentAt,
      } : prev);
      setStatusValue(data.status || "Quote Sent");
      setCommercialQuoteStatus(data.commercialQuoteStatus || "Quote sent");
      setCommercialQuoteEmailMessage(data.emailWarning ? `Quote saved, but email warning: ${data.emailWarning}` : "Commercial quote emailed to the customer for review. No payment link was sent.");
    } catch (error) {
      setCommercialQuoteEmailError(error instanceof Error ? error.message : "Unable to email commercial quote.");
    } finally {
      setCommercialQuoteEmailBusy(false);
      setActiveAction("");
    }
  }

  async function createCommercialInvoice(sendEmail: boolean) {
    if (!selected) return;
    setCommercialInvoiceBusy(true);
    setActiveAction(sendEmail ? "Creating invoice and sending NestHelper email..." : "Creating Stripe invoice...");
    setCommercialInvoiceMessage("");
    setCommercialInvoiceError("");
    setCommercialQuoteEmailMessage("");
    setCommercialQuoteEmailError("");
    setFamilyInvoiceMessage("");
    setFamilyInvoiceError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/create-commercial-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: selected.id, sendEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to create commercial invoice.");

      const nextInvoiceStatus = data.status || (sendEmail && data.emailSent ? "Invoice Link Sent" : "Invoice Created");
      setSelected((prev) => prev ? {
        ...prev,
        status: nextInvoiceStatus,
        paymentStatus: data.paymentStatus || nextInvoiceStatus,
        commercialInvoiceId: data.invoiceId,
        commercialInvoiceNumber: data.invoiceNumber,
        commercialInvoiceUrl: data.hostedInvoiceUrl,
        commercialInvoicePdf: data.invoicePdf,
        commercialInvoiceEmailSent: data.emailSent,
        commercialInvoiceEmailWarning: data.emailWarning,
        commercialInvoiceDeliveryMethod: data.deliveryMethod,
        commercialInvoiceSentAt: sendEmail && data.emailSent ? new Date().toISOString() : prev.commercialInvoiceSentAt,
      } : prev);
      setStatusValue(nextInvoiceStatus);
      if (sendEmail && data.emailSent) {
        setCommercialInvoiceMessage("Stripe invoice created and sent to the customer by NestHelper email.");
      } else if (sendEmail && data.emailWarning) {
        setCommercialInvoiceMessage(`Stripe invoice created, but customer email was not sent. ${data.emailWarning} Open or copy the invoice link below.`);
      } else {
        setCommercialInvoiceMessage("Stripe invoice created. Open or copy the hosted invoice link below.");
      }
    } catch (error) {
      setCommercialInvoiceError(error instanceof Error ? error.message : "Unable to create commercial invoice.");
    } finally {
      setCommercialInvoiceBusy(false);
      setActiveAction("");
    }
  }

  async function createFamilyInvoice(sendEmail: boolean) {
    if (!selected) return;
    setFamilyInvoiceBusy(true);
    setActiveAction(
      selected.service === "laundry-rescue"
        ? sendEmail
          ? "Creating Laundry Rescue deposit checkout and sending NestHelper email..."
          : "Creating Laundry Rescue deposit checkout..."
        : sendEmail
          ? "Creating family invoice and sending NestHelper email..."
          : "Creating family Stripe invoice..."
    );
    setFamilyInvoiceMessage("");
    setFamilyInvoiceError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/create-family-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: selected.id, sendEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to create family invoice.");

      const isLaundryDepositCheckout = Boolean(data.isLaundryDepositCheckout);
      const nextInvoiceStatus = data.status || (sendEmail && data.emailSent ? "Invoice Link Sent" : "Invoice Created");
      setSelected((prev) => prev ? {
        ...prev,
        status: nextInvoiceStatus,
        paymentStatus: data.paymentStatus || nextInvoiceStatus,
        laundryPaymentStatus: isLaundryDepositCheckout ? (data.paymentStatus || nextInvoiceStatus) : prev.laundryPaymentStatus,
        checkoutUrl: isLaundryDepositCheckout ? data.hostedInvoiceUrl : prev.checkoutUrl,
        checkoutSessionId: isLaundryDepositCheckout ? data.invoiceId : prev.checkoutSessionId,
        familyInvoiceId: data.invoiceId,
        familyInvoiceNumber: data.invoiceNumber,
        familyInvoiceUrl: data.hostedInvoiceUrl,
        familyInvoicePdf: data.invoicePdf,
        familyInvoiceEmailSent: data.emailSent,
        familyInvoiceEmailWarning: data.emailWarning,
        familyInvoiceDeliveryMethod: data.deliveryMethod,
        familyInvoiceServicePeriodLabel: data.servicePeriodLabel || prev.familyInvoiceServicePeriodLabel,
        familyInvoiceSentAt: sendEmail && data.emailSent ? new Date().toISOString() : prev.familyInvoiceSentAt,
      } : prev);
      setStatusValue(nextInvoiceStatus);
      if (isLaundryDepositCheckout && sendEmail && data.emailSent) {
        setFamilyInvoiceMessage("Laundry Rescue deposit checkout created and sent to the customer. Stripe will collect the final-balance choice: auto-charge or invoice-before-delivery.");
      } else if (isLaundryDepositCheckout && sendEmail && data.emailWarning) {
        setFamilyInvoiceMessage(`Laundry deposit checkout created, but customer email was not sent. ${data.emailWarning} Open or copy the checkout link below.`);
      } else if (isLaundryDepositCheckout) {
        setFamilyInvoiceMessage("Laundry Rescue deposit checkout created. Open or copy the checkout link below. Customer will choose auto-charge or invoice-before-delivery in Stripe.");
      } else if (sendEmail && data.emailSent) {
        setFamilyInvoiceMessage("Family Stripe invoice created and sent to the customer by NestHelper email.");
      } else if (sendEmail && data.emailWarning) {
        setFamilyInvoiceMessage(`Family invoice created, but customer email was not sent. ${data.emailWarning} Open or copy the invoice link below.`);
      } else {
        setFamilyInvoiceMessage("Family Stripe invoice created. Open or copy the hosted invoice link below.");
      }
    } catch (error) {
      setFamilyInvoiceError(error instanceof Error ? error.message : "Unable to create family invoice.");
    } finally {
      setFamilyInvoiceBusy(false);
      setActiveAction("");
    }
  }

  async function createPaymentLink(sendEmail: boolean) {
    if (!selected) return;
    const useCustomInitial = checkoutMode === "custom";
    setCheckoutBusy(true);
    setActiveAction(sendEmail ? "Creating and emailing quick checkout link..." : "Creating quick checkout link only...");
    setCheckoutMessage("");
    setCheckoutError("");
    setCommercialInvoiceMessage("");
    setCommercialInvoiceError("");
    setCommercialQuoteEmailMessage("");
    setCommercialQuoteEmailError("");
    setFamilyInvoiceMessage("");
    setFamilyInvoiceError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId: selected.id,
          mode: useCustomInitial ? "standard" : checkoutMode,
          sendEmail,
          customInitial: useCustomInitial,
          customAmount: useCustomInitial ? toNumber(customInitialAmount) : undefined,
          customTitle: useCustomInitial ? customInitialTitle : undefined,
          customNote: useCustomInitial ? customInitialNote : undefined,
          includeQuoteBreakdown: selected.service === "commercial-reset" && useCustomInitial ? includeCommercialQuoteBreakdown : undefined,
          includeFamilyBreakdown: selected.service !== "commercial-reset" ? includeFamilyPaymentBreakdown : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to create quick checkout link.");
      }

      setSelected((prev) => prev ? {
        ...prev,
        checkoutUrl: data.url,
        checkoutSessionId: data.sessionId,
        status: selected.service === "laundry-rescue" ? "Deposit Checkout Sent" : "Checkout Sent",
        paymentStatus: selected.service === "laundry-rescue" ? "Deposit Checkout Sent" : "Checkout Sent",
        checkoutIncludedQuoteBreakdown: data.includedQuoteBreakdown ?? prev.checkoutIncludedQuoteBreakdown,
        checkoutIncludedFamilyBreakdown: data.includedFamilyBreakdown ?? prev.checkoutIncludedFamilyBreakdown,
      } : prev);
      setStatusValue(selected.service === "laundry-rescue" ? "Deposit Checkout Sent" : "Checkout Sent");
      const commercialBreakdownNotice = selected.service === "commercial-reset" && useCustomInitial && sendEmail
        ? data.includedQuoteBreakdown
          ? " Saved quote breakdown was included in the customer email."
          : includeCommercialQuoteBreakdown
            ? " No saved quote breakdown was found, so the email only includes the payment link and notes. Save the quote builder draft first if you want the breakdown included."
            : " Quote breakdown was not included because the checkbox was off."
        : "";
      const familyBreakdownNotice = selected.service !== "commercial-reset" && sendEmail
        ? data.includedFamilyBreakdown
          ? " Saved family payment breakdown was included in the customer email."
          : includeFamilyPaymentBreakdown
            ? " No saved family payment breakdown was found, so the email only includes the payment link and notes. Save the family breakdown first if you want it included."
            : " Family payment breakdown was not included because the checkbox was off."
        : "";
      const laundryDepositNotice = selected.service === "laundry-rescue"
        ? " Stripe checkout will collect the non-refundable taxable deposit and ask the customer to choose auto-charge or invoice-before-delivery for the final laundry balance."
        : "";
      setCheckoutMessage(data.emailError || (data.emailSent ? `Quick checkout link created and emailed to the customer.${commercialBreakdownNotice}${familyBreakdownNotice}${laundryDepositNotice}` : `Quick checkout link created. Copy it and send it manually.${commercialBreakdownNotice}${familyBreakdownNotice}${laundryDepositNotice}`));
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to create quick checkout link.");
    } finally {
      setCheckoutBusy(false);
      setActiveAction("");
    }
  }

  async function createLaundryFinalBalance(sendEmail: boolean) {
    if (!selected) return;
    const useAutoCharge = Boolean(selected.laundryAutoChargeAuthorized && selected.laundryFinalPaymentCollectionMethod === "auto_charge");
    setLaundryFinalBusy(true);
    setActiveAction(useAutoCharge ? "Creating itemized laundry invoice and auto-charging saved card..." : sendEmail ? "Creating and emailing laundry final invoice..." : "Creating laundry final invoice only...");
    setLaundryFinalMessage("");
    setLaundryFinalError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/create-laundry-final-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId: selected.id,
          dryWeightLbs: toNumber(laundryDryWeightLbs),
          ratePerLb: toNumber(laundryRatePerLb),
          addOnsAmount: toNumber(laundryAddOnsAmount),
          depositCredit: toNumber(laundryDepositCredit),
          finalBalanceNote: laundryFinalNote,
          sendEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to create laundry final balance invoice.");
      }

      setSelected((prev) => prev ? {
        ...prev,
        status: data.noBalanceDue ? "Fully Paid" : (data.status || "Final Invoice Sent"),
        paymentStatus: data.noBalanceDue ? "Final Balance Paid" : (data.paymentStatus || "Final Invoice Sent"),
        laundryPaymentStatus: data.noBalanceDue ? "Final Balance Paid" : (data.paymentStatus || "Final Invoice Sent"),
        laundryFinalInvoiceUrl: data.invoiceUrl || prev.laundryFinalInvoiceUrl,
        laundryFinalInvoicePdf: data.invoicePdf || prev.laundryFinalInvoicePdf,
        laundryFinalInvoiceId: data.invoiceId || prev.laundryFinalInvoiceId,
        laundryFinalInvoiceNumber: data.invoiceNumber || prev.laundryFinalInvoiceNumber,
        laundryFinalCheckoutUrl: data.url || data.invoiceUrl || prev.laundryFinalCheckoutUrl,
        laundryFinalCheckoutSessionId: data.sessionId || prev.laundryFinalCheckoutSessionId,
        laundryFinalInvoiceStatus: data.autoChargeSucceeded ? "paid" : prev.laundryFinalInvoiceStatus,
        laundryFinalInvoiceAmountDue: typeof data.balanceDue === "number" ? Math.round(data.balanceDue * 100) : prev.laundryFinalInvoiceAmountDue,
        laundryFinalInvoiceAmountPaid: typeof data.amountPaid === "number" ? Math.round(data.amountPaid * 100) : prev.laundryFinalInvoiceAmountPaid,
        laundryDryWeightLbs: toNumber(laundryDryWeightLbs),
        laundryRatePerLb: toNumber(laundryRatePerLb),
        laundryAddOnsAmount: toNumber(laundryAddOnsAmount),
        laundryDepositCredit: toNumber(laundryDepositCredit),
        laundrySubtotal,
        laundryBalanceDue,
      } : prev);
      setStatusValue(data.noBalanceDue ? "Fully Paid" : (data.status || "Final Invoice Sent"));
      setLaundryFinalMessage(
        data.emailError ||
        data.message ||
        (data.autoChargeSucceeded
          ? "Final balance invoice created and the saved payment method was charged. The request is now final-balance paid."
          : data.autoCharge
            ? "Final balance invoice was created and sent to Stripe for auto-charge. Check the invoice status before delivery."
            : data.emailSent
              ? "Final balance invoice created and emailed to the customer."
              : "Final balance invoice created. Copy it and send it manually.")
      );
    } catch (error) {
      setLaundryFinalError(error instanceof Error ? error.message : "Unable to create laundry final balance invoice.");
    } finally {
      setLaundryFinalBusy(false);
      setActiveAction("");
    }
  }

  async function createAdditionalPayment(sendEmail: boolean) {
    if (!selected) return;
    setAdditionalPaymentBusy(true);
    setActiveAction(sendEmail ? "Creating and emailing additional payment link..." : "Creating additional payment link only...");
    setAdditionalPaymentMessage("");
    setAdditionalPaymentError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/create-additional-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId: selected.id,
          amount: toNumber(additionalPaymentAmount),
          reason: additionalPaymentReason,
          note: additionalPaymentNote,
          sendEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to create additional payment link.");
      }

      setSelected((prev) => prev ? {
        ...prev,
        status: "Additional Payment Sent",
        paymentStatus: "Additional Payment Sent",
        additionalPaymentStatus: "Additional Payment Sent",
        additionalPaymentAmount: toNumber(additionalPaymentAmount),
        additionalPaymentReason,
        additionalPaymentNote,
        additionalPaymentCheckoutUrl: data.url || prev.additionalPaymentCheckoutUrl,
        additionalPaymentCheckoutSessionId: data.sessionId || prev.additionalPaymentCheckoutSessionId,
      } : prev);
      setStatusValue("Additional Payment Sent");
      setAdditionalPaymentMessage(data.emailError || (data.emailSent ? "Additional payment link created and emailed to the customer." : "Additional payment link created. Copy it and send it manually."));
    } catch (error) {
      setAdditionalPaymentError(error instanceof Error ? error.message : "Unable to create additional payment link.");
    } finally {
      setAdditionalPaymentBusy(false);
      setActiveAction("");
    }
  }

  async function saveCommercialQuote() {
    if (!selected) return;
    setCommercialQuoteBusy(true);
    setActiveAction("Saving commercial quote details...");
    setCommercialQuoteMessage("");
    setCommercialQuoteError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/update-commercial-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId: selected.id,
          quoteStatus: commercialQuoteStatus,
          quoteType: commercialQuoteType,
          initialAmount: toNumber(commercialInitialAmount),
          additionalAmount: toNumber(commercialAdditionalAmount),
          customerQuoteNote: commercialCustomerQuoteNote,
          internalQuoteNotes: commercialInternalQuoteNotes,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to save commercial quote details.");
      }

      setSelected((prev) => prev ? {
        ...prev,
        status: data.mappedStatus || prev.status,
        commercialQuoteStatus,
        commercialQuoteType,
        commercialInitialAmount: toNumber(commercialInitialAmount),
        commercialAdditionalAmount: toNumber(commercialAdditionalAmount),
        commercialCustomerQuoteNote,
        commercialInternalQuoteNotes,
      } : prev);
      if (data.mappedStatus) setStatusValue(data.mappedStatus);
      setCommercialQuoteMessage("Saved. Next: use the amount buttons to fill the payment section, then create/email the Stripe link.");
    } catch (error) {
      setCommercialQuoteError(error instanceof Error ? error.message : "Unable to save commercial quote details.");
    } finally {
      setCommercialQuoteBusy(false);
      setActiveAction("");
    }
  }

  function applyCommercialInitialToCheckout() {
    setCheckoutMode("custom");
    setCustomInitialAmount(commercialInitialAmount);
    setCustomInitialTitle(commercialQuoteType === "Short-term rental turnover" ? "Short-Term Rental Turnover approved quote" : commercialQuoteType === "Recurring monthly plan" ? "Commercial Reset recurring plan" : "Commercial Reset approved quote");
    setCustomInitialNote(commercialCustomerQuoteNote || "Approved Commercial Reset quote. Any added scope or specialty add-ons will be reviewed before an additional payment is requested.");
    setCheckoutMessage("Commercial amount copied below. Next: review the first payment link section and create/email the Stripe link.");
  }

  function applyCommercialQuoteBuilderFirstPayment(amount: number, title: string, note: string) {
    setCheckoutMode("custom");
    setCustomInitialAmount(String(amount || 0));
    setCustomInitialTitle(title || "Commercial Reset approved quote");
    setCustomInitialNote(note || "Approved Commercial Reset quote. Any added scope or specialty add-ons will be reviewed before an additional payment is requested.");
    setCommercialInitialAmount(String(amount || 0));
    setCheckoutMessage("Quote builder amount copied below. Next: create/email the Stripe first payment link.");
  }

  function applyCommercialAdditionalToPayment() {
    setAdditionalPaymentAmount(commercialAdditionalAmount);
    setAdditionalPaymentReason("Commercial approved add-on / additional scope");
    setAdditionalPaymentNote(commercialCustomerQuoteNote || "Approved commercial add-on or additional scope reviewed with the customer.");
    setAdditionalPaymentMessage("Commercial later/add-on amount copied below. Use it only after the customer approves the extra scope.");
  }

  function applyCommercialQuoteBuilderAdditionalPayment(amount: number, note: string) {
    setAdditionalPaymentAmount(String(amount || 0));
    setCommercialAdditionalAmount(String(amount || 0));
    setAdditionalPaymentReason("Commercial approved add-on / additional scope");
    setAdditionalPaymentNote(note || "Approved commercial add-on or additional scope reviewed with the customer.");
    setAdditionalPaymentMessage("Quote builder later/add-on amount copied below. Use it only after the customer approves the extra scope.");
  }

  const showPaymentActions = enablePaymentActions && collectionName === "serviceRequests" && selected;
  const showCustomerStatusActions = collectionName === "serviceRequests" && selected;
  const selectedLaundryFinalPaymentStatus = String(selected?.laundryPaymentStatus || selected?.paymentStatus || selected?.status || "");
  const laundryAutoChargeAuthorized = Boolean(
    selected?.service === "laundry-rescue" &&
    selected?.laundryAutoChargeAuthorized &&
    selected?.laundryFinalPaymentCollectionMethod === "auto_charge"
  );
  const laundryAutoChargeReady = Boolean(
    laundryAutoChargeAuthorized &&
    (selected?.laundryAutoChargeReady || selected?.laundryAutoChargePaymentMethodId)
  );
  const laundryFinalAlreadyPaid = Boolean(
    selected?.service === "laundry-rescue" &&
    (
      selectedLaundryFinalPaymentStatus.includes("Final Balance Paid") ||
      selectedLaundryFinalPaymentStatus.includes("Fully Paid") ||
      String(selected?.laundryFinalInvoiceStatus || "").toLowerCase() === "paid"
    )
  );
  const showLaundryFinalBalance = showPaymentActions && selected?.service === "laundry-rescue";
  const selectedIsCommercial = isCommercialRequest(selected);
  const isCustomCheckoutMode = checkoutMode === "custom";
  const hasSavedCommercialQuoteBreakdown = Boolean(selected?.commercialQuoteBreakdown?.customerBreakdownText);
  const hasSavedFamilyPaymentBreakdown = Boolean(selected?.familyPaymentBreakdown?.customerBreakdownText);
  const showCommercialQuotePanel = showPaymentActions && selectedIsCommercial;
  const showFamilyPaymentBreakdownPanel = showPaymentActions && !selectedIsCommercial;
  const showFamilyReferralPanel = showPaymentActions && !selectedIsCommercial;
  const selectedIsFamilyReferralEligible = isFamilyReferralEligibleRequest(selected);
  const selectedCanGenerateReferral = Boolean(selectedIsFamilyReferralEligible && isCompletedRequest(selected));
  const selectedAvailableCustomerCredits = getAvailableCustomerCreditsForRequest(selected, customerCredits);
  const selectedAvailableCustomerCreditTotal = getAvailableCustomerCreditTotal(selectedAvailableCustomerCredits);
  const anyActionBusy = checkoutBusy || commercialInvoiceBusy || commercialQuoteEmailBusy || familyInvoiceBusy || statusBusy || laundryFinalBusy || additionalPaymentBusy || commercialQuoteBusy || referralBusy;

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Admin</p>
            <h2 className="text-3xl font-bold text-[#075c58]">{title}</h2>
            <p className="mt-1 text-slate-600">
              Showing <span className="font-black text-[#075c58]">{filtered.length}</span> of <span className="font-black">{items.length}</span> records
              {activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} on` : ""}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 lg:max-w-xl">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search name, phone, city, notes..."
                className="min-h-12 w-full rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 shadow-sm outline-none focus:border-[#075c58] focus:ring-4 focus:ring-[#075c58]/15"
              />
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                className={getAdminActionClass(activeFilterCount ? "secondary" : "quiet")}
              >
                Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
              </button>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearAllFilters} className={getAdminActionClass("quiet")}>Clear</button>
              )}
            </div>
          </div>
        </div>

        {collectionName === "serviceRequests" && (
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Quick service filter</p>
            <ServiceLegend
              activeServiceFilter={serviceFilter}
              onToggleServiceFilter={(key) => setServiceFilter((prev) => prev === key ? "" : key)}
              counts={serviceCounts}
            />
          </div>
        )}

        {filtersOpen && (
          <div className="mt-4 grid gap-3 rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Status
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-12 rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                <option value="all">All statuses</option>
                {availableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Payment
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="min-h-12 rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                <option value="all">All payment states</option>
                <option value="unpaid">No payment sent/paid yet</option>
                <option value="sent">Checkout or invoice sent</option>
                <option value="paid">Paid</option>
                <option value="refund">Refund / credit mentioned</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Date created
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="min-h-12 rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                <option value="all">Any time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <AdminActionFeedback
        busy={anyActionBusy}
        activeAction={activeAction}
        messages={[statusMessage, checkoutMessage, commercialInvoiceMessage, commercialQuoteEmailMessage, familyInvoiceMessage, laundryFinalMessage, additionalPaymentMessage, commercialQuoteMessage, referralMessage]}
        errors={[statusError, checkoutError, commercialInvoiceError, commercialQuoteEmailError, familyInvoiceError, laundryFinalError, additionalPaymentError, commercialQuoteError, referralError]}
      />

      <div className="max-w-full overflow-hidden rounded-3xl border border-[#eadfc8] bg-white shadow-xl shadow-[#075c58]/5">
        <div className="overflow-x-auto [scrollbar-gutter:stable]">
          <table className="w-full min-w-[1180px] divide-y divide-[#eadfc8] text-sm">
            <thead className="bg-[#f4ecdc] text-left text-xs uppercase tracking-wider text-[#075c58]">
              <tr>
                <th className="px-4 py-4">Status</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-4">{col.label}</th>
                ))}
                <th className="px-4 py-4">Created</th>
                <th className="sticky right-0 z-20 min-w-[220px] bg-[#f4ecdc] px-4 py-4 shadow-[-10px_0_18px_rgba(0,0,0,0.04)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e7d7]">
              {filtered.map((item) => (
                <tr key={item.id} className={`transition-colors ${getServiceLook(item).row}`}>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  {columns.map((col) => (
                    <td key={col.key} className="max-w-[220px] truncate px-4 py-4 text-slate-700">{renderAdminCell(col.key, item)}</td>
                  ))}
                  <td className="px-4 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="sticky right-0 z-10 min-w-[220px] bg-white/95 px-3 py-4 align-top shadow-[-10px_0_18px_rgba(0,0,0,0.04)] backdrop-blur">
                    <div className="grid min-w-[190px] gap-2">
                      <button onClick={() => setSelected(item)} className="w-full whitespace-nowrap rounded-full bg-[#075c58] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064b48] focus:outline-none focus:ring-4 focus:ring-[#075c58]/20">Open details</button>
                      <select
                        value={item.status || "New"}
                        onChange={async (e) => {
                          const next = e.target.value;
                          setStatusBusy(true);
                          setActiveAction(`Updating ${getServiceLook(item).label} status to ${next}...`);
                          setStatusMessage("");
                          setStatusError("");
                          try {
                            await updateStatus(item, next);
                            setItems((prev) => prev.map((existing) => existing.id === item.id ? { ...existing, status: next } : existing));
                            setStatusMessage(`Status updated to ${next}.`);
                          } catch (error) {
                            setStatusError(error instanceof Error ? error.message : "Unable to update status.");
                          } finally {
                            setStatusBusy(false);
                            setActiveAction("");
                          }
                        }}
                        className="w-full min-w-0 rounded-full border border-[#d8c18f] bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none transition hover:border-[#075c58] focus:border-[#075c58] focus:ring-4 focus:ring-[#075c58]/15"
                        title="Quick internal status update. Open View to send a customer email."
                      >
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={columns.length + 3} className="px-4 py-12 text-center text-slate-500">No records match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-4 flex items-center justify-between gap-3 border-b border-[#eadfc8] bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Admin details</p>
                <h3 className="text-2xl font-bold text-[#075c58]">Submission Details</h3>
              </div>
              <button onClick={() => setSelected(null)} className={getAdminActionClass("quiet")}>Close details</button>
            </div>

            <div className="mb-5 space-y-4">
              <AdminWorkflowGuide selectedIsCommercial={selectedIsCommercial} selectedService={selected.service} />
              <AdminActionFeedback
                busy={anyActionBusy}
                activeAction={activeAction}
                messages={[statusMessage, checkoutMessage, commercialInvoiceMessage, commercialQuoteEmailMessage, familyInvoiceMessage, laundryFinalMessage, additionalPaymentMessage, commercialQuoteMessage, referralMessage]}
                errors={[statusError, checkoutError, commercialInvoiceError, commercialQuoteEmailError, familyInvoiceError, laundryFinalError, additionalPaymentError, commercialQuoteError, referralError]}
              />
            </div>

            {showCustomerStatusActions && (
              <div className="mb-5 rounded-3xl border border-[#eadfc8] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Status + customer update</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">Update the request and choose whether to notify the customer</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Use the table dropdown for quick internal updates. Use this section when the customer should get a clear NestHelper email.
                    </p>
                  </div>
                  <StatusBadge status={statusValue} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Customer-facing status
                    <select
                      value={statusValue}
                      onChange={(e) => {
                        const next = e.target.value;
                        setStatusValue(next);
                        setNotifyCustomer(shouldNotifyByDefault(next));
                      }}
                      className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                    >
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] px-4 py-3 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={notifyCustomer}
                      onChange={(e) => setNotifyCustomer(e.target.checked)}
                      className="h-5 w-5 rounded border-[#075c58] accent-[#075c58]"
                    />
                    Send customer email notification
                  </label>
                </div>

                <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                  Optional customer note
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder={getStatusNotePlaceholder(statusValue)}
                    rows={4}
                    className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]"
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={statusBusy}
                    onClick={submitStatusUpdate}
                    className={getAdminActionClass("primary")}
                  >
                    {statusBusy ? <><ActionSpinner /> Updating...</> : notifyCustomer ? "Update status + notify customer" : "Update status only"}
                  </button>
                  <p className="max-w-xl text-xs leading-5 text-slate-500">
                    Payment link emails and payment received emails are handled separately. This button is for manual updates like Declined, Scheduled, Canceled, or Needs Info.
                  </p>
                </div>

                {statusMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{statusMessage}</p>}
                {statusError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{statusError}</p>}
              </div>
            )}

            {showFamilyReferralPanel && (
              <div className="mb-5 rounded-3xl border border-[#eadfc8] bg-gradient-to-br from-white via-white to-[#fbf6ea] p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Family referrals</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">Generate and track one-time family referral links</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Family referral links are only for completed eligible family-service customers. They are one-time use. Commercial Reset is intentionally excluded.
                    </p>
                  </div>
                  <StatusBadge status={getReferralStatusText(selected)} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#eadfc8] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Outgoing share link for this customer</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                      {selected.outgoingReferralCode
                        ? `Code: ${selected.outgoingReferralCode}`
                        : selectedIsFamilyReferralEligible
                          ? selectedCanGenerateReferral
                            ? "Ready to generate after you choose this completed customer."
                            : "Mark this eligible family request Completed before generating the customer’s referral link."
                          : "This service is not eligible for a family referral share link."}
                    </p>
                    {selected.outgoingReferralLink && (
                      <div className="mt-3 rounded-2xl bg-[#fbf6ea] p-3">
                        <p className="break-all text-sm font-bold text-[#075c58]">{selected.outgoingReferralLink}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-600">Status: {selected.outgoingReferralStatus || "Active"}</p>
                        {selected.outgoingReferralEmailError && <p className="mt-2 text-xs font-bold text-amber-800">Email note: {selected.outgoingReferralEmailError}</p>}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={referralBusy || (!selected.outgoingReferralLink && !selectedCanGenerateReferral)}
                        onClick={() => createReferralLink(true)}
                        className={getAdminActionClass("primary")}
                      >
                        {referralBusy ? <><ActionSpinner /> Working...</> : selected.outgoingReferralLink ? "Resend referral link email" : "Create + email referral link"}
                      </button>
                      {selected.outgoingReferralLink && (
                        <button type="button" onClick={() => copyReferralLink(selected.outgoingReferralLink || "")} className={getAdminActionClass("secondary")}>Copy referral link</button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#eadfc8] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Incoming referred-family tracking</p>
                    {selected.incomingReferralCode ? (
                      <div className="mt-2 text-sm font-bold leading-6 text-slate-700">
                        <p>Incoming code: <span className="text-[#075c58]">{selected.incomingReferralCode}</span></p>
                        <p>Status: <span className="text-[#075c58]">{selected.incomingReferralStatus || "Pending referred family completion"}</span></p>
                        {selected.incomingReferralReferrerName && <p>Referring family: {selected.incomingReferralReferrerName}</p>}
                        {selected.incomingReferralRewardCode && <p>Reward code: {selected.incomingReferralRewardCode}</p>}
                        {selected.incomingReferralRewardEmailError && <p className="mt-2 text-amber-800">Reward email note: {selected.incomingReferralRewardEmailError}</p>}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">This request was not submitted through a family referral link.</p>
                    )}
                    <p className="mt-3 rounded-2xl bg-[#fbf6ea] px-4 py-3 text-xs font-bold leading-5 text-slate-600">
                      When a referred eligible family reset is marked Completed, NestHelper automatically emails the original referring family about their reward/credit and updates both records.
                    </p>
                  </div>
                </div>

                {selectedAvailableCustomerCreditTotal > 0 && (
                  <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-900">
                    Available saved credit for this customer email: {formatMoney(selectedAvailableCustomerCreditTotal)}. Open the Family Payment Breakdown to apply it before sending checkout or invoice.
                  </div>
                )}

                {referralMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{referralMessage}</p>}
                {referralError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{referralError}</p>}
              </div>
            )}

            {showCommercialQuotePanel && (
              <div className="mb-5 rounded-3xl border border-cyan-200 bg-cyan-50/45 p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Commercial quote workflow</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">Review, quote, then invoice when approved</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      This section is for Commercial Reset only. Review the request, build and save a customer-ready quote, email the quote by itself if the customer needs to approve first, then create the Stripe invoice once they are ready to pay.
                    </p>
                  </div>
                  <StatusBadge status={getCommercialQuoteStatus(selected)} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Step 1</p>
                    <p className="mt-1 text-sm font-black text-[#075c58]">Review the request</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Check the space type, size, bathrooms, photos, timing, and requested priorities.</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Step 2</p>
                    <p className="mt-1 text-sm font-black text-[#075c58]">Prepare the quote</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Use sq-ft pricing when possible, then add recurring, turnover, or reviewed add-on lines as needed.</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Step 3</p>
                    <p className="mt-1 text-sm font-black text-[#075c58]">Email quote or invoice</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Send the quote only for approval, or create a Stripe invoice when the customer is ready to pay.</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Optional</p>
                    <p className="mt-1 text-sm font-black text-[#075c58]">Add-on balance</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Use only for customer-approved extras, floor work, linen handling, or added scope.</p>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-cyan-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Request snapshot</p>
                      <h5 className="mt-1 text-base font-black text-[#075c58]">Key details to check before quoting</h5>
                    </div>
                    <p className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-800">Commercial</p>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Space type</p>
                      <p className="mt-1 text-sm font-bold text-[#075c58]">{formatValue("businessType", selected.businessType)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">Frequency: {formatValue("frequency", selected.frequency)}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Size + layout</p>
                      <p className="mt-1 text-sm font-bold text-[#075c58]">{formatValue("squareFootage", selected.squareFootage)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">Restrooms: {formatValue("bathrooms", selected.bathrooms)} · Kitchens/breakrooms: {formatValue("kitchens", selected.kitchens)} · Showers: {formatValue("showers", selected.showers)}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Condition</p>
                      <p className="mt-1 text-sm font-bold text-[#075c58]">{formatValue("spaceCondition", selected.spaceCondition)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">Traffic: {formatValue("trafficLevel", selected.trafficLevel)}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Customer estimate</p>
                      <p className="mt-1 text-sm font-bold text-[#075c58]">{formatValue("customerEstimatePrimaryRange", selected.customerEstimatePrimaryRange)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {selected.customerEstimateMonthlyRange ? `Monthly: ${formatValue("customerEstimateMonthlyRange", selected.customerEstimateMonthlyRange)}` : "Planning range shown on request form when enough details were entered."}
                      </p>
                      {selected.customerEstimateAddOnRange && (
                        <p className="mt-1 text-xs font-semibold text-slate-600">Add-ons: {formatValue("customerEstimateAddOnRange", selected.customerEstimateAddOnRange)}</p>
                      )}
                    </div>
                  </div>

                  {(selected.carpetArea || selected.carpetAreaClearance || selected.hardFloorArea || selected.hardFloorAreaClearance || selected.spotTreatmentCount || selected.upholsteryScope || selected.upholsteryCondition || selected.glassScope || selected.glassAccess) && (
                    <div className="mt-4 rounded-3xl border border-cyan-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Add-on estimate details</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {selected.carpetArea && (
                          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 text-xs font-semibold leading-5 text-slate-600">
                            <span className="font-black text-[#075c58]">Carpet:</span> {formatValue("carpetArea", selected.carpetArea)}{selected.carpetCondition ? ` · ${formatValue("carpetCondition", selected.carpetCondition)}` : ""}{selected.carpetAreaClearance ? ` · Clearance: ${formatValue("carpetAreaClearance", selected.carpetAreaClearance)}` : ""}
                          </div>
                        )}
                        {selected.spotTreatmentCount && (
                          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 text-xs font-semibold leading-5 text-slate-600">
                            <span className="font-black text-[#075c58]">Spot treatment:</span> {formatValue("spotTreatmentCount", selected.spotTreatmentCount)}
                          </div>
                        )}
                        {selected.hardFloorArea && (
                          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 text-xs font-semibold leading-5 text-slate-600">
                            <span className="font-black text-[#075c58]">Hard floors:</span> {formatValue("hardFloorArea", selected.hardFloorArea)}{selected.hardFloorMaterial ? ` · ${formatValue("hardFloorMaterial", selected.hardFloorMaterial)}` : ""}{selected.hardFloorCondition ? ` · ${formatValue("hardFloorCondition", selected.hardFloorCondition)}` : ""}{selected.hardFloorAreaClearance ? ` · Clearance: ${formatValue("hardFloorAreaClearance", selected.hardFloorAreaClearance)}` : ""}
                          </div>
                        )}
                        {selected.upholsteryScope && (
                          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 text-xs font-semibold leading-5 text-slate-600">
                            <span className="font-black text-[#075c58]">Upholstery:</span> {formatValue("upholsteryScope", selected.upholsteryScope)}{selected.upholsteryCondition ? ` · ${formatValue("upholsteryCondition", selected.upholsteryCondition)}` : ""}
                          </div>
                        )}
                        {selected.glassScope && (
                          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 text-xs font-semibold leading-5 text-slate-600">
                            <span className="font-black text-[#075c58]">Interior glass:</span> {formatValue("glassScope", selected.glassScope)}{selected.glassAccess ? ` · Access: ${formatValue("glassAccess", selected.glassAccess)}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <CommercialQuoteBreakdownBuilder
                    item={selected}
                    formatMoney={formatMoney}
                    onSaved={(updates) => {
                      const savedBreakdown = updates.commercialQuoteBreakdown as { customerBreakdownText?: string } | undefined;
                      setSelected((prev) => (prev ? { ...prev, ...updates } : prev));
                      if (updates.commercialInitialAmount !== undefined) setCommercialInitialAmount(String(updates.commercialInitialAmount));
                      if (updates.commercialAdditionalAmount !== undefined) setCommercialAdditionalAmount(String(updates.commercialAdditionalAmount));
                      if (updates.commercialQuoteStatus) setCommercialQuoteStatus(String(updates.commercialQuoteStatus));
                      if (updates.commercialQuoteType) setCommercialQuoteType(String(updates.commercialQuoteType));
                      if (updates.commercialCustomerQuoteNote) setCommercialCustomerQuoteNote(String(updates.commercialCustomerQuoteNote));
                      if (updates.commercialInternalQuoteNotes) setCommercialInternalQuoteNotes(String(updates.commercialInternalQuoteNotes));
                      if (savedBreakdown?.customerBreakdownText) setIncludeCommercialQuoteBreakdown(true);
                      if (updates.status) setStatusValue(String(updates.status));
                    }}
                    onApplyFirstPayment={applyCommercialQuoteBuilderFirstPayment}
                    onApplyAdditionalPayment={applyCommercialQuoteBuilderAdditionalPayment}
                  />
                </div>

                <div className="mt-4 rounded-3xl border border-cyan-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Step 2 — Prepare quote</p>
                  <h5 className="mt-1 text-base font-black text-[#075c58]">What are you offering the customer?</h5>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    Enter the amount you want to collect before work is scheduled. Add a later amount only if there is an approved add-on or balance.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Quote progress
                      <select
                        value={commercialQuoteStatus}
                        onChange={(e) => setCommercialQuoteStatus(e.target.value)}
                        className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                      >
                        {COMMERCIAL_QUOTE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Pricing style
                      <select
                        value={commercialQuoteType}
                        onChange={(e) => setCommercialQuoteType(e.target.value)}
                        className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                      >
                        {COMMERCIAL_QUOTE_TYPES.map((type) => <option key={type}>{type}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Amount to collect now
                      <input
                        value={commercialInitialAmount}
                        onChange={(e) => setCommercialInitialAmount(e.target.value)}
                        inputMode="decimal"
                        placeholder="149"
                        className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]"
                      />
                      <span className="text-xs font-semibold leading-5 text-slate-500">Use this for the first approved visit, first turnover, deposit, or first recurring-plan payment.</span>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Later/add-on amount, optional
                      <input
                        value={commercialAdditionalAmount}
                        onChange={(e) => setCommercialAdditionalAmount(e.target.value)}
                        inputMode="decimal"
                        placeholder="0"
                        className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]"
                      />
                      <span className="text-xs font-semibold leading-5 text-slate-500">Leave blank/0 unless the customer approved extra add-ons, specialty floor work, linens, or added scope.</span>
                    </label>
                  </div>

                  <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                    Customer quote message
                    <textarea
                      value={commercialCustomerQuoteNote}
                      onChange={(e) => setCommercialCustomerQuoteNote(e.target.value)}
                      rows={3}
                      placeholder="Example: Approved Commercial Reset quote based on the submitted square footage range, restrooms, breakroom, and listed priorities. Specialty add-ons are reviewed before any additional charge."
                      className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]"
                    />
                    <span className="text-xs font-semibold leading-5 text-slate-500">This can be copied into the Stripe checkout note so the customer understands what the payment is for.</span>
                  </label>

                  <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                    Private admin notes
                    <textarea
                      value={commercialInternalQuoteNotes}
                      onChange={(e) => setCommercialInternalQuoteNotes(e.target.value)}
                      rows={3}
                      placeholder="Private notes: walkthrough needed, Pierce assignment, supply considerations, floor add-ons, tight turnover window, or pricing logic."
                      className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]"
                    />
                  </label>

                  <div className="mt-4 grid gap-3 lg:grid-cols-4">
                    <button
                      type="button"
                      disabled={commercialQuoteBusy}
                      onClick={saveCommercialQuote}
                      className={getAdminActionClass("primary")}
                    >
                      {commercialQuoteBusy ? <><ActionSpinner /> Saving...</> : "1. Save quote details"}
                    </button>
                    <button
                      type="button"
                      disabled={commercialQuoteEmailBusy || !hasSavedCommercialQuoteBreakdown}
                      onClick={emailCommercialQuoteOnly}
                      className={getAdminActionClass("success")}
                    >
                      {commercialQuoteEmailBusy ? <><ActionSpinner /> Emailing...</> : "Email quote only"}
                    </button>
                    <button
                      type="button"
                      onClick={applyCommercialInitialToCheckout}
                      className={getAdminActionClass("secondary")}
                    >
                      2. Fill first payment link
                    </button>
                    <button
                      type="button"
                      onClick={applyCommercialAdditionalToPayment}
                      className={getAdminActionClass("quiet")}
                    >
                      Fill optional add-on link
                    </button>
                  </div>

                  {commercialQuoteMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{commercialQuoteMessage}</p>}
                  {commercialQuoteError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{commercialQuoteError}</p>}
                  {commercialQuoteEmailMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{commercialQuoteEmailMessage}</p>}
                  {commercialQuoteEmailError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{commercialQuoteEmailError}</p>}
                </div>
              </div>
            )}

            {showFamilyPaymentBreakdownPanel && (
              <FamilyPaymentBreakdownBuilder
                item={selected}
                availableCustomerCredits={selectedAvailableCustomerCredits}
                formatMoney={formatMoney}
                onSaved={(updates) => {
                  const savedBreakdown = updates.familyPaymentBreakdown as { customerBreakdownText?: string } | undefined;
                  setSelected((prev) => (prev ? { ...prev, ...updates } : prev));
                  if (savedBreakdown?.customerBreakdownText) setIncludeFamilyPaymentBreakdown(true);
                }}
                onApplyCheckout={({ amount, title, note }) => {
                  setCheckoutMode("custom");
                  setCustomInitialAmount(String(amount));
                  setCustomInitialTitle(title);
                  setCustomInitialNote(note);
                }}
                onApplyAdditionalPayment={({ amount, reason, note }) => {
                  setAdditionalPaymentAmount(String(amount));
                  setAdditionalPaymentReason(reason);
                  setAdditionalPaymentNote(note);
                }}
              />
            )}

            {showPaymentActions && (
              <div className="mb-5 rounded-3xl border border-[#d8c18f] bg-[#fbf6ea] p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">{selectedIsCommercial ? "Step 3 — payment" : "Approval + payment"}</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">Choose invoice or quick checkout</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {selectedIsCommercial
                        ? "For Commercial Reset, the itemized Stripe invoice from the saved quote breakdown is usually the best option. Use quick checkout only for a simple deposit or first payment that does not need a formal invoice PDF."
                        : "Use a Stripe invoice when you want the customer to receive an itemized invoice/PDF from the saved Family Payment Breakdown. Use quick checkout for a simple package payment or deposit."}
                    </p>
                    {selected.service === "laundry-rescue" && (
                      <p className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#075c58]">
                        For Laundry Rescue, both the saved breakdown payment and quick checkout create a deposit checkout so Stripe can ask the customer to choose auto-charge or invoice-before-delivery. After dry weigh-in, use the final balance section below.
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[#d8c18f] bg-white px-4 py-3 text-sm font-bold text-[#075c58] lg:max-w-sm">
                    Invoices use saved builder line items. Quick checkout uses the price mode/custom amount in the quick checkout box.
                  </div>
                </div>

                {selectedIsCommercial && (
                  <div className="mt-4 rounded-3xl border border-cyan-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Recommended for commercial</p>
                        <h5 className="mt-1 text-base font-black text-[#075c58]">Create a Stripe invoice from the saved breakdown</h5>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          Best for commercial customers who expect an itemized invoice/PDF. Save the Quote / Breakdown Builder first, then create the Stripe invoice. When emailing, NestHelper sends the hosted invoice link in a branded email.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                        <button type="button" disabled={commercialInvoiceBusy || !hasSavedCommercialQuoteBreakdown} onClick={() => createCommercialInvoice(true)} className={getAdminActionClass("primary")}>
                          {commercialInvoiceBusy ? <><ActionSpinner /> Creating...</> : "Create + email invoice link"}
                        </button>
                        <button type="button" disabled={commercialInvoiceBusy || !hasSavedCommercialQuoteBreakdown} onClick={() => createCommercialInvoice(false)} className={getAdminActionClass("secondary")}>
                          Create invoice only
                        </button>
                      </div>
                    </div>
                    {!hasSavedCommercialQuoteBreakdown && (
                      <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">Save the Quote / Breakdown Builder draft first. The invoice uses those saved line items.</p>
                    )}
                    {(selected.commercialInvoiceUrl || selected.commercialInvoicePdf) && (
                      <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Current commercial invoice</p>
                        {selected.commercialInvoiceEmailWarning && <p className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{selected.commercialInvoiceEmailWarning}</p>}
                        {selected.commercialInvoiceServicePeriodLabel && <p className="mt-2 text-xs font-bold text-slate-600">Service period: {selected.commercialInvoiceServicePeriodLabel}</p>}
                        {selected.commercialInvoiceUrl && <p className="mt-2 break-all text-sm text-[#075c58]">{selected.commercialInvoiceUrl}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selected.commercialInvoiceUrl && <a href={selected.commercialInvoiceUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064b48]">Open invoice</a>}
                          {selected.commercialInvoicePdf && <a href={selected.commercialInvoicePdf} target="_blank" rel="noreferrer" className="rounded-full border border-[#075c58] bg-white px-4 py-2 text-xs font-black text-[#075c58] transition hover:bg-[#f4ecdc]">Open PDF</a>}
                          {selected.commercialInvoiceUrl && <button type="button" onClick={() => copyToClipboard(selected.commercialInvoiceUrl || "")} className="rounded-full border border-[#075c58] bg-white px-4 py-2 text-xs font-black text-[#075c58] transition hover:bg-[#f4ecdc]">Copy invoice link</button>}
                        </div>
                      </div>
                    )}
                    {commercialInvoiceMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{commercialInvoiceMessage}</p>}
                    {commercialInvoiceError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{commercialInvoiceError}</p>}
                  </div>
                )}

                {!selectedIsCommercial && (
                  <div className="mt-4 rounded-3xl border border-cyan-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">{selected.service === "laundry-rescue" ? "Laundry deposit approval" : "Optional family invoice"}</p>
                        <h5 className="mt-1 text-base font-black text-[#075c58]">{selected.service === "laundry-rescue" ? "Create a deposit checkout from the saved laundry breakdown" : "Create a Stripe invoice from the saved family breakdown"}</h5>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {selected.service === "laundry-rescue"
                            ? "This uses the saved breakdown amount to create a taxable, non-refundable Laundry Rescue deposit checkout. Stripe asks the customer to choose auto-charge for the final balance or invoice-before-delivery."
                            : "Use this when you want a formal invoice/PDF instead of only a checkout receipt: Errand Helper, custom family quotes, recurring family help, approved add-ons, or refund/credit documentation."}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                        <button type="button" disabled={familyInvoiceBusy || !hasSavedFamilyPaymentBreakdown} onClick={() => createFamilyInvoice(true)} className={getAdminActionClass("primary")}>
                          {familyInvoiceBusy ? <><ActionSpinner /> Creating...</> : selected.service === "laundry-rescue" ? "Create + email laundry deposit checkout" : "Create + email family invoice"}
                        </button>
                        <button type="button" disabled={familyInvoiceBusy || !hasSavedFamilyPaymentBreakdown} onClick={() => createFamilyInvoice(false)} className={getAdminActionClass("secondary")}>
                          {selected.service === "laundry-rescue" ? "Create laundry deposit checkout only" : "Create family invoice only"}
                        </button>
                      </div>
                    </div>
                    {!hasSavedFamilyPaymentBreakdown && (
                      <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">Save the Family Payment Breakdown draft first. For Laundry Rescue, the saved amount becomes the deposit checkout amount; for other services, the invoice uses the saved line items.</p>
                    )}
                    {(selected.familyInvoiceUrl || selected.familyInvoicePdf) && (
                      <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">{selected.service === "laundry-rescue" ? "Current laundry deposit checkout" : "Current family invoice"}</p>
                        {selected.familyInvoiceEmailWarning && <p className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{selected.familyInvoiceEmailWarning}</p>}
                        {selected.familyInvoiceServicePeriodLabel && <p className="mt-2 text-xs font-bold text-slate-600">Service period: {selected.familyInvoiceServicePeriodLabel}</p>}
                        {selected.familyInvoiceUrl && <p className="mt-2 break-all text-sm text-[#075c58]">{selected.familyInvoiceUrl}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selected.familyInvoiceUrl && <a href={selected.familyInvoiceUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064b48]">{selected.service === "laundry-rescue" ? "Open checkout" : "Open invoice"}</a>}
                          {selected.familyInvoicePdf && <a href={selected.familyInvoicePdf} target="_blank" rel="noreferrer" className="rounded-full border border-[#075c58] bg-white px-4 py-2 text-xs font-black text-[#075c58] transition hover:bg-[#f4ecdc]">Open PDF</a>}
                          {selected.familyInvoiceUrl && <button type="button" onClick={() => copyToClipboard(selected.familyInvoiceUrl || "")} className="rounded-full border border-[#075c58] bg-white px-4 py-2 text-xs font-black text-[#075c58] transition hover:bg-[#f4ecdc]">{selected.service === "laundry-rescue" ? "Copy checkout link" : "Copy invoice link"}</button>}
                        </div>
                      </div>
                    )}
                    {familyInvoiceMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{familyInvoiceMessage}</p>}
                    {familyInvoiceError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{familyInvoiceError}</p>}
                  </div>
                )}

                <div className="mt-4 rounded-3xl border border-[#d8c18f] bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Quick checkout</p>
                      <h5 className="mt-1 text-base font-black text-[#075c58]">Create a non-invoice Stripe checkout link</h5>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        Quick checkout is best for simple package payments, deposits, or small custom payments. It does not create the same itemized Stripe invoice/PDF as the invoice builder.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#fbf6ea] px-4 py-3 text-xs font-bold leading-5 text-slate-700 lg:max-w-sm">
                      {selectedIsCommercial
                        ? "Commercial quick checkout uses the custom first-payment amount below. Use the invoice option for formal itemized records."
                        : "Price mode applies only to these quick checkout buttons. Invoices use the saved Family Payment Breakdown instead."}
                    </div>
                  </div>

                  {!selectedIsCommercial && (
                    <div className="mt-4 grid gap-2 sm:max-w-sm">
                      <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Quick checkout price mode</label>
                      <select
                        value={checkoutMode}
                        onChange={(e) => setCheckoutMode(e.target.value as CheckoutMode)}
                        className="rounded-2xl border border-[#d8c18f] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                      >
                        <option value="standard">Standard price</option>
                        <option value="founding">Founding / beta price</option>
                        <option value="custom">Custom quick checkout amount</option>
                      </select>
                    </div>
                  )}

                  {selectedIsCommercial && (
                    <input type="hidden" value={checkoutMode} readOnly aria-hidden="true" />
                  )}

                  {isCustomCheckoutMode && (
                    <div className="mt-4 rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">{selectedIsCommercial ? "Quick first-payment checkout" : "Custom quick checkout"}</p>
                        <h5 className="mt-1 text-base font-black text-[#075c58]">{selectedIsCommercial ? "Amount the customer pays before scheduling" : "Reviewed custom starting amount"}</h5>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {selectedIsCommercial
                            ? "Use this only when you want a simple checkout link instead of a formal invoice. It should match the approved first-payment amount."
                            : "Use this when the first quick checkout should not match the standard package price, such as a custom approved scope, special deposit, extra starting time, or service-area adjustment."}
                        </p>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
                        <label className="grid gap-2 text-sm font-bold text-slate-700">
                          {selectedIsCommercial ? "Amount to collect now" : "Amount"}
                          <input
                            value={customInitialAmount}
                            onChange={(e) => setCustomInitialAmount(e.target.value)}
                            inputMode="decimal"
                            placeholder="149"
                            className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]"
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-bold text-slate-700">
                          Checkout title
                          <input
                            value={customInitialTitle}
                            onChange={(e) => setCustomInitialTitle(e.target.value)}
                            placeholder={selected.service === "laundry-rescue" ? "Laundry Rescue custom deposit" : selected.service === "commercial-reset" ? "Commercial Reset approved quote" : "Custom Parent Reset checkout"}
                            className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]"
                          />
                        </label>
                      </div>
                      <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                        Optional customer note
                        <textarea
                          value={customInitialNote}
                          onChange={(e) => setCustomInitialNote(e.target.value)}
                          rows={3}
                          placeholder={selectedIsCommercial ? "Example: Approved Commercial Reset first payment. Add-ons or scope changes are reviewed before any additional charge." : "Example: Custom approved starting amount for 3.5 hours after request review. Any additional approved time or mileage would be billed separately."}
                          className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]"
                        />
                      </label>
                    </div>
                  )}

                  {selectedIsCommercial && isCustomCheckoutMode && (
                    <div className="mt-4 rounded-3xl border border-[#d8c18f] bg-[#fbf6ea] p-4">
                      <label className="flex gap-3 text-sm font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={includeCommercialQuoteBreakdown}
                          onChange={(e) => setIncludeCommercialQuoteBreakdown(e.target.checked)}
                          disabled={!hasSavedCommercialQuoteBreakdown}
                          className="mt-1 h-4 w-4 rounded border-[#d8c18f] accent-[#075c58]"
                        />
                        <span>
                          <span className="block text-[#075c58]">Include saved quote breakdown in the quick checkout email</span>
                          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">
                            This only affects the quick checkout email. For a true itemized customer record, use the Stripe invoice option above instead.
                          </span>
                        </span>
                      </label>
                      {!hasSavedCommercialQuoteBreakdown && (
                        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
                          No saved quote breakdown is available yet. Save the Quote / Breakdown Builder draft first, then this checkbox will be available.
                        </p>
                      )}
                    </div>
                  )}

                  {!selectedIsCommercial && (
                    <div className="mt-4 rounded-3xl border border-[#d8c18f] bg-[#fbf6ea] p-4">
                      <label className="flex gap-3 text-sm font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={includeFamilyPaymentBreakdown}
                          onChange={(e) => setIncludeFamilyPaymentBreakdown(e.target.checked)}
                          disabled={!hasSavedFamilyPaymentBreakdown}
                          className="mt-1 h-4 w-4 rounded border-[#d8c18f] accent-[#075c58]"
                        />
                        <span>
                          <span className="block text-[#075c58]">Include saved family payment breakdown in the quick checkout email</span>
                          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">
                            Use this when you want the customer to see the package, custom amount, recurring plan, laundry note, discount, or credit details before paying by quick checkout.
                          </span>
                        </span>
                      </label>
                      {!hasSavedFamilyPaymentBreakdown && (
                        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
                          No saved family payment breakdown is available yet. Save the Family Payment Breakdown draft first, then this checkbox will be available.
                        </p>
                      )}
                    </div>
                  )}

                  {selected.service === "laundry-rescue" && (
                    <div className="mt-4 rounded-3xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">
                      <p className="font-black text-rose-950">Laundry deposit checkout note</p>
                      <p className="mt-1 font-semibold">
                        This creates the non-refundable, taxable deposit/minimum checkout. Stripe will ask the customer to choose either auto-charge for the final dry-weight balance or invoice-before-delivery. Deposit paid does not mean fully paid.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      disabled={checkoutBusy}
                      onClick={() => createPaymentLink(true)}
                      className={getAdminActionClass("primary")}
                    >
                      {checkoutBusy
                        ? <><ActionSpinner /> Creating...</>
                        : selectedIsCommercial
                          ? "Create + email quick first-payment checkout link"
                          : selected.service === "laundry-rescue"
                            ? "Create + email quick deposit checkout link"
                            : "Create + email quick checkout link"}
                    </button>
                    <button
                      type="button"
                      disabled={checkoutBusy}
                      onClick={() => createPaymentLink(false)}
                      className={getAdminActionClass("secondary")}
                    >
                      {selectedIsCommercial
                        ? "Create quick first-payment checkout link only"
                        : selected.service === "laundry-rescue"
                          ? "Create quick deposit checkout link only"
                          : "Create quick checkout link only"}
                    </button>
                  </div>
                </div>

                {selected.checkoutUrl && (
                  <div className="mt-4 rounded-2xl border border-[#eadfc8] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Current quick checkout link</p>
                    <p className="mt-2 break-all text-sm text-[#075c58]">{selected.checkoutUrl}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={selected.checkoutUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064b48]">Open Stripe quick checkout</a>
                      <button type="button" onClick={() => copyToClipboard(selected.checkoutUrl || "")} className="rounded-full border border-[#075c58] bg-white px-4 py-2 text-xs font-black text-[#075c58] transition hover:bg-[#f4ecdc]">Copy quick checkout link</button>
                    </div>
                  </div>
                )}

                {checkoutMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{checkoutMessage}</p>}
                {checkoutError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{checkoutError}</p>}
              </div>
            )}

            {showLaundryFinalBalance && (
              <div className="mb-5 rounded-3xl border border-[#d8c18f] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">
                      {laundryAutoChargeAuthorized ? "Laundry auto-charge final balance" : "Laundry final balance"}
                    </p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">
                      {laundryAutoChargeAuthorized ? "Create invoice + auto-charge saved card" : "Send final invoice before delivery"}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {laundryAutoChargeAuthorized
                        ? "The customer chose auto-charge during deposit checkout. Enter the dry weight, rate, add-ons, and deposit credit; NestHelper creates an itemized Stripe invoice and charges the saved payment method instead of showing a manual sender section."
                        : "The customer chose invoice-before-delivery, or no auto-charge authorization is saved. Enter the dry weight, rate, add-ons, and deposit credit; NestHelper creates a Stripe invoice with line-item details for the remaining taxable balance only."}
                    </p>
                  </div>
                  <StatusBadge status={String(selected.laundryPaymentStatus || selected.paymentStatus || selected.status || "New")} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4 text-sm leading-6 text-slate-700">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Customer final-payment choice</p>
                    <p className="mt-1 font-black text-[#075c58]">{selected.laundryFinalPaymentPreferenceLabel || "Not captured yet"}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      The deposit/minimum is non-refundable and taxable. The final invoice applies the pre-tax deposit as a credit so Stripe only taxes the remaining final balance.
                    </p>
                  </div>
                  {laundryAutoChargeAuthorized ? (
                    <div className={`rounded-2xl border p-4 text-sm leading-6 ${laundryAutoChargeReady ? "border-emerald-100 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                      <p className="text-xs font-black uppercase tracking-[0.16em]">Auto-charge status</p>
                      <p className="mt-1 font-black">{laundryAutoChargeReady ? "Saved Stripe payment method ready" : "Auto-charge was selected, but the saved card is missing"}</p>
                      <p className="mt-1 text-xs font-semibold">
                        {laundryAutoChargeReady
                          ? "The final action below will create the invoice and charge the saved card. Do not send a separate final invoice unless auto-charge fails."
                          : selected.laundryAutoChargeError || "Use a manual invoice or have the customer re-authorize the laundry deposit checkout before auto-charging."}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                      <p className="text-xs font-black uppercase tracking-[0.16em]">Hold until paid</p>
                      <p className="mt-1 font-black">Send the final invoice before delivery</p>
                      <p className="mt-1 text-xs font-semibold">Use the final invoice buttons below. Laundry should not be released until the invoice is fully paid.</p>
                    </div>
                  )}
                </div>

                {laundryFinalAlreadyPaid && (
                  <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                    This request already shows the final laundry balance as paid. Do not create another final invoice or auto-charge unless you intentionally need a correction.
                  </p>
                )}

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Dry weight lbs
                    <input
                      value={laundryDryWeightLbs}
                      onChange={(e) => setLaundryDryWeightLbs(e.target.value)}
                      inputMode="decimal"
                      placeholder="24"
                      className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Rate per lb
                    <input
                      value={laundryRatePerLb}
                      onChange={(e) => setLaundryRatePerLb(e.target.value)}
                      inputMode="decimal"
                      className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Add-ons / bulky
                    <input
                      value={laundryAddOnsAmount}
                      onChange={(e) => setLaundryAddOnsAmount(e.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                      className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Deposit credit before tax
                    <input
                      value={laundryDepositCredit}
                      onChange={(e) => setLaundryDepositCredit(e.target.value)}
                      inputMode="decimal"
                      className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl bg-[#fbf6ea] p-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[#b98a2f]">Laundry total before tax</p>
                    <p className="mt-1 text-xl font-black text-[#075c58]">{formatMoney(laundrySubtotal)}</p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[#b98a2f]">Deposit credit before tax</p>
                    <p className="mt-1 text-xl font-black text-[#075c58]">-{formatMoney(toNumber(laundryDepositCredit))}</p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[#b98a2f]">Final taxable balance</p>
                    <p className="mt-1 text-xl font-black text-[#075c58]">{formatMoney(laundryBalanceDue)}</p>
                  </div>
                </div>

                <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                  Optional final balance note
                  <textarea
                    value={laundryFinalNote}
                    onChange={(e) => setLaundryFinalNote(e.target.value)}
                    placeholder="Example: 24 lbs dry weight, fragrance-free detergent, low heat dry. Deposit has already been credited before tax."
                    rows={3}
                    className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]"
                  />
                </label>

                {laundryAutoChargeAuthorized ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={laundryFinalBusy || laundryFinalAlreadyPaid || !laundryAutoChargeReady}
                      onClick={() => createLaundryFinalBalance(false)}
                      className={getAdminActionClass("primary")}
                    >
                      {laundryFinalBusy ? <><ActionSpinner /> Charging...</> : "Create invoice + auto-charge saved card"}
                    </button>
                    {!laundryAutoChargeReady && (
                      <p className="mt-2 text-xs font-bold text-amber-800">Auto-charge is not ready, so the charge button is disabled to avoid a failed or duplicate billing attempt.</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      disabled={laundryFinalBusy || laundryFinalAlreadyPaid}
                      onClick={() => createLaundryFinalBalance(true)}
                      className={getAdminActionClass("primary")}
                    >
                      {laundryFinalBusy ? <><ActionSpinner /> Creating...</> : "Create + email final invoice"}
                    </button>
                    <button
                      type="button"
                      disabled={laundryFinalBusy || laundryFinalAlreadyPaid}
                      onClick={() => createLaundryFinalBalance(false)}
                      className={getAdminActionClass("secondary")}
                    >
                      Create final invoice only
                    </button>
                  </div>
                )}

                {selected.laundryFinalCheckoutUrl && (
                  <div className="mt-4 rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Current final balance invoice / receipt link</p>
                    <p className="mt-2 break-all text-sm text-[#075c58]">{selected.laundryFinalCheckoutUrl}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={selected.laundryFinalCheckoutUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064b48]">Open final invoice</a>
                      <button type="button" onClick={() => copyLaundryLink(selected.laundryFinalCheckoutUrl || "")} className="rounded-full border border-[#075c58] bg-white px-4 py-2 text-xs font-black text-[#075c58] transition hover:bg-[#f4ecdc]">Copy link</button>
                      {selected.laundryFinalInvoicePdf && (
                        <a href={selected.laundryFinalInvoicePdf} target="_blank" rel="noreferrer" className="rounded-full border border-[#075c58] bg-white px-4 py-2 text-xs font-black text-[#075c58] transition hover:bg-[#f4ecdc]">Open PDF</a>
                      )}
                    </div>
                  </div>
                )}

                {laundryFinalMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{laundryFinalMessage}</p>}
                {laundryFinalError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{laundryFinalError}</p>}
              </div>
            )}


            {showPaymentActions && (
              <div className="mb-5 rounded-3xl border border-[#d8c18f] bg-[#fbf6ea] p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">{selectedIsCommercial ? "Optional later/add-on payment" : "Additional payment"}</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">{selectedIsCommercial ? "Send only if the customer approves extra commercial scope" : "Send an extra Stripe link for approved add-ons"}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {selectedIsCommercial
                        ? "Use this after the first payment only for approved add-ons, floor/carpet work, linen/restock handling, recurring-plan changes, or added scope. Do not use it as an open-ended hourly charge."
                        : "Use this after the first payment if the job needs approved extra hours, extra miles, route changes, or another added balance. This creates a separate Stripe Checkout link tied to the same request."}
                    </p>
                  </div>
                  <StatusBadge status={String(selected.additionalPaymentStatus || "Optional")} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Additional amount
                    <input
                      value={additionalPaymentAmount}
                      onChange={(e) => setAdditionalPaymentAmount(e.target.value)}
                      inputMode="decimal"
                      placeholder="35"
                      className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Reason
                    <select
                      value={additionalPaymentReason}
                      onChange={(e) => setAdditionalPaymentReason(e.target.value)}
                      className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                    >
                      {isCommercialRequest(selected) ? (
                        <>
                          <option>Commercial approved add-on / additional scope</option>
                          <option>Specialty floor or carpet add-on</option>
                          <option>Short-term rental linen / restock add-on</option>
                          <option>Recurring plan adjustment</option>
                          <option>Other approved commercial balance</option>
                        </>
                      ) : (
                        <>
                          <option>Additional hours</option>
                          <option>Extra miles / route time</option>
                          <option>Additional approved task / add-on</option>
                          <option>Other approved balance</option>
                        </>
                      )}
                    </select>
                  </label>
                </div>

                <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                  Optional customer note
                  <textarea
                    value={additionalPaymentNote}
                    onChange={(e) => setAdditionalPaymentNote(e.target.value)}
                    placeholder="Example: Additional 30 minutes approved by text for extra folding and toy reset. Original payment has already been credited."
                    rows={3}
                    className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]"
                  />
                </label>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    disabled={additionalPaymentBusy}
                    onClick={() => createAdditionalPayment(true)}
                    className={getAdminActionClass("primary")}
                  >
                    {additionalPaymentBusy ? <><ActionSpinner /> Creating...</> : "Create + email additional payment link"}
                  </button>
                  <button
                    type="button"
                    disabled={additionalPaymentBusy}
                    onClick={() => createAdditionalPayment(false)}
                    className={getAdminActionClass("secondary")}
                  >
                    Create additional link only
                  </button>
                </div>

                {selected.additionalPaymentCheckoutUrl && (
                  <div className="mt-4 rounded-2xl border border-[#eadfc8] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Current additional payment link</p>
                    <p className="mt-2 break-all text-sm text-[#075c58]">{selected.additionalPaymentCheckoutUrl}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={selected.additionalPaymentCheckoutUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064b48]">Open additional checkout</a>
                      <button type="button" onClick={() => copyAdditionalPaymentLink(selected.additionalPaymentCheckoutUrl || "")} className="rounded-full border border-[#075c58] bg-white px-4 py-2 text-xs font-black text-[#075c58] transition hover:bg-[#f4ecdc]">Copy link</button>
                    </div>
                  </div>
                )}

                {additionalPaymentMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{additionalPaymentMessage}</p>}
                {additionalPaymentError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{additionalPaymentError}</p>}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <AdminPhotoUploads photos={getPhotoUploads(selected)} />
              {Object.entries(selected).filter(([key]) => !isPhotoDataField(key)).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#b98a2f]">{key}</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{formatValue(key, value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
