"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Gift,
  Heart,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  RotateCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  TicketCheck,
  X,
} from "lucide-react";
import {
  formatLaunchDate,
  formatRewardsDate,
  getLaunchRewardsLaunchMs,
  launchRewardPrizes,
  LAUNCH_REWARDS_MAX_SPINS_PER_MONTH,
} from "@/lib/launchRewards";
import {
  getRewardsAppCheckHeader,
  prepareRewardsAppCheck,
  prepareRewardsFirebaseAuth,
  rewardsFirebaseAuth,
} from "@/lib/firebaseRewardsClient";
import { siteConfig } from "@/lib/siteConfig";

type RewardSummary = {
  id: string;
  prizeId: string;
  title: string;
  description: string;
  customerMessage: string;
  referenceCode: string;
  status: string;
  issuedAt: string;
  expiresAt: string;
  claimDeadline: string;
  publicToken: string;
  eligibleServiceIds: string[];
  requiresManualVerification: boolean;
  useHref: string;
  testOnly?: boolean;
};

type StatusData = {
  ok: boolean;
  phase: "prelaunch" | "live" | "ended";
  launchAt: string;
  endAt: string;
  verified: boolean;
  grandPrizeAvailable: boolean;
  testMode?: boolean;
  actualPhase?: "prelaunch" | "live" | "ended";
  testModeExpiresAt?: string;
  testPrizeId?: string;
  testPrizeTitle?: string;
  monthKey?: string;
  participant?: {
    firstName: string;
    maskedEmail: string;
    maskedPhone: string;
    zip: string;
  };
  spinsThisMonth?: number;
  spinsRemainingThisMonth?: number;
  maxSpinsPerMonth?: number;
  nextEligibleSpinAt?: string | null;
  canSpin?: boolean;
  rewards?: RewardSummary[];
  error?: string;
};

type SpinResult = {
  prizeId: string;
  prizeIndex: number;
  title: string;
  description: string;
  customerMessage: string;
  referenceCode: string;
  status: string;
  publicToken: string;
  expiresAt: string;
  claimDeadline: string;
  requiresManualVerification: boolean;
  useHref: string;
  testOnly?: boolean;
};

const segmentColors = [
  "#005d56",
  "#e7bd59",
  "#127e74",
  "#fff2d4",
  "#0b6b63",
  "#d6eadf",
  "#c18f37",
];

const wheelLabelLines: Record<string, string[]> = {
  "laundry-10": ["$10 OFF", "LAUNDRY"],
  "parent-reset-15": ["$15 OFF", "PARENT RESET"],
  "nesthelper-credit-25": ["$25", "NESTHELPER CREDIT"],
  "family-service-25": ["$25 OFF", "FAMILY SERVICE"],
  "smart-label-starter": ["FREE", "SMART LABELS"],
  "organizing-add-on": ["FREE", "ORGANIZING", "ADD-ON"],
  "parent-reset-grand": ["FREE 3-HOUR", "PARENT RESET"],
};

const wheelLabelRotations = [18, 7, -18, 0, 18, -7, -18];
const WHEEL_CENTER = 500;
const WHEEL_RADIUS = 466;
const WHEEL_LABEL_RADIUS = 326;

function wheelPoint(angleDegrees: number, radius: number) {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: WHEEL_CENTER + Math.sin(radians) * radius,
    y: WHEEL_CENTER - Math.cos(radians) * radius,
  };
}

function wheelSegmentPath(index: number, total: number) {
  const segmentAngle = 360 / total;
  const start = wheelPoint(index * segmentAngle, WHEEL_RADIUS);
  const end = wheelPoint((index + 1) * segmentAngle, WHEEL_RADIUS);
  return `M ${WHEEL_CENTER} ${WHEEL_CENTER} L ${start.x} ${start.y} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 0 1 ${end.x} ${end.y} Z`;
}

function toE164(value: string) {
  const digits = value.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 ? `+1${ten}` : "";
}

function humanFirebaseError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code || "") : "";
  if (code.includes("invalid-phone-number")) return "Enter a valid U.S. mobile phone number.";
  if (code.includes("too-many-requests")) return "Too many verification texts were requested. Please wait and try again.";
  if (code.includes("invalid-verification-code")) return "That text-message code is not correct.";
  if (code.includes("code-expired")) return "That text-message code expired. Request a new one.";
  if (code.includes("captcha-check-failed")) return "The security check could not be completed. Refresh and try again.";
  if (code.includes("operation-not-allowed")) return "Phone verification is not enabled yet. NestHelper needs to enable it in Firebase before launch.";
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function Countdown({ targetMs, compact = false }: { targetMs: number; compact?: boolean }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetMs - Date.now()));

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, targetMs - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetMs]);

  const values = useMemo(() => {
    const totalSeconds = Math.floor(remaining / 1000);
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, [remaining]);

  if (compact) {
    if (!remaining) return <span>Ready now</span>;
    return <span>{values.days ? `${values.days}d ` : ""}{String(values.hours).padStart(2, "0")}h {String(values.minutes).padStart(2, "0")}m</span>;
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Countdown to Launch Rewards">
      {[
        ["Days", values.days],
        ["Hours", values.hours],
        ["Minutes", values.minutes],
        ["Seconds", values.seconds],
      ].map(([label, value]) => (
        <div key={String(label)} className="rounded-2xl border border-white/30 bg-white/12 px-2 py-3 text-center backdrop-blur sm:px-4 sm:py-4">
          <div className="text-2xl font-black text-white sm:text-4xl">{String(value).padStart(2, "0")}</div>
          <div className="mt-1 text-[0.62rem] font-black uppercase tracking-[0.13em] text-white/75 sm:text-xs">{label}</div>
        </div>
      ))}
    </div>
  );
}

function PrizeWheel({
  rotation,
  spinning,
  busy,
  phase,
  verified,
  canSpin,
  testMode,
  nextSpinMs,
  monthlyLimitReached,
  onSpin,
  onVerify,
  onAnimationComplete,
}: {
  rotation: number;
  spinning: boolean;
  busy: boolean;
  phase: StatusData["phase"];
  verified: boolean;
  canSpin: boolean;
  testMode: boolean;
  nextSpinMs: number;
  monthlyLimitReached: boolean;
  onSpin: () => void;
  onVerify: () => void;
  onAnimationComplete: () => void;
}) {
  const centerActionable = phase === "live" && (verified ? canSpin : true) && !busy && !spinning;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[31rem] select-none" aria-label="NestHelper Launch Rewards wheel">
      <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1 drop-shadow-lg" aria-hidden="true">
        <div className="h-0 w-0 border-x-[18px] border-t-[34px] border-x-transparent border-t-nest-gold2 sm:border-x-[22px] sm:border-t-[42px]" />
      </div>
      <div className={`absolute inset-0 rounded-full bg-nest-gold/25 blur-2xl transition-opacity ${spinning ? "opacity-90" : "opacity-45"}`} />
      <div className="absolute inset-[1.5%] rounded-full border-[7px] border-nest-gold bg-[#f9df91] p-[2.6%] shadow-[0_22px_70px_rgba(0,63,59,0.28),inset_0_0_0_3px_rgba(255,255,255,0.7)] sm:border-[10px]">
        <motion.div
          className="relative h-full w-full overflow-hidden rounded-full border-4 border-white/75 bg-nest-teal shadow-inner"
          animate={{ rotate: rotation }}
          transition={spinning ? { duration: 5.6, ease: [0.08, 0.62, 0.16, 1] } : { duration: 0 }}
          onAnimationComplete={onAnimationComplete}
        >
          <svg viewBox="0 0 1000 1000" className="h-full w-full" role="img" aria-label="Seven-segment NestHelper prize wheel">
            <defs>
              <filter id="wheelTextShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#003f3b" floodOpacity="0.34" />
              </filter>
              <radialGradient id="wheelSheen" cx="35%" cy="24%" r="76%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="100%" stopColor="#003f3b" stopOpacity="0.12" />
              </radialGradient>
            </defs>

            {launchRewardPrizes.map((prize, index) => {
              const segmentAngle = 360 / launchRewardPrizes.length;
              const centerAngle = segmentAngle * (index + 0.5);
              const labelPoint = wheelPoint(centerAngle, WHEEL_LABEL_RADIUS);
              const lines = wheelLabelLines[prize.id] || [prize.shortLabel];
              const lineSpacing = lines.length === 3 ? 31 : 36;
              const startY = -((lines.length - 1) * lineSpacing) / 2;
              const lightSegment = [1, 3, 5].includes(index);
              const textColor = lightSegment ? "#004f49" : "#fffaf0";

              return (
                <g key={prize.id}>
                  <path
                    d={wheelSegmentPath(index, launchRewardPrizes.length)}
                    fill={segmentColors[index]}
                    stroke="rgba(255,255,255,0.78)"
                    strokeWidth="5"
                    strokeLinejoin="round"
                  />
                  <g transform={`translate(${labelPoint.x} ${labelPoint.y}) rotate(${wheelLabelRotations[index]})`}>
                    <text
                      textAnchor="middle"
                      fill={textColor}
                      fontFamily="Arial, Helvetica, sans-serif"
                      fontWeight="900"
                      letterSpacing="-0.6"
                      filter="url(#wheelTextShadow)"
                    >
                      {lines.map((line, lineIndex) => (
                        <tspan
                          key={line}
                          x="0"
                          y={startY + lineIndex * lineSpacing}
                          fontSize={lineIndex === 0 ? (lines.length === 3 ? 29 : 33) : 27}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                </g>
              );
            })}

            <circle cx="500" cy="500" r="466" fill="url(#wheelSheen)" pointerEvents="none" />
            <circle cx="500" cy="500" r="151" fill="#fffaf0" stroke="#d4a33f" strokeWidth="14" />
            <circle cx="500" cy="500" r="137" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="4" />
          </svg>
        </motion.div>

        <button
          type="button"
          onClick={verified ? onSpin : onVerify}
          disabled={!centerActionable}
          className={`focus-ring absolute left-1/2 top-1/2 z-20 flex h-[29%] w-[29%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[5px] border-nest-gold bg-white px-2 text-center text-nest-teal shadow-[0_12px_32px_rgba(0,63,59,0.3)] transition sm:border-[7px] ${centerActionable ? "cursor-pointer hover:scale-[1.035] hover:bg-nest-cream active:scale-[0.98]" : "cursor-default"}`}
          aria-label={verified && canSpin ? (testMode ? "Run test spin" : "Spin the prize wheel") : undefined}
        >
          {spinning ? (
            <>
              <RotateCw className="h-5 w-5 animate-spin text-nest-gold sm:h-7 sm:w-7" />
              <span className="mt-1 text-[0.58rem] font-black uppercase tracking-[0.08em] sm:text-xs">Spinning</span>
            </>
          ) : busy ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin text-nest-gold sm:h-7 sm:w-7" />
              <span className="mt-1 text-[0.5rem] font-black uppercase tracking-[0.06em] sm:text-[0.68rem]">Preparing</span>
            </>
          ) : phase === "prelaunch" ? (
            <>
              <CalendarClock className="h-5 w-5 text-nest-gold sm:h-7 sm:w-7" />
              <span className="mt-1 text-[0.55rem] font-black uppercase tracking-[0.08em] sm:text-xs">Opens</span>
              <span className="text-[0.58rem] font-black uppercase text-nest-gold sm:text-xs">Aug 5</span>
            </>
          ) : phase === "ended" ? (
            <>
              <Gift className="h-5 w-5 text-nest-gold sm:h-7 sm:w-7" />
              <span className="mt-1 text-[0.55rem] font-black uppercase tracking-[0.08em] sm:text-xs">Promotion</span>
              <span className="text-[0.58rem] font-black uppercase text-nest-gold sm:text-xs">Ended</span>
            </>
          ) : !verified ? (
            <>
              <LockKeyhole className="h-5 w-5 text-nest-gold sm:h-7 sm:w-7" />
              <span className="mt-1 text-[0.62rem] font-black uppercase tracking-[0.08em] sm:text-sm">Verify</span>
              <span className="text-[0.52rem] font-black uppercase text-nest-gold sm:text-[0.68rem]">To spin</span>
            </>
          ) : canSpin ? (
            <>
              <Sparkles className="h-5 w-5 text-nest-gold sm:h-7 sm:w-7" />
              <span className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.08em] sm:text-base">{testMode ? "Test spin" : "Spin"}</span>
              <span className="text-[0.45rem] font-black uppercase tracking-[0.08em] text-nest-gold sm:text-[0.6rem]">Tap here</span>
            </>
          ) : monthlyLimitReached ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-nest-gold sm:h-7 sm:w-7" />
              <span className="mt-1 text-[0.5rem] font-black uppercase tracking-[0.06em] sm:text-[0.68rem]">Monthly</span>
              <span className="text-[0.55rem] font-black uppercase text-nest-gold sm:text-xs">Limit</span>
            </>
          ) : (
            <>
              <Clock3 className="h-5 w-5 text-nest-gold sm:h-7 sm:w-7" />
              <span className="mt-1 text-[0.5rem] font-black uppercase tracking-[0.06em] sm:text-[0.68rem]">Next spin</span>
              <span className="text-[0.48rem] font-black text-nest-gold sm:text-[0.62rem]">
                {nextSpinMs > Date.now() ? <Countdown targetMs={nextSpinMs} compact /> : "Locked"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function RewardCard({ reward }: { reward: RewardSummary }) {
  const unavailable = ["expired", "voided", "redeemed", "claim_expired"].includes(reward.status);
  const reserved = ["reserved", "claim_submitted", "pending_verification"].includes(reward.status);
  return (
    <article className="rounded-[1.65rem] border border-nest-gold/18 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-nest-mint/45 text-nest-teal">
          <Gift size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-nest-teal">{reward.title}</h3>
            <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ${unavailable ? "bg-slate-100 text-slate-500" : reserved ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
              {reward.status.replaceAll("_", " ")}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/70">{reward.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-nest-ink/60">
            <span>Code {reward.referenceCode}</span>
            {reward.expiresAt && <span>Use by {formatRewardsDate(reward.expiresAt)}</span>}
            {reward.claimDeadline && reward.requiresManualVerification && <span>Claim by {formatRewardsDate(reward.claimDeadline)}</span>}
          </div>
          {!unavailable && reward.useHref && (
            <Link href={reward.useHref} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-nest-teal px-4 py-2.5 text-sm font-black text-white transition hover:bg-nest-teal2">
              {reward.requiresManualVerification ? "Submit prize claim" : "Use my reward"} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function RewardsExperience() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verificationStep, setVerificationStep] = useState<"details" | "sms" | "email">("details");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [verificationId, setVerificationId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneAuthToken, setPhoneAuthToken] = useState("");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pendingResult, setPendingResult] = useState<SpinResult | null>(null);
  const [revealedResult, setRevealedResult] = useState<SpinResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    email: "",
    phone: "",
    zip: "",
    rulesAccepted: false,
    marketingOptIn: false,
    website: "",
  });

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/rewards/status", { cache: "no-store" });
    const result = (await response.json().catch(() => null)) as StatusData | null;
    if (!result) throw new Error("Rewards status could not be loaded.");
    setStatus(result);
    return result;
  }, []);

  useEffect(() => {
    loadStatus()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Rewards status could not be loaded."))
      .finally(() => setLoading(false));
    return () => recaptchaRef.current?.clear();
  }, [loadStatus]);

  useEffect(() => {
    if (!revealedResult) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRevealedResult(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [revealedResult]);

  async function sendPhoneCode() {
    setError("");
    setNotice("");
    const phone = toE164(form.phone);
    if (form.firstName.trim().length < 2 || !form.email.includes("@") || !phone || !/^\d{5}$/.test(form.zip.trim())) {
      setError("Complete your first name, email, mobile phone, and 5-digit ZIP code.");
      return;
    }
    if (!form.rulesAccepted) {
      setError("Please agree to the Official Rules before continuing.");
      return;
    }

    setBusy(true);
    try {
      await prepareRewardsFirebaseAuth();
      prepareRewardsAppCheck();
      await signOut(rewardsFirebaseAuth).catch(() => undefined);
      recaptchaRef.current?.clear();
      recaptchaRef.current = new RecaptchaVerifier(rewardsFirebaseAuth, "launch-rewards-recaptcha", {
        size: "invisible",
      });
      const confirmation = await signInWithPhoneNumber(rewardsFirebaseAuth, phone, recaptchaRef.current);
      setConfirmationResult(confirmation);
      setVerificationStep("sms");
      setNotice(`We texted a verification code to the mobile number ending in ${phone.slice(-4)}.`);
    } catch (sendError) {
      setError(humanFirebaseError(sendError));
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    } finally {
      setBusy(false);
    }
  }

  async function verifyPhoneAndSendEmail() {
    if (!confirmationResult || smsCode.replace(/\D/g, "").length !== 6) {
      setError("Enter the 6-digit code from the text message.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const credential = await confirmationResult.confirm(smsCode.replace(/\D/g, ""));
      const idToken = await credential.user.getIdToken(true);
      setPhoneAuthToken(idToken);
      const appCheckHeader = await getRewardsAppCheckHeader();
      const response = await fetch("/api/rewards/request-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...appCheckHeader },
        body: JSON.stringify({ ...form, phoneAuthToken: idToken }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "The email code could not be sent.");
      setVerificationId(result.verificationId);
      setMaskedEmail(result.maskedEmail);
      setVerificationStep("email");
      setNotice(`We sent a second code to ${result.maskedEmail}.`);
    } catch (verifyError) {
      setError(humanFirebaseError(verifyError));
    } finally {
      setBusy(false);
    }
  }

  async function finishVerification() {
    if (emailCode.replace(/\D/g, "").length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const currentToken = rewardsFirebaseAuth.currentUser
        ? await rewardsFirebaseAuth.currentUser.getIdToken(true)
        : phoneAuthToken;
      const appCheckHeader = await getRewardsAppCheckHeader();
      const response = await fetch("/api/rewards/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...appCheckHeader },
        body: JSON.stringify({ verificationId, code: emailCode, phoneAuthToken: currentToken }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Verification could not be completed.");
      await loadStatus();
      setNotice("Phone and email verified. Your spin limits are now securely attached to your account.");
      setVerificationStep("details");
      setSmsCode("");
      setEmailCode("");
      setPhoneAuthToken("");
      await signOut(rewardsFirebaseAuth).catch(() => undefined);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function spinWheel() {
    if (!status?.verified || !status.canSpin || spinning) return;
    setBusy(true);
    setError("");
    setNotice("");
    setRevealedResult(null);
    setPendingResult(null);
    try {
      const idempotencyKey = crypto.randomUUID().replaceAll("-", "");
      const appCheckHeader = await getRewardsAppCheckHeader({ limitedUse: true });
      const response = await fetch(status.testMode ? "/api/rewards/test-spin" : "/api/rewards/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...appCheckHeader },
        body: JSON.stringify({ idempotencyKey }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "The spin could not be completed.");
      const prize = result.result as SpinResult;
      const segmentAngle = 360 / launchRewardPrizes.length;
      const stopAt = 360 - (prize.prizeIndex + 0.5) * segmentAngle;
      setPendingResult(prize);
      setSpinning(true);
      setRotation((current) => current + 360 * 7 + stopAt + (360 - (current % 360)));
      setStatus((current) => current ? {
        ...current,
        canSpin: current.testMode ? true : false,
        grandPrizeAvailable: result.grandPrizeAvailable,
        nextEligibleSpinAt: current.testMode ? null : result.nextEligibleSpinAt,
        spinsThisMonth: current.testMode ? 0 : result.spinsThisMonth,
        spinsRemainingThisMonth: current.testMode ? 99 : result.spinsRemainingThisMonth,
      } : current);
    } catch (spinError) {
      setError(spinError instanceof Error ? spinError.message : "The spin could not be completed.");
      await loadStatus().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  function finishWheelAnimation() {
    if (!spinning || !pendingResult) return;
    setSpinning(false);
    setRevealedResult(pendingResult);
    setPendingResult(null);
    loadStatus().catch(() => undefined);
  }

  async function signOutRewards() {
    setBusy(true);
    await fetch("/api/rewards/sign-out", { method: "POST" }).catch(() => undefined);
    await signOut(rewardsFirebaseAuth).catch(() => undefined);
    setRevealedResult(null);
    setPendingResult(null);
    setVerificationStep("details");
    await loadStatus().catch(() => undefined);
    setBusy(false);
  }

  async function shareRewards() {
    const data = {
      title: "NestHelper Launch Rewards",
      text: "NestHelper Launch Rewards are live — spin for family home-help rewards and a rare chance to win a 3-hour Parent Reset.",
      url: `${window.location.origin}/rewards`,
    };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
    } else {
      setNotice("Copy nesthelperwa.com/rewards to share the promotion.");
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[26rem] place-items-center rounded-[2rem] border border-nest-gold/18 bg-white/80 p-8 shadow-soft">
        <div className="text-center text-nest-teal"><LoaderCircle className="mx-auto animate-spin" size={34} /><p className="mt-3 font-black">Loading Launch Rewards…</p></div>
      </div>
    );
  }

  const phase = status?.phase || (Date.now() < getLaunchRewardsLaunchMs() ? "prelaunch" : "live");
  const nextSpinMs = status?.nextEligibleSpinAt ? new Date(status.nextEligibleSpinAt).getTime() : 0;

  return (
    <div className="grid gap-8">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/25 bg-nest-teal px-5 py-8 text-white shadow-glow sm:px-8 sm:py-10 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(61,199,185,0.42),transparent_28rem),radial-gradient(circle_at_90%_25%,rgba(230,190,90,0.28),transparent_24rem),linear-gradient(135deg,#005d56,#003f3b)]" />
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full border border-white/10" />
        <div className="absolute -right-12 bottom-4 h-72 w-72 rounded-full border border-nest-gold2/20" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-nest-gold2/40 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-nest-gold2 backdrop-blur">
            <Sparkles size={15} /> NestHelper Launch Rewards
          </div>
          <h1 className="text-balance mt-5 text-4xl font-black leading-[0.98] sm:text-6xl">Spin for a little breathing room.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-white/82 sm:text-lg">
            Unlock useful family home-help rewards, with a rare chance to win one standard 3-hour Parent Reset. No purchase necessary.
          </p>

          {phase === "prelaunch" && (
            <div className="mx-auto mt-8 max-w-2xl">
              <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-nest-gold2">Live {formatLaunchDate()}</p>
              <Countdown targetMs={getLaunchRewardsLaunchMs()} />
            </div>
          )}

          {phase === "live" && (
            <div className="mx-auto mt-7 flex max-w-2xl flex-wrap justify-center gap-3 text-sm font-black">
              {status?.testMode ? (
                <>
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2"><ShieldCheck className="mr-2 inline h-4 w-4 text-nest-gold2" />Admin-only test</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2"><RotateCw className="mr-2 inline h-4 w-4 text-nest-gold2" />Repeatable test spins</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2"><Gift className="mr-2 inline h-4 w-4 text-nest-gold2" />No redeemable reward</span>
                </>
              ) : (
                <>
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2"><ShieldCheck className="mr-2 inline h-4 w-4 text-nest-gold2" />Phone + email verified</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2"><Clock3 className="mr-2 inline h-4 w-4 text-nest-gold2" />One spin every 7 days</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2"><Gift className="mr-2 inline h-4 w-4 text-nest-gold2" />Up to 4 spins monthly</span>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {status?.testMode && (
        <section className="rounded-[2rem] border-2 border-amber-400 bg-amber-50 p-5 text-amber-950 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Admin-only prelaunch test</p>
              <h2 className="mt-1 text-2xl font-black text-nest-teal">No real reward will be issued.</h2>
              <p className="mt-2 text-sm font-bold leading-6">The secure test endpoint is set to land on <strong>{status.testPrizeTitle || "the selected prize"}</strong>. Test spins are stored separately, cannot be redeemed, and do not affect the monthly winner limit.</p>
            </div>
            <a href="/admin/rewards" className="focus-ring inline-flex shrink-0 items-center justify-center rounded-full bg-amber-600 px-5 py-3 font-black text-white">Back to Rewards Admin</a>
          </div>
        </section>
      )}

      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 font-bold text-rose-800">{error}</div>}
      {notice && <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-900">{notice}</div>}

      <section className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white/88 p-4 shadow-soft backdrop-blur sm:p-7">
          <PrizeWheel
            rotation={rotation}
            spinning={spinning}
            busy={busy}
            phase={phase}
            verified={Boolean(status?.verified)}
            canSpin={Boolean(status?.canSpin)}
            testMode={Boolean(status?.testMode)}
            nextSpinMs={nextSpinMs}
            monthlyLimitReached={(status?.spinsThisMonth || 0) >= (status?.maxSpinsPerMonth || LAUNCH_REWARDS_MAX_SPINS_PER_MONTH)}
            onSpin={() => { void spinWheel(); }}
            onVerify={() => document.getElementById("rewards-entry")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            onAnimationComplete={finishWheelAnimation}
          />
          <p className="mx-auto mt-4 max-w-xl text-center text-xs font-semibold leading-5 text-nest-ink/55">
            {status?.testMode
              ? "Test mode uses the secure server-selected prize chosen in Admin. It creates no customer reward and does not affect live odds or limits."
              : "The animated segment sizes are decorative. The secure server chooses and permanently records the result using the odds disclosed below before the wheel moves."}
          </p>
        </div>

        <div className="grid gap-5">
          {phase === "prelaunch" && (
            <div className="rounded-[2rem] border border-nest-gold/20 bg-white p-6 shadow-soft sm:p-8">
              <div className="flex items-center gap-3 text-nest-teal"><CalendarClock size={25} /><h2 className="text-2xl font-black">The wheel opens August 5.</h2></div>
              <p className="mt-4 font-semibold leading-7 text-nest-ink/70">The countdown is live now. On launch day, this page will automatically open the secure phone-and-email verification flow—no website update or manual switch is needed.</p>
              <div className="mt-5 rounded-2xl bg-nest-mint/30 p-4 text-sm font-bold leading-6 text-nest-teal">
                Follow NestHelper so you do not miss the launch. Sharing is appreciated, but it does not improve anyone’s odds.
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" className="focus-ring inline-flex justify-center rounded-full bg-nest-teal px-5 py-3 font-black text-white">Follow on Facebook</a>
                <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" className="focus-ring inline-flex justify-center rounded-full border border-nest-teal/20 px-5 py-3 font-black text-nest-teal">Follow on Instagram</a>
              </div>
            </div>
          )}

          {phase === "ended" && (
            <div className="rounded-[2rem] border border-nest-gold/20 bg-white p-7 shadow-soft">
              <h2 className="text-2xl font-black text-nest-teal">This Launch Rewards period has ended.</h2>
              <p className="mt-3 font-semibold leading-7 text-nest-ink/70">Saved rewards remain subject to their individual expiration dates. Watch NestHelper for future family promotions.</p>
            </div>
          )}

          {phase === "live" && !status?.verified && (
            <div id="rewards-entry" className="scroll-mt-28 rounded-[2rem] border border-nest-gold/20 bg-white p-5 shadow-soft sm:p-7">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-nest-mint/45 text-nest-teal"><LockKeyhole size={23} /></span>
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-nest-gold">Secure entry</p><h2 className="mt-1 text-2xl font-black text-nest-teal">Verify once, then spin.</h2></div>
              </div>

              {verificationStep === "details" && (
                <div className="mt-6 grid gap-4">
                  <label className="label">First name<input className="input mt-1" autoComplete="given-name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
                  <label className="label">Email<input type="email" className="input mt-1" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
                  <label className="label">Mobile phone<input className="input mt-1" inputMode="tel" autoComplete="tel" placeholder="425-555-1234" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                  <label className="label">ZIP code<input className="input mt-1" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={form.zip} onChange={(event) => setForm((current) => ({ ...current, zip: event.target.value.replace(/\D/g, "").slice(0, 5) }))} /></label>
                  <label className="hidden" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} /></label>
                  <label className="flex items-start gap-3 rounded-2xl border border-nest-gold/16 bg-nest-cream p-4 text-sm font-semibold leading-6 text-nest-ink/75">
                    <input type="checkbox" className="mt-1 h-4 w-4" checked={form.rulesAccepted} onChange={(event) => setForm((current) => ({ ...current, rulesAccepted: event.target.checked }))} />
                    <span>I am at least 18, live in the eligible service area, and agree to the <Link href="/rewards/rules" className="font-black text-nest-teal underline">Official Rules</Link>.</span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-nest-gold/12 bg-white p-4 text-sm font-semibold leading-6 text-nest-ink/70">
                    <input type="checkbox" className="mt-1 h-4 w-4" checked={form.marketingOptIn} onChange={(event) => setForm((current) => ({ ...current, marketingOptIn: event.target.checked }))} />
                    <span>Optional: send me occasional NestHelper offers and family home-help updates. This is not required to enter.</span>
                  </label>
                  <button type="button" disabled={busy} onClick={sendPhoneCode} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-5 py-3.5 font-black text-white shadow-soft transition hover:bg-nest-teal2 disabled:cursor-not-allowed disabled:opacity-60">
                    {busy ? <LoaderCircle className="animate-spin" size={18} /> : <Phone size={18} />} Text my verification code
                  </button>
                </div>
              )}

              {verificationStep === "sms" && (
                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl bg-nest-mint/30 p-4 text-sm font-bold leading-6 text-nest-teal">Step 1 of 2: confirm the code sent to your mobile phone.</div>
                  <label className="label">Text-message code<input className="input mt-1 text-center text-2xl font-black tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={smsCode} onChange={(event) => setSmsCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
                  <button type="button" disabled={busy} onClick={verifyPhoneAndSendEmail} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-5 py-3.5 font-black text-white disabled:opacity-60">
                    {busy ? <LoaderCircle className="animate-spin" size={18} /> : <Mail size={18} />} Verify phone and email me
                  </button>
                  <button type="button" onClick={() => { setVerificationStep("details"); setSmsCode(""); setConfirmationResult(null); }} className="font-black text-nest-teal underline">Use different information</button>
                </div>
              )}

              {verificationStep === "email" && (
                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl bg-nest-mint/30 p-4 text-sm font-bold leading-6 text-nest-teal">Step 2 of 2: enter the code sent to {maskedEmail}.</div>
                  <label className="label">Email code<input className="input mt-1 text-center text-2xl font-black tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
                  <button type="button" disabled={busy} onClick={finishVerification} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-5 py-3.5 font-black text-white disabled:opacity-60">
                    {busy ? <LoaderCircle className="animate-spin" size={18} /> : <ShieldCheck size={18} />} Finish verification
                  </button>
                </div>
              )}
              <div id="launch-rewards-recaptcha" className="mt-4" />
            </div>
          )}

          {phase === "live" && status?.verified && (
            <div className="rounded-[2rem] border border-nest-gold/20 bg-white p-5 shadow-soft sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-nest-gold">{status.testMode ? "Admin test session" : "Verified participant"}</p>
                  <h2 className="mt-1 text-2xl font-black text-nest-teal">{status.testMode ? "Test the wheel before launch." : `Welcome, ${status.participant?.firstName || "friend"}.`}</h2>
                  <p className="mt-2 text-sm font-semibold text-nest-ink/62">{status.testMode ? `Forced result: ${status.testPrizeTitle || "selected prize"}` : `${status.participant?.maskedEmail} · ${status.participant?.maskedPhone}`}</p>
                </div>
                {status.testMode
                  ? <a href="/admin/rewards" className="text-sm font-black text-nest-teal underline">Back to Rewards Admin</a>
                  : <button type="button" onClick={signOutRewards} disabled={busy} className="text-sm font-black text-nest-teal underline">Sign out</button>}

              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-nest-mint/30 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-nest-teal/65">{status.testMode ? "Test spins" : "Monthly spins"}</p><p className="mt-1 text-2xl font-black text-nest-teal">{status.testMode ? "Unlimited preview" : `${status.spinsThisMonth || 0} / ${status.maxSpinsPerMonth || LAUNCH_REWARDS_MAX_SPINS_PER_MONTH}`}</p></div>
                <div className="rounded-2xl bg-nest-cream p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-nest-gold">{status.testMode ? "Reward status" : "Rare prize"}</p><p className="mt-1 text-sm font-black text-nest-teal">{status.testMode ? "Test only — not redeemable" : status.grandPrizeAvailable ? "Available this month" : "Claimed this month"}</p></div>
              </div>

              {status.canSpin ? (
                <div className="mt-5 rounded-2xl border border-nest-gold/18 bg-nest-mint/25 p-4 text-center">
                  <Sparkles className="mx-auto text-nest-gold" size={20} />
                  <p className="mt-2 font-black text-nest-teal">Tap the center of the wheel to {status.testMode ? "run a test spin" : "spin your reward"}.</p>
                  <p className="mt-1 text-sm font-semibold text-nest-ink/60">Your result is selected and recorded securely before the animation begins.</p>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-nest-gold/18 bg-nest-cream p-4 text-center">
                  <p className="font-black text-nest-teal">{(status.spinsThisMonth || 0) >= (status.maxSpinsPerMonth || 4) ? "You used all four spins for this month." : "Your next spin is locked for now."}</p>
                  {nextSpinMs > Date.now() && <p className="mt-2 text-sm font-bold text-nest-ink/65">Unlocks in <Countdown targetMs={nextSpinMs} compact /></p>}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {revealedResult && (
          <motion.div
            className="fixed inset-0 z-[120] grid place-items-center bg-nest-teal/72 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRevealedResult(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="launch-reward-result-title"
              className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2.25rem] border border-nest-gold/35 bg-gradient-to-br from-white via-nest-cream to-nest-mint/40 p-6 text-center shadow-[0_28px_90px_rgba(0,43,40,0.45)] sm:p-9"
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 230, damping: 22 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setRevealedResult(null)}
                className="focus-ring absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-nest-teal/15 bg-white/90 text-nest-teal shadow-sm"
                aria-label="Close reward result"
              >
                <X size={19} />
              </button>

              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.25rem]" aria-hidden="true">
                {Array.from({ length: 18 }).map((_, index) => (
                  <Star
                    key={index}
                    className="absolute animate-float text-nest-gold/35"
                    size={11 + (index % 4) * 4}
                    style={{
                      left: `${4 + (index * 17) % 92}%`,
                      top: `${5 + (index * 23) % 85}%`,
                      animationDelay: `${(index % 6) * 0.3}s`,
                    }}
                  />
                ))}
              </div>

              <div className="relative mx-auto max-w-xl">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-nest-teal text-white shadow-soft sm:h-20 sm:w-20">
                  <Gift size={32} />
                </span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-nest-gold sm:text-sm">
                  {revealedResult.testOnly ? "Test Result — No Real Reward" : "Your Launch Reward"}
                </p>
                <h2 id="launch-reward-result-title" className="mt-2 text-3xl font-black text-nest-teal sm:text-5xl">
                  {revealedResult.title}
                </h2>
                <p className="mt-4 text-lg font-black text-nest-ink/80">{revealedResult.customerMessage}</p>
                <p className="mx-auto mt-3 max-w-lg font-semibold leading-7 text-nest-ink/68">{revealedResult.description}</p>
                <div className="mx-auto mt-5 inline-flex rounded-full border border-nest-gold/20 bg-white px-4 py-2 text-sm font-black text-nest-teal shadow-sm">
                  {revealedResult.testOnly ? `Test reference ${revealedResult.referenceCode}` : `Reward ${revealedResult.referenceCode}`}
                </div>

                {revealedResult.requiresManualVerification && (
                  <p className="mx-auto mt-4 max-w-lg rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                    This rare prize is pending eligibility, service-area, identity, and standard-scope verification. Submit the claim within 72 hours.
                  </p>
                )}

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  {revealedResult.testOnly ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRevealedResult(null);
                          window.setTimeout(() => { void spinWheel(); }, 0);
                        }}
                        disabled={busy || spinning}
                        className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-3.5 font-black text-white shadow-soft disabled:opacity-60"
                      >
                        <RotateCw size={18} /> Run this test again
                      </button>
                      <a href="/admin/rewards" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-nest-teal/20 bg-white px-6 py-3.5 font-black text-nest-teal">
                        Choose another prize <ArrowRight size={18} />
                      </a>
                    </>
                  ) : (
                    <>
                      <Link href={revealedResult.useHref} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-3.5 font-black text-white shadow-soft">
                        {revealedResult.requiresManualVerification ? "Submit prize claim" : "Use my reward"} <ArrowRight size={18} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setRevealedResult(null)}
                        className="focus-ring inline-flex items-center justify-center rounded-full border border-nest-teal/20 bg-white px-6 py-3.5 font-black text-nest-teal"
                      >
                        Save for later
                      </button>
                    </>
                  )}
                </div>

                {!revealedResult.testOnly && (
                  <button type="button" onClick={shareRewards} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-nest-teal underline">
                    <Share2 size={16} /> Share Launch Rewards
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {status?.verified && (status.rewards?.length || 0) > 0 && (
        <section className="rounded-[2.5rem] border border-nest-gold/18 bg-white/75 p-5 shadow-soft sm:p-8">
          <div className="flex items-center gap-3"><TicketCheck className="text-nest-gold" size={25} /><div><p className="text-xs font-black uppercase tracking-[0.16em] text-nest-gold">Saved securely</p><h2 className="text-2xl font-black text-nest-teal">My Launch Rewards</h2></div></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">{status.rewards?.map((reward) => <RewardCard key={reward.id} reward={reward} />)}</div>
        </section>
      )}

      <section className="grid gap-6 rounded-[2.5rem] border border-nest-gold/18 bg-white p-5 shadow-soft sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="pill-label w-fit"><Gift size={15} /> Prize odds</p>
          <h2 className="mt-4 text-3xl font-black text-nest-teal">Useful wins, with one truly rare prize.</h2>
          <p className="mt-4 font-semibold leading-7 text-nest-ink/68">The free Parent Reset has approximate odds of 1 in 500 per eligible spin while it remains available. There can be no more than one verified Parent Reset winner in a calendar month, and a winner is not guaranteed every month.</p>
          <div className="mt-5 rounded-2xl bg-nest-mint/30 p-4 text-sm font-bold leading-6 text-nest-teal"><LockKeyhole className="mr-2 inline h-4 w-4" />Refreshing, clearing cookies, opening another browser, or replaying a request does not create another eligible spin.</div>
        </div>
        <div className="grid gap-2">
          {launchRewardPrizes.map((prize) => (
            <div key={prize.id} className="flex items-center justify-between gap-4 rounded-2xl border border-nest-gold/14 bg-nest-cream/55 px-4 py-3">
              <div><p className="font-black text-nest-teal">{prize.title}</p><p className="mt-1 text-xs font-semibold leading-5 text-nest-ink/58">{prize.description}</p></div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-nest-gold shadow-sm">{prize.approximateOdds}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          [<ShieldCheck key="a" />, "Verified identity", "A mobile text code and a separate email code connect each participant to one persistent account."],
          [<RotateCw key="b" />, "Server-recorded spins", "The server records the prize first. Refreshing or replaying the request returns the same saved result."],
          [<CheckCircle2 key="c" />, "Controlled redemption", "Rewards are tied to the verified participant, limited to eligible services, and cannot be stacked."],
        ].map(([icon, title, text]) => (
          <div key={String(title)} className="rounded-[1.75rem] border border-nest-gold/16 bg-white p-5 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-nest-mint/35 text-nest-teal">{icon}</span>
            <h3 className="mt-4 text-lg font-black text-nest-teal">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/65">{text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-nest-gold/18 bg-nest-cream p-5 text-sm font-semibold leading-6 text-nest-ink/68 sm:p-7">
        <div className="flex items-start gap-3"><Heart className="mt-0.5 shrink-0 text-nest-gold" size={20} /><div><h2 className="font-black text-nest-teal">Simple promotion reminders</h2><p className="mt-2">No purchase necessary. One participant account per verified email and mobile number. One spin every seven days, maximum four per calendar month. One reward per booking. Rewards cannot be combined with referral credits, launch pricing, or another discount. Commercial services, custom heavy deep cleaning, and move-out cleaning are excluded. See the <Link href="/rewards/rules" className="font-black text-nest-teal underline">Official Rules</Link> for full eligibility, prize scope, odds, monthly limits, and platform disclaimers.</p></div></div>
      </section>
    </div>
  );
}
