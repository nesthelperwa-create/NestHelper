import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Gift, HeartHandshake, Send, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { CopyReferralLinkButton } from "@/components/CopyReferralLinkButton";

function normalizeReferralCode(value: unknown) {
  return typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32) : "";
}

type ReferralSharePageProps = {
  searchParams: Promise<{ ref?: string; referral?: string; referralCode?: string }>;
};

export const metadata = {
  title: "Share Your Family Referral | NestHelper",
  description: "Copy your one-time NestHelper family referral link and share it with one family.",
};

export default async function ReferralSharePage({ searchParams }: ReferralSharePageProps) {
  const params = await searchParams;
  const referralCode = normalizeReferralCode(params.ref || params.referral || params.referralCode);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nesthelperwa.com").replace(/\/$/, "");
  const referralLinkToCopy = referralCode ? `${siteUrl}/referrals?ref=${encodeURIComponent(referralCode)}` : "";

  return (
    <>
      <PageHero
        eyebrow="Family Referral Share Page"
        title={referralCode ? "Copy your referral link and send it to one family." : "Referral link not found."}
        text={
          referralCode
            ? "This page is for the original NestHelper family. Copy the referral link below and paste it into a text or email to the next family."
            : "Please open the referral share page from the email NestHelper sent you, or contact NestHelper for help."
        }
        cta={false}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {referralCode ? (
          <div className="rounded-[2.25rem] border border-nest-gold/20 bg-gradient-to-br from-white via-nest-cream to-nest-mint/30 p-5 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><Gift size={15} /> One-time family referral</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Send this to one family you know.</h2>
            <p className="mt-3 font-medium leading-7 text-nest-ink/72">
              Tap the button below to copy the referral link. Then paste it into a text message or email to the family you want to refer.
            </p>

            <div className="mt-6 rounded-3xl border border-nest-gold/18 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Copy this referral link</p>
              <p className="mt-2 break-words text-sm font-bold leading-6 text-nest-ink/65">{referralLinkToCopy}</p>
              <div className="mt-4">
                <CopyReferralLinkButton referralUrl={referralLinkToCopy} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StepCard
                icon={<Send className="h-5 w-5" />}
                title="1. Copy"
                text="Tap Copy referral link."
              />
              <StepCard
                icon={<HeartHandshake className="h-5 w-5" />}
                title="2. Send"
                text="Paste it into a text or email to one family."
              />
              <StepCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="3. Earn"
                text="After they complete an eligible service, your credit is saved under your email."
              />
            </div>

            <div className="mt-6 rounded-3xl border border-nest-gold/18 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-xl font-black text-nest-teal"><ShieldCheck className="h-5 w-5" /> How your reward works</h3>
              <div className="mt-3 grid gap-3 text-sm font-black leading-6 text-nest-ink/70">
                <div className="flex gap-3 rounded-2xl bg-nest-cream p-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-nest-teal" /> Your referred family gets the referral discount on an eligible family service.</div>
                <div className="flex gap-3 rounded-2xl bg-nest-cream p-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-nest-teal" /> You earn your NestHelper credit after their eligible service is completed.</div>
                <div className="flex gap-3 rounded-2xl bg-nest-cream p-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-nest-teal" /> Use the same email next time you request help, and NestHelper can apply your saved credit before sending payment.</div>
              </div>
            </div>

            <div className="mt-5 text-sm font-bold leading-6 text-nest-ink/60">
              This link works one time only. Referral credits are for eligible family services and are not cash. Commercial Reset is not included. <Link href="/policies/referral-program-policy" className="font-black text-nest-gold hover:text-nest-teal">Read the referral policy <ArrowRight className="inline h-4 w-4" /></Link>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-nest-gold/20 bg-white p-6 text-center shadow-soft sm:p-8">
            <p className="text-lg font-black text-nest-teal">This referral share page needs a referral code.</p>
            <p className="mt-2 font-semibold leading-7 text-nest-ink/70">Open the link from your NestHelper referral email, or reply to that email and we can help.</p>
          </div>
        )}
      </section>
    </>
  );
}

function StepCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-nest-gold/18 bg-white p-4 shadow-sm">
      <div className="mb-3 inline-flex rounded-2xl bg-nest-mint/45 p-3 text-nest-teal shadow-sm">{icon}</div>
      <h3 className="text-lg font-black text-nest-teal">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}
