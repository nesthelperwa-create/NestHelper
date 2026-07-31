"use client";

import { useEffect, useState } from "react";
import { Info, Loader2, ShieldAlert } from "lucide-react";
import { CustomerAuthCard, getUserToken, SignedInBadge, useCustomerAuth } from "@/components/smart-labels/SmartLabelsAuth";
import { SmartLabelsShell } from "@/components/smart-labels/SmartLabelsShell";

type DashboardResponse = {
  ok?: boolean;
  error?: string;
  summary: {
    purchasedLabels: number;
    claimedLabels: number;
    remainingLabels: number;
  };
};

export default function AccountPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const token = await getUserToken(user);
        const response = await fetch("/api/smart-labels/dashboard", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const result = await response.json().catch(() => null) as DashboardResponse | null;
        if (response.ok && result?.ok) setData(result);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <SmartLabelsShell title="Account" subtitle="Manage sign-in access for your Smart Label dashboard and review important privacy reminders.">
      {authLoading ? (
        <div className="grid place-items-center py-16"><div className="flex items-center gap-3 rounded-3xl bg-white px-5 py-4 font-black text-nest-teal shadow-soft"><Loader2 className="animate-spin" size={18} /> Loading account…</div></div>
      ) : !user ? (
        <CustomerAuthCard compact />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="grid gap-5">
            <SignedInBadge user={user} />
            <section className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-black text-nest-teal">Dashboard status</h2>
              {loading ? <p className="mt-3 text-sm font-semibold text-slate-500">Loading…</p> : (
                <div className="mt-4 grid gap-3">
                  <MiniStat label="Purchased labels" value={String(data?.summary.purchasedLabels || 0)} />
                  <MiniStat label="Added to dashboard" value={String(data?.summary.claimedLabels || 0)} />
                  <MiniStat label="Remaining to add" value={String(data?.summary.remainingLabels || 0)} />
                </div>
              )}
            </section>
          </div>
          <div className="grid gap-5">
            <section className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3 text-nest-teal"><Info size={20} /><h2 className="text-xl font-black">Helpful reminders</h2></div>
              <ul className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-600">
                <li className="rounded-2xl bg-[#fbf6ea] p-4">Scan a sticker with your phone camera, then tap <span className="font-black text-nest-teal">Add Label</span> if it is unclaimed.</li>
                <li className="rounded-2xl bg-[#fbf6ea] p-4">Use <span className="font-black text-nest-teal">Find My Item</span> to search label name, location, contents, and notes.</li>
                <li className="rounded-2xl bg-[#fbf6ea] p-4">Switch a label to <span className="font-black text-nest-teal">Lost &amp; Found</span> mode later if you want a finder-friendly public scan page.</li>
              </ul>
            </section>
            <section className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-5 shadow-soft">
              <div className="flex items-start gap-3 text-amber-800"><ShieldAlert size={22} className="mt-1 shrink-0" /><div><h2 className="text-xl font-black">Privacy warning</h2><p className="mt-2 text-sm font-semibold leading-6">Do not store passwords, financial information, security codes, or sensitive private information in label notes. Claimed labels keep contents private, but you should still avoid sensitive data.</p></div></div>
            </section>
          </div>
        </div>
      )}
    </SmartLabelsShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[1.2rem] border border-nest-gold/14 bg-[#fbf6ea] px-4 py-3"><p className="text-xs font-black uppercase tracking-[0.16em] text-nest-gold">{label}</p><p className="mt-1 text-2xl font-black text-nest-teal">{value}</p></div>;
}
