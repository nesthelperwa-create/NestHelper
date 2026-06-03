import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Gift, HeartHandshake, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";

function normalizeReferralCode(value: unknown) {
  return typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32) : "";
}

type ReferralsPageProps = {
  searchParams: Promise<{ ref?: string; referral?: string; referralCode?: string }>;
};

export const metadata = {
  title: "Family Referrals | NestHelper",
  description: "A simple one-time NestHelper family referral link for eligible family services.",
};

export default async function ReferralsPage({ searchParams }: ReferralsPageProps) {
  const params = await searchParams;
  const referralCode = normalizeReferralCode(params.ref || params.referral || params.referralCode);
  const requestHref = referralCode ? `/request?ref=${encodeURIComponent(referralCode)}` : "/contact";

  return (
    <>
      <PageHero
        eyebrow="Family Referrals"
        title={referralCode ? "Your referral link is ready." : "Family referrals, kept simple."}
        text={
          referralCode
            ? "Share this page with one family. The family you send it to can tap the button below to request help with your referral attached."
            : "NestHelper family referrals are one-time share links for eligible family services. Rewards are reviewed after the referred family completes their reset."
        }
        cta={false}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {referralCode && (
          <div className="mb-8 overflow-hidden rounded-[2rem] border border-nest-gold/20 bg-gradient-to-br from-white via-nest-cream to-nest-mint/30 p-5 shadow-soft sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="pill-label w-fit"><Gift size={15} /> One-time referral link</p>
                <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Share this page with one family.</h2>
                <p className="mt-3 font-medium leading-7 text-nest-ink/72">
                  Forward the email or copy this page link from your browser. The link works once, so send it to the family you want to refer.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-nest-gold/18 bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-black text-nest-teal">If you are sharing</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/68">
                    Send this page link to one family. After they complete an eligible NestHelper family service, we will email you about your thank-you credit.
                  </p>
                </div>

                <div className="rounded-3xl border border-nest-gold/18 bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-black text-nest-teal">If you received this link</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/68">
                    Tap below and submit your request. Your referral code will stay attached automatically.
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    <ButtonLink href={requestHref}>Request help with this referral</ButtonLink>
                    <ButtonLink href="/policies/referral-program-policy" variant="secondary">Referral policy</ButtonLink>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white/75 p-4 text-sm font-black text-nest-ink/70 shadow-sm">
              Referral code: <span className="text-nest-teal">{referralCode}</span>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><HeartHandshake size={15} /> Family Referrals</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">A simple thank-you for sharing NestHelper.</h2>
            <p className="mt-4 font-medium leading-7 text-nest-ink/72">
              After a completed eligible family service, NestHelper may email a one-time referral link to that customer. They can share it with one family. When the referred family completes an eligible service, the original family receives a reward or credit email.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Share the one-time link with one family",
                "The referred family submits a request through the link",
                "NestHelper reviews, schedules, and completes the service",
                "The original family gets a reward or credit email",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-nest-cream p-4 font-black text-nest-ink/75">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-nest-teal shadow-sm"><CheckCircle2 size={17} /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <InfoCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Family services only"
              text="Referral links are for eligible NestHelper family services. Commercial Reset is separate and is not part of this family referral program."
            />
            <InfoCard
              icon={<LockKeyhole className="h-6 w-6" />}
              title="One-time use"
              text="Each referral link can only be claimed by one referred family request. Once used, the same link cannot be used again."
            />
            <InfoCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Reward after completion"
              text="Referral rewards are reviewed after the referred family’s eligible service is completed, not just when a form is submitted."
            />
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-nest-gold/18 bg-gradient-to-br from-nest-mint/25 via-white to-nest-cream p-6 shadow-soft sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="pill-label w-fit"><Gift size={15} /> Good to know</p>
              <h2 className="mt-3 text-2xl font-black text-nest-teal sm:text-3xl">Referrals are reviewed before rewards are issued.</h2>
            </div>
            <Link href="/policies/referral-program-policy" className="inline-flex items-center gap-2 font-black text-nest-gold transition hover:gap-3 hover:text-nest-teal">
              Read the policy <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-nest-gold/16 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/45 p-3 text-nest-teal shadow-sm">{icon}</div>
      <h3 className="text-2xl font-black text-nest-teal">{title}</h3>
      <p className="mt-3 font-medium leading-7 text-nest-ink/70">{text}</p>
    </div>
  );
}
