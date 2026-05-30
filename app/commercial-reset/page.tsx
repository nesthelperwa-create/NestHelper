import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  MapPin,
  ShieldCheck,
  Sparkles,
  SprayCan,
} from "lucide-react";
import { CommercialQuoteMiniCard, CommercialResetForm } from "@/components/forms/CommercialResetForm";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "Commercial Reset | NestHelper",
  description: "Quote-first commercial cleaning and reset services for small offices, studios, churches, salons, and local small businesses in select Pierce County, Eastside, and Northshore areas.",
};

const businessTypes = [
  "Small offices",
  "Studios and gyms",
  "Churches and nonprofits",
  "Salons and barbershops",
  "Therapy or professional offices",
  "Real estate and insurance offices",
  "Daycare common areas",
  "Local small businesses",
];

const routineCleaning = [
  "Trash and recycling reset",
  "Restroom cleaning",
  "Breakroom and kitchenette reset",
  "Common-area wipe-downs",
  "Dusting and high-touch surfaces",
  "Vacuuming, sweeping, and mopping",
];

const specialtyAddOns = [
  "Carpet extraction quoted separately",
  "Spot treatment quoted separately",
  "Floor scrub, buff, wax, or strip/wax by quote",
  "Upholstery or specialty surfaces after review",
  "First-time heavier reset quoted after walkthrough",
  "No mold, biohazard, construction cleanup, or hazardous work",
];

export default function CommercialResetPage() {
  return (
    <>
      <PageHero
        eyebrow="Commercial Reset"
        title="Routine cleaning support for small local business spaces."
        text="A separate NestHelper service page for small offices, studios, churches, salons, and local business spaces that need reliable reset-style janitorial support. Commercial jobs are quoted after review, not forced into family-service pricing."
        cta={false}
      />

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/88 p-6 shadow-soft backdrop-blur sm:p-8 lg:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-nest-mint/45 blur-3xl" />
            <div className="relative">
              <p className="pill-label w-fit"><Building2 size={15} /> Built separately from Parent Reset</p>
              <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
                Same NestHelper care, different service lane.
              </h2>
              <p className="mt-5 text-base font-medium leading-7 text-nest-ink/72 sm:text-lg sm:leading-8">
                Commercial Reset keeps the family-focused homepage clean while giving small businesses a professional place to ask for routine cleaning, first-time resets, and recurring janitorial support.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="#commercial-quote">Request Commercial Quote</ButtonLink>
                <ButtonLink href="/services" variant="secondary">Family Services</ButtonLink>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <MiniProof icon={<ShieldCheck size={20} />} title="Insured local service" text="Commercial requests are reviewed for scope, schedule, address, and safety before any work is confirmed." />
            <MiniProof icon={<ClipboardCheck size={20} />} title="Quote-first process" text="Pricing is customized around square footage, bathrooms, frequency, supplies, access, and condition." />
            <MiniProof icon={<CalendarClock size={20} />} title="Recurring or one-time" text="Request a one-time reset, weekly service, or more frequent routine cleaning depending on the space." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="pill-label w-fit"><Sparkles size={15} /> Who it fits</p>
            <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
              Small business spaces that need a reset, not a giant cleaning contract.
            </h2>
          </div>
          <p className="text-base font-medium leading-7 text-nest-ink/70 sm:text-lg sm:leading-8">
            Commercial Reset is best for manageable local spaces where a clean, consistent environment matters: offices, client-facing rooms, studios, waiting areas, restrooms, and staff common areas.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {businessTypes.map((type) => (
            <InfoCard key={type} icon={<Building2 size={20} />} title={type} text="Quote reviewed based on space, frequency, access, and cleaning scope." />
          ))}
        </div>
      </section>

      <section className="soft-section px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white/86 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><SprayCan size={15} /> Routine Scope</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">What Commercial Reset can include.</h2>
            <p className="mt-4 font-medium leading-7 text-nest-ink/70">
              Basic Commercial Reset is routine janitorial-style support. Specialty floor work and carpet work are not included by default and are quoted separately when available.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {routineCleaning.map((item) => <CheckTile key={item}>{item}</CheckTile>)}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white/86 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><DoorOpen size={15} /> Add-ons and Boundaries</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Quoted separately when the job needs more.</h2>
            <p className="mt-4 font-medium leading-7 text-nest-ink/70">
              This keeps quotes honest and protects NestHelper from accidentally promising specialty work under a basic cleaning price.
            </p>
            <div className="mt-7 grid gap-3">
              {specialtyAddOns.map((item) => <CheckTile key={item}>{item}</CheckTile>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="pill-label w-fit"><MapPin size={15} /> Service Areas</p>
            <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
              Now quoting select Pierce County, Eastside, and Northshore areas.
            </h2>
            <p className="mt-5 font-medium leading-7 text-nest-ink/70">
              Service availability depends on schedule, scope, address, and local licensing/endorsement requirements. Some city-limit jobs may require a city endorsement before service begins.
            </p>
            <div className="mt-7">
              <CommercialQuoteMiniCard />
            </div>
          </div>

          <div className="grid gap-5">
            <AreaCard
              title="Pierce County focus"
              text="Tacoma, Lakewood, Puyallup, University Place, Fife, Sumner, Bonney Lake, Gig Harbor, Spanaway, Parkland, Graham, Frederickson, South Hill, Midland, Summit-Waller, Elk Plain, and nearby unincorporated Pierce County areas."
            />
            <AreaCard
              title="Eastside and Northshore"
              text="Woodinville, Bothell, Kenmore, Kirkland, Redmond, Bellevue, Duvall, Mill Creek, and nearby Eastside/Northshore areas."
            />
            <div className="rounded-[2rem] border border-nest-gold/16 bg-nest-mint/20 p-6">
              <h3 className="text-2xl font-black text-nest-teal">Important wording for unincorporated areas</h3>
              <p className="mt-3 font-medium leading-7 text-nest-ink/70">
                The page lists unincorporated Pierce County communities as service areas without calling them cities. That keeps the wording accurate while still helping local business owners recognize their area.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.75rem] border border-nest-gold/18 bg-white/90 shadow-soft">
          <div className="bg-gradient-to-br from-nest-cream via-white to-nest-mint/35 p-6 sm:p-8 lg:p-10">
            <p className="pill-label w-fit"><CheckCircle2 size={15} /> Quote Guidance</p>
            <h2 className="text-balance mt-4 text-3xl font-black text-nest-teal sm:text-5xl">Pricing is shown as guidance, not a guaranteed flat rate.</h2>
            <p className="mt-4 max-w-4xl text-lg font-medium leading-8 text-nest-ink/72">
              Commercial pricing should stay quote-based because square footage, bathrooms, flooring, access, after-hours timing, and current condition can change the real labor cost.
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-3 lg:p-10">
            <PricingCard title="Recurring commercial cleaning" price="Starting at $175/visit" text="$499/month recurring minimum. Quote depends on square footage, bathrooms, frequency, timing, and supplies." />
            <PricingCard title="One-time commercial reset" price="Starting at $249" text="Best for first-time catch-up, move-in prep, office reset, or a deeper one-time clean before recurring service." />
            <PricingCard title="Hourly quote planning" price="$75–$95/labor hour" text="Used internally for custom scopes, heavier resets, walkthrough-based quotes, and specialty add-ons." />
          </div>
        </div>
      </section>

      <section id="commercial-quote" className="mx-auto grid max-w-7xl scroll-mt-24 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div className="self-start rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-6 shadow-soft backdrop-blur lg:sticky lg:top-28">
          <p className="pill-label w-fit"><ClipboardCheck size={15} /> Quote Request</p>
          <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Start with a reviewed request.</h2>
          <p className="mt-3 font-medium leading-7 text-nest-ink/70">
            This form sends the commercial request into the same private NestHelper admin dashboard, marked as Commercial Reset, so you can review it before quoting or sending any payment link.
          </p>
          <div className="mt-6 grid gap-3">
            <SidebarPoint icon={<Building2 />} text="Business name, type, and contact" />
            <SidebarPoint icon={<MapPin />} text="Address and service area review" />
            <SidebarPoint icon={<SprayCan />} text="Square footage, bathrooms, floors, supplies" />
            <SidebarPoint icon={<CalendarClock />} text="Frequency and preferred service windows" />
          </div>
        </div>

        <CommercialResetForm />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-nest-gold/18 bg-nest-teal p-6 text-white shadow-soft sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-nest-gold2">Parent Reset still stays separate</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Looking for home help instead?</h2>
              <p className="mt-3 max-w-3xl leading-7 text-white/80">
                Commercial Reset is for business spaces. Parent Reset services stay focused on families, homes, laundry, errands, and household support.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/request" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-black text-nest-teal shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-cream">
                Request Parent Reset <ArrowRight size={18} />
              </Link>
              <Link href="/" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function MiniProof({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="group rounded-[2rem] border border-nest-gold/16 bg-white/88 p-5 shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-nest-mint/35 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="group h-full rounded-[1.9rem] border border-nest-gold/12 bg-white/88 p-5 shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-7 text-nest-ink/68">{text}</p>
    </div>
  );
}

function CheckTile({ children }: { children: ReactNode }) {
  return (
    <div className="group flex gap-3 rounded-2xl border border-nest-gold/12 bg-white p-4 font-black text-nest-ink/78 shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold/28 hover:shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nest-mint/35 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">
        <CheckCircle2 size={18} />
      </span>
      <span>{children}</span>
    </div>
  );
}

function AreaCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-nest-gold/16 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <h3 className="text-2xl font-black text-nest-teal">{title}</h3>
      <p className="mt-3 font-medium leading-7 text-nest-ink/70">{text}</p>
    </div>
  );
}

function PricingCard({ title, price, text }: { title: string; price: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-nest-gold/16 bg-nest-cream p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-sm">
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-3 text-3xl font-black text-nest-teal">{price}</p>
      <p className="mt-3 text-sm font-medium leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}

function SidebarPoint({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-nest-cream p-4 font-black text-nest-ink/76">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-nest-teal shadow-sm">{icon}</span>
      {text}
    </div>
  );
}
