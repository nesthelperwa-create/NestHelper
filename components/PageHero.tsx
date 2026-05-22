import { Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function PageHero({
  eyebrow,
  title,
  text,
  cta = true,
}: {
  eyebrow: string;
  title: string;
  text: string;
  cta?: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-80" />
      <div className="absolute inset-0 -z-10 bg-white/50" />
      <div className="absolute -left-20 top-6 -z-10 h-72 w-72 rounded-full bg-nest-mint/65 blur-3xl" />
      <div className="absolute -right-20 bottom-0 -z-10 h-72 w-72 rounded-full bg-nest-gold/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="pill-label mx-auto mb-5">
          <Sparkles size={15} />
          {eyebrow}
        </div>
        <h1 className="text-balance text-4xl font-black tracking-tight text-nest-teal sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-8 text-nest-ink/74">
          {text}
        </p>
        {cta && (
          <div className="mt-8">
            <ButtonLink href="/request">Request Help</ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}
