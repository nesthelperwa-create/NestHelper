import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Gift, HeartHandshake, Link2, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { REFERRAL_PROGRAM } from "@/lib/referrals";

export const metadata = {
  title: "Refer a Family | NestHelper",
  description: "Share NestHelper with another local family through the NestHelper family referral program.",
};

export default function ReferralsPage() {
  return (
    <>
      <PageHero
        eyebrow="Family Referrals"
        title="Share NestHelper with another local family."
        text="A simple family-to-family referral program for Parent Reset services. Commercial Reset is separate and not included right now."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/30 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><HeartHandshake size={15} /> Give credit. Get credit.</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">A simple thank-you when your referral becomes a completed service.</h2>
            <p className="mt-4 text-base font-medium leading-8 text-nest-ink/72">
              After a completed NestHelper visit, we can give your family a referral link to share. When a new family uses your link, completes their first eligible service, and pays, both families can receive NestHelper credit.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/request">Request Help</ButtonLink>
              <ButtonLink href="/policies/referral-program-policy" variant="secondary">Referral Policy</ButtonLink>
            </div>
          </div>

          <div className="grid gap-4">
            <ReferralCard
              icon={<Link2 size={20} />}
              title="1. Share your family link"
              text="Your link can look like nesthelperwa.com/request?ref=NH-SMITH25. The request form captures the code automatically."
            />
            <ReferralCard
              icon={<Gift size={20} />}
              title="2. New family gets credit"
              text={`Eligible first Parent Reset, Family Reset, Helper Block, or Errand Helper requests can receive $${REFERRAL_PROGRAM.defaultNewCustomerCredit} off. Laundry Rescue may use a smaller $${REFERRAL_PROGRAM.laundryCredit} credit.`}
            />
            <ReferralCard
              icon={<CheckCircle2 size={20} />}
              title="3. You get thanked too"
              text={`After the new family completes and pays for their first eligible service, the referring family can receive a $${REFERRAL_PROGRAM.defaultReferrerCredit} NestHelper credit toward a future reset.`}
            />
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-nest-gold/18 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-nest-mint/55 text-nest-teal"><ShieldCheck size={21} /></span>
              <div>
                <h3 className="text-xl font-black text-nest-teal">Simple boundaries</h3>
                <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-nest-ink/70">
                  Credits are reviewed after the referred family completes and pays for their first eligible family service. Credits are not cash, cannot be used for past services, and are not currently available for Commercial Reset.
                </p>
              </div>
            </div>
            <Link href="/policies/referral-program-policy" className="focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-nest-gold/18 bg-nest-cream px-5 py-3 text-sm font-black text-nest-teal transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft">
              Read terms <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function ReferralCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-nest-gold/16 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft sm:p-6">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/55 p-3 text-nest-teal">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-7 text-nest-ink/70">{text}</p>
    </div>
  );
}
