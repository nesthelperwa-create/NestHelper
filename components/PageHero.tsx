import { Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function PageHero({
  eyebrow,
  title,
  text,
  cta = true,
  ctaHref = "/request",
  ctaLabel = "Request Help",
}: {
  eyebrow: string;
  title: string;
  text: string;
  cta?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-75" />
      <div className="absolute inset-0 -z-10 bg-white/48" />
      <div className="absolute -left-20 top-6 -z-10 h-72 w-72 rounded-full bg-nest-mint/65 blur-3xl" />
      <div className="absolute -right-20 bottom-0 -z-10 h-72 w-72 rounded-full bg-nest-gold/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/60 p-6 text-center shadow-soft backdrop-blur sm:p-10 lg:p-12">
        <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-nest-mint/45 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-nest-gold/15 blur-3xl" />
        <div className="relative">
          <div className="pill-label mx-auto mb-5">
            <Sparkles size={15} />
            {eyebrow}
          </div>
          <h1 className="text-balance text-3xl font-black tracking-tight text-nest-teal sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-nest-ink/74 sm:text-lg sm:leading-8">
            {text}
          </p>
          {cta && (
            <div className="mt-8">
              <ButtonLink href={ctaHref}>{ctaLabel}</ButtonLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
