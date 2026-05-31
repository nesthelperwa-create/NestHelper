import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
  SprayCan,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "Commercial Reset | NestHelper",
  description: "Quote-first commercial cleaning and reset services for small offices, studios, churches, daycare common areas, salons, short-term rental turnovers, and local small businesses in select Pierce County, Eastside, and Northshore areas.",
};

const businessTypes = [
  {
    title: "Small offices",
    text: "After-hours or recurring reset support for workstations, entry areas, restrooms, and breakrooms.",
  },
  {
    title: "Studios and gyms",
    text: "Member-facing spaces, lobby areas, restrooms, floors, and high-touch surfaces kept ready for the next class or client.",
  },
  {
    title: "Churches and nonprofits",
    text: "Flexible cleaning support for gathering areas, offices, restrooms, classrooms, and community rooms.",
  },
  {
    title: "Salons and barbershops",
    text: "Client-ready reset support for reception areas, stations, floors, mirrors, and restrooms.",
  },
  {
    title: "Therapy or professional offices",
    text: "Calm, clean waiting rooms, treatment rooms, offices, and restroom touchpoints for client-facing practices.",
  },
  {
    title: "Real estate and insurance offices",
    text: "Polished support for client entrances, conference rooms, desks, display areas, and staff common spaces.",
  },
  {
    title: "Daycare common areas",
    text: "Common-area cleaning requests can be reviewed without adding childcare, supervision, or regulated sanitation services.",
  },
  {
    title: "Schools and learning studios",
    text: "Classrooms, common areas, restrooms, and supply preferences are reviewed before a quote is confirmed.",
  },
  {
    title: "Short-term rental turnovers",
    text: "Between-stay reset cleaning, linen or towel changeover notes, restock checklist review, and optional photo notes.",
  },
  {
    title: "Local small businesses",
    text: "Custom routine cleaning for manageable spaces that need consistency without a large janitorial contract.",
  },
];

const routineCleaning = [
  "Trash and recycling reset",
  "Restroom cleaning",
  "Breakroom and kitchenette reset",
  "Common-area wipe-downs",
  "Dusting and high-touch surfaces",
  "Vacuuming, sweeping, and mopping",
  "Low-odor / non-toxic product options by request",
  "Guest-ready turnover resets when quoted",
  "Linen, towel, and restock checklist review",
];

const specialtyAddOns = [
  "Carpet extraction quoted separately",
  "Spot treatment quoted separately",
  "Floor scrub, buff, wax, or strip/wax by quote",
  "Upholstery or specialty surfaces after review",
  "First-time heavier reset quoted after walkthrough",
  "Daycare requests are common-area focused unless reviewed",
  "Short-term rental work does not include guest messaging, repairs, pest treatment, biohazards, or property management unless separately reviewed",
  "No mold, biohazard, construction cleanup, or hazardous work",
];

export default function CommercialResetPage() {
  return (
    <>
      <PageHero
        eyebrow="Commercial Reset"
        title="Routine cleaning support for small local business spaces."
        text="A separate NestHelper service page for small offices, studios, churches, daycare common areas, salons, short-term rental turnovers, and local business spaces that need reliable reset-style janitorial support. Commercial jobs are quoted after review, not forced into family-service pricing."
        ctaHref="/commercial-reset/request"
        ctaLabel="Request Commercial Reset"
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
                Commercial Reset keeps the family-focused homepage clean while giving small businesses and community spaces a professional place to ask for routine cleaning, first-time resets, recurring janitorial support, short-term rental turnover cleaning, and product preferences such as low-odor or non-toxic options when appropriate.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <MiniProof icon={<ShieldCheck size={20} />} title="Insured local service" text="Commercial requests are reviewed for scope, schedule, address, and safety before any work is confirmed." />
            <MiniProof icon={<ClipboardCheck size={20} />} title="Quote-first process" text="Pricing is customized around square footage, bathrooms, frequency, product preferences, access, and condition." />
            <MiniProof icon={<CalendarClock size={20} />} title="Recurring or one-time" text="Request a one-time reset, weekly service, or more frequent routine cleaning depending on the space." />
            <MiniProof icon={<SprayCan size={20} />} title="Product preferences" text="Non-toxic, low-odor, or fragrance-free options can be requested where appropriate for the surface and scope." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="pill-label mx-auto w-fit"><Sparkles size={15} /> Who it fits</p>
          <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
            Small business spaces that need a reset, not a giant cleaning contract.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-nest-ink/70 sm:text-lg sm:leading-8">
            Commercial Reset is best for manageable local spaces where a clean, consistent environment matters: offices, client-facing rooms, studios, waiting areas, restrooms, staff common areas, daycare or learning-space common areas, and host-managed short-term rental spaces.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {businessTypes.map((type) => (
            <InfoCard key={type.title} icon={type.title.includes("rental") ? <Home size={20} /> : <Building2 size={20} />} title={type.title} text={type.text} />
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/25 p-6 shadow-soft sm:p-8 lg:p-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="pill-label mx-auto w-fit"><BedDouble size={15} /> Short-Term Rental Turnovers</p>
            <h2 className="text-balance mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Guest-ready reset support for local hosts.</h2>
            <p className="mx-auto mt-4 max-w-3xl font-medium leading-7 text-nest-ink/70">
              For Airbnb-style or vacation rental spaces, NestHelper can review turnover cleaning requests as part of Commercial Reset. This can include reset cleaning between stays, linen/towel changeover, restock checklist notes, and optional photo notes after service when the scope is approved.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard icon={<BedDouble size={20} />} title="Between-stay reset" text="Kitchen, bath, floors, surfaces, trash, and guest-ready details based on the approved checklist." />
            <InfoCard icon={<ClipboardCheck size={20} />} title="Host checklist" text="Add bed count, restock items, lockbox/access notes, parking, and must-check areas in the quote form." />
            <InfoCard icon={<Camera size={20} />} title="Photo notes" text="Optional photos can help with quoting, walkthroughs, and documenting priority areas before service." />
            <InfoCard icon={<ShieldCheck size={20} />} title="Clear boundaries" text="No repairs, guest communication, pest treatment, biohazards, or full property management unless separately reviewed." />
          </div>
        </div>
      </section>

      <section className="soft-section px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white/86 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><SprayCan size={15} /> Routine Scope</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">What Commercial Reset can include.</h2>
            <p className="mt-4 font-medium leading-7 text-nest-ink/70">
              Basic Commercial Reset is routine janitorial-style support. Specialty floor work and carpet work are not included by default and are quoted separately when available. Product preferences can be noted in the quote request.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {routineCleaning.map((item) => <CheckTile key={item}>{item}</CheckTile>)}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white/86 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><DoorOpen size={15} /> Add-ons and Boundaries</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Quoted separately when the job needs more.</h2>
            <p className="mt-4 font-medium leading-7 text-nest-ink/70">
              This keeps quotes honest and helps make sure the service scope, product preferences, safety boundaries, and specialty work are reviewed before anything is confirmed.
            </p>
            <div className="mt-7 grid gap-3">
              {specialtyAddOns.map((item) => <CheckTile key={item}>{item}</CheckTile>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="pill-label mx-auto w-fit"><MapPin size={15} /> Service Areas</p>
          <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
            Now quoting select Pierce County, Eastside, and Northshore areas.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl font-medium leading-7 text-nest-ink/70">
            Service availability depends on schedule, scope, address, and local licensing/endorsement requirements. Some city-limit jobs may require a city endorsement before service begins.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <AreaCard
            title="Pierce County focus"
            text="Tacoma, Lakewood, Puyallup, University Place, Fife, Sumner, Bonney Lake, Gig Harbor, Spanaway, Parkland, Graham, Frederickson, South Hill, Midland, Summit-Waller, Elk Plain, and nearby unincorporated Pierce County areas."
          />
          <AreaCard
            title="Eastside and Northshore"
            text="Woodinville, Bothell, Kenmore, Kirkland, Redmond, Bellevue, Duvall, Mill Creek, and nearby Eastside/Northshore areas."
          />
          <div className="rounded-[2rem] border border-nest-gold/16 bg-nest-mint/20 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
            <h3 className="text-2xl font-black text-nest-teal">Nearby communities welcome</h3>
            <p className="mt-3 font-medium leading-7 text-nest-ink/70">
              We include nearby unincorporated Pierce County communities as service areas because many local businesses are outside city limits. Availability still depends on the address, schedule, scope, and any required local endorsements.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.75rem] border border-nest-gold/18 bg-white/90 shadow-soft">
          <div className="bg-gradient-to-br from-nest-cream via-white to-nest-mint/35 p-6 text-center sm:p-8 lg:p-10">
            <p className="pill-label mx-auto w-fit"><CheckCircle2 size={15} /> Quote Guidance</p>
            <h2 className="text-balance mx-auto mt-4 max-w-4xl text-3xl font-black text-nest-teal sm:text-5xl">Pricing is quoted clearly before service is scheduled.</h2>
            <p className="mx-auto mt-4 max-w-4xl text-lg font-medium leading-8 text-nest-ink/72">
              Commercial pricing is not an open-ended hourly clock. NestHelper reviews the space, frequency, bathrooms, flooring, access, timing, current condition, product preferences, and optional photos, then sends a clear visit price or recurring plan before service is scheduled.
            </p>
          </div>
          <div className="grid gap-4 p-6 pb-0 sm:p-8 sm:pb-0 lg:grid-cols-3 lg:p-10 lg:pb-0">
            <PricingCard title="Recurring commercial cleaning" price="From $149/visit" text="Quoted as a clear visit price or monthly plan. Small recurring accounts often start around $595/month depending on frequency, square footage, bathrooms, timing, and scope." />
            <PricingCard title="One-time commercial reset" price="From $225" text="Best for first-time catch-up, move-in prep, office reset, or a deeper one-time clean before recurring service." />
            <PricingCard title="Short-term rental turnover" price="From $129/turnover" text="Small studio/1-bed style turnovers may start here. Larger homes, laundry/linen handling, restock needs, tight windows, and photo reporting are quoted before scheduling." />
          </div>
          <div className="grid gap-3 p-6 sm:p-8 lg:grid-cols-3 lg:p-10">
            <PolicyLink href="/policies/commercial-reset-policy" title="Commercial Reset Policy" />
            <PolicyLink href="/policies/commercial-pricing-add-ons" title="Commercial Pricing & Add-ons" />
            <PolicyLink href="/policies/short-term-rental-turnover-policy" title="Short-Term Rental Policy" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.75rem] border border-nest-gold/18 bg-gradient-to-br from-nest-teal via-[#075c58] to-[#0b4f4b] p-6 text-white shadow-soft sm:p-8 lg:p-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="pill-label mx-auto w-fit border-white/20 bg-white/12 text-nest-gold2"><ClipboardCheck size={15} /> Commercial Quote</p>
            <h2 className="text-balance mt-4 text-3xl font-black sm:text-5xl">Ready for a reviewed commercial quote?</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base font-medium leading-7 text-white/78 sm:text-lg sm:leading-8">
              Use the dedicated quote page when you are ready. Commercial Reset stays focused on business spaces, short-term rental turnovers, and routine cleaning support, while Parent Reset remains separate for homes, laundry, errands, and family support.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/commercial-reset/request" variant="secondary">Request Commercial Reset</ButtonLink>
              <ButtonLink href="/contact" variant="secondary">Ask a Question First</ButtonLink>
              <Link href="/request" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                Need Parent Reset instead? <ArrowRight size={18} />
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


function PolicyLink({ href, title }: { href: string; title: string }) {
  return (
    <Link href={href} className="group inline-flex items-center justify-between gap-3 rounded-2xl border border-nest-gold/14 bg-white px-5 py-4 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold/30 hover:shadow-soft">
      {title}
      <ArrowRight size={16} className="transition group-hover:translate-x-1" />
    </Link>
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

