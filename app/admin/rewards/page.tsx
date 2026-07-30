"use client";

import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  Gift,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
  TicketCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { launchRewardPrizes, type LaunchRewardPrizeId } from "@/lib/launchRewards";

type RewardRecord = {
  id: string;
  participantId?: string;
  prizeId?: string;
  prizeTitle?: string;
  referenceCode?: string;
  status?: string;
  monthKey?: string;
  valueCents?: number;
  reservedRequestId?: string;
  expiresAtIso?: string;
  claimDeadlineIso?: string;
  createdAt?: { toDate?: () => Date };
  updatedAt?: { toDate?: () => Date };
};

type GrandMonthRecord = {
  id: string;
  monthKey?: string;
  winnerCount?: number;
  status?: string;
  winnerRewardId?: string;
  winnerParticipantId?: string;
};

type TestModeType = "quick" | "full";

type TestModeState = {
  enabled: boolean;
  prizeId: LaunchRewardPrizeId;
  prizeTitle: string;
  testType: TestModeType;
  fullVerified: boolean;
  expiresAt: string | null;
};

function isLaunchRewardPrizeId(value: unknown): value is LaunchRewardPrizeId {
  return typeof value === "string" && launchRewardPrizes.some((prize) => prize.id === value);
}

function formatDate(value?: { toDate?: () => Date } | string) {
  const date = typeof value === "string" ? new Date(value) : value?.toDate?.();
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString() : "—";
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [grandMonths, setGrandMonths] = useState<GrandMonthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState("");
  const [testMode, setTestMode] = useState<TestModeState>({
    enabled: false,
    prizeId: launchRewardPrizes[0].id,
    prizeTitle: launchRewardPrizes[0].title,
    testType: "quick",
    fullVerified: false,
    expiresAt: null,
  });
  const [selectedTestPrizeId, setSelectedTestPrizeId] = useState<LaunchRewardPrizeId>(launchRewardPrizes[0].id);
  const [selectedTestType, setSelectedTestType] = useState<TestModeType>("quick");
  const [testBusy, setTestBusy] = useState(false);

  useEffect(() => {
    const rewardsQuery = query(collection(firestoreDb, "launchRewards"), orderBy("createdAt", "desc"), limit(100));
    const monthsQuery = query(collection(firestoreDb, "launchRewardGrandPrizeMonths"), orderBy("monthKey", "desc"), limit(18));
    const unsubRewards = onSnapshot(rewardsQuery, (snapshot) => {
      setRewards(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<RewardRecord, "id">) })));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setMessage("Unable to load Launch Rewards. Confirm Firestore rules were deployed.");
      setLoading(false);
    });
    const unsubMonths = onSnapshot(monthsQuery, (snapshot) => {
      setGrandMonths(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<GrandMonthRecord, "id">) })));
    });
    return () => { unsubRewards(); unsubMonths(); };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/admin/rewards-test-mode", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.ok) return;
        const resultPrizeId = isLaunchRewardPrizeId(result.prizeId)
          ? result.prizeId
          : launchRewardPrizes[0].id;
        const next: TestModeState = {
          enabled: result.enabled === true,
          prizeId: resultPrizeId,
          prizeTitle: String(result.prizeTitle || launchRewardPrizes[0].title),
          testType: result.testType === "full" ? "full" : "quick",
          fullVerified: result.fullVerified === true,
          expiresAt: result.expiresAt ? String(result.expiresAt) : null,
        };
        setTestMode(next);
        setSelectedTestPrizeId(resultPrizeId);
        setSelectedTestType(next.testType);
      } catch (error) {
        console.error("Unable to load Launch Rewards test mode", error);
      }
    });
    return unsubscribe;
  }, []);

  const stats = useMemo(() => ({
    total: rewards.length,
    issued: rewards.filter((reward) => ["issued", "approved"].includes(reward.status || "")).length,
    pending: rewards.filter((reward) => ["pending_verification", "claim_submitted", "reserved"].includes(reward.status || "")).length,
    redeemed: rewards.filter((reward) => reward.status === "redeemed").length,
  }), [rewards]);

  async function updateTestMode(action: "enable" | "update" | "reset" | "disable") {
    setTestBusy(true);
    setMessage("");
    try {
      const token = await firebaseAuth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Sign in to Admin again.");
      const response = await fetch("/api/admin/rewards-test-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, prizeId: selectedTestPrizeId, testType: selectedTestType }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to update test mode.");
      const resultPrizeId = isLaunchRewardPrizeId(result.prizeId)
        ? result.prizeId
        : selectedTestPrizeId;
      const next: TestModeState = {
        enabled: result.enabled === true,
        prizeId: resultPrizeId,
        prizeTitle: String(result.prizeTitle || launchRewardPrizes.find((prize) => prize.id === resultPrizeId)?.title || "Test prize"),
        testType: result.testType === "full" ? "full" : "quick",
        fullVerified: result.fullVerified === true,
        expiresAt: result.expiresAt ? String(result.expiresAt) : null,
      };
      setTestMode(next);
      setSelectedTestPrizeId(resultPrizeId);
      setSelectedTestType(next.testType);
      setMessage(action === "disable"
        ? "Prelaunch test mode is off for this browser."
        : next.testType === "full"
          ? `Full verification test is on. Complete the real SMS and email-code steps, then the test wheel will land on: ${next.prizeTitle}.`
          : `Quick wheel preview is on. The wheel will land on: ${next.prizeTitle}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update test mode.");
    } finally {
      setTestBusy(false);
    }
  }

  async function updateReward(reward: RewardRecord, action: "approve" | "redeem" | "void" | "release") {
    const reason = ["void", "release"].includes(action)
      ? window.prompt(action === "void" ? "Why is this reward being voided?" : "Why is this reservation being released?")?.trim() || ""
      : "";
    if (["void", "release"].includes(action) && !reason) return;
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${reward.referenceCode || reward.id}?`)) return;

    setWorkingId(reward.id);
    setMessage("");
    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/update-launch-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rewardId: reward.id, action, reason }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Reward update failed.");
      setMessage(`Reward ${reward.referenceCode || reward.id} updated: ${action}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reward update failed.");
    } finally {
      setWorkingId("");
    }
  }

  return (
    <AdminShell>
      <div className="grid gap-6">
        <section className="rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3"><Gift className="mt-1 text-[#b98a2f]" /><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b98a2f]">Promotion control</p><h2 className="text-3xl font-bold text-[#075c58]">Launch Rewards</h2><p className="mt-2 text-sm text-slate-600">Review winners, reservations, redemptions, and monthly grand-prize status. Nothing here sends a customer message automatically.</p></div></div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Total", stats.total], ["Available", stats.issued], ["Pending", stats.pending], ["Redeemed", stats.redeemed]].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-[#f6f1e7] p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-[#075c58]">{value}</p></div>)}
          </div>
          {message && <div className="mt-5 rounded-2xl bg-[#e9f4f1] p-4 font-semibold text-[#075c58]">{message}</div>}
        </section>

        <section className="rounded-[2rem] border border-amber-300 bg-amber-50 p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <FlaskConical className="mt-1 shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Admin-only preview</p>
              <h3 className="mt-1 text-2xl font-bold text-[#075c58]">Prelaunch wheel test</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-950/75">This enables the live wheel only in this browser for two hours. Test results are stored separately, cannot be redeemed, and never count toward the monthly Parent Reset limit.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-bold text-[#075c58]">
              Test experience
              <select
                value={selectedTestType}
                onChange={(event) => setSelectedTestType(event.target.value === "full" ? "full" : "quick")}
                className="mt-2 w-full rounded-xl border border-amber-300 bg-white px-3 py-3 text-base font-semibold text-slate-900"
              >
                <option value="quick">Quick wheel preview — skip verification</option>
                <option value="full">Full verification test — real SMS + email codes</option>
              </select>
              <span className="mt-2 block text-xs font-medium leading-5 text-amber-950/65">
                {selectedTestType === "full"
                  ? "Uses your real phone and email to test Firebase phone verification, the invisible security check, the NestHelper email code, and the test spin. No real participant or reward is created."
                  : "Jumps straight to the wheel so you can repeatedly preview every prize animation."}
              </span>
            </label>

            <label className="text-sm font-bold text-[#075c58]">
              Prize the test wheel should land on
              <select
                value={selectedTestPrizeId}
                onChange={(event) => {
                  if (isLaunchRewardPrizeId(event.target.value)) {
                    setSelectedTestPrizeId(event.target.value);
                  }
                }}
                className="mt-2 w-full rounded-xl border border-amber-300 bg-white px-3 py-3 text-base font-semibold text-slate-900"
              >
                {launchRewardPrizes.map((prize) => <option key={prize.id} value={prize.id}>{prize.title}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={testBusy}
              onClick={() => updateTestMode(testMode.enabled ? "update" : "enable")}
              className="cursor-pointer rounded-full bg-[#075c58] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064c49] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testBusy ? "Saving…" : testMode.enabled ? "Update test settings" : "Enable test mode"}
            </button>
            {testMode.enabled && <button type="button" disabled={testBusy} onClick={() => updateTestMode("reset")} className="cursor-pointer rounded-full border border-[#075c58]/25 bg-white px-5 py-3 text-sm font-bold text-[#075c58] transition hover:bg-[#eef7f5] disabled:cursor-not-allowed disabled:opacity-60">Start fresh test session</button>}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-[#075c58]">Status: {testMode.enabled ? "Enabled for this browser" : "Off"}</p>
              {testMode.enabled && (
                <p className="mt-1 text-sm text-slate-600">
                  Mode: {testMode.testType === "full" ? "Full verification test" : "Quick wheel preview"}
                  {testMode.testType === "full" ? ` · Verification ${testMode.fullVerified ? "complete" : "not completed yet"}` : ""}
                  {` · Selected result: ${testMode.prizeTitle}`}
                  {testMode.expiresAt ? ` · Expires ${formatDate(testMode.expiresAt)}` : ""}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {testMode.enabled && <Link href="/rewards" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-sm font-bold text-white"><ExternalLink size={16} /> Open test wheel</Link>}
              {testMode.enabled && <button type="button" disabled={testBusy} onClick={() => updateTestMode("disable")} className="rounded-full border border-rose-300 bg-white px-5 py-3 text-sm font-bold text-rose-700 disabled:opacity-60">Turn off test mode</button>}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-sm sm:p-7">
          <h3 className="text-xl font-bold text-[#075c58]">Monthly Parent Reset status</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {grandMonths.length ? grandMonths.map((month) => <div key={month.id} className="rounded-2xl border border-[#eadfc8] bg-[#fbf6ea] p-4"><p className="font-bold text-[#075c58]">{month.monthKey || month.id}</p><p className="mt-1 text-sm text-slate-600">Status: {month.status || "available"}</p><p className="text-sm text-slate-600">Winner count: {month.winnerCount || 0}</p>{month.winnerRewardId && <p className="mt-2 break-all text-xs text-slate-500">Reward: {month.winnerRewardId}</p>}</div>) : <p className="text-sm text-slate-500">No monthly grand-prize records yet. The first record is created when a rare prize is selected.</p>}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#eadfc8] bg-white p-4 shadow-sm sm:p-7">
          <div className="flex items-center gap-2"><TicketCheck className="text-[#b98a2f]" /><h3 className="text-xl font-bold text-[#075c58]">Latest rewards</h3></div>
          {loading ? <div className="grid place-items-center py-16 text-[#075c58]"><LoaderCircle className="animate-spin" /></div> : (
            <div className="mt-5 grid gap-4">
              {rewards.map((reward) => {
                const working = workingId === reward.id;
                return <article key={reward.id} className="rounded-2xl border border-[#eadfc8] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-[#075c58]">{reward.prizeTitle || reward.prizeId}</h4><span className="rounded-full bg-[#e9f4f1] px-2.5 py-1 text-xs font-bold text-[#075c58]">{reward.status || "issued"}</span></div><p className="mt-2 text-sm text-slate-600">Code: <strong>{reward.referenceCode || "—"}</strong> · Value: ${((reward.valueCents || 0) / 100).toFixed(2)}</p><p className="mt-1 break-all text-xs text-slate-500">Participant: {reward.participantId || "—"}</p><p className="mt-1 text-xs text-slate-500">Created: {formatDate(reward.createdAt)} · Expires: {formatDate(reward.expiresAtIso)}</p>{reward.reservedRequestId && <p className="mt-1 break-all text-xs font-semibold text-amber-700">Reserved request: {reward.reservedRequestId}</p>}</div>
                    <div className="flex flex-wrap gap-2">
                      {reward.prizeId === "parent-reset-grand" && ["pending_verification", "claim_submitted"].includes(reward.status || "") && <button disabled={working} onClick={() => updateReward(reward, "approve")} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><CheckCircle2 size={14} /> Approve</button>}
                      {((reward.prizeId === "parent-reset-grand" && reward.status === "approved") || (reward.prizeId !== "parent-reset-grand" && ["issued", "approved", "reserved"].includes(reward.status || ""))) && <button disabled={working} onClick={() => updateReward(reward, "redeem")} className="inline-flex items-center gap-1 rounded-full bg-[#075c58] px-3 py-2 text-xs font-bold text-white"><CheckCircle2 size={14} /> Redeem</button>}
                      {reward.status === "reserved" && <button disabled={working} onClick={() => updateReward(reward, "release")} className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800"><RotateCcw size={14} /> Release</button>}
                      {!["voided", "redeemed"].includes(reward.status || "") && <button disabled={working} onClick={() => updateReward(reward, "void")} className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700"><XCircle size={14} /> Void</button>}
                    </div>
                  </div>
                </article>;
              })}
              {!rewards.length && <p className="py-8 text-center text-sm text-slate-500">No Launch Rewards have been issued yet.</p>}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><div className="flex gap-3"><ShieldAlert className="mt-0.5 shrink-0" /><p><strong>Grand-prize control:</strong> Approve only after identity, household, service address, service area, and standard Parent Reset scope are verified. Voiding the current grand-prize reward automatically reopens that calendar month so another eligible spin may win.</p></div></section>
      </div>
    </AdminShell>
  );
}
