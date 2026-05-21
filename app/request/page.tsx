import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { RequestForm } from "@/components/forms/RequestForm";

export default function RequestPage() {
  return <>
    <PageHero
      eyebrow="Request Help"
      title="Tell us what’s piling up."
      text="No payment is due when you submit. We review your service area, timing, scope, safety notes, pets, access, and pricing first — then send a secure Stripe checkout link if the request is approved."
      cta={false}
    />
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.6fr] lg:px-8">
      <aside className="h-fit rounded-[2rem] border border-nest-gold/20 bg-white p-6 shadow-soft lg:sticky lg:top-28">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">How requests work</p>
        <h2 className="mt-3 text-3xl font-black text-nest-teal">Simple for families. Controlled for quality.</h2>
        <div className="mt-6 grid gap-4 text-sm leading-6 text-nest-ink/72">
          <div className="rounded-2xl bg-nest-cream p-4"><strong className="text-nest-teal">1. Submit details.</strong><br />Tell us the service, timing, home access, pets, and what needs attention.</div>
          <div className="rounded-2xl bg-nest-cream p-4"><strong className="text-nest-teal">2. We review.</strong><br />We confirm service area, safety, availability, and whether the package fits.</div>
          <div className="rounded-2xl bg-nest-cream p-4"><strong className="text-nest-teal">3. You approve checkout.</strong><br />Approved requests receive a secure Stripe checkout or invoice link before work starts.</div>
          <div className="rounded-2xl bg-nest-cream p-4"><strong className="text-nest-teal">4. We follow up.</strong><br />After service, NestHelper checks in so families are not left guessing.</div>
        </div>
        <p className="mt-5 rounded-2xl border border-nest-teal/15 bg-nest-mint/25 p-4 text-sm font-semibold leading-6 text-nest-ink/76">
          NestHelper does not provide childcare, medical care, elder care, emergency services, legal services, or financial advice.
        </p>
      </aside>
      <Suspense fallback={<div className="rounded-3xl bg-white p-8 shadow-soft">Loading form...</div>}>
        <RequestForm />
      </Suspense>
    </section>
  </>;
}
