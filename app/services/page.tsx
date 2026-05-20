import { PageHero } from "@/components/PageHero";
import { ServiceCard } from "@/components/ServiceCard";
import { services, laundryAddOns } from "@/lib/services";
import { siteConfig } from "@/lib/siteConfig";

export default function ServicesPage() {
  return <>
    <PageHero eyebrow="Services & Pricing" title="Clear packages. Real accountability." text="Pricing reflects vetted helpers, coordination, insurance-backed operations, service standards, Stripe checkout, taxes where applicable, and the NestHelper Reset Promise." />
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{services.map((service)=><ServiceCard key={service.id} service={service}/>)}</div>
      <div className="mt-10 rounded-[2rem] border border-nest-gold/20 bg-white p-8 shadow-soft">
        <h2 className="text-3xl font-black text-nest-teal">What’s included with every visit</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['Vetted helper or partner provider','Service coordination','Clear scope and prep notes','Secure Stripe checkout','Applicable WA tax in checkout/invoice','Follow-up after service','Reset Promise','No awkward negotiation'].map((x)=><div key={x} className="rounded-2xl bg-nest-cream p-4 font-bold text-nest-ink/76">✓ {x}</div>)}
        </div>
      </div>
      <div id="laundry" className="mt-10 rounded-[2rem] border border-nest-teal/15 bg-nest-mint/25 p-8">
        <h2 className="text-3xl font-black text-nest-teal">Laundry Rescue dry-weight flow</h2>
        <p className="mt-3 text-nest-ink/75">Laundry uses a minimum deposit first. After pickup, laundry is weighed dry, add-ons are applied, and the final balance is sent through Stripe invoice/payment link with applicable Washington sales tax.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {laundryAddOns.map((x)=><div key={x} className="rounded-2xl bg-white p-4 font-bold text-nest-ink/75">{x}</div>)}
        </div>
      </div>
      <div id="founding" className="mt-10 rounded-[2rem] border border-nest-gold/25 bg-nest-gold/10 p-8 text-center">
        <h2 className="text-3xl font-black text-nest-teal">Founding Family Beta Credit</h2>
        <p className="mx-auto mt-3 max-w-3xl text-nest-ink/75">To honor the original beta pricing, early families can use code <strong>{siteConfig.foundingCode}</strong> for their first approved request. Promo availability may be limited. Prices shown before applicable tax and fees.</p>
      </div>
    </section>
  </>
}
