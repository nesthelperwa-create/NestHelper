import type { ReactNode } from "react";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ServiceCard } from "@/components/ServiceCard";
import { services } from "@/lib/services";
import { siteConfig } from "@/lib/siteConfig";

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-80" />
        <div className="absolute inset-0 -z-10 bg-white/42" />
        <div className="absolute -left-24 top-20 -z-10 h-80 w-80 rounded-full bg-nest-mint/70 blur-3xl" />
        <div className="absolute -right-20 bottom-10 -z-10 h-80 w-80 rounded-full bg-nest-gold/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <AnimatedSection className="order-2 lg:order-1">
            <div className="pill-label">
              <Sparkles size={16} /> Parent Reset Concierge
            </div>
            <h1 className="text-balance mt-5 max-w-3xl text-4xl font-black tracking-tight text-nest-teal sm:text-6xl lg:text-7xl">
              Reset the home. Reclaim the day.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-nest-ink/74 sm:text-xl sm:leading-8">
              Trusted local help for busy parents — home resets, laundry rescue, errands, and family support without the awkward marketplace guessing game.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/request">Request Help</ButtonLink>
              <ButtonLink href="/services" variant="secondary">View Services</ButtonLink>
            </div>
            <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-nest-gold/18 bg-white/75 px-4 py-2 text-sm font-black text-nest-teal shadow-sm backdrop-blur">
              <MapPin size={16} className="shrink-0 text-nest-gold" />
              <span className="truncate">Serving {siteConfig.serviceArea}</span>
            </div>
          </AnimatedSection>

          <AnimatedSection className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-2xl lg:max-w-none">
              <div className="absolute -inset-5 rounded-[2.8rem] bg-nest-gold/16 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/55 p-3 shadow-glow backdrop-blur">
                <Image
                  src={siteConfig.assets.hero}
                  alt="NestHelper Parent Reset banner"
                  width={1792}
                  height={768}
                  priority
                  className="aspect-[16/9] w-full rounded-[2rem] object-cover"
                />
                <div className="absolute bottom-6 left-6 hidden max-w-[15rem] rounded-[1.6rem] border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur sm:block">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">Parent Reset</p>
                  <p className="mt-1 text-2xl font-black leading-tight text-nest-teal">Help that feels coordinated.</p>
                </div>
                <div className="absolute right-5 top-5 hidden rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-black text-nest-teal shadow-sm backdrop-blur sm:inline-flex">
                  <Heart size={16} className="text-nest-gold" /> Built for busy parents
                </div>
              </div>
              <div className="absolute -bottom-6 right-6 hidden rounded-[1.6rem] border border-nest-gold/18 bg-nest-cream p-4 shadow-soft lg:block">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">No booking chaos</p>
                <p className="mt-1 max-w-[13rem] text-sm font-bold leading-5 text-nest-ink/72">Request first. We review before payment.</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="overflow-hidden rounded-[2.5rem] border border-nest-gold/16 bg-white/90 p-5 shadow-soft backdrop-blur sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <LifestyleImage src="/assets/services/service-parent-reset.png" label="Home reset" />
              <LifestyleImage src="/assets/services/service-laundry-rescue.png" label="Laundry rescue" />
              <LifestyleImage src="/assets/services/service-family-reset.png" label="Family catch-up" />
            </div>
          </div>
          <div>
            <p className="pill-label w-fit"><Heart size={15} /> What NestHelper is</p>
            <h2 className="text-balance mt-4 text-4xl font-black text-nest-teal sm:text-5xl">A calmer way to ask for household help.</h2>
            <p className="mt-4 text-lg font-medium leading-8 text-nest-ink/70">
              Instead of posting in a random group, comparing strangers, and negotiating the scope yourself, families submit one clear request and NestHelper coordinates the details.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MiniPoint icon={<MessageCircle />} title="Less back-and-forth" text="Clear request details before checkout." />
              <MiniPoint icon={<ShieldCheck />} title="More controlled" text="Scope and safety reviewed first." />
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="soft-section px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="pill-label w-fit"><Star size={15} /> Services</p>
              <h2 className="text-balance mt-4 text-4xl font-black text-nest-teal sm:text-5xl">Extra hands for busy parents.</h2>
            </div>
            <p className="text-lg font-medium leading-8 text-nest-ink/70">
              Choose a package, submit details, and NestHelper reviews the request before payment. Each card shows the price first, then expands for more detail when needed.
            </p>
          </div>
          <div className="mt-10 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => <ServiceCard key={service.id} service={service} />)}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="pro-card overflow-hidden rounded-[2.5rem] p-5 sm:p-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-nest-cream p-6">
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-nest-mint/55 blur-3xl" />
            <Image src={siteConfig.assets.badge} alt="NestHelper Gold Star Checked badge" width={600} height={600} className="relative mx-auto max-h-[420px] w-full object-contain animate-float" />
          </div>
        </div>
        <div className="self-center">
          <p className="pill-label w-fit"><ShieldCheck size={15} /> Trust & Safety</p>
          <h2 className="text-balance mt-4 text-4xl font-black text-nest-teal sm:text-5xl">Not a random helper board.</h2>
          <p className="mt-5 text-lg font-medium leading-8 text-nest-ink/72">
            NestHelper is being built as a managed local parent-help service. We coordinate the request, set expectations, use checked helpers or vetted partner providers, and follow up after service.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              "Identity review",
              "Background screening",
              "Reference review",
              "Service standards",
              "Partner-vetted providers",
              "Follow-up after service",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-nest-gold/12 bg-white p-4 font-black text-nest-ink/78 shadow-sm">
                <CheckCircle2 className="shrink-0 text-nest-teal" /> {item}
              </div>
            ))}
          </div>
          <div className="mt-8"><ButtonLink href="/trust" variant="secondary">See Trust Standards</ButtonLink></div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="teal-gradient px-4 py-16 text-white sm:px-6 lg:px-8">
        <div id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.22em] text-nest-gold2">How it works</p>
            <h2 className="text-balance mt-3 text-4xl font-black sm:text-5xl">Smooth for families. Controlled for quality.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            <Step icon={<ClipboardCheck />} title="1. Request help" text="Tell us what is piling up, your location, timing, pets, access, and promo code." />
            <Step icon={<ShieldCheck />} title="2. We review" text="We check service area, availability, safety, scope, and whether the package fits." />
            <Step icon={<CreditCard />} title="3. Secure checkout" text="After approval, we send a secure payment link or invoice." />
            <Step icon={<Home />} title="4. We get to work" text="A checked helper or vetted partner completes the job, then we follow up." />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.7rem] bg-white p-8 shadow-glow md:p-12">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-nest-gold/16 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-nest-mint/70 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-center">
            <div>
              <p className="pill-label w-fit"><Users size={15} /> Ready when you need a reset</p>
              <h2 className="text-balance mt-4 text-4xl font-black text-nest-teal sm:text-5xl">Need help this week?</h2>
              <p className="mt-4 text-lg font-medium leading-8 text-nest-ink/72">
                Submit a request and we’ll review the details before sending your secure payment link. Laundry requests use a deposit first, then a final balance after dry weigh-in.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/request">Request Help</ButtonLink><ButtonLink href="/contact" variant="secondary">Ask a Question</ButtonLink></div>
            </div>
            <div id="service-area" className="scroll-mt-24 rounded-[2rem] border border-nest-gold/18 bg-nest-cream p-6">
              <div className="flex items-center gap-2 text-nest-teal"><MapPin /> <strong>Serving</strong></div>
              <p className="mt-3 text-2xl font-black text-nest-ink">{siteConfig.serviceArea}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-nest-ink/65">Requests outside the core service area may include a travel fee or have limited availability.</p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}

function LifestyleImage({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.8rem] bg-nest-cream shadow-sm">
      <Image src={src} alt={label} width={500} height={500} className="aspect-[4/5] w-full object-cover object-top transition duration-700 hover:scale-105" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-4">
        <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-nest-teal shadow-sm">{label}</span>
      </div>
    </div>
  );
}

function MiniPoint({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-nest-gold/14 bg-white/90 p-4 shadow-sm">
      <div className="mb-3 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal">{icon}</div>
      <h3 className="font-black text-nest-teal">{title}</h3>
      <p className="mt-1 text-sm font-medium leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-white/12 bg-white/10 p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/14">
      <div className="mb-4 inline-flex rounded-2xl bg-white/12 p-3 text-nest-gold2">{icon}</div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-white/78">{text}</p>
    </div>
  );
}
