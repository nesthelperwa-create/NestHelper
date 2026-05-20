"use client";

import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import StatusBadge from "./StatusBadge";

type AdminDoc = { id: string; status?: string; createdAt?: Timestamp; [key: string]: any };

function formatDate(value: unknown) {
  if (!value) return "—";
  if (value instanceof Timestamp) return value.toDate().toLocaleString();
  if (typeof value === "object" && value && "toDate" in value) return (value as Timestamp).toDate().toLocaleString();
  return String(value);
}

export default function AdminTable({
  collectionName,
  title,
  columns,
  statuses,
}: {
  collectionName: string;
  title: string;
  columns: { key: string; label: string }[];
  statuses: string[];
}) {
  const [items, setItems] = useState<AdminDoc[]>([]);
  const [selected, setSelected] = useState<AdminDoc | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const q = query(collection(firestoreDb, collectionName), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [collectionName]);

  const filtered = useMemo(() => {
    const term = filter.toLowerCase().trim();
    if (!term) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(term));
  }, [items, filter]);

  async function updateStatus(item: AdminDoc, status: string) {
    const token = await firebaseAuth.currentUser?.getIdToken();
    await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ collection: collectionName, id: item.id, status }),
    });
  }

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
                    <td key={col.key} className="max-w-[220px] truncate px-4 py-4 text-slate-700">{String(item[col.key] ?? "—")}</td>
                  ))}
                  <td className="px-4 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(item)} className="rounded-full bg-[#075c58] px-3 py-1.5 text-xs font-bold text-white">View</button>
                      <select
                        value={item.status || "New"}
                        onChange={(e) => updateStatus(item, e.target.value)}
                        className="rounded-full border border-[#eadfc8] bg-white px-3 py-1.5 text-xs"
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
          <div className="max-h-[86vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-bold text-[#075c58]">Submission Details</h3>
              <button onClick={() => setSelected(null)} className="rounded-full border px-4 py-2 text-sm font-bold">Close</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(selected).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#b98a2f]">{key}</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{key.toLowerCase().includes("created") || key.toLowerCase().includes("updated") ? formatDate(value) : String(value ?? "—")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
