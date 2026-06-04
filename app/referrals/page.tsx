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
  description: "A simple NestHelper family referral program for eligible family services.",
};

const familySteps = [
  "NestHelper emails a one-time referral link after an eligible completed family service.",
  "The family shares that link with one other family.",
  "The referred family requests and completes an eligible NestHelper family service.",
  "NestHelper sends the referring family a saved credit for a future eligible service.",
];

export default async function ReferralsPage({ searchParams }: ReferralsPageProps) {
  const params = await searchParams;
  const referralCode = normalizeReferralCode(params.ref || params.referral || params.referralCode);
  const requestHref = referralCode ? `/request?ref=${encodeURIComponent(referralCode)}` : "/contact";

  return (
    <>
      <PageHero
        eyebrow="Family Referrals"
        title={referralCode ? "You were referred by a NestHelper family." : "Give a family a little help. Get a thank-you credit."}
        text={
          referralCode
            ? "Use the button below to request an eligible NestHelper family service with this one-time referral attached."
            : "NestHelper family referrals are simple: your referred family gets a discount, and you get a NestHelper credit after their eligible service is completed."
        }
        cta={false}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {referralCode && (
          <div className="mb-8 overflow-hidden rounded-[2rem] border border-nest-gold/20 bg-gradient-to-br from-white via-nest-cream to-nest-mint/30 p-5 shadow-soft sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <p className="pill-label w-fit"><Gift size={15} /> One-time family referral</p>
                <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Your family gets a referral discount.</h2>
                <p className="mt-3 font-medium leading-7 text-nest-ink/72">
                  This referral can be used once for an eligible NestHelper family service. Submit your request with the button below and the referral code will stay attached automatically.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href={requestHref}>Request help with this referral</ButtonLink>
                  <ButtonLink href="/policies/referral-program-policy" variant="secondary">Referral policy</ButtonLink>
                </div>
              </div>

              <div className="rounded-3xl border border-nest-gold/18 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Referral code</p>
                <p className="mt-2 break-words text-2xl font-black text-nest-teal">{referralCode}</p>
                <div className="mt-4 grid gap-3 text-sm font-black leading-6 text-nest-ink/70">
                  <div className="flex gap-3 rounded-2xl bg-nest-cream p-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-nest-teal" /> New family gets the referral discount.</div>
                  <div className="flex gap-3 rounded-2xl bg-nest-cream p-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-nest-teal" /> The referring family earns credit after your eligible service is completed.</div>
                  <div className="flex gap-3 rounded-2xl bg-nest-cream p-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-nest-teal" /> Commercial Reset is not included.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!referralCode && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white p-6 shadow-soft sm:p-8">
              <p className="pill-label w-fit"><HeartHandshake size={15} /> Family Referrals</p>
              <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Simple family-to-family rewards.</h2>
              <p className="mt-4 font-medium leading-7 text-nest-ink/72">
                After your completed eligible family service, NestHelper may send you a one-time referral link to share with one family. Happy customers can receive another one-time link after a referred family completes service.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <RewardCard
                  eyebrow="Your referred family gets"
                  amount="$25 off"
                  text="an eligible Parent Reset, Family Reset, Helper Block, or Errand Helper service."
                />
                <RewardCard
                  eyebrow="You get"
                  amount="$25 credit"
                  text="after the referred family completes their eligible NestHelper family service."
                />
              </div>

              <div className="mt-4 rounded-2xl bg-nest-cream p-4 text-sm font-black leading-6 text-nest-ink/72">
                Laundry Rescue referral credits may be $15 instead of $25 because laundry pricing is based on weight and final balance.
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-nest-mint/25 via-white to-nest-cream p-6 shadow-soft sm:p-8">
              <p className="pill-label w-fit"><Gift size={15} /> How it works</p>
              <div className="mt-5 grid gap-3">
                {familySteps.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 font-black text-nest-ink/75 shadow-sm">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nest-mint/60 text-nest-teal"><CheckCircle2 size={17} /></span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/policies/referral-program-policy" className="mt-6 inline-flex items-center gap-2 font-black text-nest-gold transition hover:gap-3 hover:text-nest-teal">
                Read referral policy <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <InfoCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Family services only"
            text="Commercial Reset is separate and is not part of the family referral program."
          />
          <InfoCard
            icon={<LockKeyhole className="h-6 w-6" />}
            title="One-time link"
            text="Each referral link can only be claimed by one referred family request. NestHelper can send another one-time link after completion when approved."
          />
          <InfoCard
            icon={<Sparkles className="h-6 w-6" />}
            title="After completion"
            text="Credits are sent after the referred family completes an eligible service."
          />
        </div>
      </section>
    </>
  );
}

function RewardCard({ eyebrow, amount, text }: { eyebrow: string; amount: string; text: string }) {
  return (
    <div className="rounded-3xl border border-nest-gold/18 bg-nest-cream p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">{eyebrow}</p>
      <p className="mt-2 text-4xl font-black text-nest-teal">{amount}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-nest-gold/16 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/45 p-3 text-nest-teal shadow-sm">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}
