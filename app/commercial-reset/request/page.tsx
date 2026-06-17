import type { Metadata } from "next";
import { Building2, CheckCircle2 } from "lucide-react";
import { CommercialResetForm } from "@/components/forms/CommercialResetForm";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "Request Commercial Reset Quote | NestHelper",
  description:
    "Request a reviewed Commercial Reset quote for small offices, studios, churches, daycare common areas, salons, short-term rental turnovers, and local small business spaces.",
};

export default function CommercialResetRequestPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-70" />
        <div className="absolute inset-0 -z-10 bg-white/55" />
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-white/72 p-5 text-center shadow-soft backdrop-blur sm:p-7 lg:p-8">
          <p className="pill-label mx-auto w-fit"><Building2 size={15} /> Commercial Quote</p>
          <h1 className="text-balance mt-4 text-3xl font-black tracking-tight text-nest-teal sm:text-5xl">
            Request a Commercial Reset quote.
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm font-semibold leading-6 text-nest-ink/72 sm:text-base sm:leading-7">
            Tell us the basics about the space, location, schedule, and photos if helpful. No payment is due today — NestHelper reviews the request and sends a clear quote before checkout.
          </p>
          <div className="mx-auto mt-6 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
            <ButtonLink href="#commercial-quote-form">Start quote request</ButtonLink>
            <ButtonLink href="/commercial-reset" variant="secondary">View Commercial Reset</ButtonLink>
          </div>
          <div className="mx-auto mt-5 grid max-w-3xl gap-2 text-left sm:grid-cols-3">
            {["No payment today", "Quote reviewed first", "Clear scope before checkout"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-nest-cream px-4 py-3 text-sm font-black text-nest-teal">
                <CheckCircle2 size={16} className="shrink-0 text-nest-gold" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="commercial-quote-form" className="scroll-mt-28 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <CommercialResetForm />
      </section>
    </>
  );
}
