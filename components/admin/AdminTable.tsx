"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import StatusBadge from "./StatusBadge";

type AdminDoc = { id: string; status?: string; createdAt?: unknown; checkoutUrl?: string; promoCode?: string; [key: string]: any };
type CheckoutMode = "standard" | "founding";

function formatDate(value: unknown) {
  if (!value) return "—";
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") return value.toDate().toLocaleString();
  return String(value);
}

function formatValue(key: string, value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key.toLowerCase().includes("created") || key.toLowerCase().includes("updated") || key.toLowerCase().includes("paidat")) return formatDate(value);
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function guessCheckoutMode(item: AdminDoc | null): CheckoutMode {
  const promo = String(item?.promoCode || "").toUpperCase();
  return promo.includes("FOUNDING") || promo.includes("BETA") ? "founding" : "standard";
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
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [statusValue, setStatusValue] = useState("New");
  const [statusNote, setStatusNote] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    const q = query(collection(firestoreDb, collectionName), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [collectionName]);

  useEffect(() => {
    const nextStatus = selected?.status || "New";
    setCheckoutMode(guessCheckoutMode(selected));
    setCheckoutMessage("");
    setCheckoutError("");
    setStatusValue(nextStatus);
    setStatusNote("");
    setNotifyCustomer(shouldNotifyByDefault(nextStatus));
    setStatusMessage("");
    setStatusError("");
  }, [selected?.id]);

  const filtered = useMemo(() => {
    const term = filter.toLowerCase().trim();
    if (!term) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(term));
  }, [items, filter]);

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

  async function createPaymentLink(sendEmail: boolean) {
    if (!selected) return;
    setCheckoutBusy(true);
    setCheckoutMessage("");
    setCheckoutError("");

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: selected.id, mode: checkoutMode, sendEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to create checkout link.");
      }

      setSelected((prev) => prev ? { ...prev, checkoutUrl: data.url, checkoutSessionId: data.sessionId, status: "Checkout Sent", paymentStatus: "Checkout Sent" } : prev);
      setStatusValue("Checkout Sent");
      setCheckoutMessage(data.emailError || (data.emailSent ? "Checkout link created and emailed to the customer." : "Checkout link created. Copy it and send it manually."));
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to create checkout link.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  const showPaymentActions = enablePaymentActions && collectionName === "serviceRequests" && selected;
  const showCustomerStatusActions = collectionName === "serviceRequests" && selected;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Admin</p>
          <h2 className="text-3xl font-bold text-[#075c58]">{title}</h2>
          <p className="mt-1 text-slate-600">{filtered.length} records</p>
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
                <tr key={item.id} className="hover:bg-[#fbf6ea]">
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  {columns.map((col) => (
                    <td key={col.key} className="max-w-[220px] truncate px-4 py-4 text-slate-700">{formatValue(col.key, item[col.key])}</td>
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

            {showPaymentActions && (
              <div className="mb-5 rounded-3xl border border-[#d8c18f] bg-[#fbf6ea] p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Approval + payment</p>
                    <h4 className="mt-1 text-xl font-black text-[#075c58]">Create checkout after you approve the request</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      This creates a Stripe Checkout Session tied to this request. Public checkout stays off; only admin can send payment after reviewing scope, service area, and availability.
                    </p>
                  </div>
                  <div className="grid min-w-72 gap-2">
                    <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Price mode</label>
                    <select
                      value={checkoutMode}
                      onChange={(e) => setCheckoutMode(e.target.value as CheckoutMode)}
                      className="rounded-2xl border border-[#d8c18f] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]"
                    >
                      <option value="standard">Standard price</option>
                      <option value="founding">Founding / beta price</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    disabled={checkoutBusy}
                    onClick={() => createPaymentLink(true)}
                    className="rounded-2xl bg-[#075c58] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#075c58]/15 transition hover:-translate-y-0.5 hover:bg-[#064b48] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkoutBusy ? "Creating..." : "Create + email checkout link"}
                  </button>
                  <button
                    type="button"
                    disabled={checkoutBusy}
                    onClick={() => createPaymentLink(false)}
                    className="rounded-2xl border-2 border-[#075c58] bg-white px-5 py-3 text-sm font-black text-[#075c58] transition hover:-translate-y-0.5 hover:bg-[#f4ecdc] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Create link only
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

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(selected).map(([key, value]) => (
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
