import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { RequestForm } from "@/components/forms/RequestForm";

export default function RequestPage() {
  return (
    <>
      <PageHero
        eyebrow="Request Help"
        title="Tell us what’s piling up."
        text="No payment is due when you submit. We review your service area, timing, scope, safety notes, pets, access, and pricing first — then send a secure payment link if the request is approved."
        cta={false}
      />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Suspense fallback={<div className="rounded-3xl bg-white p-8 shadow-soft">Loading form...</div>}>
          <RequestForm />
        </Suspense>
      </section>
    </>
  );
}
