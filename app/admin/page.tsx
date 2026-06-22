"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { firestoreDb } from "@/lib/firebaseClient";

type OverviewCard = {
  id: string;
  collection: string;
  label: string;
  href: string;
  status?: string;
  statusField?: string;
};

const cards: OverviewCard[] = [
  { id: "service-new", collection: "serviceRequests", label: "New Service Requests", href: "/admin/requests" },
  { id: "helpers-new", collection: "helperApplications", label: "New Helper Applications", href: "/admin/helpers" },
  { id: "helper-ops-review", collection: "serviceRequests", label: "Helper Ops Review", href: "/admin/helper-ops", status: "Submitted by helper", statusField: "helperOpsPayrollStatus" },
  { id: "partners-new", collection: "partnerApplications", label: "New Partner Applications", href: "/admin/partners" },
  { id: "marketing-new", collection: "marketingOutreach", label: "Marketing Leads", href: "/admin/marketing", status: "New lead" },
  { id: "smart-labels-ready", collection: "smartLabelBatches", label: "Smart Label Sheets", href: "/admin/smart-labels", status: "Ready" },
  { id: "contact-new", collection: "contactMessages", label: "New Contact Messages", href: "/admin/contact" },
];

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubs = cards.map((card) => {
      const statusField = card.statusField || "status";
      const statusValue = card.status || "New";
      return onSnapshot(query(collection(firestoreDb, card.collection), where(statusField, "==", statusValue)), (snap) => {
        setCounts((prev) => ({ ...prev, [card.id]: snap.size }));
      });
    });
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <AdminShell>
      <section className="space-y-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#075c58] to-[#0b7b73] p-8 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#f1c96b]">Command Center</p>
          <h2 className="mt-2 text-4xl font-bold">Welcome back</h2>
          <p className="mt-3 max-w-2xl text-white/80">Review new family requests, helper applications, partner providers, smart label sheets, and contact messages from one private dashboard.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <a key={card.id} href={card.href} className="group rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-lg shadow-[#075c58]/5 transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-sm font-bold text-slate-500">{card.label}</p>
              <p className="mt-3 text-5xl font-bold text-[#075c58]">{counts[card.id] ?? 0}</p>
              <p className="mt-4 text-sm font-semibold text-[#b98a2f] group-hover:text-[#075c58]">Open →</p>
            </a>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
