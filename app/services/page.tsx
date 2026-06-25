import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Building2, CheckCircle2, ClipboardCheck, CreditCard, Grid3X3, Home, KeyRound, Mail, QrCode, Scale, ShieldCheck, Shirt, ShoppingBag, Sparkles, SprayCan, Tags, Truck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ServiceCard } from "@/components/ServiceCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { services, laundryAddOns } from "@/lib/services";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Household Help Services, Home Reset, Move-In / Move-Out Cleaning, Laundry & Errands",
  description:
    "View NestHelper services for home resets, kitchen and bath resets, garage and area resets, move-in / move-out cleaning, laundry help, errands, and organizing in Bothell, Woodinville, and nearby Eastside/Northshore areas.",
  alternates: {
    canonical: `${siteConfig.url}/services`,
  },
  openGraph: {
    title: "Household Help Services, Home Reset, Move-In / Move-Out Cleaning, Laundry & Errands | NestHelper",
    description:
      "Managed household support, home reset packages, kitchen and bath resets, garage and area resets, move-in / move-out cleaning, laundry help, organizing, and errand help for busy families. No childcare.",
    url: `${siteConfig.url}/services`,
    images: [siteConfig.assets.og],
  },
};

const hiddenLegacyPackageIds = new Set(["parent-reset-2hr", "helper-block-4hr"]);

export default function ServicesPage() {
  const specialtyServices = services.filter((service) => !hiddenLegacyPackageIds.has(service.id));

  return (
    <>
      <PageHero
        eyebrow="Services & Pricing"
        title="Clear packages. Real accountability."
        text="Choose a household-help package, submit the details, and NestHelper reviews scope, timing, service area, safety notes, and pricing before sending a secure payment link."
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[2rem] border border-nest-gold/16 bg-white/86 p-5 text-center shadow-sm sm:p-6">
          <p className="pill-label mx-auto w-fit"><ShieldCheck size={15} /> Managed service</p>
          <h2 className="text-balance mt-4 text-2xl font-black text-nest-teal sm:text-3xl">Premium support is built into every request.</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm font-semibold leading-6 text-nest-ink/70 sm:text-base sm:leading-7">
            NestHelper pricing includes more than task time: request review, clear scope, helper coordination, secure payment, insured local service, and follow-up after the visit.
          </p>
        </div>

        <div className="mb-10 grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/25 p-6 text-center shadow-soft sm:p-8 lg:text-left">
            <p className="pill-label mx-auto w-fit lg:mx-0"><Sparkles size={15} /> Home Cleaning & Reset Services</p>
            <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-4xl lg:text-5xl">Choose the help your home needs.</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base font-semibold leading-7 text-nest-ink/70 sm:text-lg lg:mx-0">
              Choose Parent Reset Plan for busy-parent room resets, Whole Home Cleaning for the entire home, Specific Area(s) Reset for selected rooms, or Move-In / Move-Out Cleaning for empty or mostly empty homes. You can also request laundry help or errands.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <ButtonLink href="/request#request-form">Request Help</ButtonLink>
            </div>
          </div>

          <div className="pro-card rounded-[2.5rem] p-6 sm:p-8">
            <h3 className="text-2xl font-black text-nest-teal">Not sure what to choose?</h3>
            <div className="mt-5 grid gap-3">
              {[
                { title: "Parent Reset Plan", label: "Busy-parent room reset", text: "Choose this for a 3-hour reset of playrooms, kids rooms, living areas, pantry, entry, or other family spaces with organizing, light cleaning, and child-safe disinfecting.", icon: <Sparkles size={16} />, badge: "bg-blue-50 text-blue-800 border-blue-200" },
                { title: "Whole Home Cleaning", label: "Entire home", text: "Choose this for full-home cleaning, first-time deep cleans, and weekly, bi-weekly, or monthly maintenance.", icon: <Home size={16} />, badge: "bg-emerald-50 text-emerald-900 border-emerald-200" },
                { title: "Specific Area(s) Reset", label: "Selected rooms", text: "Choose this for kitchen, bathroom(s), bedrooms, playroom, pantry, fridge, oven, laundry area, garage, or a few rooms — not the entire home.", icon: <Grid3X3 size={16} />, badge: "bg-lime-50 text-lime-900 border-lime-200" },
                { title: "Move-In / Move-Out Cleaning", label: "Empty home", text: "Choose this for empty or mostly empty homes before moving in, after moving out, or before listing/renting.", icon: <Truck size={16} />, badge: "bg-cyan-50 text-cyan-900 border-cyan-200" },
                { title: "Errand Helper", label: "Local errands", text: "Choose this for simple local errands, pickups, drop-offs, or family support tasks.", icon: <ShoppingBag size={16} />, badge: "bg-amber-50 text-amber-900 border-amber-200" },
                { title: "Laundry Rescue", label: "Laundry help", text: "Choose this for laundry pickup, folding, reset help, or catching up on laundry.", icon: <Shirt size={16} />, badge: "bg-rose-50 text-rose-800 border-rose-200" },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-nest-gold/14 bg-white/82 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${item.badge}`}>{item.icon}</span>
                    <div className="min-w-0">
                      <p className="font-black text-nest-teal">{item.title}</p>
                      <p className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] ${item.badge}`}>{item.label}</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/68">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-10 rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/25 p-7 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="pill-label mx-auto w-fit lg:mx-0"><QrCode size={15} /> Smart Labels</p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-4xl">Included labels. Optional setup help.</h2>
              <p className="mt-3 font-medium leading-7 text-nest-ink/70">
                NestHelper Smart Labels are customer-owned QR stickers that may be included with qualifying resets. Families can use them to keep bins, closets, shelves, moving boxes, seasonal items, and storage areas easier to maintain.
              </p>
              <p className="mt-3 font-medium leading-7 text-nest-ink/70">
                Want us to set them up for you? Choose Starter, Standard, or Full setup in the request form. Larger setups, extra labels, or photo-heavy inventory can still be quoted after review.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SmartLabelFeature icon={<Tags size={19} />} title="Labels included" text="Up to 10 included, with up to 30 for larger organizing projects." />
              <SmartLabelFeature icon={<KeyRound size={19} />} title="Optional PIN" text="Default is no PIN. Add a 4-digit PIN for private labels." />
              <SmartLabelFeature icon={<ShieldCheck size={19} />} title="Family-owned" text="Use them yourself, or ask NestHelper to set them up." />
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm font-bold leading-6 text-nest-ink/70 md:grid-cols-3">
            <div className="rounded-3xl border border-nest-gold/16 bg-white/78 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-nest-gold">Smart Labels</p>
              <p className="mt-1 text-lg font-black text-nest-teal">Included free</p>
              <p className="mt-1">Use up to 10 yourself with qualifying resets, or up to 30 for larger organizing projects.</p>
            </div>
            <div className="rounded-3xl border border-nest-gold/16 bg-white/78 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-nest-gold">Setup add-on</p>
              <p className="mt-1 text-lg font-black text-nest-teal">$49 / $79 / $109</p>
              <p className="mt-1">Starter, Standard, or Full setup for up to 10, 20, or 30 labels during approved reset work.</p>
            </div>
            <div className="rounded-3xl border border-nest-gold/16 bg-white/78 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-nest-gold">Extra labels</p>
              <p className="mt-1 text-lg font-black text-nest-teal">Quote after 30</p>
              <p className="mt-1">Extra labels, detailed inventory, or photo-heavy setup can be quoted after review.</p>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-nest-gold/16 bg-white/80 p-4 text-sm font-bold text-nest-ink/65 shadow-sm sm:px-5">
          Tap or click a card to open details. If you are unsure, start with the closest option and add notes in the request form.
        </div>

        <div className="space-y-10">
          <section aria-labelledby="specific-reset-support">
            <div className="mb-5 flex flex-col gap-2 text-center sm:text-left">
              <p className="pill-label mx-auto w-fit sm:mx-0"><Sparkles size={15} /> Home Cleaning & Support</p>
              <h3 id="specific-reset-support" className="text-2xl font-black text-nest-teal sm:text-3xl">For parent resets, whole-home cleaning, selected areas, moving, laundry, and errands.</h3>
              <p className="max-w-3xl font-semibold leading-7 text-nest-ink/68">
                Parent Reset Plan is for a 3-hour organizing + light cleaning reset in family spaces. Whole Home Cleaning is for the entire home. Specific Area(s) Reset is for selected rooms. Move-In / Move-Out Cleaning is for empty or mostly empty homes.
              </p>
            </div>
            <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
              {specialtyServices.map((service) => <ServiceCard key={service.id} service={service} equalCollapsedHeight />)}
            </div>
          </section>
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/30 p-7 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="pill-label mx-auto w-fit lg:mx-0"><Building2 size={15} /> Need business cleaning?</p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-4xl">Commercial Reset is separate from Parent Reset.</h2>
            </div>
            <div>
              <p className="font-medium leading-7 text-nest-ink/70">
                For small offices, studios, churches, daycare common areas, salons, and local business spaces, use the Commercial Reset page. Commercial work is quoted after review instead of listed as a guaranteed flat package. It is available in select Eastside and Northshore areas, and product preferences can be noted before quoting.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <ButtonLink href="/commercial-reset" variant="secondary">View Commercial Reset</ButtonLink>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-nest-gold/20 bg-white p-7 shadow-soft sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="pill-label mx-auto w-fit lg:mx-0"><ShieldCheck size={15} /> Included</p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-4xl">Every request includes more than task time.</h2>
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
            <div className="text-center lg:text-left">
              <p className="pill-label mx-auto w-fit lg:mx-0"><SprayCan size={15} /> Product preferences</p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-4xl">Non-toxic, low-odor, and sensitive options can be requested.</h2>
            </div>
            <p className="font-medium leading-7 text-nest-ink/70">
              NestHelper brings the supplies. Tell us in the request if your family prefers non-toxic, low-odor, fragrance-free, or baby/sensitive products. We review the surface, task, supplies, and scope before confirming what fits the visit.
            </p>
          </div>
        </div>

        <div id="laundry" className="mt-10 overflow-hidden rounded-[2.5rem] border border-rose-200 bg-white shadow-soft">
          <div className="bg-gradient-to-br from-rose-50 via-white to-nest-cream p-7 text-center sm:p-8">
            <p className="pill-label mx-auto w-fit"><Scale size={15} /> Laundry Rescue</p>
            <h2 className="text-balance mx-auto mt-4 max-w-4xl text-3xl font-black leading-tight text-nest-teal sm:text-4xl">Deposit first. Dry weigh-in after pickup. Final balance after we know the real amount.</h2>
            <p className="mx-auto mt-4 max-w-4xl text-lg font-medium leading-8 text-nest-ink/72">
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

function SmartLabelFeature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.6rem] border border-nest-gold/14 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-nest-mint/35 text-nest-teal">{icon}</div>
      <h3 className="font-black text-nest-teal">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/64">{text}</p>
    </div>
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
