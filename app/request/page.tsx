import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { RequestForm } from "@/components/forms/RequestForm";

export default function RequestPage() {
  return <>
    <PageHero eyebrow="Request Help" title="Tell us what’s piling up." text="We’ll review your request for service area, scope, safety, pets, access, availability, promo code, and pricing before sending a secure Stripe checkout link." cta={false} />
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="rounded-3xl bg-white p-8 shadow-soft">Loading form...</div>}><RequestForm /></Suspense>
    </section>
  </>
}
