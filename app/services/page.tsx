import type { ReactNode } from "react";
import { Building2, CheckCircle2, ClipboardCheck, CreditCard, Mail, Scale, ShieldCheck, Sparkles, SprayCan } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ServiceCard } from "@/components/ServiceCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { services, laundryAddOns } from "@/lib/services";
import { siteConfig } from "@/lib/siteConfig";

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services & Pricing"
        title="Clear packages. Real accountability."
        text="Choose a parent-reset package, submit the details, and NestHelper reviews scope, timing, service area, safety notes, and pricing before sending a secure payment link."
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[2rem] border border-nest-gold/16 bg-white/86 p-5 text-center shadow-sm sm:p-6">
          <p className="pill-label mx-auto w-fit"><ShieldCheck size={15} /> Managed service</p>
          <h2 className="text-balance mt-4 text-2xl font-black text-nest-teal sm:text-3xl">Premium support is built into every request.</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm font-semibold leading-6 text-nest-ink/70 sm:text-base sm:leading-7">
            NestHelper pricing includes more than task time: request review, clear scope, helper coordination, secure payment, insured local service, and follow-up after the visit.
          </p>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="pill-label w-fit"><Sparkles size={15} /> Parent Reset Packages</p>
            <h2 className="text-balance mt-4 text-4xl font-black text-nest-teal sm:text-5xl">Designed for the moments when the house feels like too much.</h2>
          </div>
          <div className="pro-card rounded-[2rem] p-6">
            <h3 className="text-xl font-black text-nest-teal">Simple at first glance. Details when you need them.</h3>
            <p className="mt-3 font-medium leading-7 text-nest-ink/70">
              Each card shows the essentials first. Open a package to see what is included, then request the one that fits your family best. We review availability and scope before sending payment.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-nest-gold/16 bg-white/80 p-4 text-sm font-bold text-nest-ink/65 shadow-sm sm:px-5">
          Tap or click a card to open details. Opening another package closes the previous one.
        </div>

        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => <ServiceCard key={service.id} service={service} equalCollapsedHeight />)}
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/30 p-7 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="pill-label w-fit"><Sparkles size={15} /> Recurring Reset Plans</p>
              <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Steady support, modest loyalty savings.</h2>
              <p className="mt-4 font-medium leading-7 text-nest-ink/70">
                After a first completed reset, eligible families may request recurring support. Recurring rates are available when the schedule, scope, service area, and helper fit are consistent.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "2-Hour Parent Reset", biweekly: "$125", weekly: "$119" },
                { title: "3-Hour Family Reset", biweekly: "$189", weekly: "$179" },
                { title: "4-Hour Helper Block", biweekly: "$269", weekly: "$259" },
              ].map((plan) => (
                <div key={plan.title} className="rounded-[1.7rem] border border-nest-gold/16 bg-white/86 p-5 shadow-sm">
                  <h3 className="text-lg font-black text-nest-teal">{plan.title}</h3>
                  <div className="mt-4 grid gap-2 text-sm font-bold text-nest-ink/70">
                    <div className="flex justify-between gap-3 rounded-2xl bg-nest-cream px-3 py-2"><span>Every 2 weeks</span><span className="text-nest-teal">{plan.biweekly}/visit</span></div>
                    <div className="flex justify-between gap-3 rounded-2xl bg-nest-mint/25 px-3 py-2"><span>Weekly</span><span className="text-nest-teal">{plan.weekly}/visit</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-5 rounded-3xl border border-nest-gold/14 bg-white/75 p-4 text-sm font-bold leading-6 text-nest-ink/68">
            First visits are completed at standard pricing. Recurring rates are not discounted trials; they reflect consistent scope, priority scheduling, and a family planning ongoing support. Monthly refresh visits remain at standard pricing when openings allow.
          </p>
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/30 p-7 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="pill-label w-fit"><Building2 size={15} /> Need business cleaning?</p>
              <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Commercial Reset is separate from Parent Reset.</h2>
            </div>
            <div>
              <p className="font-medium leading-7 text-nest-ink/70">
                For small offices, studios, churches, daycare common areas, salons, and local business spaces, use the Commercial Reset page. Commercial work is quoted after review instead of listed as a guaranteed flat package. It is available in select Pierce County, Eastside, and Northshore areas, and product preferences can be noted before quoting.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/commercial-reset" variant="secondary">View Commercial Reset</ButtonLink>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-nest-gold/20 bg-white p-7 shadow-soft sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <p className="pill-label w-fit"><ShieldCheck size={15} /> Included</p>
              <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Every request includes more than task time.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Request review before checkout",
                "Clear scope and prep notes",
                "Service coordination",
                "Helper fit and availability review",
                "Insured local service",
                "Secure payment link",
                "Follow-up after service",
                "Product preferences reviewed",
              ].map((x) => (
                <div key={x} className="group flex gap-3 rounded-2xl bg-nest-cream p-4 font-black text-nest-ink/76 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-nest-teal shadow-sm transition group-hover:bg-nest-teal group-hover:text-white">
                    <CheckCircle2 size={17} />
                  </span>
                  {x}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-nest-mint/25 via-white to-nest-cream p-7 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <p className="pill-label w-fit"><SprayCan size={15} /> Product preferences</p>
              <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Non-toxic, low-odor, and sensitive options can be requested.</h2>
            </div>
            <p className="font-medium leading-7 text-nest-ink/70">
              NestHelper brings the supplies. Tell us in the request if your family prefers non-toxic, low-odor, fragrance-free, or baby/sensitive products. We review the surface, task, supplies, and scope before confirming what fits the visit.
            </p>
          </div>
        </div>

        <div id="laundry" className="mt-10 overflow-hidden rounded-[2.5rem] border border-rose-200 bg-white shadow-soft">
          <div className="bg-gradient-to-br from-rose-50 via-white to-nest-cream p-7 sm:p-8">
            <p className="pill-label w-fit"><Scale size={15} /> Laundry Rescue</p>
            <h2 className="text-balance mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Deposit first. Dry weigh-in after pickup. Final balance after we know the real amount.</h2>
            <p className="mt-4 max-w-4xl text-lg font-medium leading-8 text-nest-ink/72">
              Laundry Rescue uses a non-refundable minimum deposit first. At pickup, laundry is weighed dry using a portable scale. The final total is calculated from dry weight, add-ons, and any bulky quoted items, then the pre-tax deposit is credited toward the final balance. During checkout, customers can choose auto-charge for the final balance or invoice-before-delivery.
            </p>
          </div>

          <div className="grid gap-5 p-7 sm:p-8 lg:grid-cols-3">
            <LaundryStep icon={<CreditCard />} title="1. Deposit" text="$59 standard non-refundable minimum/deposit secures the request after approval and is credited before tax toward the final total." />
            <LaundryStep icon={<Scale />} title="2. Dry weigh-in" text="Laundry is weighed dry at pickup so pricing is transparent." />
            <LaundryStep icon={<ClipboardCheck />} title="3. Final balance" text="Any remaining balance is handled by the checkout option selected: auto-charge after review or invoice before delivery." />
          </div>

          <div className="border-t border-nest-gold/12 p-7 sm:p-8">
            <h3 className="text-2xl font-black text-nest-teal">Laundry add-ons</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {laundryAddOns.map((x) => <div key={x} className="rounded-2xl bg-nest-cream p-4 font-bold text-nest-ink/75 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">{x}</div>)}
            </div>
            <div className="mt-6 rounded-3xl border border-nest-gold/20 bg-nest-mint/20 p-6">
              <h3 className="text-2xl font-black text-nest-teal">Reusable return bags</h3>
              <p className="mt-3 leading-7 text-nest-ink/72">
                Clean laundry may be returned in NestHelper reusable bags or totes. Please empty and return them at your next Laundry Rescue pickup, scheduled drop-off, or another approved return method. Missing or damaged bags may be billed a reasonable replacement fee.
              </p>
              <a href={`mailto:${siteConfig.emails.laundry}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <Mail size={16} /> Laundry questions: {siteConfig.emails.laundry}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function LaundryStep({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="group rounded-[2rem] border border-rose-100 bg-rose-50/65 p-6 transition hover:-translate-y-1 hover:shadow-sm">
      <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-rose-700 shadow-sm transition group-hover:bg-rose-700 group-hover:text-white">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-2 font-medium leading-7 text-nest-ink/70">{text}</p>
    </div>
  );
}
