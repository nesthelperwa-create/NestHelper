import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  BadgeDollarSign,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  FileText,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
  SprayCan,
} from "lucide-react";
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

const pricingCards = [
  {
    title: "Small recurring spaces",
    price: "From $149/visit",
    text: "A competitive starting point for smaller offices, studios, salons, and common-area resets. Final quote depends on bathrooms, foot traffic, timing, and scope.",
  },
  {
    title: "Weekly recurring plans",
    price: "Often $595+/month",
    text: "Useful planning range for small spaces that need reliable weekly service. More frequent visits can lower the per-visit square-foot rate.",
  },
  {
    title: "One-time commercial reset",
    price: "From $225",
    text: "For first-time catch-up, move-in prep, office reset, or heavier cleaning before recurring service begins. Photos help us quote fairly.",
  },
];

const squareFootRanges = [
  { frequency: "1x per week", range: "$0.14–$0.20 / sq ft", note: "Best for small offices, studios, and light routine upkeep." },
  { frequency: "2x per week", range: "$0.11–$0.17 / sq ft", note: "Helpful for restrooms, client-facing rooms, and higher traffic spaces." },
  { frequency: "3x+ per week", range: "$0.09–$0.15 / sq ft", note: "Lower per-visit rate when the space stays on a steady routine." },
  { frequency: "One-time light reset", range: "$0.22–$0.35 / sq ft", note: "For lighter first-time cleaning, move-in readiness, or catch-up resets." },
  { frequency: "Heavier first-time reset", range: "$0.35–$0.50 / sq ft", note: "Used when the space needs extra labor before routine service makes sense." },
];

const addOnPricing = [
  { service: "Carpet extraction", range: "$0.35–$0.55 / sq ft", note: "$199 minimum when available" },
  { service: "Spot treatment", range: "$25–$65 / area", note: "Quoted after photo or walkthrough review" },
  { service: "Floor scrub", range: "$0.30–$0.55 / sq ft", note: "$225 minimum when available" },
  { service: "Buff / shine", range: "$0.45–$0.75 / sq ft", note: "$249 minimum when available" },
  { service: "Wax / finish", range: "$0.65–$1.10 / sq ft", note: "$299 minimum when available" },
  { service: "Strip & wax", range: "$1.50–$2.25 / sq ft", note: "$499 minimum; condition matters" },
];

const commercialPolicies = [
  "Commercial Reset is routine janitorial-style support, not licensed childcare, medical, hazmat, biohazard, mold, construction cleanup, or regulated sanitation service.",
  "Daycare and learning-space requests are focused on common areas unless a reviewed scope says otherwise.",
  "NestHelper brings supplies and reviews product preferences before confirming what fits the surface and scope.",
  "Final pricing, add-ons, schedule, access, and city endorsement needs are reviewed before checkout or recurring service begins.",
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
              <div className="mt-7 rounded-2xl border border-nest-gold/14 bg-nest-cream/85 p-4 text-sm font-black leading-6 text-nest-teal shadow-sm">
                Commercial requests are reviewed before checkout, so businesses can share the space, scope, timing, and preferences first.
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

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <AreaCard
            title="Pierce County focus"
            text="Tacoma, Lakewood, Puyallup, University Place, Fife, Sumner, Bonney Lake, Gig Harbor, Spanaway, Parkland, Graham, Frederickson, South Hill, Midland, Summit-Waller, Elk Plain, and nearby unincorporated Pierce County areas."
          />
          <AreaCard
            title="Eastside and Northshore"
            text="Woodinville, Bothell, Kenmore, Kirkland, Redmond, Bellevue, Duvall, Mill Creek, and nearby Eastside/Northshore areas."
          />
          <div className="rounded-[2rem] border border-nest-gold/16 bg-nest-mint/20 p-6 text-center shadow-sm">
            <h3 className="text-2xl font-black text-nest-teal">Nearby communities welcome</h3>
            <p className="mt-3 font-medium leading-7 text-nest-ink/70">
              We include nearby unincorporated Pierce County communities as service areas because many local businesses are outside city limits. Availability still depends on the address, schedule, scope, and any required local endorsements.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.75rem] border border-nest-gold/18 bg-white/90 shadow-soft">
          <div className="bg-gradient-to-br from-nest-cream via-white to-nest-mint/35 p-6 sm:p-8 lg:p-10">
            <CommercialSectionIntro
              icon={<BadgeDollarSign size={15} />}
              label="Pricing Guidance"
              title="Competitive ranges, reviewed before anything is confirmed."
              text="Commercial pricing stays quote-based because square footage, bathrooms, flooring, access, after-hours timing, current condition, product preferences, and optional photos can change the real labor cost. These ranges are planning guidance, not guaranteed flat pricing."
            />
          </div>

          <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-3 lg:p-10">
            {pricingCards.map((card) => (
              <PricingCard key={card.title} title={card.title} price={card.price} text={card.text} />
            ))}
          </div>

          <div className="border-t border-nest-gold/12 p-6 sm:p-8 lg:p-10">
            <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div>
                <p className="pill-label mx-auto w-fit lg:mx-0"><ListChecks size={15} /> Sq Ft Planning</p>
                <h3 className="mt-4 text-center text-3xl font-black text-nest-teal lg:text-left">Routine cleaning by frequency.</h3>
                <p className="mt-3 text-center font-medium leading-7 text-nest-ink/70 lg:text-left">
                  More frequent service usually lowers the per-visit square-foot range because the space stays easier to maintain.
                </p>
              </div>
              <div className="grid gap-3">
                {squareFootRanges.map((item) => (
                  <RangeRow key={item.frequency} title={item.frequency} range={item.range} note={item.note} />
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-nest-gold/12 bg-nest-cream/55 p-6 sm:p-8 lg:p-10">
            <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div>
                <p className="pill-label mx-auto w-fit lg:mx-0"><SprayCan size={15} /> Add-on Ranges</p>
                <h3 className="mt-4 text-center text-3xl font-black text-nest-teal lg:text-left">Specialty items stay separate.</h3>
                <p className="mt-3 text-center font-medium leading-7 text-nest-ink/70 lg:text-left">
                  Basic Commercial Reset does not include carpet extraction, waxing, or specialty floor work by default. These are quoted separately when available.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {addOnPricing.map((item) => (
                  <AddOnPrice key={item.service} service={item.service} range={item.range} note={item.note} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2.75rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/30 p-6 shadow-soft sm:p-8 lg:p-10">
          <CommercialSectionIntro
            icon={<FileText size={15} />}
            label="Commercial Policies"
            title="Clear boundaries for business spaces."
            text="Commercial Reset has its own policy expectations so business customers understand scope, access, supplies, pricing, add-ons, and service boundaries before work begins."
          />

          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {commercialPolicies.map((policy) => (
              <CheckTile key={policy}>{policy}</CheckTile>
            ))}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/policies/commercial-reset-policy" variant="secondary">Read Commercial Policy</ButtonLink>
            <ButtonLink href="/policies/commercial-pricing-addons" variant="secondary">Read Pricing & Add-ons</ButtonLink>
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

function RangeRow({ title, range, note }: { title: string; range: string; note: string }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-nest-gold/12 bg-white p-4 shadow-sm sm:grid-cols-[0.75fr_0.8fr_1.2fr] sm:items-center">
      <div className="font-black text-nest-teal">{title}</div>
      <div className="rounded-full bg-nest-mint/35 px-3 py-2 text-center text-sm font-black text-nest-teal">{range}</div>
      <div className="text-sm font-medium leading-6 text-nest-ink/68">{note}</div>
    </div>
  );
}

function AddOnPrice({ service, range, note }: { service: string; range: string; note: string }) {
  return (
    <div className="rounded-2xl border border-nest-gold/12 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-sm">
      <h4 className="font-black text-nest-teal">{service}</h4>
      <p className="mt-2 text-2xl font-black text-nest-teal">{range}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-nest-ink/66">{note}</p>
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

