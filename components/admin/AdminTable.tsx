"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import StatusBadge from "./StatusBadge";
import CommercialQuoteBreakdownBuilder from "./CommercialQuoteBreakdownBuilder";
import FamilyPaymentBreakdownBuilder from "./FamilyPaymentBreakdownBuilder";

type AdminDoc = { id: string; status?: string; createdAt?: unknown; checkoutUrl?: string; promoCode?: string; [key: string]: any };
type CustomerCredit = { id: string; status?: string; amount?: number; remainingAmount?: number; customerEmail?: string; customerEmailKey?: string; creditCode?: string; [key: string]: any };
type CheckoutMode = "standard" | "custom";
type ApplicationDocument = { id?: string; label?: string; originalName?: string; contentType?: string; size?: number; storagePath?: string; uploadedAtIso?: string };
type OnboardingChecklist = Record<string, boolean>;

const APPLICATION_CHECKLIST_ITEMS = [
  { key: "applicationReviewed", label: "Application reviewed" },
  { key: "phoneScreenComplete", label: "Phone screen complete" },
  { key: "referencesChecked", label: "References checked" },
  { key: "backgroundCheckStarted", label: "Background check started" },
  { key: "backgroundCheckCleared", label: "Background check cleared" },
  { key: "licenseInsuranceReviewed", label: "License/insurance reviewed" },
  { key: "trialJobComplete", label: "Trial job complete" },
  { key: "approved", label: "Approved" },
  { key: "backupOnly", label: "Backup-only" },
  { key: "notApproved", label: "Not approved" },
  { key: "archived", label: "Archived" },
];

const APPLICATION_STATUS_OPTIONS = [
  "New",
  "Reviewing",
  "Needs Documents",
  "Phone Screen",
  "References",
  "Background Check",
  "Approved",
  "Backup List",
  "Rejected",
  "Archived",
];

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
  const paymentMode = String(item?.paymentMode || "").toLowerCase();
  const rawService = String(item?.service || item?.selectedServiceTitle || item?.packageType || item?.requestType || "").toLowerCase();
  if (rawService.includes("commercial")) return "custom";
  if (paymentMode === "custom" || paymentMode === "custom_initial" || item?.customInitialPayment) return "custom";
  return "standard";
}

function getLaundryDefaultDepositCredit(item: AdminDoc | null, mode: CheckoutMode) {
  if (!item || item.service !== "laundry-rescue") return 0;
  if (toNumber(item.laundryDepositCredit) > 0) return toNumber(item.laundryDepositCredit);
  if (toNumber(item.laundryDepositCreditCents) > 0) return centsToDollars(item.laundryDepositCreditCents);
  // Credit only the pre-tax non-refundable deposit/minimum toward the final invoice.
  // Manual sales tax is added only when the admin sales-tax box is checked before sending the payment.
  if (toNumber(item.laundryDepositAmountSubtotal) > 0) return centsToDollars(item.laundryDepositAmountSubtotal);
  if (toNumber(item.depositPaidAmountSubtotal) > 0) return centsToDollars(item.depositPaidAmountSubtotal);
  if (toNumber(item.laundryDepositExpectedAmountCents) > 0) return centsToDollars(item.laundryDepositExpectedAmountCents);
  if (toNumber(item.laundryDepositAmountTotal) > 0) return centsToDollars(item.laundryDepositAmountTotal);
  if (toNumber(item.depositPaidAmountTotal) > 0) return centsToDollars(item.depositPaidAmountTotal);
  const paymentStatus = String(item.paymentStatus || item.laundryPaymentStatus || item.status || "");
  if (toNumber(item.amountSubtotal) > 0 && ["Deposit Paid", "Deposit Paid - Final Pending", "Paid"].includes(paymentStatus)) return centsToDollars(item.amountSubtotal);
  if (toNumber(item.amountTotal) > 0 && ["Deposit Paid", "Deposit Paid - Final Pending", "Paid"].includes(paymentStatus)) return centsToDollars(item.amountTotal);
  return 59;
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


function ManualSalesTaxControls({
  enabled,
  rate,
  onEnabledChange,
  onRateChange,
  context,
}: {
  enabled: boolean;
  rate: string;
  onEnabledChange: (enabled: boolean) => void;
  onRateChange: (rate: string) => void;
  context: string;
}) {
  return (
    <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
      <label className="flex gap-3 font-bold">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-amber-300 accent-[#075c58]"
        />
        <span>
          <span className="block font-black text-amber-950">Add manual Washington sales tax to this {context}</span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-amber-900">
            Stripe automatic tax stays off. Only check this when you intentionally want sales tax added and you have verified the customer/location rate.
          </span>
        </span>
      </label>
      {enabled && (
        <div className="mt-3 grid gap-2 sm:max-w-xs">
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-amber-900">
            Sales tax rate %
            <input
              value={rate}
              onChange={(e) => onRateChange(e.target.value)}
              inputMode="decimal"
              placeholder="Example: 10.2"
              className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold normal-case tracking-normal text-[#075c58] outline-none focus:border-[#075c58]"
            />
          </label>
          <p className="text-xs font-semibold leading-5 text-amber-900">
            The rate is manual. Do not use this as tax advice; verify the rate and whether the service is taxable before sending.
          </p>
        </div>
      )}
    </div>
  );
}

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

function getAdminPaymentText(item: AdminDoc | null | undefined) {
  return String(`${item?.paymentStatus || ""} ${item?.laundryPaymentStatus || ""} ${item?.familyInvoiceStatus || ""} ${item?.invoiceStatus || ""} ${item?.checkoutStatus || ""} ${item?.status || ""}`).toLowerCase();
}

function isClosedAdminStatus(item: AdminDoc | null | undefined) {
  const status = String(item?.status || "").trim().toLowerCase();
  return ["completed", "canceled", "cancelled", "declined", "not eligible", "archived"].includes(status);
}

function getAdminQueueKey(item: AdminDoc | null | undefined) {
  const status = String(item?.status || "").trim().toLowerCase();
  const paymentText = getAdminPaymentText(item);
  if (status === "completed") return "completed";
  if (["canceled", "cancelled", "declined", "not eligible", "archived"].includes(status)) return "closed";
  if (!status || ["new", "needs info", "follow-up needed", "pending review", "reviewing", "requested"].includes(status) || status.includes("review") || status.includes("follow")) return "needs-review";
  if (paymentText.includes("sent") || paymentText.includes("checkout") || paymentText.includes("invoice")) {
    if (!paymentText.includes("paid")) return "payment";
  }
  if (paymentText.includes("paid") || status.includes("scheduled") || status.includes("assigned")) return "paid-scheduled";
  if (status.includes("approved") || status.includes("quote")) return "needs-payment";
  return "active";
}

function isActiveQueueItem(item: AdminDoc | null | undefined) {
  return !isClosedAdminStatus(item);
}

const ADMIN_QUEUE_OPTIONS = [
  { key: "all", label: "All records", helper: "Everything", accent: "bg-[#075c58] text-white border-[#075c58]" },
  { key: "active", label: "Active queue", helper: "Open work", accent: "bg-white text-[#075c58] border-[#eadfc8]" },
  { key: "needs-review", label: "Needs review", helper: "New/follow-up", accent: "bg-amber-100 text-amber-900 border-amber-300" },
  { key: "needs-payment", label: "Needs payment", helper: "Approved/quote", accent: "bg-blue-100 text-blue-900 border-blue-300" },
  { key: "payment", label: "Payment sent", helper: "Waiting to pay", accent: "bg-violet-100 text-violet-900 border-violet-300" },
  { key: "paid-scheduled", label: "Paid / scheduled", helper: "Ready to serve", accent: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { key: "completed", label: "Completed", helper: "Done", accent: "bg-slate-100 text-slate-800 border-slate-300" },
  { key: "closed", label: "Closed", helper: "Canceled/declined", accent: "bg-rose-100 text-rose-900 border-rose-300" },
] as const;

function hasOutgoingReferralData(item: AdminDoc | null | undefined) {
  return Boolean(item?.outgoingReferralCode || item?.outgoingReferralLink || item?.outgoingReferralStatus || getOutgoingReferralHistory(item).length);
}

function hasIncomingReferralData(item: AdminDoc | null | undefined) {
  return Boolean(item?.incomingReferralCode || item?.incomingReferralLinkId || item?.incomingReferralStatus || item?.incomingReferralReferrerEmail);
}

function hasReferralData(item: AdminDoc | null | undefined) {
  return hasOutgoingReferralData(item) || hasIncomingReferralData(item) || Boolean(item?.outgoingReferralCreditId || item?.incomingReferralRewardCode);
}

function hasReferralCreditData(item: AdminDoc | null | undefined) {
  const combined = String(`${item?.outgoingReferralCreditStatus || ""} ${item?.incomingReferralStatus || ""} ${item?.incomingReferralRewardCode || ""} ${item?.outgoingReferralRewardCode || ""}`).toLowerCase();
  return combined.includes("credit") || combined.includes("reward") || Boolean(item?.outgoingReferralCreditId || item?.incomingReferralRewardCode);
}

function matchesReferralFilter(item: AdminDoc | null | undefined, referralFilter: string) {
  if (referralFilter === "all") return true;
  if (referralFilter === "any") return hasReferralData(item);
  if (referralFilter === "outgoing") return hasOutgoingReferralData(item);
  if (referralFilter === "incoming") return hasIncomingReferralData(item);
  if (referralFilter === "credit") return hasReferralCreditData(item);
  if (referralFilter === "available-credit") {
    const combined = String(`${item?.outgoingReferralCreditStatus || ""} ${item?.customerCreditStatus || ""} ${item?.availableCustomerCreditTotal || ""}`).toLowerCase();
    return combined.includes("available") || combined.includes("credit available");
  }
  return true;
}

function hasDiscountOrPromoData(item: AdminDoc | null | undefined) {
  const raw = JSON.stringify(item || {}).toLowerCase();
  return raw.includes("promo") || raw.includes("discount") || raw.includes("credit") || raw.includes("founding") || raw.includes("beta");
}

function matchesPromoFilter(item: AdminDoc | null | undefined, promoFilter: string) {
  if (promoFilter === "all") return true;
  const raw = JSON.stringify(item || {}).toLowerCase();
  const promo = String(item?.promoCode || "").toLowerCase();
  const mode = String(item?.paymentMode || "").toLowerCase();
  if (promoFilter === "any") return hasDiscountOrPromoData(item);
  if (promoFilter === "promo-code") return Boolean(promo);
  if (promoFilter === "founding-beta") return promo.includes("founding") || promo.includes("beta") || mode === "founding" || raw.includes("founding") || raw.includes("beta");
  if (promoFilter === "referral-credit") return raw.includes("referral") && raw.includes("credit");
  if (promoFilter === "customer-credit") return raw.includes("customercredit") || raw.includes("customer credit") || raw.includes("saved credit");
  if (promoFilter === "discount") return raw.includes("discount");
  return true;
}

function getPageNumberItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1) as Array<number | string>;
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }
  const sorted = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const result: Array<number | string> = [];
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (index > 0 && previous && page - previous > 1) result.push(`ellipsis-${previous}-${page}`);
    result.push(page);
  });
  return result;
}

function getOutgoingReferralHistory(item: AdminDoc | null | undefined) {
  const history = item?.outgoingReferralHistory;
  if (!Array.isArray(history)) return [] as Array<Record<string, any>>;
  return history.filter((entry) => entry && typeof entry === "object") as Array<Record<string, any>>;
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

function formatFileSize(bytes: unknown) {
  const next = Number(bytes);
  if (!Number.isFinite(next) || next <= 0) return "file size unavailable";
  if (next < 1024) return `${Math.round(next)} B`;
  if (next < 1024 * 1024) return `${Math.round(next / 1024)} KB`;
  return `${(next / (1024 * 1024)).toFixed(1)} MB`;
}

function getApplicationDocuments(item: AdminDoc | null | undefined): ApplicationDocument[] {
  const value = item?.applicationDocuments;
  if (!Array.isArray(value)) return [];
  return value.filter((document) => document && typeof document === "object" && typeof document.storagePath === "string");
}

function isApplicationDocumentField(key: string) {
  const normalized = key.trim().toLowerCase();
  return [
    "applicationdocuments",
    "applicationdocumentcount",
    "applicationdocumentsummary",
    "applicationdocumentsuploadedat",
  ].includes(normalized);
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

function AdminApplicationDocuments({
  documents,
  collectionName,
  recordId,
  onOpenDocument,
  busyDocumentPath,
}: {
  documents: ApplicationDocument[];
  collectionName: string;
  recordId: string;
  onOpenDocument: (document: ApplicationDocument) => void;
  busyDocumentPath: string;
}) {
  if (!documents.length) return null;

  return (
    <div className="rounded-2xl border border-[#eadfc8] bg-white p-4 sm:col-span-2">
      <p className="text-xs font-bold uppercase tracking-widest text-[#b98a2f]">Uploaded application documents</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Documents are stored privately. Opening a file creates a short-lived admin-only link.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {documents.map((document, index) => (
          <div key={document.storagePath || document.id || index} className="rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b98a2f]">{document.label || "Other"}</p>
            <p className="mt-1 break-words text-sm font-black text-[#075c58]">{document.originalName || `Document ${index + 1}`}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{formatFileSize(document.size)} · {document.contentType || "file"}</p>
            <button
              type="button"
              onClick={() => onOpenDocument(document)}
              disabled={!document.storagePath || busyDocumentPath === document.storagePath}
              className="mt-3 rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064b48] disabled:opacity-60"
            >
              {busyDocumentPath === document.storagePath ? "Opening..." : "Open document"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


const DETAIL_FIELD_LABELS: Record<string, string> = {
  fullName: "Name",
  businessName: "Business",
  ownerName: "Contact",
  service: "Service",
  phone: "Phone",
  email: "Email",
  address: "Address",
  city: "City",
  state: "State",
  zip: "ZIP",
  zipCode: "ZIP",
  preferredDate: "Preferred date",
  preferredTime: "Preferred time",
  roomsOrAreas: "Rooms / areas",
  requestDetails: "Request details",
  notes: "Notes",
  specialInstructions: "Special instructions",
  promoCode: "Promo",
  incomingReferralCode: "Referral",
  howFoundUs: "Found us",
  howFoundUsDetails: "Source details",
  availability: "Availability",
  services: "Services",
  serviceType: "Services",
  serviceArea: "Service area",
  transportation: "Transportation",
  travelRadius: "Travel radius",
  experienceLevel: "Experience",
  comfortLevel: "Comfort level",
  notWillingToDo: "Limits",
  insuranceStatus: "Insurance",
  licenseStatus: "License",
  businessStructure: "Business structure",
  applicationDocumentCount: "Docs",
};

const DETAIL_FIELD_ORDER: Record<string, string[]> = {
  serviceRequests: [
    "fullName", "service", "phone", "email", "howFoundUs", "howFoundUsDetails", "address", "city", "state", "zip", "zipCode", "preferredDate", "preferredTime", "roomsOrAreas", "requestDetails", "notes", "specialInstructions", "promoCode", "incomingReferralCode",
  ],
  helperApplications: [
    "fullName", "phone", "email", "city", "howFoundUs", "howFoundUsDetails", "state", "zip", "availability", "services", "transportation", "travelRadius", "experienceLevel", "comfortLevel", "notWillingToDo", "applicationDocumentCount",
  ],
  partnerApplications: [
    "businessName", "ownerName", "phone", "email", "howFoundUs", "howFoundUsDetails", "city", "state", "zip", "serviceType", "serviceArea", "businessStructure", "licenseStatus", "insuranceStatus", "availability", "applicationDocumentCount",
  ],
  contactMessages: ["fullName", "name", "phone", "email", "howFoundUs", "howFoundUsDetails", "subject", "message", "preferredContactMethod"],
};

const ADVANCED_FIELD_HIDE_KEYS = new Set([
  "id",
  "applicationDocuments",
  "applicationDocumentSummary",
  "photoUploads",
  "uploadedPhotos",
  "photoDataUrls",
  "imageDataUrls",
  "commercialQuoteBreakdown",
  "familyPaymentBreakdown",
  "onboardingChecklist",
]);

function getRecordDisplayName(item: AdminDoc | null | undefined) {
  return String(item?.fullName || item?.businessName || item?.ownerName || item?.name || item?.email || "Submission");
}

function getRecordContactLine(item: AdminDoc | null | undefined) {
  const parts = [item?.phone, item?.email, item?.city].map((value) => String(value || "").trim()).filter(Boolean);
  return parts.length ? parts.join(" · ") : "No contact details saved";
}

function getRecordDetailFields(collectionName: string, item: AdminDoc | null | undefined) {
  if (!item) return [] as Array<{ key: string; label: string; value: unknown }>;
  const order = DETAIL_FIELD_ORDER[collectionName] || Object.keys(item).slice(0, 12);
  return order
    .filter((key) => item[key] !== undefined && item[key] !== null && item[key] !== "")
    .map((key) => ({ key, label: DETAIL_FIELD_LABELS[key] || key, value: item[key] }));
}

function AdminDetailSnapshot({ collectionName, item }: { collectionName: string; item: AdminDoc }) {
  const fields = getRecordDetailFields(collectionName, item);
  const visibleFields = fields.slice(0, collectionName === "serviceRequests" ? 12 : 10);
  if (!visibleFields.length) return null;

  return (
    <div className="mb-5 rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98a2f]">Snapshot</p>
          <h4 className="mt-1 truncate text-xl font-black text-[#075c58]">{getRecordDisplayName(item)}</h4>
          <p className="mt-1 text-sm font-semibold text-slate-600">{getRecordContactLine(item)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visibleFields.map(({ key, label, value }) => (
          <div key={key} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm font-bold text-slate-800">{formatValue(key, value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAdvancedRecordDetails({ item }: { item: AdminDoc }) {
  const entries = Object.entries(item).filter(([key]) => !ADVANCED_FIELD_HIDE_KEYS.has(key) && !isPhotoDataField(key) && !isApplicationDocumentField(key));
  if (!entries.length) return null;

  return (
    <details className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-black text-[#075c58]">Advanced / full saved answers</summary>
      <p className="mt-2 text-xs leading-5 text-slate-500">Open this only when you need the complete submitted record for troubleshooting or uncommon fields.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b98a2f]">{DETAIL_FIELD_LABELS[key] || key}</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{formatValue(key, value)}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

function ApplicationQuickRead({ item, documentCount }: { item: AdminDoc; documentCount: number }) {
  const serviceValue = item.services || item.serviceType || item.preferredWorkTypes;
  const availabilityValue = item.availability || item.availabilityStyle;
  const limitsValue = item.notWillingToDo || item.limits;
  const statusCount = Object.values((item.onboardingChecklist || {}) as OnboardingChecklist).filter(Boolean).length;

  return (
    <div className="mb-5 grid gap-3 md:grid-cols-4">
      <div className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm md:col-span-2">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98a2f]">Best quick read</p>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{formatValue("services", serviceValue) || "Review services in full answers."}</p>
        {availabilityValue && <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Availability: {formatValue("availability", availabilityValue)}</p>}
        {limitsValue && <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Limits: {formatValue("notWillingToDo", limitsValue)}</p>}
      </div>
      <div className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98a2f]">Docs</p>
        <p className="mt-2 text-2xl font-black text-[#075c58]">{documentCount}</p>
        <p className="text-xs font-semibold text-slate-500">uploaded file{documentCount === 1 ? "" : "s"}</p>
      </div>
      <div className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98a2f]">Onboarding</p>
        <p className="mt-2 text-2xl font-black text-[#075c58]">{statusCount}/{APPLICATION_CHECKLIST_ITEMS.length}</p>
        <p className="text-xs font-semibold text-slate-500">checklist items complete</p>
      </div>
    </div>
  );
}



type AdminExportEntry = { key: string; label: string; value: string };
type AdminExportSection = { title: string; entries: AdminExportEntry[] };

const EXPORT_HIDE_EXACT_KEYS = new Set([
  "id",
  "source",
  "photoUploads",
  "uploadedPhotos",
  "photoDataUrls",
  "imageDataUrls",
  "applicationDocuments",
  "applicationDocumentSummary",
  "commercialQuoteBreakdown",
  "familyPaymentBreakdown",
  "onboardingChecklist",
]);

const EXPORT_HIDE_KEYWORDS = [
  "adminemail",
  "appliedcustomercreditid",
  "checkout",
  "confirmation",
  "createdby",
  "customeremailkey",
  "deliverymethod",
  "firebase",
  "firestore",
  "included",
  "internal",
  "metadata",
  "referral",
  "sessionid",
  "storagepath",
  "stripe",
  "taxmode",
  "updatedby",
  "webhook",
];

const EXPORT_HIDE_SUFFIXES = ["cents", "id", "ids", "key", "keys", "path", "token", "url", "urls"];

const SERVICE_REQUEST_CLEAN_KEYS = [
  "fullName",
  "name",
  "service",
  "selectedServiceTitle",
  "packageType",
  "phone",
  "email",
  "serviceAddress",
  "address",
  "serviceAddressLine1",
  "serviceAddressLine2",
  "address2",
  "city",
  "serviceCity",
  "state",
  "serviceState",
  "zip",
  "serviceZip",
  "zipCode",
  "preferredDate",
  "preferredTime",
  "urgency",
  "roomsOrAreas",
  "requestDetails",
  "notes",
  "specialInstructions",
  "howFoundUs",
  "howFoundUsDetails",
  "reusableBagAck",
  "laundryBagEstimate",
  "laundryPickupSpot",
  "laundryTypes",
  "detergent",
  "dryPreference",
  "laundryAddOns",
];

const HELPER_APPLICATION_CLEAN_KEYS = [
  "fullName",
  "name",
  "phone",
  "email",
  "city",
  "state",
  "zip",
  "howFoundUs",
  "howFoundUsDetails",
  "availability",
  "availabilityStyle",
  "services",
  "preferredWorkTypes",
  "transportation",
  "travelRadius",
  "experienceLevel",
  "comfortLevel",
  "notWillingToDo",
  "workStyleFit",
  "references",
  "notes",
];

const PARTNER_APPLICATION_CLEAN_KEYS = [
  "businessName",
  "ownerName",
  "phone",
  "email",
  "city",
  "state",
  "zip",
  "howFoundUs",
  "howFoundUsDetails",
  "serviceType",
  "services",
  "serviceArea",
  "businessStructure",
  "licenseStatus",
  "insuranceStatus",
  "availability",
  "capacity",
  "proofDocuments",
  "notes",
];

const CONTACT_MESSAGE_CLEAN_KEYS = [
  "fullName",
  "name",
  "phone",
  "email",
  "howFoundUs",
  "howFoundUsDetails",
  "subject",
  "message",
  "preferredContactMethod",
];

function getCollectionDisplayLabel(collectionName: string) {
  const labels: Record<string, string> = {
    serviceRequests: "Service request",
    helperApplications: "Helper application",
    partnerApplications: "Partner / contractor application",
    contactMessages: "Contact message",
  };
  return labels[collectionName] || "Admin record";
}



function safeFilePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "record";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function humanizeKey(key: string) {
  const known = DETAIL_FIELD_LABELS[key];
  if (known) return known;
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bZip\b/g, "ZIP")
    .replace(/\bId\b/g, "ID");
}

function normalizedExportKey(key: string) {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitiveOrNoisyExportKey(key: string) {
  const normalized = normalizedExportKey(key);
  if (EXPORT_HIDE_EXACT_KEYS.has(key) || EXPORT_HIDE_EXACT_KEYS.has(normalized)) return true;
  if (EXPORT_HIDE_KEYWORDS.some((keyword) => normalized.includes(keyword))) return true;
  if (EXPORT_HIDE_SUFFIXES.some((suffix) => normalized.endsWith(suffix))) return true;
  if (normalized.includes("amountcents") || normalized.includes("subtotalcents") || normalized.includes("totalcents")) return true;
  if (normalized.includes("breakdown") || normalized.includes("json")) return true;
  return false;
}

function isProbablyMoneyKey(key: string) {
  const normalized = normalizedExportKey(key);
  return ["amount", "balance", "credit", "deposit", "rate", "refund", "subtotal", "total"].some((part) => normalized.includes(part));
}

function formatExportMoneyValue(key: string, value: unknown) {
  const numeric = toNumber(value);
  if (!Number.isFinite(numeric)) return "";
  if (normalizedExportKey(key).includes("rateperlb")) return `${formatMoney(numeric)} per lb`;
  return formatMoney(numeric);
}

function exportValueToText(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (isPhotoDataField(key)) return Array.isArray(value) ? `${value.length} uploaded photo${value.length === 1 ? "" : "s"}` : "Uploaded photos";
  if (isApplicationDocumentField(key)) return Array.isArray(value) ? `${value.length} uploaded document${value.length === 1 ? "" : "s"}` : formatValue(key, value);
  if (Array.isArray(value)) {
    const simple = value.every((entry) => ["string", "number", "boolean"].includes(typeof entry));
    return simple ? value.map((entry) => exportValueToText(key, entry)).filter((entry) => entry !== "—").join(", ") || "—" : `${value.length} saved item${value.length === 1 ? "" : "s"}`;
  }
  if (typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") return formatDate(value);
    return "Saved in admin dashboard";
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (isProbablyMoneyKey(key) && (typeof value === "number" || /^\s*\$?\d+(\.\d{1,2})?\s*$/.test(String(value)))) {
    return formatExportMoneyValue(key, value);
  }
  return formatValue(key, value);
}

function makeExportEntry(key: string, value: unknown, label?: string): AdminExportEntry | null {
  if (value === null || value === undefined || value === "") return null;
  if (isSensitiveOrNoisyExportKey(key)) return null;
  const text = exportValueToText(key, value);
  if (!text || text === "—" || text === "Saved in admin dashboard") return null;
  return { key, label: label || humanizeKey(key), value: text };
}

function getFirstPresentValue(item: AdminDoc, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function getCleanAddress(item: AdminDoc) {
  const full = getFirstPresentValue(item, ["serviceAddress", "address"]);
  if (full) return String(full);
  const line1 = String(getFirstPresentValue(item, ["serviceAddressLine1", "addressLine1"]) || "").trim();
  const line2 = String(getFirstPresentValue(item, ["serviceAddressLine2", "address2", "unit", "apt"]) || "").trim();
  const city = String(getFirstPresentValue(item, ["serviceCity", "city"]) || "").trim();
  const state = String(getFirstPresentValue(item, ["serviceState", "state"]) || "").trim();
  const zip = String(getFirstPresentValue(item, ["serviceZip", "zip", "zipCode"]) || "").trim();
  const street = [line1, line2].filter(Boolean).join(", ");
  const locality = [city, state, zip].filter(Boolean).join(", ");
  return [street, locality].filter(Boolean).join("\n");
}

function getCleanPrimarySection(collectionName: string, item: AdminDoc): AdminExportSection {
  const title = collectionName === "contactMessages" ? "Message summary" : "Submission summary";
  const created = makeExportEntry("createdAt", item.createdAt, "Submitted");
  const status = makeExportEntry("status", item.status, "Status");
  const entries = [created, status].filter((entry): entry is AdminExportEntry => Boolean(entry));
  return { title, entries };
}

function getCleanContactSection(collectionName: string, item: AdminDoc): AdminExportSection {
  const entries: Array<AdminExportEntry | null> = [];
  if (collectionName === "partnerApplications") {
    entries.push(makeExportEntry("businessName", item.businessName, "Business"));
    entries.push(makeExportEntry("ownerName", item.ownerName, "Contact person"));
  } else {
    entries.push(makeExportEntry("fullName", item.fullName || item.name, "Name"));
  }
  entries.push(makeExportEntry("phone", item.phone, "Phone"));
  entries.push(makeExportEntry("email", item.email, "Email"));
  const address = getCleanAddress(item);
  if (address) entries.push({ key: "cleanAddress", label: "Address", value: address });
  entries.push(makeExportEntry("howFoundUs", item.howFoundUs, "How they found us"));
  entries.push(makeExportEntry("howFoundUsDetails", item.howFoundUsDetails, "Source details"));
  return { title: "Contact", entries: entries.filter((entry): entry is AdminExportEntry => Boolean(entry)) };
}

function getCleanRequestedServiceSection(collectionName: string, item: AdminDoc): AdminExportSection {
  const entries: Array<AdminExportEntry | null> = [];
  if (collectionName === "contactMessages") {
    entries.push(makeExportEntry("subject", item.subject, "Subject"));
    entries.push(makeExportEntry("message", item.message, "Message"));
    entries.push(makeExportEntry("preferredContactMethod", item.preferredContactMethod, "Preferred contact"));
    return { title: "Message", entries: entries.filter((entry): entry is AdminExportEntry => Boolean(entry)) };
  }

  if (collectionName === "helperApplications") {
    ["services", "preferredWorkTypes", "availability", "availabilityStyle", "transportation", "travelRadius", "experienceLevel", "comfortLevel", "notWillingToDo", "workStyleFit", "references", "notes"].forEach((key) => entries.push(makeExportEntry(key, item[key])));
    return { title: "Helper fit", entries: entries.filter((entry): entry is AdminExportEntry => Boolean(entry)) };
  }

  if (collectionName === "partnerApplications") {
    ["serviceType", "services", "serviceArea", "businessStructure", "licenseStatus", "insuranceStatus", "availability", "capacity", "proofDocuments", "notes"].forEach((key) => entries.push(makeExportEntry(key, item[key])));
    return { title: "Business fit", entries: entries.filter((entry): entry is AdminExportEntry => Boolean(entry)) };
  }

  entries.push(makeExportEntry("service", item.selectedServiceTitle || item.packageType || item.service, "Service"));
  entries.push(makeExportEntry("preferredDate", item.preferredDate, "Preferred date"));
  entries.push(makeExportEntry("preferredTime", item.preferredTime, "Preferred time"));
  entries.push(makeExportEntry("urgency", item.urgency, "Urgency"));
  entries.push(makeExportEntry("roomsOrAreas", item.roomsOrAreas, "Rooms / areas"));
  entries.push(makeExportEntry("requestDetails", item.requestDetails, "Request details"));
  entries.push(makeExportEntry("notes", item.notes, "Notes"));
  entries.push(makeExportEntry("specialInstructions", item.specialInstructions, "Special instructions"));
  return { title: "Service details", entries: entries.filter((entry): entry is AdminExportEntry => Boolean(entry)) };
}

function getCleanLaundrySection(item: AdminDoc): AdminExportSection {
  const entries = [
    makeExportEntry("laundryBagEstimate", item.laundryBagEstimate, "Estimated bags / hampers"),
    makeExportEntry("laundryPickupSpot", item.laundryPickupSpot, "Pickup spot"),
    makeExportEntry("laundryTypes", item.laundryTypes, "Laundry types"),
    makeExportEntry("detergent", item.detergent, "Detergent"),
    makeExportEntry("dryPreference", item.dryPreference, "Dry preference"),
    makeExportEntry("laundryAddOns", item.laundryAddOns, "Add-ons"),
    makeExportEntry("reusableBagAck", item.reusableBagAck, "Reusable bag agreement"),
    makeExportEntry("laundryDryWeightLbs", item.laundryDryWeightLbs, "Dry weight"),
    makeExportEntry("laundryRatePerLb", item.laundryRatePerLb, "Rate"),
  ].filter((entry): entry is AdminExportEntry => Boolean(entry));
  return { title: "Laundry details", entries };
}

function getPaymentBreakdown(item: AdminDoc) {
  const raw = item.familyPaymentBreakdown;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, any>;
  return {} as Record<string, any>;
}

function getPaymentLineItemsText(item: AdminDoc) {
  const breakdown = getPaymentBreakdown(item);
  const lineItems = Array.isArray(breakdown.lineItems) ? breakdown.lineItems : [];
  if (!lineItems.length) return "";
  return lineItems
    .map((line, index) => {
      const label = String(line?.label || line?.description || `Item ${index + 1}`).trim();
      const quantity = String(line?.quantity || "1").trim();
      const amount = toNumber(line?.amount);
      const note = String(line?.note || "").trim();
      return [`${label} — ${formatMoney(amount)}${quantity && quantity !== "1" ? ` x ${quantity}` : ""}`, note].filter(Boolean).join("\n  ");
    })
    .join("\n");
}

function getCleanPaymentSection(item: AdminDoc): AdminExportSection {
  const breakdown = getPaymentBreakdown(item);
  const refund = item.familyRefundTracking && typeof item.familyRefundTracking === "object" ? item.familyRefundTracking as Record<string, any> : {};
  const entries: Array<AdminExportEntry | null> = [
    makeExportEntry("paymentStatus", item.laundryPaymentStatus || item.paymentStatus || item.familyPaymentStatus, "Payment status"),
    makeExportEntry("familyPaymentPlan", item.familyPaymentPlan || breakdown.paymentPlan, "Payment plan"),
    makeExportEntry("amountDueNow", breakdown.amountDueNow ?? item.familyInitialAmount, "Amount requested"),
    makeExportEntry("laundrySubtotal", item.laundrySubtotal ?? item.laundryBaseAmount ?? breakdown.subtotal, "Laundry subtotal"),
    makeExportEntry("laundryDepositCredit", item.laundryDepositCredit, "Deposit credit"),
    makeExportEntry("laundryBalanceDue", item.laundryBalanceDue, "Final balance due"),
    makeExportEntry("laundryFinalPaymentOptions", item.laundryFinalPaymentOptions, "Final payment option"),
    makeExportEntry("refundStatus", refund.refundStatus, "Refund status"),
    toNumber(refund.refundAmount) > 0 ? makeExportEntry("refundAmount", refund.refundAmount, "Refund amount") : null,
  ];
  const lineItemsText = getPaymentLineItemsText(item);
  if (lineItemsText) entries.push({ key: "paymentItems", label: "Payment items", value: lineItemsText });
  const note = item.familyCustomerPaymentNote || breakdown.customerNote;
  if (note) entries.push(makeExportEntry("paymentNote", note, "Payment note"));
  return { title: "Payment summary", entries: entries.filter((entry): entry is AdminExportEntry => Boolean(entry)) };
}

function getCleanAdminNotesSection(item: AdminDoc): AdminExportSection {
  const entries = [
    makeExportEntry("applicationStatus", item.applicationStatus, "Application status"),
    makeExportEntry("bestFitServices", item.bestFitServices, "Best-fit services"),
    makeExportEntry("reliabilityRating", item.reliabilityRating, "Reliability / fit"),
    makeExportEntry("strengths", item.strengths, "Strengths"),
    makeExportEntry("concerns", item.concerns, "Concerns"),
    makeExportEntry("adminNotes", item.adminNotes, "Admin notes"),
    makeExportEntry("approvedBio", item.approvedBio, "Approved bio draft"),
  ].filter((entry): entry is AdminExportEntry => Boolean(entry));
  return { title: "Admin notes", entries };
}

function getAdditionalCleanEntries(collectionName: string, item: AdminDoc, usedKeys: Set<string>): AdminExportEntry[] {
  const cleanKeyList = collectionName === "helperApplications"
    ? HELPER_APPLICATION_CLEAN_KEYS
    : collectionName === "partnerApplications"
      ? PARTNER_APPLICATION_CLEAN_KEYS
      : collectionName === "contactMessages"
        ? CONTACT_MESSAGE_CLEAN_KEYS
        : SERVICE_REQUEST_CLEAN_KEYS;
  const allowed = new Set(cleanKeyList);
  return Object.entries(item)
    .filter(([key]) => !usedKeys.has(key) && allowed.has(key))
    .map(([key, value]) => makeExportEntry(key, value))
    .filter((entry): entry is AdminExportEntry => Boolean(entry));
}

function getAdminRecordExportSections(collectionName: string, item: AdminDoc): AdminExportSection[] {
  const sections = [
    getCleanPrimarySection(collectionName, item),
    getCleanContactSection(collectionName, item),
    getCleanRequestedServiceSection(collectionName, item),
  ];

  if (collectionName === "serviceRequests" && getServiceKey(item) === "laundry-rescue") sections.push(getCleanLaundrySection(item));
  if (collectionName === "serviceRequests") sections.push(getCleanPaymentSection(item));
  if (collectionName === "helperApplications" || collectionName === "partnerApplications") sections.push(getCleanAdminNotesSection(item));

  const usedKeys = new Set(sections.flatMap((section) => section.entries.map((entry) => entry.key)));
  const additionalEntries = getAdditionalCleanEntries(collectionName, item, usedKeys);
  if (additionalEntries.length) sections.push({ title: "Additional submitted details", entries: additionalEntries });

  const photos = getPhotoUploads(item);
  const photoEntries = photos.map((photo, index) => ({
    key: `photo-${index + 1}`,
    label: `Photo ${index + 1}`,
    value: [photo.name || "Uploaded photo", photo.type || "image", formatPhotoSize(photo.size)].filter(Boolean).join(" · "),
  }));

  const documents = getApplicationDocuments(item);
  const documentEntries = documents.map((document, index) => ({
    key: document.storagePath || document.id || `document-${index + 1}`,
    label: document.label || `Document ${index + 1}`,
    value: [document.originalName || `Document ${index + 1}`, document.contentType || "file", formatFileSize(document.size)].filter(Boolean).join(" · "),
  }));

  sections.push({ title: "Uploaded photos", entries: photoEntries });
  sections.push({ title: "Uploaded application documents", entries: documentEntries });

  return sections.filter((section) => section.entries.length);
}

function getAdminRecordExportFilename(collectionName: string, item: AdminDoc, extension: string) {
  const label = safeFilePart(getCollectionDisplayLabel(collectionName));
  const name = safeFilePart(getRecordDisplayName(item));
  const createdDate = getDateObject(item.createdAt)?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10);
  return `nesthelper-${label}-${name}-${createdDate}.${extension}`;
}

function getAdminRecordPlainText(collectionName: string, item: AdminDoc) {
  const title = `${getCollectionDisplayLabel(collectionName)} — ${getRecordDisplayName(item)}`;
  const lines = [title, `Exported: ${new Date().toLocaleString()}`, ""];
  getAdminRecordExportSections(collectionName, item).forEach((section) => {
    lines.push(section.title.toUpperCase());
    section.entries.forEach((entry) => {
      lines.push(`${entry.label}: ${entry.value}`);
    });
    lines.push("");
  });
  return lines.join("\n");
}

function getAdminRecordPrintableHtml(collectionName: string, item: AdminDoc) {
  const title = `${getCollectionDisplayLabel(collectionName)} — ${getRecordDisplayName(item)}`;
  const sections = getAdminRecordExportSections(collectionName, item);
  const sectionsHtml = sections.map((section) => `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      <dl>
        ${section.entries.map((entry) => `
          <div class="row">
            <dt>${escapeHtml(entry.label)}</dt>
            <dd>${escapeHtml(entry.value).replace(/\n/g, "<br />")}</dd>
          </div>
        `).join("")}
      </dl>
    </section>
  `).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #1f2937; font-family: Arial, sans-serif; line-height: 1.45; }
    .header { border-bottom: 3px solid #075c58; margin-bottom: 22px; padding-bottom: 16px; }
    .eyebrow { color: #b98a2f; font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    h1 { color: #075c58; font-size: 28px; margin: 6px 0; }
    .meta { color: #64748b; font-size: 13px; font-weight: 700; }
    section { break-inside: avoid; margin-top: 22px; }
    h2 { color: #075c58; font-size: 16px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .08em; }
    dl { border: 1px solid #eadfc8; border-radius: 14px; overflow: hidden; margin: 0; }
    .row { display: grid; grid-template-columns: 190px 1fr; border-top: 1px solid #eadfc8; }
    .row:first-child { border-top: 0; }
    dt { background: #fbf6ea; color: #475569; font-size: 12px; font-weight: 800; padding: 10px 12px; text-transform: uppercase; letter-spacing: .06em; }
    dd { margin: 0; padding: 10px 12px; white-space: pre-wrap; word-break: break-word; }
    .note { margin-top: 24px; color: #64748b; font-size: 12px; }
    @media print { body { padding: 18px; } .no-print { display: none; } }
    @media (max-width: 720px) { body { padding: 18px; } .row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="eyebrow">NestHelper clean admin export</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">Submitted: ${escapeHtml(formatDate(item.createdAt))} · Status: ${escapeHtml(formatValue("status", item.status))} · Exported: ${escapeHtml(new Date().toLocaleString())}</div>
  </div>
  ${sectionsHtml}
  <p class="note">Clean admin export. Internal IDs, Stripe/payment links, tax codes, backend tracking fields, and raw JSON are intentionally hidden. Uploaded photos/documents are listed by metadata; open private files from the admin dashboard when needed.</p>
</body>
</html>`;
}

function downloadTextFile(filename: string, contents: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function printAdminRecord(collectionName: string, item: AdminDoc) {
  const printWindow = window.open("", "_blank", "width=900,height=900");
  if (!printWindow) {
    window.alert("Your browser blocked the print window. Allow pop-ups for this admin page, then try again.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(getAdminRecordPrintableHtml(collectionName, item));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
}

function getAdminRecordsPrintableHtml(collectionName: string, title: string, records: AdminDoc[]) {
  const sectionsHtml = records.map((record, recordIndex) => {
    const recordTitle = `${getCollectionDisplayLabel(collectionName)} — ${getRecordDisplayName(record)}`;
    const recordSections = getAdminRecordExportSections(collectionName, record).map((section) => `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <dl>
          ${section.entries.map((entry) => `
            <div class="row">
              <dt>${escapeHtml(entry.label)}</dt>
              <dd>${escapeHtml(entry.value).replace(/\n/g, "<br />")}</dd>
            </div>
          `).join("")}
        </dl>
      </section>
    `).join("");

    return `
      <article class="record">
        <div class="record-header">
          <div class="eyebrow">NestHelper clean admin export</div>
          <h1>${escapeHtml(recordTitle)}</h1>
          <div class="meta">Submitted: ${escapeHtml(formatDate(record.createdAt))} · Status: ${escapeHtml(formatValue("status", record.status))} · Exported: ${escapeHtml(new Date().toLocaleString())}</div>
        </div>
        ${recordSections}
      </article>
      ${recordIndex < records.length - 1 ? '<div class="page-break"></div>' : ''}
    `;
  }).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #1f2937; font-family: Arial, sans-serif; line-height: 1.45; }
    .record { margin-bottom: 36px; }
    .record-header { border-bottom: 3px solid #075c58; margin-bottom: 22px; padding-bottom: 16px; }
    .eyebrow { color: #b98a2f; font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    h1 { color: #075c58; font-size: 26px; margin: 6px 0; }
    .meta { color: #64748b; font-size: 13px; font-weight: 700; }
    section { break-inside: avoid; margin-top: 22px; }
    h2 { color: #075c58; font-size: 16px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .08em; }
    dl { border: 1px solid #eadfc8; border-radius: 14px; overflow: hidden; margin: 0; }
    .row { display: grid; grid-template-columns: 190px 1fr; border-top: 1px solid #eadfc8; }
    .row:first-child { border-top: 0; }
    dt { background: #fbf6ea; color: #475569; font-size: 12px; font-weight: 800; padding: 10px 12px; text-transform: uppercase; letter-spacing: .06em; }
    dd { margin: 0; padding: 10px 12px; white-space: pre-wrap; word-break: break-word; }
    .page-break { break-after: page; page-break-after: always; }
    .note { margin-top: 24px; color: #64748b; font-size: 12px; }
    @media print { body { padding: 18px; } }
    @media (max-width: 720px) { body { padding: 18px; } .row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  ${sectionsHtml || `<p>No records selected.</p>`}
  <p class="note">Clean admin export. Internal IDs, Stripe/payment links, tax codes, backend tracking fields, and raw JSON are intentionally hidden. Uploaded photos/documents are listed by metadata; open private files from the admin dashboard when needed.</p>
</body>
</html>`;
}

function printAdminRecords(collectionName: string, title: string, records: AdminDoc[]) {
  if (!records.length) return;
  const printWindow = window.open("", "_blank", "width=900,height=900");
  if (!printWindow) {
    window.alert("Your browser blocked the print window. Allow pop-ups for this admin page, then try again.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(getAdminRecordsPrintableHtml(collectionName, title, records));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
}

function downloadAdminRecord(collectionName: string, item: AdminDoc) {
  downloadTextFile(
    getAdminRecordExportFilename(collectionName, item, "txt"),
    getAdminRecordPlainText(collectionName, item)
  );
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function getFilteredCsvFilename(title: string) {
  return `nesthelper-${safeFilePart(title)}-${new Date().toISOString().slice(0, 10)}.csv`;
}

function getFlattenedCleanExportEntries(collectionName: string, record: AdminDoc) {
  return getAdminRecordExportSections(collectionName, record).flatMap((section) =>
    section.entries.map((entry) => ({
      key: `${section.title} — ${entry.label}`,
      value: entry.value,
    }))
  );
}

function getAdminCsvExport(collectionName: string, records: AdminDoc[]) {
  const flattenedRecords = records.map((record) => getFlattenedCleanExportEntries(collectionName, record));
  const keys = Array.from(new Set(flattenedRecords.flatMap((entries) => entries.map((entry) => entry.key))));
  const header = keys.map((key) => csvEscape(key)).join(",");
  const rows = flattenedRecords.map((entries) => {
    const lookup = new Map(entries.map((entry) => [entry.key, entry.value]));
    return keys.map((key) => csvEscape(lookup.get(key) || "")).join(",");
  });
  return [header, ...rows].join("\n");
}


function csvFromRows(headers: string[], rows: string[][]) {
  return [headers.map((header) => csvEscape(header)).join(","), ...rows.map((row) => headers.map((_, index) => csvEscape(row[index] || "")).join(","))].join("\n");
}

function getBookkeepingExportFilename(title: string, reportName: string) {
  return `nesthelper-${safeFilePart(title)}-${safeFilePart(reportName)}-${new Date().toISOString().slice(0, 10)}.csv`;
}

function getCleanServiceLabel(item: AdminDoc) {
  return String(item.selectedServiceTitle || item.packageType || item.service || getServiceLook(item).label || "Service");
}

function getCleanCity(item: AdminDoc) {
  return String(getFirstPresentValue(item, ["serviceCity", "city"]) || "").trim();
}

function getCleanState(item: AdminDoc) {
  return String(getFirstPresentValue(item, ["serviceState", "state"]) || "").trim();
}

function getCleanZip(item: AdminDoc) {
  return String(getFirstPresentValue(item, ["serviceZip", "zip", "zipCode"]) || "").trim();
}

function getBookkeepingValue(item: AdminDoc, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function getDollarsFromAny(value: unknown) {
  const next = toNumber(value);
  return Number.isFinite(next) ? next : 0;
}

function getDollarsFromCents(value: unknown) {
  const next = toNumber(value);
  return next > 0 ? next / 100 : 0;
}

function getBookkeepingDollarAmount(item: AdminDoc, dollarKeys: string[], centKeys: string[] = []) {
  const direct = getBookkeepingValue(item, dollarKeys);
  const directAmount = getDollarsFromAny(direct);
  if (directAmount) return directAmount;
  const cents = getBookkeepingValue(item, centKeys);
  return getDollarsFromCents(cents);
}

function getBookkeepingBreakdownAmount(item: AdminDoc, key: string) {
  const breakdown = getPaymentBreakdown(item);
  return getDollarsFromAny(breakdown[key]);
}

function getGrossCustomerCharge(item: AdminDoc) {
  return getBookkeepingDollarAmount(
    item,
    ["amountTotal", "totalPaid", "totalAmount", "familyInitialAmount", "customInitialAmount", "commercialInitialAmount", "amountDueNow"],
    ["amountTotalCents", "totalPaidCents", "totalAmountCents", "familyInitialAmountCents", "customInitialAmountCents", "commercialInitialAmountCents"]
  ) || getBookkeepingBreakdownAmount(item, "amountDueNow") || getBookkeepingBreakdownAmount(item, "subtotal");
}

function getSubtotalBeforeTax(item: AdminDoc) {
  return getBookkeepingDollarAmount(
    item,
    ["amountSubtotal", "subtotal", "familyInitialSubtotal", "laundrySubtotal", "laundryBaseAmount", "customInitialAmount", "commercialInitialAmount"],
    ["amountSubtotalCents", "subtotalCents", "familyInitialSubtotalCents", "laundrySubtotalCents", "laundryBaseAmountCents"]
  ) || getBookkeepingBreakdownAmount(item, "subtotal") || getGrossCustomerCharge(item);
}

function getSalesTaxCollected(item: AdminDoc) {
  return getBookkeepingDollarAmount(
    item,
    ["amountTax", "salesTax", "taxCollected", "taxAmount", "stripeTaxAmount"],
    ["amountTaxCents", "salesTaxCents", "taxCollectedCents", "taxAmountCents", "stripeTaxAmountCents"]
  );
}

function getDiscountOrCreditAmount(item: AdminDoc) {
  const breakdown = getPaymentBreakdown(item);
  return getBookkeepingDollarAmount(
    item,
    ["discountCredit", "appliedCustomerCreditAmount", "laundryDepositCredit", "incomingReferralCreditAmount", "totalSuggestedCreditAmount"],
    ["discountCreditCents", "appliedCustomerCreditAmountCents", "laundryDepositCreditCents", "incomingReferralCreditAmountCents", "totalSuggestedCreditAmountCents"]
  ) || getDollarsFromAny(breakdown.discountCredit) || getDollarsFromAny(breakdown.appliedCustomerCreditAmount) || getDollarsFromAny(breakdown.incomingReferralCreditAmount);
}

function getRefundAmount(item: AdminDoc) {
  const refund = item.familyRefundTracking && typeof item.familyRefundTracking === "object" ? item.familyRefundTracking as Record<string, any> : {};
  return getBookkeepingDollarAmount(item, ["refundAmount", "refundedAmount"], ["refundAmountCents", "refundedAmountCents"]) || getDollarsFromAny(refund.refundAmount);
}

function getNetCustomerCharge(item: AdminDoc) {
  const gross = getGrossCustomerCharge(item);
  const refund = getRefundAmount(item);
  return Math.max(0, gross - refund);
}

function getPaymentShortReference(item: AdminDoc) {
  const candidates = [item.paymentIntentId, item.invoiceId, item.checkoutSessionId, item.laundryDepositCheckoutSessionId, item.familyInvoiceId]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (!candidates.length) return "";
  const value = candidates[0];
  return value.length > 12 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function getPaymentStatusForBookkeeping(item: AdminDoc) {
  return String(item.laundryPaymentStatus || item.paymentStatus || item.familyPaymentStatus || item.status || "").trim();
}

function isPaidForBookkeeping(item: AdminDoc) {
  const text = getPaymentStatusForBookkeeping(item).toLowerCase();
  return text.includes("paid") || text.includes("completed") || Boolean(item.paidAt || item.paymentReceivedAt || item.laundryFinalBalancePaidAt);
}

function getPaidDateForBookkeeping(item: AdminDoc) {
  return formatDate(getBookkeepingValue(item, ["paidAt", "paymentReceivedAt", "laundryFinalBalancePaidAt", "laundryFinalBalanceCreatedAt", "checkoutPaidAt", "updatedAt", "createdAt"]));
}

function getTaxableLabel(item: AdminDoc) {
  const serviceKey = getServiceKey(item);
  if (serviceKey === "laundry-rescue" || serviceKey === "commercial-reset") return "Taxable / verify in Stripe + WA DOR";
  if (getSalesTaxCollected(item) > 0) return "Tax collected";
  return "Likely non-taxable / verify";
}

function getBoCategoryNote(item: AdminDoc) {
  const serviceKey = getServiceKey(item);
  if (serviceKey === "commercial-reset") return "Commercial cleaning / verify WA B&O classification";
  if (serviceKey === "laundry-rescue") return "Laundry service / verify WA B&O classification";
  return "Household/family service / verify WA B&O classification";
}

function getRevenueSummaryCsv(records: AdminDoc[]) {
  const paidRecords = records.filter(isPaidForBookkeeping);
  const headers = [
    "Date paid",
    "Customer name",
    "Service type",
    "Customer city",
    "Customer state",
    "Customer ZIP",
    "Invoice/payment title",
    "Subtotal before tax",
    "Sales tax collected",
    "Discount/credit",
    "Refund amount",
    "Net customer charge",
    "Payment status",
    "Payment reference",
  ];
  const rows = paidRecords.map((item) => {
    const breakdown = getPaymentBreakdown(item);
    return [
      getPaidDateForBookkeeping(item),
      getRecordDisplayName(item),
      getCleanServiceLabel(item),
      getCleanCity(item),
      getCleanState(item),
      getCleanZip(item),
      String(item.familyPaymentTitle || item.quoteTitle || breakdown.quoteTitle || breakdown.paymentPlan || getCleanServiceLabel(item)),
      formatMoney(getSubtotalBeforeTax(item)),
      formatMoney(getSalesTaxCollected(item)),
      formatMoney(getDiscountOrCreditAmount(item)),
      formatMoney(getRefundAmount(item)),
      formatMoney(getNetCustomerCharge(item)),
      getPaymentStatusForBookkeeping(item),
      getPaymentShortReference(item),
    ];
  });
  return csvFromRows(headers, rows);
}

function getWashingtonTaxSummaryCsv(records: AdminDoc[]) {
  const paidRecords = records.filter(isPaidForBookkeeping);
  const headers = [
    "Payment date",
    "Service category",
    "Taxable / non-taxable note",
    "Gross amount",
    "Sales tax collected",
    "Customer city",
    "Customer ZIP",
    "Refunds",
    "Net after refunds",
    "B&O category note",
  ];
  const rows = paidRecords.map((item) => [
    getPaidDateForBookkeeping(item),
    getCleanServiceLabel(item),
    getTaxableLabel(item),
    formatMoney(getGrossCustomerCharge(item)),
    formatMoney(getSalesTaxCollected(item)),
    getCleanCity(item),
    getCleanZip(item),
    formatMoney(getRefundAmount(item)),
    formatMoney(getNetCustomerCharge(item)),
    getBoCategoryNote(item),
  ]);
  return csvFromRows(headers, rows);
}

function getRefundCreditsCsv(records: AdminDoc[]) {
  const refundRecords = records.filter((item) => getRefundAmount(item) > 0 || String(item.familyRefundTracking?.refundStatus || item.refundStatus || "").trim());
  const headers = [
    "Date",
    "Customer",
    "Service",
    "Original amount",
    "Refund amount",
    "Reason",
    "Customer notified",
    "Final net amount",
    "Refund status",
  ];
  const rows = refundRecords.map((item) => {
    const refund = item.familyRefundTracking && typeof item.familyRefundTracking === "object" ? item.familyRefundTracking as Record<string, any> : {};
    return [
      formatDate(getBookkeepingValue(item, ["refundCreatedAt", "updatedAt", "createdAt"])),
      getRecordDisplayName(item),
      getCleanServiceLabel(item),
      formatMoney(getGrossCustomerCharge(item)),
      formatMoney(getRefundAmount(item)),
      String(refund.refundReason || item.refundReason || ""),
      typeof refund.customerNotified === "boolean" ? (refund.customerNotified ? "Yes" : "No") : formatValue("customerNotified", item.customerNotified),
      formatMoney(getNetCustomerCharge(item)),
      String(refund.refundStatus || item.refundStatus || ""),
    ];
  });
  return csvFromRows(headers, rows);
}

function getLaundryPaymentsCsv(records: AdminDoc[]) {
  const laundryRecords = records.filter((item) => getServiceKey(item) === "laundry-rescue");
  const headers = [
    "Customer",
    "Pickup date",
    "Deposit paid/credited",
    "Dry weight lbs",
    "Rate per lb",
    "Add-ons amount",
    "Laundry subtotal",
    "Final balance",
    "Total paid / net charge",
    "Refund/credit",
    "Payment status",
  ];
  const rows = laundryRecords.map((item) => [
    getRecordDisplayName(item),
    String(item.preferredDate || item.pickupDate || ""),
    formatMoney(getBookkeepingDollarAmount(item, ["laundryDepositCredit", "laundryDepositExpectedAmount", "familyInitialAmount"], ["laundryDepositCreditCents", "laundryDepositExpectedAmountCents", "familyInitialAmountCents"])),
    String(item.laundryDryWeightLbs || ""),
    item.laundryRatePerLb ? `${formatMoney(toNumber(item.laundryRatePerLb))}/lb` : "",
    formatMoney(getBookkeepingDollarAmount(item, ["laundryAddOnsAmount"], ["laundryAddOnsAmountCents"])),
    formatMoney(getBookkeepingDollarAmount(item, ["laundrySubtotal", "laundryBaseAmount"], ["laundrySubtotalCents", "laundryBaseAmountCents"])),
    formatMoney(getBookkeepingDollarAmount(item, ["laundryBalanceDue"], ["laundryBalanceDueCents"])),
    formatMoney(getNetCustomerCharge(item)),
    formatMoney(getDiscountOrCreditAmount(item) + getRefundAmount(item)),
    getPaymentStatusForBookkeeping(item),
  ]);
  return csvFromRows(headers, rows);
}

function getOnboardingCsv(collectionName: string, records: AdminDoc[]) {
  const headers = [
    "Applicant / business",
    "Applicant type",
    "Email",
    "Phone",
    "City",
    "State",
    "ZIP",
    "Services offered",
    "Application status",
    "Onboarding completed",
    "Approved date",
    "Insurance reviewed",
    "Business license reviewed",
    "W-9 requested",
    "W-9 received",
    "1099 eligible",
    "Docs uploaded",
    "Internal notes",
  ];
  const rows = records.map((item) => {
    const checklist = item.onboardingChecklist && typeof item.onboardingChecklist === "object" ? item.onboardingChecklist as OnboardingChecklist : {};
    const completed = APPLICATION_CHECKLIST_ITEMS.filter((entry) => checklist[entry.key]).length;
    return [
      getRecordDisplayName(item),
      collectionName === "partnerApplications" ? "Business / partner" : "Individual helper",
      String(item.email || ""),
      String(item.phone || ""),
      String(item.city || ""),
      String(item.state || ""),
      String(item.zip || ""),
      exportValueToText("services", item.services || item.serviceType || item.preferredWorkTypes),
      String(item.applicationStatus || item.status || ""),
      `${completed}/${APPLICATION_CHECKLIST_ITEMS.length}`,
      formatDate(getBookkeepingValue(item, ["approvedAt", "updatedAt"])),
      checklist.licenseInsuranceReviewed || String(item.insuranceStatus || "").toLowerCase().includes("yes") ? "Yes" : "No / not marked",
      checklist.licenseInsuranceReviewed || String(item.licenseStatus || "").toLowerCase().includes("yes") ? "Yes" : "No / not marked",
      formatValue("w9Requested", item.w9Requested),
      formatValue("w9Received", item.w9Received),
      formatValue("is1099Eligible", item.is1099Eligible),
      String(getApplicationDocuments(item).length),
      String(item.adminNotes || item.internalNotes || ""),
    ];
  });
  return csvFromRows(headers, rows);
}

function getMarketingSourceCsv(collectionName: string, records: AdminDoc[]) {
  const headers = [
    "Date",
    "Form type",
    "Name / business",
    "Service requested / offered",
    "How they found us",
    "Source details",
    "Converted to paid customer",
    "Amount paid",
    "Status",
  ];
  const rows = records.map((item) => [
    formatDate(item.createdAt),
    getCollectionDisplayLabel(collectionName),
    getRecordDisplayName(item),
    collectionName === "serviceRequests" ? getCleanServiceLabel(item) : exportValueToText("services", item.services || item.serviceType || item.subject),
    String(item.howFoundUs || ""),
    String(item.howFoundUsDetails || ""),
    collectionName === "serviceRequests" && isPaidForBookkeeping(item) ? "Yes" : "No",
    collectionName === "serviceRequests" ? formatMoney(getNetCustomerCharge(item)) : "",
    String(item.status || item.applicationStatus || ""),
  ]);
  return csvFromRows(headers, rows);
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


function getRecordDeleteBlockReason(collectionName: string, item: AdminDoc | null | undefined) {
  if (!item) return "Open a record first.";
  if (!["serviceRequests", "helperApplications", "partnerApplications", "contactMessages"].includes(collectionName)) return "This admin list does not support deleting records.";
  if (collectionName !== "serviceRequests") return "";

  const paymentText = getAdminPaymentText(item);
  const statusText = String(item.status || "").toLowerCase();
  if (paymentText.includes("paid") || statusText.includes("completed") || statusText.includes("scheduled")) {
    return "This request looks paid, completed, or scheduled. Keep it for customer/payment records and mark it Canceled or Archived instead.";
  }

  const protectedKeys = [
    "checkoutUrl",
    "checkoutSessionId",
    "paymentIntentId",
    "stripeCustomerId",
    "commercialInvoiceId",
    "commercialInvoiceUrl",
    "commercialInvoicePdf",
    "familyInvoiceId",
    "familyInvoiceUrl",
    "familyInvoicePdf",
    "laundryFinalInvoiceId",
    "laundryFinalInvoiceUrl",
    "laundryFinalCheckoutUrl",
    "additionalCheckoutUrl",
    "additionalCheckoutSessionId",
    "outgoingReferralCode",
    "outgoingReferralLink",
    "incomingReferralCode",
    "outgoingReferralCreditId",
    "incomingReferralRewardCode",
  ];
  const hasProtectedData = protectedKeys.some((key) => {
    const value = item[key];
    if (value === null || value === undefined || value === "") return false;
    if (typeof value === "number") return Number.isFinite(value) && value !== 0;
    if (typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });

  if (hasProtectedData) {
    return "This request already has payment, invoice, checkout, or referral data attached. Keep it for audit history and mark it Canceled or Archived instead.";
  }

  return "";
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
  const [referralFilter, setReferralFilter] = useState("all");
  const [promoFilter, setPromoFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<"25" | "all">("25");
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
  const [manualSalesTaxEnabled, setManualSalesTaxEnabled] = useState(false);
  const [manualSalesTaxRate, setManualSalesTaxRate] = useState("");
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
  const [applicationStatus, setApplicationStatus] = useState("New");
  const [onboardingChecklist, setOnboardingChecklist] = useState<OnboardingChecklist>({});
  const [internalNotes, setInternalNotes] = useState("");
  const [bestFitServices, setBestFitServices] = useState("");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [approvedBio, setApprovedBio] = useState("");
  const [doNotAssignNotes, setDoNotAssignNotes] = useState("");
  const [reliabilityRating, setReliabilityRating] = useState("");
  const [applicationOnboardingBusy, setApplicationOnboardingBusy] = useState(false);
  const [applicationOnboardingMessage, setApplicationOnboardingMessage] = useState("");
  const [applicationOnboardingError, setApplicationOnboardingError] = useState("");
  const [busyDocumentPath, setBusyDocumentPath] = useState("");
  const [documentOpenError, setDocumentOpenError] = useState("");
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
    setManualSalesTaxEnabled(false);
    setManualSalesTaxRate(selected?.manualSalesTaxRate ? String(selected.manualSalesTaxRate) : "");
    setStatusValue(nextStatus);
    setStatusNote("");
    setNotifyCustomer(shouldNotifyByDefault(nextStatus));
    setStatusMessage("");
    setStatusError("");
    setLaundryDryWeightLbs(selected?.laundryDryWeightLbs ? String(selected.laundryDryWeightLbs) : "");
    setLaundryRatePerLb(selected?.laundryRatePerLb ? String(selected.laundryRatePerLb) : "2.99");
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
    setApplicationStatus(selected?.status ? String(selected.status) : "New");
    setOnboardingChecklist(selected?.onboardingChecklist && typeof selected.onboardingChecklist === "object" ? selected.onboardingChecklist : {});
    setInternalNotes(selected?.internalNotes ? String(selected.internalNotes) : selected?.adminNotes ? String(selected.adminNotes) : "");
    setBestFitServices(selected?.bestFitServices ? String(selected.bestFitServices) : "");
    setStrengths(selected?.strengths ? String(selected.strengths) : "");
    setConcerns(selected?.concerns ? String(selected.concerns) : "");
    setApprovedBio(selected?.approvedBio ? String(selected.approvedBio) : "");
    setDoNotAssignNotes(selected?.doNotAssignNotes ? String(selected.doNotAssignNotes) : "");
    setReliabilityRating(selected?.reliabilityRating ? String(selected.reliabilityRating) : "");
    setApplicationOnboardingMessage("");
    setApplicationOnboardingError("");
    setBusyDocumentPath("");
    setDocumentOpenError("");
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

  const dropdownStatuses = availableStatuses;

  const queueCounts = useMemo(() => {
    const counts: Record<string, number> = { active: 0, "needs-review": 0, "needs-payment": 0, payment: 0, "paid-scheduled": 0, completed: 0, closed: 0, all: items.length };
    items.forEach((item) => {
      const key = getAdminQueueKey(item);
      counts[key] = (counts[key] || 0) + 1;
      if (isActiveQueueItem(item)) counts.active = (counts.active || 0) + 1;
    });
    return counts;
  }, [items]);

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
      if (collectionName === "serviceRequests" && queueFilter !== "all") {
        if (queueFilter === "active") {
          if (!isActiveQueueItem(item)) return false;
        } else if (getAdminQueueKey(item) !== queueFilter) {
          return false;
        }
      }

      const paymentStatus = String(item.paymentStatus || item.laundryPaymentStatus || item.additionalPaymentStatus || "").toLowerCase();
      if (paymentFilter === "paid" && !paymentStatus.includes("paid")) return false;
      if (paymentFilter === "sent" && !(paymentStatus.includes("sent") || paymentStatus.includes("checkout") || paymentStatus.includes("invoice"))) return false;
      if (paymentFilter === "unpaid" && (paymentStatus.includes("paid") || paymentStatus.includes("sent") || paymentStatus.includes("checkout") || paymentStatus.includes("invoice"))) return false;
      if (paymentFilter === "refund" && !JSON.stringify(item).toLowerCase().includes("refund")) return false;
      if (referralFilter === "available-credit") {
        if (!matchesReferralFilter(item, referralFilter) && !getAvailableCustomerCreditsForRequest(item, customerCredits).length) return false;
      } else if (!matchesReferralFilter(item, referralFilter)) {
        return false;
      }
      if (promoFilter === "customer-credit") {
        if (!matchesPromoFilter(item, promoFilter) && !getAvailableCustomerCreditsForRequest(item, customerCredits).length) return false;
      } else if (!matchesPromoFilter(item, promoFilter)) {
        return false;
      }

      if (dateFilter !== "all") {
        const created = getDateObject(item.createdAt)?.getTime();
        if (!created) return false;
        if (dateFilter === "today" && created < todayStart) return false;
        if (dateFilter === "7d" && created < cutoff7) return false;
        if (dateFilter === "30d" && created < cutoff30) return false;
      }

      return true;
    });
  }, [items, customerCredits, filter, serviceFilter, statusFilter, paymentFilter, referralFilter, promoFilter, dateFilter, queueFilter, collectionName]);

  const pageLimit = pageSize === "all" ? filtered.length || 1 : 25;
  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(filtered.length / pageLimit));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = pageSize === "all" ? 0 : (safeCurrentPage - 1) * pageLimit;
  const pagedItems = pageSize === "all" ? filtered : filtered.slice(pageStartIndex, pageStartIndex + pageLimit);
  const pageFirstRecord = filtered.length ? pageStartIndex + 1 : 0;
  const pageLastRecord = filtered.length ? Math.min(pageStartIndex + pagedItems.length, filtered.length) : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, serviceFilter, statusFilter, paymentFilter, referralFilter, promoFilter, dateFilter, queueFilter, collectionName, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const activeFilterCount = [filter.trim(), serviceFilter, statusFilter !== "all" ? statusFilter : "", paymentFilter !== "all" ? paymentFilter : "", referralFilter !== "all" ? referralFilter : "", promoFilter !== "all" ? promoFilter : "", dateFilter !== "all" ? dateFilter : "", collectionName === "serviceRequests" && queueFilter !== "all" ? queueFilter : ""].filter(Boolean).length;
  const pageNumberItems = useMemo(() => getPageNumberItems(safeCurrentPage, totalPages), [safeCurrentPage, totalPages]);
  function clearAllFilters() {
    setFilter("");
    setServiceFilter("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setReferralFilter("all");
    setPromoFilter("all");
    setDateFilter("all");
    setQueueFilter("all");
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

  function toggleOnboardingChecklist(key: string, checked: boolean) {
    setOnboardingChecklist((prev) => ({ ...prev, [key]: checked }));
  }

  async function saveApplicationOnboarding() {
    if (!selected || !["helperApplications", "partnerApplications"].includes(collectionName)) return;
    setApplicationOnboardingBusy(true);
    setActiveAction("Saving application onboarding details...");
    setApplicationOnboardingMessage("");
    setApplicationOnboardingError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/update-application-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          collection: collectionName,
          id: selected.id,
          status: applicationStatus,
          onboardingChecklist,
          internalNotes,
          bestFitServices,
          strengths,
          concerns,
          approvedBio,
          doNotAssignNotes,
          reliabilityRating,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to save onboarding details.");

      const updates = {
        status: applicationStatus,
        onboardingChecklist,
        internalNotes,
        bestFitServices,
        strengths,
        concerns,
        approvedBio,
        doNotAssignNotes,
        reliabilityRating,
      };
      setSelected((prev) => (prev ? { ...prev, ...updates } : prev));
      setItems((prev) => prev.map((item) => item.id === selected.id ? { ...item, ...updates } : item));
      setApplicationOnboardingMessage("Application onboarding details saved.");
    } catch (error) {
      setApplicationOnboardingError(error instanceof Error ? error.message : "Unable to save onboarding details.");
    } finally {
      setApplicationOnboardingBusy(false);
      setActiveAction("");
    }
  }

  async function openApplicationDocument(document: ApplicationDocument) {
    if (!selected || !document.storagePath) return;
    setBusyDocumentPath(document.storagePath);
    setDocumentOpenError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/application-document-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ collection: collectionName, id: selected.id, storagePath: document.storagePath }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.url) throw new Error(data.error || "Unable to open this document.");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setDocumentOpenError(error instanceof Error ? error.message : "Unable to open this document.");
    } finally {
      setBusyDocumentPath("");
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

  async function createReferralLink(sendEmail = true, forceNew = false) {
    if (!selected) return;
    setReferralBusy(true);
    setActiveAction(forceNew ? "Creating another one-time family referral link..." : sendEmail ? "Creating and emailing family referral link..." : "Creating family referral link...");
    setReferralMessage("");
    setReferralError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/create-referral-link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: selected.id, sendEmail, forceNew }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to create referral link.");
      }

      setSelected((prev) => {
        if (!prev) return prev;
        const currentHistory = getOutgoingReferralHistory(prev);
        const nextHistoryEntry = data.historyEntry || {
          code: data.code,
          url: data.url,
          status: data.status || "Active",
          generatedAtIso: new Date().toISOString(),
        };
        const hasHistoryEntry = currentHistory.some((entry) => String(entry.code || "") === String(data.code || ""));
        const nextHistory = hasHistoryEntry ? currentHistory : [...currentHistory, nextHistoryEntry];
        return {
          ...prev,
          outgoingReferralCode: data.code,
          outgoingReferralLink: data.url,
          outgoingReferralStatus: data.status || prev.outgoingReferralStatus || "Active",
          outgoingReferralEmailSent: data.emailSent || prev.outgoingReferralEmailSent,
          outgoingReferralEmailError: data.emailWarning || "",
          outgoingReferralHistory: nextHistory,
          outgoingReferralLinkCount: nextHistory.length,
        };
      });

      setReferralMessage(data.emailWarning
        ? `Referral link ready, but email warning: ${data.emailWarning}`
        : data.emailSent
          ? forceNew
            ? "Another one-time family referral link was created and emailed to the customer."
            : "Family referral link created and emailed to the customer."
          : data.reused
            ? "Existing family referral link loaded. Copy or resend it as needed."
            : forceNew
              ? "Another one-time family referral link was created. Copy it or email it when ready."
              : "Family referral link created. Copy it or email it when ready.");
    } catch (error) {
      setReferralError(error instanceof Error ? error.message : "Unable to create referral link.");
    } finally {
      setReferralBusy(false);
      setActiveAction("");
    }
  }


  function getManualSalesTaxPayload() {
    return {
      manualSalesTax: manualSalesTaxEnabled,
      manualSalesTaxRate: manualSalesTaxEnabled ? toNumber(manualSalesTaxRate) : 0,
    };
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
        body: JSON.stringify({ requestId: selected.id, sendEmail, ...getManualSalesTaxPayload() }),
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
        body: JSON.stringify({ requestId: selected.id, sendEmail, ...getManualSalesTaxPayload() }),
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
          ...getManualSalesTaxPayload(),
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
        ? " Stripe checkout will collect the non-refundable deposit and ask the customer to choose auto-charge or invoice-before-delivery. Manual sales tax is added only if the sales-tax box is checked."
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
          ...getManualSalesTaxPayload(),
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
          ...getManualSalesTaxPayload(),
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
  const showApplicationOnboardingPanel = Boolean(selected && ["helperApplications", "partnerApplications"].includes(collectionName));
  const selectedApplicationDocuments = getApplicationDocuments(selected);
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
  const selectedOutgoingReferralHistory = getOutgoingReferralHistory(selected);
  const anyActionBusy = checkoutBusy || commercialInvoiceBusy || commercialQuoteEmailBusy || familyInvoiceBusy || statusBusy || laundryFinalBusy || additionalPaymentBusy || commercialQuoteBusy || referralBusy || applicationOnboardingBusy || Boolean(busyDocumentPath);

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Admin</p>
            <h2 className="text-3xl font-bold text-[#075c58]">{title}</h2>
            <p className="mt-1 text-slate-600">
              Showing <span className="font-black text-[#075c58]">{pageFirstRecord}-{pageLastRecord}</span> of <span className="font-black text-[#075c58]">{filtered.length}</span> matching records · <span className="font-black">{items.length}</span> total
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
          <div className="mt-4 rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-3 sm:p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Work queue</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Showing all records by default. Use the buckets to narrow the list when needed.</p>
              </div>
              {queueFilter !== "all" && (
                <button type="button" onClick={() => setQueueFilter("all")} className={getAdminActionClass("quiet")}>Show all records</button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
              {ADMIN_QUEUE_OPTIONS.map((option) => {
                const active = queueFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setQueueFilter(option.key)}
                    className={`rounded-2xl border px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#075c58]/15 ${active ? option.accent + " ring-2 ring-[#075c58]/25" : "border-[#eadfc8] bg-white text-slate-700"}`}
                    title={`Show ${option.label}`}
                  >
                    <span className="block text-lg font-black leading-none">{queueCounts[option.key] || 0}</span>
                    <span className="mt-1 block text-[11px] font-black uppercase tracking-wide">{option.label}</span>
                    <span className="mt-1 block text-[10px] font-semibold opacity-80">{option.helper}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
          <div className="mt-4 grid gap-3 rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Status
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-12 rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                <option value="all">All statuses</option>
                {availableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            {collectionName === "serviceRequests" && (
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
            )}
            {collectionName === "serviceRequests" && (
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Referrals
                <select value={referralFilter} onChange={(e) => setReferralFilter(e.target.value)} className="min-h-12 rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                  <option value="all">All referral states</option>
                  <option value="any">Has referral activity</option>
                  <option value="outgoing">Outgoing share links</option>
                  <option value="incoming">Referred-family requests</option>
                  <option value="credit">Reward / credit activity</option>
                  <option value="available-credit">Available credit noted</option>
                </select>
              </label>
            )}
            {collectionName === "serviceRequests" && (
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Promo / credits
                <select value={promoFilter} onChange={(e) => setPromoFilter(e.target.value)} className="min-h-12 rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                  <option value="all">All promo states</option>
                  <option value="any">Any promo / discount / credit</option>
                  <option value="promo-code">Has promo code</option>
                  <option value="founding-beta">Internal discount / promo</option>
                  <option value="referral-credit">Referral credit</option>
                  <option value="customer-credit">Saved customer credit</option>
                  <option value="discount">Discount line</option>
                </select>
              </label>
            )}
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

      <div className="flex flex-col gap-3 rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">List view</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {pageSize === "all" ? `Showing all ${filtered.length} matching records.` : `Showing ${pageFirstRecord}-${pageLastRecord} of ${filtered.length} matching records.`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <details className="rounded-2xl border border-[#eadfc8] bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
            <summary className="cursor-pointer list-none text-[#075c58]">Export list</summary>
            <div className="mt-3 grid gap-2 sm:min-w-[220px]">
              <button
                type="button"
                onClick={() => printAdminRecords(collectionName, title, filtered)}
                disabled={!filtered.length}
                className={getAdminActionClass("quiet")}
                title="Print the full details for every record currently matching your filters."
              >
                Print filtered
              </button>
              <button
                type="button"
                onClick={() => downloadTextFile(getFilteredCsvFilename(title), getAdminCsvExport(collectionName, filtered), "text/csv;charset=utf-8")}
                disabled={!filtered.length}
                className={getAdminActionClass("quiet")}
                title="Download the currently filtered list as a spreadsheet-friendly CSV."
              >
                Download filtered CSV
              </button>

              {collectionName === "serviceRequests" && (
                <div className="mt-2 grid gap-2 border-t border-[#eadfc8] pt-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Tax / bookkeeping</p>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(getBookkeepingExportFilename(title, "paid-revenue-summary"), getRevenueSummaryCsv(filtered), "text/csv;charset=utf-8")}
                    disabled={!filtered.some(isPaidForBookkeeping)}
                    className={getAdminActionClass("quiet")}
                    title="Paid records only. Clean revenue report for bookkeeping and tax prep."
                  >
                    Paid revenue CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(getBookkeepingExportFilename(title, "washington-tax-summary"), getWashingtonTaxSummaryCsv(filtered), "text/csv;charset=utf-8")}
                    disabled={!filtered.some(isPaidForBookkeeping)}
                    className={getAdminActionClass("quiet")}
                    title="Paid records only. Includes gross amounts, sales tax collected, location, refunds, and WA B&O notes."
                  >
                    WA tax summary CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(getBookkeepingExportFilename(title, "refunds-credits"), getRefundCreditsCsv(filtered), "text/csv;charset=utf-8")}
                    disabled={!filtered.some((item) => getRefundAmount(item) > 0 || String(item.familyRefundTracking?.refundStatus || item.refundStatus || "").trim())}
                    className={getAdminActionClass("quiet")}
                    title="Refunds and credit notes for matching requests."
                  >
                    Refunds / credits CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(getBookkeepingExportFilename(title, "laundry-payments"), getLaundryPaymentsCsv(filtered), "text/csv;charset=utf-8")}
                    disabled={!filtered.some((item) => getServiceKey(item) === "laundry-rescue")}
                    className={getAdminActionClass("quiet")}
                    title="Laundry-specific deposit, dry-weight, add-on, balance, and payment summary."
                  >
                    Laundry payments CSV
                  </button>
                </div>
              )}

              {(collectionName === "helperApplications" || collectionName === "partnerApplications") && (
                <div className="mt-2 grid gap-2 border-t border-[#eadfc8] pt-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Onboarding / contractor records</p>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(getBookkeepingExportFilename(title, "onboarding-records"), getOnboardingCsv(collectionName, filtered), "text/csv;charset=utf-8")}
                    disabled={!filtered.length}
                    className={getAdminActionClass("quiet")}
                    title="Applicant/vendor onboarding tracking. Useful for contractor paperwork follow-up."
                  >
                    Onboarding CSV
                  </button>
                </div>
              )}

              <div className="mt-2 grid gap-2 border-t border-[#eadfc8] pt-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Marketing</p>
                <button
                  type="button"
                  onClick={() => downloadTextFile(getBookkeepingExportFilename(title, "marketing-source-report"), getMarketingSourceCsv(collectionName, filtered), "text/csv;charset=utf-8")}
                  disabled={!filtered.length}
                  className={getAdminActionClass("quiet")}
                  title="How people found NestHelper, source details, and paid conversion where applicable."
                >
                  Marketing source CSV
                </button>
              </div>
            </div>
          </details>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            Per page
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value === "all" ? "all" : "25")}
              className="min-h-10 rounded-2xl border border-[#eadfc8] bg-white px-3 py-2 font-bold text-[#075c58] outline-none focus:border-[#075c58] focus:ring-4 focus:ring-[#075c58]/15"
            >
              <option value="25">25</option>
              <option value="all">Show all</option>
            </select>
          </label>
          {pageSize !== "all" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage <= 1}
                className={getAdminActionClass("quiet")}
              >
                Previous
              </button>
              <div className="flex max-w-full flex-wrap items-center justify-center gap-1">
                {pageNumberItems.map((page) =>
                  typeof page === "number" ? (
                    <button
                      key={`page-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={page === safeCurrentPage ? "page" : undefined}
                      className={`min-h-10 min-w-10 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-4 focus:ring-[#075c58]/15 ${page === safeCurrentPage ? "bg-[#075c58] text-white" : "bg-[#fbf6ea] text-[#075c58] ring-1 ring-[#eadfc8] hover:bg-[#f4ecdc]"}`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={page} className="px-1 text-xs font-black text-slate-400">…</span>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                className={getAdminActionClass("quiet")}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>



      <div className="grid gap-3 md:hidden">
        {pagedItems.map((item) => (
          <div key={`mobile-${item.id}`} className={`rounded-3xl border border-[#eadfc8] p-4 shadow-sm ${getServiceLook(item).row}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-[#075c58]">{getRecordDisplayName(item)}</p>
                  <p className="mt-1 text-xs font-bold text-slate-600">{getRecordContactLine(item)}</p>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-700">
              {columns.slice(0, 4).map((col) => (
                <div key={`${item.id}-${col.key}`} className="rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-[#eadfc8]">
                  <span className="mr-1 uppercase tracking-wide text-slate-400">{col.label}:</span>
                  <span>{renderAdminCell(col.key, item)}</span>
                </div>
              ))}
              <div className="rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-[#eadfc8]">
                <span className="mr-1 uppercase tracking-wide text-slate-400">Created:</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              <button onClick={() => setSelected(item)} className="w-full rounded-full bg-[#075c58] px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-[#064b48]">Open details</button>
              <select
                value={item.status || "New"}
                onChange={async (e) => {
                  const next = e.target.value;
                  setStatusBusy(true);
                  setActiveAction(`Updating ${getRecordDisplayName(item)} to ${next}...`);
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
                className="w-full rounded-full border border-[#d8c18f] bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-[#075c58]"
              >
                {dropdownStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          </div>
        ))}
        {!filtered.length && <div className="rounded-3xl border border-[#eadfc8] bg-white p-8 text-center text-sm font-semibold text-slate-500">No records match the current filters.</div>}
      </div>

      <div className="hidden max-w-full overflow-hidden rounded-3xl border border-[#eadfc8] bg-white shadow-xl shadow-[#075c58]/5 md:block">
        <div className="overflow-x-auto [scrollbar-gutter:stable]">
          <table className="w-full min-w-[1240px] divide-y divide-[#eadfc8] text-sm">
            <thead className="bg-[#f4ecdc] text-left text-xs uppercase tracking-wider text-[#075c58]">
              <tr>
                <th className="px-4 py-4">Status</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-4">{col.label}</th>
                ))}
                <th className="px-4 py-4">Created</th>
                <th className="sticky right-0 z-20 min-w-[190px] bg-[#f4ecdc] px-4 py-4 shadow-[-10px_0_18px_rgba(0,0,0,0.04)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e7d7]">
              {pagedItems.map((item) => (
                <tr key={item.id} className={`transition-colors ${getServiceLook(item).row}`}>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  {columns.map((col) => (
                    <td key={col.key} className="max-w-[220px] truncate px-4 py-4 text-slate-700">{renderAdminCell(col.key, item)}</td>
                  ))}
                  <td className="px-4 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="sticky right-0 z-10 min-w-[190px] bg-white/95 px-3 py-4 align-top shadow-[-10px_0_18px_rgba(0,0,0,0.04)] backdrop-blur">
                    <div className="grid min-w-[170px] gap-2">
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
                        {dropdownStatuses.map((status) => <option key={status}>{status}</option>)}
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

      {pageSize !== "all" && filtered.length > 25 && (
        <div className="flex flex-col gap-2 rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">Showing {pageFirstRecord}-{pageLastRecord} of {filtered.length} matching records.</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className={getAdminActionClass("quiet")}
            >
              Previous
            </button>
              <div className="flex max-w-full flex-wrap items-center justify-center gap-1">
                {pageNumberItems.map((page) =>
                  typeof page === "number" ? (
                    <button
                      key={`page-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={page === safeCurrentPage ? "page" : undefined}
                      className={`min-h-10 min-w-10 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-4 focus:ring-[#075c58]/15 ${page === safeCurrentPage ? "bg-[#075c58] text-white" : "bg-[#fbf6ea] text-[#075c58] ring-1 ring-[#eadfc8] hover:bg-[#f4ecdc]"}`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={page} className="px-1 text-xs font-black text-slate-400">…</span>
                  )
                )}
              </div>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className={getAdminActionClass("quiet")}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-4 flex items-center justify-between gap-3 border-b border-[#eadfc8] bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Admin details</p>
                <h3 className="text-2xl font-bold text-[#075c58]">Submission Details</h3>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button onClick={() => setSelected(null)} className={getAdminActionClass("quiet")}>Close details</button>
              </div>
            </div>

            <div className="mb-5 space-y-3">
              {showPaymentActions && (
                <details className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm">
                  <summary className="cursor-pointer text-sm font-black text-[#075c58]">Recommended flow</summary>
                  <div className="mt-3">
                    <AdminWorkflowGuide selectedIsCommercial={selectedIsCommercial} selectedService={selected.service} />
                  </div>
                </details>
              )}
              <AdminActionFeedback
                busy={anyActionBusy}
                activeAction={activeAction}
                messages={[statusMessage, checkoutMessage, commercialInvoiceMessage, commercialQuoteEmailMessage, familyInvoiceMessage, laundryFinalMessage, additionalPaymentMessage, commercialQuoteMessage, referralMessage, applicationOnboardingMessage]}
                errors={[statusError, checkoutError, commercialInvoiceError, commercialQuoteEmailError, familyInvoiceError, laundryFinalError, additionalPaymentError, commercialQuoteError, referralError, applicationOnboardingError, documentOpenError]}
              />
              <details className="rounded-3xl border border-[#eadfc8] bg-white p-4 shadow-sm">
                <summary className="cursor-pointer text-sm font-black text-[#075c58]">Print / download this record</summary>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => printAdminRecord(collectionName, selected)} className={getAdminActionClass("quiet")}>Print clean summary</button>
                  <button type="button" onClick={() => downloadAdminRecord(collectionName, selected)} className={getAdminActionClass("quiet")}>Download clean summary</button>
                </div>
              </details>
            </div>

            <AdminDetailSnapshot collectionName={collectionName} item={selected} />
            {showApplicationOnboardingPanel && <ApplicationQuickRead item={selected} documentCount={selectedApplicationDocuments.length} />}

            {showApplicationOnboardingPanel && (
              <div className="mb-5 rounded-3xl border border-[#eadfc8] bg-gradient-to-br from-white via-white to-[#fbf6ea] p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Applicant onboarding</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">Track documents, screening, fit, and approval notes</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      This is admin-only. Use it to move helpers/partners from application to phone screen, documents, background check, approved, backup list, rejected, or archived.
                    </p>
                  </div>
                  <StatusBadge status={applicationStatus} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Application status
                    <select
                      value={applicationStatus}
                      onChange={(e) => setApplicationStatus(e.target.value)}
                      className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                    >
                      {Array.from(new Set([...APPLICATION_STATUS_OPTIONS, ...dropdownStatuses])).map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Reliability / fit rating
                    <select
                      value={reliabilityRating}
                      onChange={(e) => setReliabilityRating(e.target.value)}
                      className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                    >
                      <option value="">Not rated yet</option>
                      <option>Excellent fit</option>
                      <option>Good fit</option>
                      <option>Backup / limited fit</option>
                      <option>Needs more review</option>
                      <option>Do not assign</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {APPLICATION_CHECKLIST_ITEMS.map((item) => (
                    <label key={item.key} className={`flex items-center gap-3 rounded-2xl border p-3 text-sm font-bold transition ${onboardingChecklist[item.key] ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-[#eadfc8] bg-white text-slate-700"}`}>
                      <input
                        type="checkbox"
                        checked={Boolean(onboardingChecklist[item.key])}
                        onChange={(e) => toggleOnboardingChecklist(item.key, e.target.checked)}
                        className="h-5 w-5 rounded border-[#075c58] accent-[#075c58]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>

                <details className="mt-4 rounded-3xl border border-[#eadfc8] bg-white p-4">
                  <summary className="cursor-pointer text-sm font-black text-[#075c58]">Notes, fit, concerns, and approved bio</summary>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Best-fit services
                      <textarea value={bestFitServices} onChange={(e) => setBestFitServices(e.target.value)} rows={3} placeholder="Example: Laundry, organizing, family reset, backup errand helper." className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Strengths
                      <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={3} placeholder="What seems strong about this applicant?" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Concerns / follow-up needed
                      <textarea value={concerns} onChange={(e) => setConcerns(e.target.value)} rows={3} placeholder="Questions, gaps, schedule limits, or documents still needed." className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Do-not-assign notes
                      <textarea value={doNotAssignNotes} onChange={(e) => setDoNotAssignNotes(e.target.value)} rows={3} placeholder="Only use for important internal restrictions." className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">
                      Internal notes
                      <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={4} placeholder="Phone screen notes, references, document review notes, assignment preferences, etc." className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">
                      Customer-facing approved bio draft
                      <textarea value={approvedBio} onChange={(e) => setApprovedBio(e.target.value)} rows={3} placeholder="Optional bio if this helper/partner is approved later." className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
                    </label>
                  </div>
                </details>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button type="button" disabled={applicationOnboardingBusy} onClick={saveApplicationOnboarding} className={getAdminActionClass("primary")}>
                    {applicationOnboardingBusy ? <><ActionSpinner /> Saving...</> : "Save onboarding details"}
                  </button>
                  <p className="text-xs font-semibold text-slate-500">This does not email the applicant. It only updates the admin record.</p>
                </div>

                {applicationOnboardingMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{applicationOnboardingMessage}</p>}
                {applicationOnboardingError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{applicationOnboardingError}</p>}
              </div>
            )}

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
                      {dropdownStatuses.map((status) => <option key={status}>{status}</option>)}
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
                      Family referral links are only for completed eligible family-service customers. Each link is one-time use, and you can generate another one-time link for the same happy family when needed. Commercial Reset is intentionally excluded.
                    </p>
                  </div>
                  <StatusBadge status={getReferralStatusText(selected)} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#eadfc8] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Outgoing share link for this customer</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                      {selected.outgoingReferralCode
                        ? `Latest one-time code: ${selected.outgoingReferralCode}`
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
                    {selectedOutgoingReferralHistory.length > 0 && (
                      <div className="mt-3 rounded-2xl border border-[#eadfc8] bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                        {selectedOutgoingReferralHistory.length} one-time referral link{selectedOutgoingReferralHistory.length === 1 ? "" : "s"} generated for this family. The latest link is shown above; each link can be used by one referred family only.
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={referralBusy || (!selected.outgoingReferralLink && !selectedCanGenerateReferral)}
                        onClick={() => createReferralLink(true)}
                        className={getAdminActionClass("primary")}
                      >
                        {referralBusy ? <><ActionSpinner /> Working...</> : selected.outgoingReferralLink ? "Resend latest link email" : "Create + email referral link"}
                      </button>
                      {selected.outgoingReferralLink && selectedCanGenerateReferral && (
                        <button
                          type="button"
                          disabled={referralBusy}
                          onClick={() => createReferralLink(true, true)}
                          className={getAdminActionClass("secondary")}
                          title="Creates a brand-new one-time link for this same family to share with another family."
                        >
                          Create + email another one-time link
                        </button>
                      )}
                      {selected.outgoingReferralLink && (
                        <button type="button" onClick={() => copyReferralLink(selected.outgoingReferralLink || "")} className={getAdminActionClass("secondary")}>Copy latest link</button>
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
                        placeholder="199"
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

                <ManualSalesTaxControls
                  enabled={manualSalesTaxEnabled}
                  rate={manualSalesTaxRate}
                  onEnabledChange={setManualSalesTaxEnabled}
                  onRateChange={setManualSalesTaxRate}
                  context={selected.service === "laundry-rescue" ? "deposit checkout" : selectedIsCommercial ? "commercial payment" : "family payment"}
                />

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
                            ? "This uses the saved breakdown amount to create a non-refundable Laundry Rescue deposit checkout with manual sales tax only if checked. Stripe asks the customer to choose auto-charge for the final balance or invoice-before-delivery."
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
                        : "Quick checkout uses the standard package price unless you choose a custom reviewed amount. Invoices use the saved Family Payment Breakdown instead."}
                    </div>
                  </div>

                  {!selectedIsCommercial && (
                    <div className="mt-4 grid gap-2 sm:max-w-sm">
                      <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Quick checkout amount</label>
                      <select
                        value={checkoutMode}
                        onChange={(e) => setCheckoutMode(e.target.value as CheckoutMode)}
                        className="rounded-2xl border border-[#d8c18f] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                      >
                        <option value="standard">Standard package price</option>
                        <option value="custom">Custom reviewed amount</option>
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
                            placeholder="199"
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
                        This creates the non-refundable deposit/minimum checkout with manual sales tax only if checked. Stripe will ask the customer to choose either auto-charge for the final dry-weight balance or invoice-before-delivery. Deposit paid does not mean fully paid.
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
                        : "The customer chose invoice-before-delivery, or no auto-charge authorization is saved. Enter the dry weight, rate, add-ons, and deposit credit; NestHelper creates a Stripe invoice with line-item details for the remaining balance only, with manual sales tax only if checked."}
                    </p>
                  </div>
                  <StatusBadge status={String(selected.laundryPaymentStatus || selected.paymentStatus || selected.status || "New")} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4 text-sm leading-6 text-slate-700">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Customer final-payment choice</p>
                    <p className="mt-1 font-black text-[#075c58]">{selected.laundryFinalPaymentPreferenceLabel || "Not captured yet"}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      The deposit/minimum is non-refundable. The final invoice applies the pre-tax deposit as a credit; add manual sales tax only if this final balance should be taxed.
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
                    <p className="font-black uppercase tracking-[0.14em] text-[#b98a2f]">Final balance before any manual tax</p>
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

                <ManualSalesTaxControls
                  enabled={manualSalesTaxEnabled}
                  rate={manualSalesTaxRate}
                  onEnabledChange={setManualSalesTaxEnabled}
                  onRateChange={setManualSalesTaxRate}
                  context="final laundry balance"
                />

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

                <ManualSalesTaxControls
                  enabled={manualSalesTaxEnabled}
                  rate={manualSalesTaxRate}
                  onEnabledChange={setManualSalesTaxEnabled}
                  onRateChange={setManualSalesTaxRate}
                  context="additional payment"
                />

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

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminPhotoUploads photos={getPhotoUploads(selected)} />
                <AdminApplicationDocuments documents={selectedApplicationDocuments} collectionName={collectionName} recordId={selected.id} onOpenDocument={openApplicationDocument} busyDocumentPath={busyDocumentPath} />
                {documentOpenError && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700 sm:col-span-2">{documentOpenError}</div>}
              </div>
              <AdminAdvancedRecordDetails item={selected} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
