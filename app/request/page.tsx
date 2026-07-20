import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { RequestForm } from "@/components/forms/RequestForm";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Request NestHelper Service | Bothell & Nearby Areas",
  description:
    "Request NestHelper home resets, cleaning, laundry help, errands, or move support in Bothell, the Eastside, and select Snohomish County areas.",
  alternates: {
    canonical: `${siteConfig.url}/request`,
  },
  openGraph: {
    title: "Request NestHelper Service",
    description:
      "Request NestHelper home resets, cleaning, laundry help, errands, or move support in Bothell, the Eastside, and select Snohomish County areas.",
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
            Tell us what kind of help you need. NestHelper reviews the scope, timing, service area, helper coverage, and pricing before sending any secure payment link. Select Snohomish County requests are confirmed before payment.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xs font-bold leading-5 text-nest-ink/58 sm:text-sm">
            Home cleaning, parent resets, laundry rescue, errands, move prep, and simple in-home meal prep support.
          </p>
          <div className="mx-auto mt-6 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
            <ButtonLink href="#request-form">Start the request</ButtonLink>
            <ButtonLink href="/services" variant="secondary">View Services</ButtonLink>
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
