import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Building2, CheckCircle2, ClipboardCheck, CreditCard, Grid3X3, Home, Mail, Scale, ShieldCheck, Shirt, ShoppingBag, Sparkles, SprayCan, Tags, Truck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ServiceCard } from "@/components/ServiceCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { services, laundryAddOns } from "@/lib/services";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Home Cleaning & Parent Reset Services | NestHelper",
  description:
    "NestHelper offers whole-home cleaning, parent reset help, simple in-home meal prep support, area resets, Move Prep & Home Reset, move-in/move-out cleaning, laundry rescue, and errands for Bothell and Eastside families.",
  alternates: {
    canonical: `${siteConfig.url}/services`,
  },
  openGraph: {
    title: "Home Cleaning & Parent Reset Services | NestHelper",
    description:
      "Compare NestHelper services for whole-home cleaning, parent resets, simple in-home meal prep support, area resets, Move Prep & Home Reset, move-in/move-out cleaning, laundry rescue, and errands.",
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
              Start with the closest service. We review the details before checkout, so you do not have to pick everything perfectly.
            </p>
            <p className="mx-auto mt-5 max-w-3xl text-sm font-black leading-6 text-nest-teal sm:text-base lg:mx-0">
              Click a service guide to jump to the matching service card below.
            </p>
          </div>

          <div className="pro-card rounded-[2.5rem] p-6 sm:p-8">
            <h3 className="text-2xl font-black text-nest-teal">Not sure what to choose?</h3>
            <div className="mt-5 grid gap-3">
              {[
                { title: "Parent Reset Plan", label: "Busy-parent room reset", href: "#service-family-reset-3hr", text: "Choose this for a 3-hour reset of playrooms, kids rooms, living areas, pantry, entry, or other family spaces with organizing, light cleaning, child-safe disinfecting, and optional simple in-home meal prep.", icon: <Sparkles size={16} />, badge: "bg-blue-50 text-blue-800 border-blue-200" },
                { title: "Whole Home Cleaning", label: "Entire home", href: "#service-whole-home-reset", text: "Choose this for full-home cleaning, first-time deep cleans, and weekly, bi-weekly, or monthly maintenance.", icon: <Home size={16} />, badge: "bg-emerald-50 text-emerald-900 border-emerald-200" },
                { title: "Specific Area(s) Reset", label: "Selected rooms", href: "#service-specific-area-reset", text: "Choose this for kitchen, bathroom(s), bedrooms, playroom, pantry, fridge, oven, laundry area, garage, or a few rooms — not the entire home.", icon: <Grid3X3 size={16} />, badge: "bg-lime-50 text-lime-900 border-lime-200" },
                { title: "Move-In / Move-Out Cleaning", label: "Empty home", href: "#service-move-out-cleaning", text: "Choose this for empty or mostly empty homes before moving in, after moving out, or before listing/renting.", icon: <Truck size={16} />, badge: "bg-cyan-50 text-cyan-900 border-cyan-200" },
                { title: "Move Prep & Home Reset", label: "Move support", href: "#service-move-prep-home-reset", text: "Movers handle the heavy lifting. NestHelper helps with sorting, open-first essentials boxes, QR labels, packing supply kits, light unpacking, and after-move setup.", icon: <Tags size={16} />, badge: "bg-amber-50 text-amber-900 border-amber-200" },
                { title: "Errand Helper", label: "Local errands", href: "#service-errand-helper", text: "Choose this for simple local errands, pickups, drop-offs, or family support tasks.", icon: <ShoppingBag size={16} />, badge: "bg-amber-50 text-amber-900 border-amber-200" },
                { title: "Laundry Rescue", label: "Laundry help", href: "#service-laundry-rescue", text: "Choose this for laundry pickup, wash, dry, fold, and return when the baskets are piling up.", icon: <Shirt size={16} />, badge: "bg-rose-50 text-rose-800 border-rose-200" },
              ].map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="block rounded-3xl border border-nest-gold/14 bg-white/82 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-nest-teal/20"
                  aria-label={`Jump to ${item.title}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${item.badge}`}>{item.icon}</span>
                    <div className="min-w-0">
                      <p className="font-black text-nest-teal">{item.title}</p>
                      <p className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] ${item.badge}`}>{item.label}</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/68">{item.text}</p>
                    </div>
                  </div>
                </a>
              ))}
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
                Pick the main service first. Add-ons like simple meal prep, QR labels, packing supply kits, or move support can be noted in the request and confirmed before payment. Laundry Rescue stays separate so pricing stays clear.
              </p>
            </div>
            <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
              {specialtyServices.map((service) => (
                <div key={service.id} id={`service-${service.id}`} className="scroll-mt-28">
                  <ServiceCard service={service} equalCollapsedHeight />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-10 rounded-[2.25rem] border border-nest-gold/18 bg-white/88 p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="pill-label w-fit"><Sparkles size={15} /> Helpful add-ons</p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-nest-teal sm:text-3xl">Mention extras without overthinking the package.</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-nest-ink/68">
                Choose the main service first. These extras can be added, reviewed, or quoted before any payment link is sent.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SupportNoteCard
                icon={<Sparkles size={18} />}
                title="Simple meal prep"
                label="Parent Reset option"
                text="In-home only: wash/chop produce, portion snacks, or prep simple ingredients using the customer’s food and kitchen."
              />
              <SupportNoteCard
                icon={<Tags size={18} />}
                title="QR Smart Labels"
                label="Organizing / move support"
                text="Good for bins, shelves, closets, storage, and moving boxes. Use them yourself or ask for setup help."
              />
              <SupportNoteCard
                icon={<ClipboardCheck size={18} />}
                title="Move support"
                label="Move support option"
                text="Sorting, open-first boxes, QR labels, packing supply kits, light unpacking, and after-move setup. Movers handle transportation and heavy lifting."
              />
            </div>
          </div>
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
            <h2 className="text-balance mx-auto mt-4 max-w-4xl text-3xl font-black leading-tight text-nest-teal sm:text-4xl">$59 minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs.</h2>
            <p className="mx-auto mt-4 max-w-4xl text-lg font-medium leading-8 text-nest-ink/72">
              Laundry Rescue intro launch pricing keeps the first step simple. Additional laundry above the included weight is $2.25/lb. At pickup, laundry is weighed dry using a portable scale, add-ons or bulky items are reviewed, and any final balance is handled by the option selected during checkout: auto-charge after review or invoice-before-delivery.
            </p>
          </div>

          <div className="grid gap-5 p-7 sm:p-8 lg:grid-cols-3">
            <LaundryStep icon={<CreditCard />} title="1. Intro minimum" text="$59 non-refundable minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs of laundry." />
            <LaundryStep icon={<Scale />} title="2. Dry weigh-in" text="Laundry is weighed dry at pickup. Additional laundry above the included weight is $2.25/lb." />
            <LaundryStep icon={<ClipboardCheck />} title="3. Extras if needed" text="Approved add-ons, bulky items, or additional weight are handled by the checkout option selected: auto-charge after review or invoice before delivery." />
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

function SupportNoteCard({ icon, title, label, text }: { icon: ReactNode; title: string; label: string; text: string }) {
  return (
    <div className="rounded-[1.6rem] border border-nest-gold/14 bg-nest-cream/70 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-nest-teal shadow-sm">{icon}</div>
      <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-nest-gold">{label}</p>
      <h3 className="mt-1 text-lg font-black leading-tight text-nest-teal">{title}</h3>
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
