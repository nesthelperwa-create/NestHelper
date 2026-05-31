import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Building2, CalendarClock, Camera, ClipboardCheck, MapPin } from "lucide-react";
import { CommercialResetForm } from "@/components/forms/CommercialResetForm";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Request Commercial Reset Quote | NestHelper",
  description:
    "Request a reviewed Commercial Reset quote for small offices, studios, churches, daycare common areas, salons, short-term rental turnovers, and local small business spaces.",
};

export default function CommercialResetRequestPage() {
  return (
    <>
      <PageHero
        eyebrow="Commercial Quote"
        title="Request a Commercial Reset quote."
        text="Tell us the basics about the space, location, schedule, and any photos. No payment is due today — NestHelper reviews the request and sends a clear quote before checkout."
        cta={false}
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <aside className="self-start rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-6 shadow-soft backdrop-blur lg:sticky lg:top-28">
          <p className="pill-label w-fit"><ClipboardCheck size={15} /> Quote request</p>
          <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">A few details, then we review.</h2>
          <p className="mt-3 font-medium leading-7 text-nest-ink/70">
            Share the space, location, timing, and photos if available. NestHelper reviews the request first, then sends a quote or recurring plan before payment.
          </p>
          <div className="mt-6 grid gap-3">
            <SidebarPoint icon={<Building2 />} text="Business or property contact" />
            <SidebarPoint icon={<MapPin />} text="Service address and area check" />
            <SidebarPoint icon={<Camera />} text="Space details and optional photos" />
            <SidebarPoint icon={<CalendarClock />} text="Frequency and preferred timing" />
          </div>
          <p className="mt-5 rounded-2xl border border-nest-teal/15 bg-nest-mint/25 p-4 text-sm font-semibold leading-6 text-nest-ink/76">
            Product preferences can be requested when appropriate for the surface and scope.
          </p>
        </aside>

        <CommercialResetForm />
      </section>
    </>
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
