import { Suspense } from "react";
import { CalendarClock, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { RequestForm } from "@/components/forms/RequestForm";

export default function RequestPage() {
  return (
    <>
      <PageHero
        eyebrow="Request Help"
        title="Tell us what’s piling up."
        text="No payment is due when you submit. NestHelper is currently accepting a limited number of requests while we grow carefully, so we review service area, timing, scope, safety notes, pets, access, pricing, and helper availability before approval."
        cta={false}
      />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-6 rounded-[2rem] border border-nest-gold/18 bg-white/88 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-nest-mint/40 text-nest-teal">
              <CalendarClock size={22} />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-nest-gold">Limited availability</p>
              <h2 className="mt-2 text-2xl font-black text-nest-teal">Requests are reviewed before we confirm a spot.</h2>
              <p className="mt-2 leading-7 text-nest-ink/72">
                Submitting this form does not guarantee a booking. To protect service quality, NestHelper reviews each request for scope, location, timing, safety notes, and helper availability before sending payment or scheduling next steps.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-nest-cream px-4 py-2 text-sm font-black text-nest-teal">
                <ShieldCheck size={16} /> Thoughtful growth, not overbooking.
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="rounded-3xl bg-white p-8 shadow-soft">Loading form...</div>}>
          <RequestForm />
        </Suspense>
      </section>
    </>
  );
}
