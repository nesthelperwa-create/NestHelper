import { ButtonLink } from "@/components/ui/ButtonLink";

export function PageHero({ eyebrow, title, text, cta = true }: { eyebrow: string; title: string; text: string; cta?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover px-4 py-20 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-white/35" />
      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mx-auto mb-5 inline-flex rounded-full border border-nest-gold/25 bg-white/70 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-nest-gold">{eyebrow}</div>
        <h1 className="text-balance text-4xl font-black tracking-tight text-nest-teal sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-nest-ink/74">{text}</p>
        {cta && <div className="mt-8"><ButtonLink href="/request">Request Help</ButtonLink></div>}
      </div>
    </section>
  );
}
