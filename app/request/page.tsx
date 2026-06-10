import { Suspense } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
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
        <div className="mb-8 rounded-[2rem] border border-nest-gold/16 bg-white/86 p-5 text-center shadow-sm sm:p-6">
          <p className="pill-label mx-auto w-fit"><Sparkles size={15} /> Limited Availability</p>
          <h2 className="text-balance mt-4 text-2xl font-black text-nest-teal sm:text-3xl">Limited Parent Reset Openings</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm font-semibold leading-6 text-nest-ink/70 sm:text-base sm:leading-7">
            NestHelper reviews each request before confirmation so we can protect quality, helper fit, and availability while we grow carefully. Submitting a request does not charge you or guarantee a booking.
          </p>
          <div className="mx-auto mt-5 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            {["Scope reviewed first", "Clear price before payment", "Follow-up after service"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-nest-cream px-4 py-3 text-sm font-black text-nest-teal">
                <CheckCircle2 size={16} className="shrink-0 text-nest-gold" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <Suspense fallback={<div className="rounded-3xl bg-white p-8 shadow-soft">Loading form...</div>}>
          <RequestForm />
        </Suspense>
      </section>
    </>
  );
}
