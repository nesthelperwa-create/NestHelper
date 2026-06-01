import type { Metadata } from "next";
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

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CommercialResetForm />
      </section>
    </>
  );
}
