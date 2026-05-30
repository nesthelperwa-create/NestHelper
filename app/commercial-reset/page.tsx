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
import { CommercialQuoteMiniCard } from "@/components/forms/CommercialResetForm";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "Commercial Reset | NestHelper",
  description: "Quote-first commercial cleaning and reset services for small offices, studios, churches, daycare common areas, salons, and local small businesses in select Pierce County, Eastside, and Northshore areas.",
};

const businessTypes = [
  "Small offices",
  "Studios and gyms",
  "Churches and nonprofits",
  "Salons and barbershops",
  "Therapy or professional offices",
  "Real estate and insurance offices",
  "Daycare common areas",
  "Schools and learning studios",
  "Local small businesses",
];

const routineCleaning = [
  "Trash and recycling reset",
  "Restroom cleaning",
  "Breakroom and kitchenette reset",
  "Common-area wipe-downs",
  "Dusting and high-touch surfaces",
  "Vacuuming, sweeping, and mopping",
  "Low-odor / non-toxic product options by request",
];

const specialtyAddOns = [
  "Carpet extraction quoted separately",
  "Spot treatment quoted separately",
  "Floor scrub, buff, wax, or strip/wax by quote",
  "Upholstery or specialty surfaces after review",
  "First-time heavier reset quoted after walkthrough",
  "Daycare requests are common-area focused unless reviewed",
  "No mold, biohazard, construction cleanup, or hazardous work",
];

export default function CommercialResetPage() {
  return (
    <>
      <PageHero
        eyebrow="Commercial Reset"
        title="Routine cleaning support for small local business spaces."
        text="A separate NestHelper service page for small offices, studios, churches, daycare common areas, salons, and local business spaces that need reliable reset-style janitorial support. Commercial jobs are quoted after review, not forced into family-service pricing."
        cta={false}
      />

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/88 p-6 shadow-soft backdrop-blur sm:p-8 lg:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-nest-mint/45 blur-3xl" />
            <div className="relative">
              <p className="pill-label mx-auto w-fit lg:mx-0"><Building2 size={15} /> Built separately from Parent Reset</p>
              <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
                Same NestHelper care, different service lane.
              </h2>
              <p className="mt-5 text-base font-medium leading-7 text-nest-ink/72 sm:text-lg sm:leading-8">
                Commercial Reset keeps the family-focused homepage clean while giving small businesses and community spaces a professional place to ask for routine cleaning, first-time resets, recurring janitorial support, and product preferences such as low-odor or non-toxic options when appropriate.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/commercial-reset/request">Start Quote Request</ButtonLink>
                <ButtonLink href="/services" variant="secondary">Family Services</ButtonLink>
              </div>
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
        <CommercialSectionIntro
          icon={<Sparkles size={15} />}
          label="Who it fits"
          title="Small business spaces that need a reset, not a giant cleaning contract."
          text="Commercial Reset is best for manageable local spaces where a clean, consistent environment matters: offices, client-facing rooms, studios, waiting areas, restrooms, staff common areas, and daycare or learning-space common areas."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {businessTypes.map((type) => (
            <InfoCard key={type} icon={<Building2 size={20} />} title={type} text="Quote reviewed based on space, frequency, access, and cleaning scope." />
          ))}
        </div>
      </section>

      <section className="soft-section px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white/86 p-6 shadow-soft sm:p-8">
            <p className="pill-label mx-auto w-fit"><SprayCan size={15} /> Routine Scope</p>
            <h2 className="mt-4 text-center text-3xl font-black text-nest-teal sm:text-4xl">What Commercial Reset can include.</h2>
            <p className="mt-4 text-center font-medium leading-7 text-nest-ink/70">
              Basic Commercial Reset is routine janitorial-style support. Specialty floor work and carpet work are not included by default and are quoted separately when available. Product preferences can be noted in the quote request.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {routineCleaning.map((item) => <CheckTile key={item}>{item}</CheckTile>)}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white/86 p-6 shadow-soft sm:p-8">
            <p className="pill-label mx-auto w-fit"><DoorOpen size={15} /> Add-ons and Boundaries</p>
            <h2 className="mt-4 text-center text-3xl font-black text-nest-teal sm:text-4xl">Quoted separately when the job needs more.</h2>
            <p className="mt-4 text-center font-medium leading-7 text-nest-ink/70">
              This keeps quotes honest and helps make sure the service scope, product preferences, safety boundaries, and specialty work are reviewed before anything is confirmed.
            </p>
            <div className="mt-7 grid gap-3">
              {specialtyAddOns.map((item) => <CheckTile key={item}>{item}</CheckTile>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <CommercialSectionIntro
          icon={<MapPin size={15} />}
          label="Service Areas"
          title="Now quoting select Pierce County, Eastside, and Northshore areas."
          text="Service availability depends on schedule, scope, address, and local licensing/endorsement requirements. Some city-limit jobs may require a city endorsement before service begins."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <CommercialQuoteMiniCard />
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
            <div className="rounded-[2rem] border border-nest-gold/16 bg-nest-mint/20 p-6 text-center shadow-sm sm:text-left">
              <h3 className="text-2xl font-black text-nest-teal">Nearby communities welcome</h3>
              <p className="mt-3 font-medium leading-7 text-nest-ink/70">
                We include nearby unincorporated Pierce County communities as service areas because many local businesses are outside city limits. Availability still depends on the address, schedule, scope, and any required local endorsements.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.75rem] border border-nest-gold/18 bg-white/90 shadow-soft">
          <div className="bg-gradient-to-br from-nest-cream via-white to-nest-mint/35 p-6 sm:p-8 lg:p-10">
            <CommercialSectionIntro
              icon={<CheckCircle2 size={15} />}
              label="Quote Guidance"
              title="Pricing is shown as guidance, not a guaranteed flat rate."
              text="Commercial pricing stays quote-based because square footage, bathrooms, flooring, access, after-hours timing, current condition, product preferences, and optional photos can change the real labor cost."
            />
          </div>
          <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-3 lg:p-10">
            <PricingCard title="Recurring commercial cleaning" price="Starting at $175/visit" text="$499/month recurring minimum. Quote depends on square footage, bathrooms, frequency, timing, and product preferences." />
            <PricingCard title="One-time commercial reset" price="Starting at $249" text="Best for first-time catch-up, move-in prep, office reset, or a deeper one-time clean before recurring service." />
            <PricingCard title="Hourly quote planning" price="$75–$95/labor hour" text="Used for custom scopes, heavier resets, walkthrough-based quotes, and specialty add-ons." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.75rem] border border-nest-gold/18 bg-gradient-to-br from-nest-teal via-[#075c58] to-[#0b4f4b] p-6 text-white shadow-soft sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="pill-label mx-auto w-fit border-white/20 bg-white/12 text-nest-gold2 lg:mx-0"><ClipboardCheck size={15} /> Commercial Quote</p>
              <h2 className="text-balance mt-4 text-3xl font-black sm:text-5xl">Ready for a reviewed commercial quote?</h2>
              <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-white/78 sm:text-lg sm:leading-8">
                Use the dedicated quote page when you are ready. Commercial Reset stays focused on business spaces, while Parent Reset remains separate for homes, laundry, errands, and family support.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <ButtonLink href="/commercial-reset/request" variant="secondary">Start Commercial Quote</ButtonLink>
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

function CommercialSectionIntro({ icon, label, title, text }: { icon: ReactNode; label: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <p className="pill-label mx-auto w-fit">{icon} {label}</p>
      <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-nest-ink/70 sm:text-lg sm:leading-8">{text}</p>
    </div>
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

