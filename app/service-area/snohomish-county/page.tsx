import type { Metadata } from "next";
import { CheckCircle2, Clock3, Home, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Snohomish County Home Help",
  description:
    "NestHelper serves Bothell, the Eastside, and select Snohomish County communities with home resets, cleaning, laundry help, errands, and move-related support.",
  alternates: {
    canonical: `${siteConfig.url}/service-area/snohomish-county`,
  },
  openGraph: {
    title: "Snohomish County Home Help | NestHelper",
    description:
      "Home resets, cleaning, laundry help, errands, and move-related support for select Snohomish County communities by request.",
    url: `${siteConfig.url}/service-area/snohomish-county`,
    images: [siteConfig.assets.og],
  },
};

const coreAreas = [
  "Bothell",
  "Woodinville",
  "Kenmore",
  "Kirkland",
  "Redmond",
  "Mill Creek",
  "Lynnwood",
  "Edmonds",
  "Mountlake Terrace",
  "Snohomish",
  "Mukilteo",
];

const byRequestAreas = [
  "Everett",
  "Brier",
  "Maltby",
  "Clearview",
  "Lake Stevens",
  "Monroe",
  "Marysville",
];

const serviceNotes = [
  {
    title: "Reviewed before payment",
    text: "Snohomish County requests are reviewed by address, service type, schedule, and helper coverage before we send a checkout link.",
    icon: <ShieldCheck size={20} />,
  },
  {
    title: "Best nearby fit first",
    text: "We are starting with nearby South Snohomish County communities so travel time and service quality stay manageable.",
    icon: <MapPin size={20} />,
  },
  {
    title: "Service type matters",
    text: "Home resets, move-out cleaning, and cleaning support are easier to expand. Laundry and errands may depend more on route timing.",
    icon: <Clock3 size={20} />,
  },
];

export default function SnohomishCountyServiceAreaPage() {
  return (
    <>
      <PageHero
        eyebrow="Service area"
        title="Now reviewing select Snohomish County requests."
        text="NestHelper is expanding beyond Bothell, Woodinville, and nearby Eastside/Northshore communities into select Snohomish County areas. Availability is confirmed by address before payment."
        ctaLabel="Request Help"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[2rem] border border-nest-gold/18 bg-white p-6 shadow-soft sm:p-8">
            <div className="pill-label mb-4 w-fit">
              <MapPin size={15} /> Areas we are reviewing
            </div>
            <h2 className="text-3xl font-black tracking-tight text-nest-teal sm:text-4xl">
              Nearby communities make the most sense first.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-nest-ink/72">
              We are not promising every Snohomish County address yet. The goal is to serve nearby families well while keeping travel, helper coverage, laundry routes, and scheduling realistic.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-nest-teal/10 bg-nest-cream p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Primary nearby areas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {coreAreas.map((area) => (
                  <span key={area} className="rounded-full border border-nest-gold/16 bg-white px-3 py-1.5 text-sm font-black text-nest-teal">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-nest-teal/10 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Farther areas by request</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {byRequestAreas.map((area) => (
                  <span key={area} className="rounded-full border border-nest-teal/10 bg-nest-mint/35 px-3 py-1.5 text-sm font-bold text-nest-teal">
                    {area}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-nest-ink/65">
                These may require schedule review, helper availability, route planning, or a custom quote.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {serviceNotes.map((note) => (
              <div key={note.title} className="rounded-[1.75rem] border border-nest-gold/18 bg-white/82 p-5 shadow-sm">
                <div className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-nest-mint text-nest-teal">
                    {note.icon}
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-nest-teal">{note.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/68">{note.text}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-[2rem] border border-nest-gold/18 bg-nest-cream p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-nest-teal shadow-sm">
                  <Home size={20} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Services</p>
                  <h3 className="text-xl font-black text-nest-teal">What can be requested</h3>
                </div>
              </div>
              <ul className="mt-5 grid gap-3 text-sm font-semibold leading-6 text-nest-ink/72">
                {[
                  "Parent Reset Plan and focused home resets",
                  "Whole Home Cleaning and Specific Area(s) Reset",
                  "Move-In / Move-Out Cleaning",
                  "Move Prep & Home Reset support",
                  "Laundry Rescue when route timing works",
                  "Errand Helper by route and distance review",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-nest-teal" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2.25rem] border border-nest-teal/10 bg-nest-teal p-6 text-white shadow-soft sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-nest-gold2">
                <Sparkles size={14} /> Best next step
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Send the address and request details first.</h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/78">
                We will confirm whether the address is within a practical service route, whether the requested service is a good fit, and whether any local endorsement or helper coverage item needs review before checkout.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ButtonLink href="/request">Request Help</ButtonLink>
              <ButtonLink href="/contact" variant="secondary">Ask Before Booking</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
