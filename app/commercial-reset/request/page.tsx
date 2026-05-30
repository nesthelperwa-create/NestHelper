import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Building2, CalendarClock, ClipboardCheck, MapPin, SprayCan } from "lucide-react";
import { CommercialResetForm } from "@/components/forms/CommercialResetForm";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Request Commercial Reset Quote | NestHelper",
  description:
    "Request a reviewed Commercial Reset quote for small offices, studios, churches, daycare common areas, salons, and local small business spaces.",
};

export default function CommercialResetRequestPage() {
  return (
    <>
      <PageHero
        eyebrow="Commercial Quote"
        title="Tell us about the business space."
        text="No payment is due when you submit. NestHelper reviews the address, scope, frequency, access, photos, product preferences, and service fit before confirming availability or sending a quote/payment link."
        cta={false}
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <aside className="self-start rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-6 shadow-soft backdrop-blur lg:sticky lg:top-28">
          <p className="pill-label w-fit"><ClipboardCheck size={15} /> Guided Intake</p>
          <h2 className="mt-4 text-3xl font-black text-nest-teal sm:text-4xl">Start with the basics.</h2>
          <p className="mt-3 font-medium leading-7 text-nest-ink/70">
            This page is only for Commercial Reset. The form uses dropdowns, checkboxes, and optional photos to keep the request simple while still giving NestHelper enough information to review fit and quote accurately.
          </p>
          <div className="mt-6 grid gap-3">
            <SidebarPoint icon={<Building2 />} text="Business contact and type" />
            <SidebarPoint icon={<MapPin />} text="Pierce County or Eastside/Northshore area review" />
            <SidebarPoint icon={<SprayCan />} text="Size, bathrooms, priorities, product preferences, and photos" />
            <SidebarPoint icon={<CalendarClock />} text="Frequency and preferred service windows" />
          </div>
          <p className="mt-5 rounded-2xl border border-nest-teal/15 bg-nest-mint/25 p-4 text-sm font-semibold leading-6 text-nest-ink/76">
            NestHelper brings the supplies. Non-toxic, low-odor, or fragrance-free product preferences can be requested where appropriate for the surface and scope.
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
