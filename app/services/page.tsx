import { CheckCircle2, ClipboardCheck, CreditCard, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ServiceCard } from "@/components/ServiceCard";
import { services, laundryAddOns } from "@/lib/services";

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services & Pricing"
        title="Clear packages. Real accountability."
        text="Choose a parent-reset package, submit the details, and NestHelper reviews scope, timing, service area, safety notes, and pricing before sending payment."
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="pill-label w-fit"><Sparkles size={15} /> Parent Reset Packages</p>
            <h2 className="text-balance mt-4 text-4xl font-black text-nest-teal sm:text-5xl">Designed for the moments when the house feels like too much.</h2>
          </div>
          <div className="pro-card rounded-[2rem] p-6">
            <h3 className="text-xl font-black text-nest-teal">What the price covers</h3>
            <p className="mt-3 font-medium leading-7 text-nest-ink/70">
              Pricing is not just helper time. It includes coordination, request review, service standards, clear communication, payment handling, and follow-up so parents are not managing everything themselves.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => <ServiceCard key={service.id} service={service} />)}
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-nest-gold/20 bg-white p-7 shadow-soft sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <p className="pill-label w-fit"><ShieldCheck size={15} /> Included</p>
              <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Every request includes more than the task list.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Request review before checkout",
                "Service coordination",
                "Clear scope and prep notes",
                "Secure payment link",
                "Follow-up after service",
                "No awkward negotiation",
              ].map((x) => (
                <div key={x} className="flex gap-3 rounded-2xl bg-nest-cream p-4 font-black text-nest-ink/76">
                  <CheckCircle2 className="shrink-0 text-nest-teal" size={19} /> {x}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="laundry" className="mt-10 overflow-hidden rounded-[2.5rem] border border-rose-200 bg-white shadow-soft">
          <div className="bg-gradient-to-br from-rose-50 via-white to-nest-cream p-7 sm:p-8">
            <p className="pill-label w-fit"><Scale size={15} /> Laundry Rescue</p>
            <h2 className="text-balance mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Deposit first. Dry weigh-in after pickup. Final balance after we know the real amount.</h2>
            <p className="mt-4 max-w-4xl text-lg font-medium leading-8 text-nest-ink/72">
              Laundry Rescue uses a minimum deposit first. At pickup, laundry is weighed dry using a portable scale. The final total is calculated from dry weight, add-ons, and any bulky quoted items, then the deposit is credited toward the final balance.
            </p>
          </div>

          <div className="grid gap-5 p-7 sm:p-8 lg:grid-cols-3">
            <LaundryStep icon={<CreditCard />} title="1. Deposit" text="$59 standard minimum/deposit secures the request after approval." />
            <LaundryStep icon={<Scale />} title="2. Dry weigh-in" text="Laundry is weighed dry at pickup so pricing is transparent." />
            <LaundryStep icon={<ClipboardCheck />} title="3. Final balance" text="Any remaining balance is sent after weight and add-ons are confirmed." />
          </div>

          <div className="border-t border-nest-gold/12 p-7 sm:p-8">
            <h3 className="text-2xl font-black text-nest-teal">Laundry add-ons</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {laundryAddOns.map((x) => <div key={x} className="rounded-2xl bg-nest-cream p-4 font-bold text-nest-ink/75">{x}</div>)}
            </div>
            <div className="mt-6 rounded-3xl border border-nest-gold/20 bg-nest-mint/20 p-6">
              <h3 className="text-2xl font-black text-nest-teal">Reusable return bags</h3>
              <p className="mt-3 leading-7 text-nest-ink/72">
                Clean laundry may be returned in NestHelper reusable bags or totes. Please empty and return them at your next Laundry Rescue pickup, scheduled drop-off, or another approved return method. Missing or damaged bags may be billed a reasonable replacement fee.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function LaundryStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-rose-100 bg-rose-50/65 p-6">
      <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-rose-700 shadow-sm">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-2 font-medium leading-7 text-nest-ink/70">{text}</p>
    </div>
  );
}
