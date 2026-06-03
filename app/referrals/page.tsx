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
  description: "Share NestHelper with another family through a one-time family referral link for eligible Parent Reset services.",
};

export default async function ReferralsPage({ searchParams }: ReferralsPageProps) {
  const params = await searchParams;
  const referralCode = normalizeReferralCode(params.ref || params.referral || params.referralCode);
  const requestHref = referralCode ? `/request?ref=${encodeURIComponent(referralCode)}` : "/contact";

  return (
    <>
      <PageHero
        eyebrow="Family Referrals"
        title="Share a reset with another family."
        text="NestHelper family referrals are simple, one-time share links for eligible Parent Reset services. A referring family can receive a thank-you credit after the referred family completes an eligible reset."
        cta={false}
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {referralCode && (
          <div className="mb-8 overflow-hidden rounded-[2rem] border border-nest-gold/20 bg-gradient-to-br from-white via-nest-cream to-nest-mint/30 p-5 shadow-soft sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
              <div>
                <p className="pill-label w-fit"><Gift size={15} /> Referral attached</p>
                <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Referral code {referralCode}</h2>
              </div>
              <div>
                <p className="font-medium leading-7 text-nest-ink/72">
                  This referral link can be used once for an eligible family reset request: Parent Reset, Family Reset, or Helper Block. It stays pending until the completed reset is marked complete by NestHelper.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href={requestHref}>Start referred family request</ButtonLink>
                  <ButtonLink href="/policies/referral-program-policy" variant="secondary">Read referral policy</ButtonLink>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><HeartHandshake size={15} /> Family Referrals</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">A simple thank-you for sharing NestHelper.</h2>
            <p className="mt-4 font-medium leading-7 text-nest-ink/72">
              After a completed eligible family reset, NestHelper may email a one-time referral share link to that customer. The customer can share that link with one other family. When the referred family completes an eligible family reset, the original referring family receives a reward or credit email from NestHelper.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Family-to-family referrals only",
                "One-time use referral link",
                "Eligible family reset must be completed",
                "Reward/credit email is sent after completion",
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
              title="Eligible family services"
              text="Referral links apply to Parent Reset, Family Reset, and Helper Block requests that are reviewed, approved, paid when required, scheduled, and completed."
            />
            <InfoCard
              icon={<LockKeyhole className="h-6 w-6" />}
              title="One-time use"
              text="A referral link can only be claimed by one referred family request. Once used, the same link cannot be used again."
            />
            <InfoCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Tracked by NestHelper"
              text="NestHelper tracks the original family’s share link separately from the referred family’s incoming referral code so rewards are handled clearly."
            />
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-nest-mint/25 via-white to-nest-cream p-6 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <p className="pill-label w-fit"><Gift size={15} /> Good to know</p>
              <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Referrals are reviewed before rewards are issued.</h2>
            </div>
            <div>
              <p className="font-medium leading-7 text-nest-ink/72">
                Commercial Reset, Laundry Rescue, Errand Helper, canceled visits, refunded visits, incomplete visits, self-referrals, duplicate accounts, and misuse are not eligible unless NestHelper approves an exception in writing.
              </p>
              <Link href="/policies/referral-program-policy" className="mt-5 inline-flex items-center gap-2 font-black text-nest-gold transition hover:gap-3 hover:text-nest-teal">
                Read the Referral Program Policy <ArrowRight size={18} />
              </Link>
            </div>
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
