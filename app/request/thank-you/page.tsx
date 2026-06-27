import type { Metadata } from "next";
import { CheckCircle2, Mail, Phone, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Request Received | NestHelper",
  description: "Thanks for submitting your NestHelper service request.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${siteConfig.url}/request/thank-you`,
  },
};

export default function RequestThankYouPage() {
  return (
    <section className="relative isolate overflow-hidden px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-75" />
      <div className="absolute inset-0 -z-10 bg-white/55" />
      <div className="absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-nest-mint/65 blur-3xl" />
      <div className="absolute -right-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-nest-gold/20 blur-3xl" />

      <div className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/78 p-6 text-center shadow-soft backdrop-blur sm:p-10 lg:p-12">
        <div className="pill-label mx-auto w-fit">
          <Sparkles size={15} /> Request received
        </div>

        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-nest-mint text-nest-teal shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-balance text-3xl font-black tracking-tight text-nest-teal sm:text-5xl">
          Thanks — we received your NestHelper request.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-nest-ink/75 sm:text-lg sm:leading-8">
          Leo or Gen will review the service area, timing, scope, safety notes, and pricing before sending a secure checkout link. No payment is due until the request is reviewed.
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
          {["Request saved", "Scope reviewed", "Payment link sent after review"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-2xl bg-nest-cream px-4 py-3 text-sm font-black text-nest-teal">
              <CheckCircle2 size={16} className="shrink-0 text-nest-gold" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-nest-teal/12 bg-white/72 p-5 text-left shadow-sm sm:grid-cols-2">
          <div className="flex gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nest-mint text-nest-teal">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-nest-teal">Check your email</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/70">
                A confirmation email should arrive shortly. If you do not see it, check spam or promotions.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nest-mint text-nest-teal">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-nest-teal">Need to add something?</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/70">
                Call or text {siteConfig.phone}, or reply to your confirmation email with photos or extra details.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
          <ButtonLink href="/services">View services</ButtonLink>
          <ButtonLink href="/" variant="secondary">Back home</ButtonLink>
        </div>
      </div>
    </section>
  );
}
