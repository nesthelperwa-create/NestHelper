import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { RequestForm } from "@/components/forms/RequestForm";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Request NestHelper Service | Bothell, WA",
  description:
    "Request NestHelper help for whole-home cleaning, parent resets, simple in-home meal prep support, area resets, Move Prep & Home Reset, move-in/move-out cleaning, laundry rescue, and local errands.",
  alternates: {
    canonical: `${siteConfig.url}/request`,
  },
  openGraph: {
    title: "Request NestHelper Service | Bothell, WA",
    description:
      "Send a NestHelper request for home cleaning, parent reset help, simple in-home meal prep support, area resets, Move Prep & Home Reset, move-in/move-out cleaning, laundry rescue, or local errands.",
    url: `${siteConfig.url}/request`,
    images: [siteConfig.assets.og],
  },
};

export default function RequestPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-70" />
        <div className="absolute inset-0 -z-10 bg-white/55" />
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-white/72 p-5 text-center shadow-soft backdrop-blur sm:p-7 lg:p-8">
          <p className="pill-label mx-auto w-fit"><Sparkles size={15} /> Request Help</p>
          <h1 className="text-balance mt-4 text-3xl font-black tracking-tight text-nest-teal sm:text-5xl">
            Request household help.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-6 text-nest-ink/72 sm:text-base sm:leading-7">
            Tell us what kind of help you need. NestHelper reviews the scope, timing, service area, and pricing before sending any secure payment link.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xs font-bold leading-5 text-nest-ink/58 sm:text-sm">
            Home cleaning, parent resets, laundry rescue, errands, move prep, and simple in-home meal prep support.
          </p>
          <div className="mx-auto mt-6 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
            <ButtonLink href="#request-form">Start the request</ButtonLink>
            <ButtonLink href="/services" variant="secondary">View Services</ButtonLink>
          </div>
          <div className="mx-auto mt-5 grid max-w-3xl gap-2 text-left sm:grid-cols-3">
            {["No payment today", "Reviewed before checkout", "Clear scope before service"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-nest-cream px-4 py-3 text-sm font-black text-nest-teal">
                <CheckCircle2 size={16} className="shrink-0 text-nest-gold" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="request-form" className="scroll-mt-28 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Suspense fallback={<div className="rounded-3xl bg-white p-8 shadow-soft">Loading form...</div>}>
          <RequestForm />
        </Suspense>
      </section>
    </>
  );
}
