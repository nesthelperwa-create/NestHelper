import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  formatLaunchDate,
  LAUNCH_REWARDS_END_AT,
  LAUNCH_REWARDS_GRAND_PRIZE_MONTHLY_LIMIT,
  LAUNCH_REWARDS_MAX_SPINS_PER_MONTH,
  LAUNCH_REWARDS_SPIN_COOLDOWN_DAYS,
  launchRewardPrizes,
} from "@/lib/launchRewards";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Launch Rewards Official Rules",
  description: "Official rules, eligibility, odds, prize limits, and redemption terms for NestHelper Launch Rewards.",
  alternates: { canonical: `${siteConfig.url}/rewards/rules` },
  robots: { index: true, follow: true },
};

export default function LaunchRewardsRulesPage() {
  const endDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(LAUNCH_REWARDS_END_AT));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <article className="rounded-[2.5rem] border border-nest-gold/18 bg-white p-5 shadow-soft sm:p-8 lg:p-10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">NestHelper Launch Rewards</p>
        <h1 className="mt-3 text-3xl font-black text-nest-teal sm:text-5xl">Official Rules</h1>
        <p className="mt-4 font-semibold leading-7 text-nest-ink/70">No purchase necessary. A purchase will not improve the odds of winning.</p>
        <p className="mt-2 text-sm font-bold text-nest-ink/55">Effective for the initial promotion period beginning {formatLaunchDate()} and ending {endDate}, unless ended earlier where legally permitted and after appropriate notice.</p>

        <RuleSection title="1. Sponsor">
          <p>NestHelper LLC, 100 N Howard St, Ste R, Spokane, WA 99201, United States. Questions may be sent to <a className="font-black text-nest-teal underline" href={`mailto:${siteConfig.emails.support}`}>{siteConfig.emails.support}</a> or {siteConfig.phone}.</p>
        </RuleSection>

        <RuleSection title="2. Eligibility">
          <p>Open to legal residents of Washington who are at least 18 years old and can receive an eligible NestHelper family service within NestHelper’s active Bothell, Eastside, Northshore, or select Snohomish County service area. Employees, contractors, household members of the Sponsor, and anyone involved in administering the promotion are not eligible. NestHelper may require identity, age, phone, email, household, and service-address verification before approving a high-value prize.</p>
        </RuleSection>

        <RuleSection title="3. Promotion periods">
          <p>The initial promotion opens at 12:00 a.m. Pacific Time on {formatLaunchDate()} and ends at 11:59:59 p.m. Pacific Time on {endDate}. Each calendar month is a separate grand-prize availability period. A free Parent Reset winner is not guaranteed in any month.</p>
        </RuleSection>

        <RuleSection title="4. How to enter and spin">
          <p>Visit <Link className="font-black text-nest-teal underline" href="/rewards">nesthelperwa.com/rewards</Link>, complete mobile-phone and email verification, provide the requested eligibility information, and agree to these Rules. No payment information or purchase is required. Each verified participant may receive one eligible spin every {LAUNCH_REWARDS_SPIN_COOLDOWN_DAYS} days, up to {LAUNCH_REWARDS_MAX_SPINS_PER_MONTH} spins in a calendar month. Limits apply per person, verified email, verified phone number, account, and household. Attempts to create duplicate identities, automate requests, replay requests, manipulate browser code, or evade limits may be voided.</p>
        </RuleSection>

        <RuleSection title="5. Prize odds and monthly limit">
          <p>The secure server selects and permanently records the result before the animated wheel moves. Wheel slice sizes are decorative and do not represent odds. Approximate odds per eligible spin while each prize remains available are:</p>
          <div className="mt-4 grid gap-2">
            {launchRewardPrizes.map((prize) => (
              <div key={prize.id} className="flex items-start justify-between gap-4 rounded-2xl bg-nest-cream px-4 py-3">
                <div><p className="font-black text-nest-teal">{prize.title}</p><p className="mt-1 text-sm text-nest-ink/65">{prize.description}</p></div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-nest-gold">{prize.approximateOdds}</span>
              </div>
            ))}
          </div>
          <p className="mt-4">The free 3-hour Parent Reset has approximate odds of 1 in 500 per eligible spin only while that month’s prize remains available. There is a maximum of {LAUNCH_REWARDS_GRAND_PRIZE_MONTHLY_LIMIT} verified free Parent Reset winner per calendar month. Once claimed, the rare prize is removed from subsequent results until the next calendar month, while smaller rewards may remain available.</p>
        </RuleSection>

        <RuleSection title="6. Prize restrictions">
          <p>Only one Launch Reward may be used per booking. Launch Rewards cannot be combined with referral credits, the $179 Parent Reset launch price, another promotion, another wheel reward, or another discount. Rewards have no cash value, are nontransferable, and apply only to new eligible bookings reviewed and accepted by NestHelper. Commercial services, custom heavy deep cleaning, move-in/move-out cleaning, biohazard work, hauling, moving labor, carpet restoration, wall washing, and other excluded or unsafe scope are not eligible.</p>
          <ul className="mt-3 grid gap-2 pl-5 marker:text-nest-gold">
            <li><strong>$10 Laundry Rescue:</strong> applies once toward the $59 minimum or eligible Laundry Rescue charges.</li>
            <li><strong>$15 Parent Reset:</strong> applies to the regular $199 standard price and not the $179 launch price.</li>
            <li><strong>$25 credits/discounts:</strong> require an eligible service subtotal of at least $119 before tax.</li>
            <li><strong>Smart Label Starter:</strong> up to 10 standard labels installed during an eligible paid service; no separate free trip.</li>
            <li><strong>Organizing add-on:</strong> up to 30 minutes of light organizing during an eligible paid Parent Reset or Specific Area Reset.</li>
            <li><strong>Free Parent Reset:</strong> one standard 3-hour Parent Reset Plan valued at up to $199. Additional time, add-ons, supplies, heavy cleaning, unsafe work, or work outside the standard scope is excluded or charged separately only after approval.</li>
          </ul>
        </RuleSection>

        <RuleSection title="7. Claiming and redemption">
          <p>Standard rewards are generally issued with a 30-day redemption deadline shown in the participant’s saved reward record. The rare Parent Reset result is provisional and must be claimed within 72 hours. The potential winner must provide accurate contact and service-address information and pass identity, household, service-area, safety, and standard-scope review. If the potential winner does not respond, is ineligible, used duplicate identities, supplied inaccurate information, or requests excluded work, the result may be voided and the monthly prize may be reopened. A reward is reserved only after it is attached to an eligible service request and validated by the server. Service remains subject to NestHelper’s review and availability.</p>
        </RuleSection>

        <RuleSection title="8. Security, disqualification, and technical issues">
          <p>NestHelper may review server logs, verified identities, device and network risk signals, duplicate addresses, request timing, and other reasonable fraud indicators. Refreshing, clearing cookies, private browsing, switching browsers, or opening multiple tabs does not reset eligibility. NestHelper may void entries or rewards affected by fraud, automation, tampering, technical manipulation, or material error. If a technical problem compromises fair administration, NestHelper may pause, correct, or end the affected portion of the promotion in a manner consistent with applicable law.</p>
        </RuleSection>

        <RuleSection title="9. Social platforms">
          <p>This promotion is not sponsored, endorsed, administered by, or associated with Facebook, Instagram, or Meta. By participating, entrants release those platforms from claims related to this promotion. Following, liking, sharing, sending, or tagging is appreciated but is not required to enter and does not change the odds.</p>
        </RuleSection>

        <RuleSection title="10. Privacy and communications">
          <p>Verification information is used to administer the promotion, enforce limits, prevent fraud, contact potential winners, and redeem rewards. Marketing consent is optional and separate from entry. Verification codes are transactional messages requested by the participant. NestHelper does not sell participant information to advertisers.</p>
        </RuleSection>

        <RuleSection title="11. General terms">
          <p>Participation constitutes agreement to these Rules and reasonable Sponsor decisions regarding eligibility, security, prize scope, and administration. Taxes, if any, are the winner’s responsibility. Washington law applies, subject to any nonwaivable consumer rights. To request the name of a verified grand-prize winner after a promotion month closes, email {siteConfig.emails.support}; privacy-sensitive information will not be disclosed.</p>
        </RuleSection>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/rewards" className="focus-ring inline-flex justify-center rounded-full bg-nest-teal px-6 py-3 font-black text-white">Return to Launch Rewards</Link>
          <Link href="/policies/privacy-policy" className="focus-ring inline-flex justify-center rounded-full border border-nest-teal/20 px-6 py-3 font-black text-nest-teal">Privacy Policy</Link>
        </div>
      </article>
    </div>
  );
}

function RuleSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-8 border-t border-nest-gold/15 pt-6"><h2 className="text-xl font-black text-nest-teal">{title}</h2><div className="mt-3 text-sm font-semibold leading-7 text-nest-ink/72">{children}</div></section>;
}
