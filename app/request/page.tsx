import { Suspense } from "react";
import { ClipboardCheck, CreditCard, MessageCircle, ShieldCheck } from "lucide-react";
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
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.6fr] lg:px-8">
        <aside className="h-fit rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-6 shadow-soft backdrop-blur lg:sticky lg:top-28">
          <p className="pill-label w-fit"><ClipboardCheck size={15} /> How it works</p>
          <h2 className="mt-4 text-3xl font-black text-nest-teal">Simple for families. Controlled for quality.</h2>
          <div className="mt-6 grid gap-4 text-sm leading-6 text-nest-ink/72">
            <RequestStep icon={<ClipboardCheck />} title="1. Submit details" text="Tell us the service, timing, home access, pets, and what needs attention." />
            <RequestStep icon={<ShieldCheck />} title="2. We review" text="We confirm service area, safety, availability, and whether the package fits." />
            <RequestStep icon={<CreditCard />} title="3. You approve checkout" text="Approved requests receive a secure payment link or invoice before work starts." />
            <RequestStep icon={<MessageCircle />} title="4. We follow up" text="After service, NestHelper checks in so families are not left guessing." />
          </div>
          <p className="mt-5 rounded-2xl border border-nest-teal/15 bg-nest-mint/25 p-4 text-sm font-semibold leading-6 text-nest-ink/76">
            NestHelper does not provide childcare, medical care, elder care, emergency services, legal services, or financial advice.
          </p>
        </aside>
        <Suspense fallback={<div className="rounded-3xl bg-white p-8 shadow-soft">Loading form...</div>}>
          <RequestForm />
        </Suspense>
      </section>
    </>
  );
}

function RequestStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-nest-cream p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
      <div className="shrink-0 rounded-xl bg-white p-2 text-nest-teal shadow-sm">{icon}</div>
      <div>
        <strong className="text-nest-teal">{title}</strong>
        <p className="mt-1">{text}</p>
      </div>
    </div>
  );
}
