"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import StatusBadge from "./StatusBadge";

type AdminDoc = { id: string; status?: string; createdAt?: unknown; checkoutUrl?: string; promoCode?: string; [key: string]: any };
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

function formatDate(value: unknown) {
  if (!value) return "—";
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") return value.toDate().toLocaleString();
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
  if (toNumber(item.laundryDepositAmountTotal) > 0) return centsToDollars(item.laundryDepositAmountTotal);
  if (toNumber(item.depositPaidAmountTotal) > 0) return centsToDollars(item.depositPaidAmountTotal);
  if (toNumber(item.amountTotal) > 0 && ["Deposit Paid", "Paid"].includes(String(item.paymentStatus || item.status || ""))) return centsToDollars(item.amountTotal);
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

function ServiceLegend() {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {Object.entries(SERVICE_LOOKS).map(([key, look]) => (
        <span key={key} className={`inline-flex min-w-[128px] items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${look.badge}`}>
          <span className={`h-2 w-2 rounded-full ${look.dot}`} />
          {look.label}
        </span>
      ))}
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
  const [selected, setSelected] = useState<AdminDoc | null>(null);
  const [filter, setFilter] = useState("");
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("standard");
  const [customInitialAmount, setCustomInitialAmount] = useState("");
  const [customInitialTitle, setCustomInitialTitle] = useState("");
  const [customInitialNote, setCustomInitialNote] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
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

  useEffect(() => {
    const q = query(collection(firestoreDb, collectionName), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [collectionName]);

  useEffect(() => {
    const nextStatus = selected?.status || "New";
    const nextMode = guessCheckoutMode(selected);
    setCheckoutMode(nextMode);
    setCheckoutMessage("");
    setCheckoutError("");
    setCustomInitialAmount(selected?.customInitialAmount ? String(selected.customInitialAmount) : "");
    setCustomInitialTitle(selected?.customInitialTitle ? String(selected.customInitialTitle) : "");
    setCustomInitialNote(selected?.customInitialNote ? String(selected.customInitialNote) : "");
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
  }, [selected?.id]);

  const filtered = useMemo(() => {
    const term = filter.toLowerCase().trim();
    if (!term) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(term));
  }, [items, filter]);

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
    return data as { ok: boolean; emailSent?: boolean; emailSkipped?: boolean; emailError?: string };
  }

  async function submitStatusUpdate() {
    if (!selected) return;
    setStatusBusy(true);
    setStatusMessage("");
    setStatusError("");

    try {
      const data = await updateStatus(selected, statusValue, { notifyCustomer, customerNote: statusNote });
      setSelected((prev) => (prev ? { ...prev, status: statusValue, lastStatusEmailNote: notifyCustomer ? statusNote : prev.lastStatusEmailNote } : prev));

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

  async function createPaymentLink(sendEmail: boolean) {
    if (!selected) return;
    const useCustomInitial = checkoutMode === "custom";
    setCheckoutBusy(true);
    setCheckoutMessage("");
    setCheckoutError("");

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
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to create checkout link.");
      }

      setSelected((prev) => prev ? { ...prev, checkoutUrl: data.url, checkoutSessionId: data.sessionId, status: "Checkout Sent", paymentStatus: selected.service === "laundry-rescue" ? "Deposit Checkout Sent" : "Checkout Sent" } : prev);
      setStatusValue("Checkout Sent");
      setCheckoutMessage(data.emailError || (data.emailSent ? "Checkout link created and emailed to the customer." : "Checkout link created. Copy it and send it manually."));
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to create checkout link.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function createLaundryFinalBalance(sendEmail: boolean) {
    if (!selected) return;
    setLaundryFinalBusy(true);
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
        throw new Error(data.error || "Unable to create laundry final balance link.");
      }

      setSelected((prev) => prev ? {
        ...prev,
        status: data.noBalanceDue ? "Fully Paid" : "Final Balance Sent",
        paymentStatus: data.noBalanceDue ? "Fully Paid" : "Final Balance Sent",
        laundryPaymentStatus: data.noBalanceDue ? "Fully Paid" : "Final Balance Sent",
        laundryFinalCheckoutUrl: data.url || prev.laundryFinalCheckoutUrl,
        laundryFinalCheckoutSessionId: data.sessionId || prev.laundryFinalCheckoutSessionId,
        laundryDryWeightLbs: toNumber(laundryDryWeightLbs),
        laundryRatePerLb: toNumber(laundryRatePerLb),
        laundryAddOnsAmount: toNumber(laundryAddOnsAmount),
        laundryDepositCredit: toNumber(laundryDepositCredit),
        laundrySubtotal,
        laundryBalanceDue,
      } : prev);
      setStatusValue(data.noBalanceDue ? "Fully Paid" : "Final Balance Sent");
      setLaundryFinalMessage(data.emailError || data.message || (data.emailSent ? "Final balance link created and emailed to the customer." : "Final balance link created. Copy it and send it manually."));
    } catch (error) {
      setLaundryFinalError(error instanceof Error ? error.message : "Unable to create laundry final balance link.");
    } finally {
      setLaundryFinalBusy(false);
    }
  }

  async function createAdditionalPayment(sendEmail: boolean) {
    if (!selected) return;
    setAdditionalPaymentBusy(true);
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
    }
  }

  async function saveCommercialQuote() {
    if (!selected) return;
    setCommercialQuoteBusy(true);
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
    }
  }

  function applyCommercialInitialToCheckout() {
    setCheckoutMode("custom");
    setCustomInitialAmount(commercialInitialAmount);
    setCustomInitialTitle(commercialQuoteType === "Short-term rental turnover" ? "Short-Term Rental Turnover approved quote" : commercialQuoteType === "Recurring monthly plan" ? "Commercial Reset recurring plan" : "Commercial Reset approved quote");
    setCustomInitialNote(commercialCustomerQuoteNote || "Approved Commercial Reset quote. Any added scope or specialty add-ons will be reviewed before an additional payment is requested.");
    setCheckoutMessage("Commercial amount copied below. Next: review the first payment link section and create/email the Stripe link.");
  }

  function applyCommercialAdditionalToPayment() {
    setAdditionalPaymentAmount(commercialAdditionalAmount);
    setAdditionalPaymentReason("Commercial approved add-on / additional scope");
    setAdditionalPaymentNote(commercialCustomerQuoteNote || "Approved commercial add-on or additional scope reviewed with the customer.");
    setAdditionalPaymentMessage("Commercial later/add-on amount copied below. Use it only after the customer approves the extra scope.");
  }

  const showPaymentActions = enablePaymentActions && collectionName === "serviceRequests" && selected;
  const showCustomerStatusActions = collectionName === "serviceRequests" && selected;
  const showLaundryFinalBalance = showPaymentActions && selected?.service === "laundry-rescue";
  const selectedIsCommercial = isCommercialRequest(selected);
  const isCustomCheckoutMode = checkoutMode === "custom";
  const showCommercialQuotePanel = showPaymentActions && selectedIsCommercial;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Admin</p>
          <h2 className="text-3xl font-bold text-[#075c58]">{title}</h2>
          <p className="mt-1 text-slate-600">{filtered.length} records</p>
          {collectionName === "serviceRequests" && <ServiceLegend />}
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search name, phone, city, notes..."
          className="w-full rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 shadow-sm outline-none focus:border-[#075c58] sm:max-w-sm"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#eadfc8] bg-white shadow-xl shadow-[#075c58]/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#eadfc8] text-sm">
            <thead className="bg-[#f4ecdc] text-left text-xs uppercase tracking-wider text-[#075c58]">
              <tr>
                <th className="px-4 py-4">Status</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-4">{col.label}</th>
                ))}
                <th className="px-4 py-4">Created</th>
                <th className="px-4 py-4">Actions</th>
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
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setSelected(item)} className="rounded-full bg-[#075c58] px-3 py-1.5 text-xs font-bold text-white">View</button>
                      <select
                        value={item.status || "New"}
                        onChange={(e) => updateStatus(item, e.target.value).catch(console.error)}
                        className="rounded-full border border-[#eadfc8] bg-white px-3 py-1.5 text-xs"
                        title="Quick internal status update. Open View to send a customer email."
                      >
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={columns.length + 3} className="px-4 py-12 text-center text-slate-500">No records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[86vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Admin details</p>
                <h3 className="text-2xl font-bold text-[#075c58]">Submission Details</h3>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full border px-4 py-2 text-sm font-bold">Close</button>
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
                    className="rounded-2xl bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/15 transition hover:-translate-y-0.5 hover:bg-[#064b48] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {statusBusy ? "Updating..." : notifyCustomer ? "Update status + notify customer" : "Update status only"}
                  </button>
                  <p className="max-w-xl text-xs leading-5 text-slate-500">
                    Payment link emails and payment received emails are handled separately. This button is for manual updates like Declined, Scheduled, Canceled, or Needs Info.
                  </p>
                </div>

                {statusMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{statusMessage}</p>}
                {statusError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{statusError}</p>}
              </div>
            )}

            {showCommercialQuotePanel && (
              <div className="mb-5 rounded-3xl border border-cyan-200 bg-cyan-50/45 p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Commercial quote workflow</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">Review, quote, then send the payment link</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      This section is a guide for Commercial Reset only. Start by reviewing the space details, enter the approved quote amount, save it, then use the green buttons to fill the Stripe payment sections below.
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
                    <p className="mt-1 text-xs leading-5 text-slate-600">Use a flat visit price, recurring plan, turnover price, or reviewed range.</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Step 3</p>
                    <p className="mt-1 text-sm font-black text-[#075c58]">Send first payment</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Copy the amount into checkout below, then create and email the Stripe link.</p>
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

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <button
                      type="button"
                      disabled={commercialQuoteBusy}
                      onClick={saveCommercialQuote}
                      className="rounded-2xl bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/15 transition hover:-translate-y-0.5 hover:bg-[#064b48] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {commercialQuoteBusy ? "Saving..." : "1. Save quote details"}
                    </button>
                    <button
                      type="button"
                      onClick={applyCommercialInitialToCheckout}
                      className="rounded-2xl border-2 border-[#075c58] bg-white px-5 py-3 text-sm font-black text-[#075c58] transition hover:-translate-y-0.5 hover:bg-[#f4ecdc]"
                    >
                      2. Fill first payment link
                    </button>
                    <button
                      type="button"
                      onClick={applyCommercialAdditionalToPayment}
                      className="rounded-2xl border-2 border-cyan-700 bg-white px-5 py-3 text-sm font-black text-cyan-800 transition hover:-translate-y-0.5 hover:bg-white/70"
                    >
                      Fill optional add-on link
                    </button>
                  </div>

                  {commercialQuoteMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{commercialQuoteMessage}</p>}
                  {commercialQuoteError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{commercialQuoteError}</p>}
                </div>
              </div>
            )}

            {showPaymentActions && (
              <div className="mb-5 rounded-3xl border border-[#d8c18f] bg-[#fbf6ea] p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">{selectedIsCommercial ? "Step 3 — first payment" : "Approval + payment"}</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">{selectedIsCommercial ? "Create the first Commercial Reset payment link" : "Create checkout after you approve the request"}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {selectedIsCommercial
                        ? "For Commercial Reset, use the amount you prepared above. Review the custom checkout details here, then create and email the Stripe payment link when you are ready."
                        : "This creates a Stripe Checkout Session tied to this request. Public checkout stays off; only admin can send payment after reviewing scope, service area, and availability."}
                    </p>
                    {selected.service === "laundry-rescue" && (
                      <p className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#075c58]">
                        Laundry Rescue first checkout is the deposit/minimum only. After dry weigh-in, use the final balance section below.
                      </p>
                    )}
                  </div>
                  {selectedIsCommercial ? (
                    <div className="rounded-2xl border border-[#d8c18f] bg-white px-4 py-3 text-sm font-bold text-[#075c58] lg:min-w-80">
                      Commercial uses a custom reviewed amount. Use the quote panel above to fill this section.
                    </div>
                  ) : (
                    <div className="grid min-w-72 gap-2">
                      <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Price mode</label>
                      <select
                        value={checkoutMode}
                        onChange={(e) => setCheckoutMode(e.target.value as CheckoutMode)}
                        className="rounded-2xl border border-[#d8c18f] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                      >
                        <option value="standard">Standard price</option>
                        <option value="founding">Founding / beta price</option>
                        <option value="custom">Custom initial amount</option>
                      </select>
                    </div>
                  )}
                </div>

                {isCustomCheckoutMode && (
                  <div className="mt-4 rounded-3xl border border-[#eadfc8] bg-white p-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">{selectedIsCommercial ? "First payment link" : "Custom initial checkout"}</p>
                      <h5 className="mt-1 text-base font-black text-[#075c58]">{selectedIsCommercial ? "Amount the customer pays before scheduling" : "Reviewed custom starting amount"}</h5>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {selectedIsCommercial
                          ? "This should match the approved Commercial Reset quote amount. It is the amount collected before the first visit, first turnover, or first recurring plan begins."
                          : "Use this when the first payment should not match the standard package price, such as a custom approved scope, special deposit, extra starting time, or service-area adjustment."}
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
                        placeholder={selectedIsCommercial ? "Example: Approved Commercial Reset quote. Add-ons or scope changes are reviewed before any additional charge." : "Example: Custom approved starting amount for 3.5 hours after request review. Any additional approved time or mileage would be billed separately."}
                        className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]"
                      />
                    </label>
                  </div>
                )}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    disabled={checkoutBusy}
                    onClick={() => createPaymentLink(true)}
                    className="rounded-2xl bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/15 transition hover:-translate-y-0.5 hover:bg-[#064b48] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkoutBusy
                      ? "Creating..."
                      : isCustomCheckoutMode
                        ? selectedIsCommercial ? "Create + email first payment link" : "Create + email custom link"
                        : selected.service === "laundry-rescue"
                          ? "Create + email deposit link"
                          : "Create + email checkout link"}
                  </button>
                  <button
                    type="button"
                    disabled={checkoutBusy}
                    onClick={() => createPaymentLink(false)}
                    className="rounded-2xl border-2 border-[#075c58] bg-white px-5 py-3 text-sm font-black text-[#075c58] transition hover:-translate-y-0.5 hover:bg-[#f4ecdc] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCustomCheckoutMode ? selectedIsCommercial ? "Create first payment link only" : "Create custom link only" : selected.service === "laundry-rescue" ? "Create deposit link only" : "Create link only"}
                  </button>
                </div>


                {selected.checkoutUrl && (
                  <div className="mt-4 rounded-2xl border border-[#eadfc8] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Current checkout link</p>
                    <p className="mt-2 break-all text-sm text-[#075c58]">{selected.checkoutUrl}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={selected.checkoutUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white">Open Stripe checkout</a>
                      <button type="button" onClick={() => copyToClipboard(selected.checkoutUrl || "")} className="rounded-full border border-[#075c58] px-4 py-2 text-xs font-black text-[#075c58]">Copy link</button>
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
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Laundry final balance</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">Bill the remaining balance after dry weigh-in</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Enter the dry weight, rate, add-ons, and deposit credit. NestHelper calculates the balance and creates a Stripe checkout link for the remaining amount only.
                    </p>
                  </div>
                  <StatusBadge status={String(selected.laundryPaymentStatus || selected.paymentStatus || selected.status || "New")} />
                </div>

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
                    Deposit credit
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
                    <p className="font-black uppercase tracking-[0.14em] text-[#b98a2f]">Laundry total</p>
                    <p className="mt-1 text-xl font-black text-[#075c58]">{formatMoney(laundrySubtotal)}</p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[#b98a2f]">Deposit credit</p>
                    <p className="mt-1 text-xl font-black text-[#075c58]">-{formatMoney(toNumber(laundryDepositCredit))}</p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[#b98a2f]">Balance due</p>
                    <p className="mt-1 text-xl font-black text-[#075c58]">{formatMoney(laundryBalanceDue)}</p>
                  </div>
                </div>

                <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                  Optional final balance note
                  <textarea
                    value={laundryFinalNote}
                    onChange={(e) => setLaundryFinalNote(e.target.value)}
                    placeholder="Example: 24 lbs dry weight, fragrance-free detergent, low heat dry. Deposit has already been credited."
                    rows={3}
                    className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]"
                  />
                </label>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    disabled={laundryFinalBusy}
                    onClick={() => createLaundryFinalBalance(true)}
                    className="rounded-2xl bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/15 transition hover:-translate-y-0.5 hover:bg-[#064b48] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {laundryFinalBusy ? "Creating..." : "Create + email final balance link"}
                  </button>
                  <button
                    type="button"
                    disabled={laundryFinalBusy}
                    onClick={() => createLaundryFinalBalance(false)}
                    className="rounded-2xl border-2 border-[#075c58] bg-white px-5 py-3 text-sm font-black text-[#075c58] transition hover:-translate-y-0.5 hover:bg-[#f4ecdc] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Create final balance link only
                  </button>
                </div>

                {selected.laundryFinalCheckoutUrl && (
                  <div className="mt-4 rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Current final balance checkout link</p>
                    <p className="mt-2 break-all text-sm text-[#075c58]">{selected.laundryFinalCheckoutUrl}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={selected.laundryFinalCheckoutUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white">Open final balance checkout</a>
                      <button type="button" onClick={() => copyLaundryLink(selected.laundryFinalCheckoutUrl || "")} className="rounded-full border border-[#075c58] px-4 py-2 text-xs font-black text-[#075c58]">Copy link</button>
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
                    className="rounded-2xl bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/15 transition hover:-translate-y-0.5 hover:bg-[#064b48] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {additionalPaymentBusy ? "Creating..." : "Create + email additional payment link"}
                  </button>
                  <button
                    type="button"
                    disabled={additionalPaymentBusy}
                    onClick={() => createAdditionalPayment(false)}
                    className="rounded-2xl border-2 border-[#075c58] bg-white px-5 py-3 text-sm font-black text-[#075c58] transition hover:-translate-y-0.5 hover:bg-[#f4ecdc] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Create additional link only
                  </button>
                </div>

                {selected.additionalPaymentCheckoutUrl && (
                  <div className="mt-4 rounded-2xl border border-[#eadfc8] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Current additional payment link</p>
                    <p className="mt-2 break-all text-sm text-[#075c58]">{selected.additionalPaymentCheckoutUrl}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={selected.additionalPaymentCheckoutUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#075c58] px-4 py-2 text-xs font-black text-white">Open additional checkout</a>
                      <button type="button" onClick={() => copyAdditionalPaymentLink(selected.additionalPaymentCheckoutUrl || "")} className="rounded-full border border-[#075c58] px-4 py-2 text-xs font-black text-[#075c58]">Copy link</button>
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
