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
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
  SprayCan,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CommercialAddOnPricingSelector } from "./CommercialAddOnPricingSelector";

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
    text: "Host-managed turnover cleaning for manageable rentals when access, checklists, laundry or linen expectations, and guest timing are reviewed first.",
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
  "Short-term rental turnover add-ons can include linen/towel handling, restock checklist notes, limited photo notes, and guest-ready detail checks when approved",
  "No guest messaging, property management, repairs, pest treatment, mold, biohazards, construction cleanup, or hazardous work",
];

const commercialPriceRanges = [
  {
    title: "Recurring commercial cleaning",
    price: "From $175/visit",
    text: "Often quoted as a clear visit price or monthly plan. Small recurring accounts may start around $499/month depending on frequency, square footage, bathrooms, timing, and scope.",
  },
  {
    title: "One-time commercial reset",
    price: "From $249",
    text: "Best for first-time catch-up, move-in prep, office reset, or a deeper one-time clean before moving into recurring service.",
  },
  {
    title: "Labor-hour planning range",
    price: "$75–$95/hr",
    text: "Used internally for custom quotes when the job does not fit a simple square-foot or visit minimum. Final customer quotes are still sent as clear totals when possible.",
  },
  {
    title: "Short-term rental turnover",
    price: "From $129/turnover",
    text: "Small studio or 1-bedroom style turnovers may start here. Larger homes, laundry/linen handling, restock needs, limited time between check-out and check-in, and photo notes are quoted before scheduling.",
  },
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
        <div className="overflow-hidden rounded-[2.35rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/25 p-5 shadow-soft sm:p-6 lg:p-7">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="pill-label w-fit"><MapPin size={15} /> Service area check</p>
              <h2 className="mt-4 text-2xl font-black leading-tight text-nest-teal sm:text-3xl">
                Now quoting select Pierce County, Eastside, and Northshore areas.
              </h2>
              <p className="mt-3 font-medium leading-7 text-nest-ink/70">
                This service is not available everywhere yet. If your business is near these areas, submit a quote request and NestHelper will review the address, schedule, scope, and any local endorsement requirements before confirming service.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-nest-gold/14 bg-white/88 p-4 shadow-sm">
                <h3 className="text-lg font-black text-nest-teal">Pierce County focus</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-nest-ink/68">
                  Tacoma, Lakewood, Puyallup, University Place, Fife, Sumner, Bonney Lake, Gig Harbor, Spanaway, Parkland, Graham, Frederickson, South Hill, and nearby communities.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-nest-gold/14 bg-white/88 p-4 shadow-sm">
                <h3 className="text-lg font-black text-nest-teal">Eastside / Northshore</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-nest-ink/68">
                  Woodinville, Bothell, Kenmore, Kirkland, Redmond, Bellevue, Duvall, Mill Creek, and nearby Eastside/Northshore areas.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-nest-gold/14 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black leading-6 text-nest-ink/68">
              Not sure if your address fits? Request a quote and we will review it before payment or scheduling.
            </p>
            <Link href="#service-areas" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-nest-gold/20 bg-white px-5 py-3 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
              View service area details <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

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
                Commercial Reset keeps the family-focused Parent Reset homepage clean while giving small businesses and community spaces a focused place for routine cleaning, first-time resets, recurring janitorial support, and host-managed turnover requests.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <MiniProof icon={<ShieldCheck size={20} />} title="Insured local service" text="NestHelper operates as an insured local service, so commercial requests are handled through a professional review-and-quote process instead of casual one-off hiring." />
            <MiniProof icon={<ClipboardCheck size={20} />} title="Reviewed before scheduling" text="Each request is checked for address, square footage, bathrooms, flooring, access, timing, supplies, and safety before a quote is confirmed." />
            <MiniProof icon={<CalendarClock size={20} />} title="One-time or recurring plans" text="Choose a first-time reset, weekly routine cleaning, or a custom recurring schedule that fits the space and business hours." />
            <MiniProof icon={<DoorOpen size={20} />} title="Clear scope and boundaries" text="Customers know what is included, what may cost extra, and what NestHelper cannot take on before service is scheduled." />
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
      </section>

      <section id="commercial-scope" className="soft-section scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-stretch gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex h-full flex-col rounded-[2.5rem] border border-nest-gold/18 bg-white/86 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><SprayCan size={15} /> Routine Scope</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">What Commercial Reset can include.</h2>
            <p className="mt-4 font-medium leading-7 text-nest-ink/70">
              Basic Commercial Reset is routine janitorial-style support. Specialty floor work and carpet work are not included by default and are quoted separately when available. Product preferences can be noted in the quote request.
            </p>
            <div className="mt-7 grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
              {routineCleaning.map((item) => <CheckTile key={item}>{item}</CheckTile>)}
            </div>
          </div>

          <div className="flex h-full flex-col rounded-[2.5rem] border border-nest-gold/18 bg-white/86 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><DoorOpen size={15} /> Add-ons and Boundaries</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Quoted separately when the job needs more.</h2>
            <p className="mt-4 font-medium leading-7 text-nest-ink/70">
              This keeps quotes honest and helps make sure the service scope, product preferences, safety boundaries, and specialty work are reviewed before anything is confirmed.
            </p>
            <div className="mt-7 grid flex-1 auto-rows-fr gap-3">
              {specialtyAddOns.map((item) => <CheckTile key={item}>{item}</CheckTile>)}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-7xl items-stretch gap-5 lg:grid-cols-[1fr_0.95fr]">
          <div className="flex h-full flex-col rounded-[2.25rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/25 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><Home size={15} /> Host-managed turnovers</p>
            <h3 className="mt-4 text-2xl font-black text-nest-teal sm:text-3xl">Short-term rentals can be reviewed as a commercial add-on lane.</h3>
            <p className="mt-4 font-medium leading-7 text-nest-ink/70">
              Turnover requests fit best when the host already manages the guest relationship, house rules, supplies, and property decisions. NestHelper can review cleaning, linen or towel handling, restock checklist notes, and optional photo notes as part of the approved quote.
            </p>
            <p className="mt-4 rounded-2xl bg-white/72 p-4 text-sm font-bold leading-6 text-nest-ink/68">
              Boundaries stay clear: no guest messaging, platform communication, repairs, pest treatment, biohazards, emergency response, or full property management unless separately reviewed and confirmed.
            </p>
          </div>

          <div id="commercial-policy-details" className="flex h-full scroll-mt-28 flex-col rounded-[2.25rem] border border-nest-gold/18 bg-white/86 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><ClipboardCheck size={15} /> Scope details</p>
            <h3 className="mt-4 text-2xl font-black text-nest-teal sm:text-3xl">Routine scope and special-case boundaries.</h3>
            <p className="mt-4 font-medium leading-7 text-nest-ink/70">
              These links explain what routine Commercial Reset can include, what stays outside the basic scope, and how host-managed turnovers are reviewed before scheduling.
            </p>
            <div className="mt-6 grid gap-3">
              <ActionLink href="/policies/commercial-reset-policy" title="Commercial Reset Policy" />
              <ActionLink href="/policies/short-term-rental-turnover-policy" title="Short-Term Rental Turnover Policy" />
            </div>
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
          <div className="grid gap-4 p-6 sm:p-8 md:grid-cols-2 lg:grid-cols-4 lg:p-10">
            {commercialPriceRanges.map((item) => (
              <PricingCard key={item.title} title={item.title} price={item.price} text={item.text} />
            ))}
          </div>

          <div className="border-t border-nest-gold/14 bg-white/78 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-4xl text-center">
              <p className="pill-label mx-auto w-fit"><DoorOpen size={15} /> Add-on pricing guidance</p>
              <h3 className="mt-4 text-2xl font-black text-nest-teal sm:text-3xl">Specialty work is priced separately so the quote stays clear.</h3>
              <p className="mx-auto mt-4 max-w-3xl font-medium leading-7 text-nest-ink/70">
                These are planning ranges, not guaranteed final prices. NestHelper confirms add-ons after reviewing the space, condition, photos, surface type, access, and timing.
              </p>
            </div>
            <div className="mt-7">
              <CommercialAddOnPricingSelector />
            </div>
            <p className="mx-auto mt-6 max-w-4xl rounded-2xl bg-nest-cream p-4 text-center text-sm font-bold leading-6 text-nest-ink/68">
              Basic Commercial Reset does not automatically include carpet shampooing, wax, strip-and-wax, repairs, mold, biohazards, construction cleanup, or hazardous work. Those are reviewed separately or declined when outside NestHelper’s scope.
            </p>
          </div>
        </div>
      </section>

      <section id="service-areas" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="pill-label mx-auto w-fit"><MapPin size={15} /> Detailed Service Areas</p>
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
    <div className="group flex h-full items-start gap-3 rounded-2xl border border-nest-gold/12 bg-white p-4 font-black text-nest-ink/78 shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold/28 hover:shadow-sm">
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


function ActionLink({ href, title }: { href: string; title: string }) {
  return (
    <Link href={href} className="group inline-flex items-center justify-between gap-3 rounded-2xl border border-nest-gold/14 bg-white px-5 py-4 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold/30 hover:shadow-soft">
      {title}
      <ArrowRight size={16} className="transition group-hover:translate-x-1" />
    </Link>
  );
}

function PricingCard({ title, price, text }: { title: string; price: string; text: string }) {
  return (
    <div className="h-full rounded-[2rem] border border-nest-gold/16 bg-nest-cream p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-sm">
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-3 text-3xl font-black text-nest-teal">{price}</p>
      <p className="mt-3 text-sm font-medium leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}

