"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { firestoreDb } from "@/lib/firebaseClient";

const cards = [
  { collection: "serviceRequests", label: "New Service Requests", href: "/admin/requests" },
  { collection: "helperApplications", label: "New Helper Applications", href: "/admin/helpers" },
  { collection: "serviceRequests", label: "Helper Ops Review", href: "/admin/helper-ops", status: "Submitted by helper" },
  { collection: "partnerApplications", label: "New Partner Applications", href: "/admin/partners" },
  { collection: "contactMessages", label: "New Contact Messages", href: "/admin/contact" },
];

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubs = cards.map((card) =>
      onSnapshot(query(collection(firestoreDb, card.collection), where(card.status ? "helperOpsPayrollStatus" : "status", "==", card.status || "New")), (snap) => {
        setCounts((prev) => ({ ...prev, [card.collection]: snap.size }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <AdminShell>
      <section className="space-y-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#075c58] to-[#0b7b73] p-8 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#f1c96b]">Command Center</p>
          <h2 className="mt-2 text-4xl font-bold">Welcome back</h2>
          <p className="mt-3 max-w-2xl text-white/80">Review new family requests, helper applications, partner providers, and contact messages from one private dashboard.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <a key={card.collection} href={card.href} className="group rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-lg shadow-[#075c58]/5 transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-sm font-bold text-slate-500">{card.label}</p>
              <p className="mt-3 text-5xl font-bold text-[#075c58]">{counts[card.collection] ?? 0}</p>
              <p className="mt-4 text-sm font-semibold text-[#b98a2f] group-hover:text-[#075c58]">Open →</p>
            </a>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}



