import type { ReactNode } from "react";
import Image from "next/image";
import {
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
  UserCheck,
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
        <div className="absolute inset-0 -z-10 bg-white/44" />
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
            <div id="service-area" className="mt-6 inline-flex max-w-full scroll-mt-24 items-center gap-2 rounded-full border border-nest-gold/18 bg-white/78 px-4 py-2 text-sm font-black text-nest-teal shadow-sm backdrop-blur">
              <MapPin size={16} className="shrink-0 text-nest-gold" />
              <span className="truncate">Serving {siteConfig.serviceArea}</span>
            </div>
          </AnimatedSection>

          <AnimatedSection className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-2xl lg:max-w-none">
              <div className="absolute -inset-5 rounded-[2.8rem] bg-nest-gold/16 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/60 p-3 shadow-glow backdrop-blur">
                <Image
                  src={siteConfig.assets.hero}
                  alt="NestHelper Parent Reset banner"
                  width={1792}
                  height={768}
                  priority
                  className="aspect-[16/9] w-full rounded-[2rem] object-cover"
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 rounded-[2.75rem] border border-nest-gold/12 bg-white/82 p-6 shadow-soft backdrop-blur sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
          <div className="self-center">
            <p className="pill-label w-fit"><Heart size={15} /> What NestHelper is</p>
            <h2 className="text-balance mt-4 text-4xl font-black text-nest-teal sm:text-5xl">
              Parent Reset help, coordinated for busy families.
            </h2>
            <p className="mt-5 text-lg font-medium leading-8 text-nest-ink/72">
              NestHelper is a managed local parent-help service for families who need extra hands at home, but do not want to search through random posts, message strangers, or negotiate every detail alone.
            </p>
            <p className="mt-4 text-lg font-medium leading-8 text-nest-ink/72">
              Families send one clear request. We review the scope, timing, location, safety notes, and best-fit package before checkout so expectations are clearer from the start.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <WhyPoint icon={<Home />} title="Home reset help" text="Kitchen resets, tidying support, light household catch-up, and practical help when the day gets away from you." />
            <WhyPoint icon={<Sparkles />} title="Laundry rescue" text="Pickup, dry weigh-in, wash/fold coordination, return delivery, and clear reusable bag expectations." />
            <WhyPoint icon={<ClipboardCheck />} title="Errands and family support" text="Approved errands, pickups, returns, and household support with a reviewed scope before payment." />
            <WhyPoint icon={<MessageCircle />} title="One request, less chaos" text="No messy group posts or endless message threads. NestHelper helps coordinate the details." />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="soft-section px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="pill-label w-fit"><ShieldCheck size={15} /> Why families choose NestHelper</p>
              <h2 className="text-balance mt-4 text-4xl font-black text-nest-teal sm:text-5xl">
                A better choice than random unvetted help.
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-nest-ink/72">
                Facebook groups and marketplace listings can be useful, but parents are often left sorting through strangers, unclear pricing, and loose promises. NestHelper gives families a more professional path: insured service, reviewed requests, checked helpers or vetted partners, and follow-up after the job.
              </p>
              <div className="mt-7 rounded-[2rem] border border-nest-gold/14 bg-white/82 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold2">The difference</p>
                <p className="mt-2 text-lg font-black leading-7 text-nest-teal">
                  We are not just sending a name from the internet. We help define the job, review the fit, coordinate the details, and stand behind the process.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ChoiceItem icon={<ShieldCheck />} title="Insured local service" text="NestHelper is insured, so families are not relying only on a handshake with a random helper." />
              <ChoiceItem icon={<UserCheck />} title="Checked helpers" text="Helpers are reviewed before being matched to in-home family requests." />
              <ChoiceItem icon={<CheckCircle2 />} title="Vetted partners" text="For partner-completed services, we review the provider instead of leaving parents to guess." />
              <ChoiceItem icon={<ClipboardCheck />} title="Clear scope before payment" text="Timing, location, access, pets, safety notes, and package fit are reviewed before checkout." />
              <ChoiceItem icon={<CreditCard />} title="Clear packages and pricing" text="Parents can see what they are requesting and the starting price before moving forward." />
              <ChoiceItem icon={<MessageCircle />} title="Coordinated follow-up" text="NestHelper helps reduce awkward back-and-forth and follows up after service." />
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div id="how-it-works" className="scroll-mt-24 rounded-[2.75rem] border border-nest-gold/12 bg-white/84 p-6 shadow-soft backdrop-blur sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="pill-label w-fit">How it works</p>
              <h2 className="text-balance mt-4 text-4xl font-black text-nest-teal sm:text-5xl">
                Simple request. Reviewed first. Then we get to work.
              </h2>
            </div>
            <p className="text-lg font-medium leading-8 text-nest-ink/70">
              The process is built to feel controlled and clear, so families know what happens before payment and what to expect next.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Step icon={<MessageCircle />} title="1. Request help" text="Tell us what is piling up, your location, timing, pets, access, and other details." />
            <Step icon={<ShieldCheck />} title="2. We review" text="We check service area, availability, safety notes, and whether the package is the right fit." />
            <Step icon={<CreditCard />} title="3. Secure checkout" text="After approval, we send a secure payment link or invoice so you know the request is confirmed." />
            <Step icon={<Home />} title="4. We get to work" text="A checked helper or vetted partner completes the job, and NestHelper follows up after service." />
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
            NestHelper is a managed local parent-help service. We coordinate the request, set expectations, use checked helpers or vetted partner providers, and follow up after service.
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
    </>
  );
}

function WhyPoint({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="h-full rounded-3xl border border-nest-gold/12 bg-white/84 p-4 shadow-sm">
      <div className="mb-3 inline-flex rounded-2xl bg-nest-mint/40 p-3 text-nest-teal">{icon}</div>
      <h3 className="font-black text-nest-teal">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}

function ChoiceItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="grid h-full grid-cols-[2.25rem_1fr] gap-3 rounded-[1.55rem] border border-nest-gold/12 bg-white/90 p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-nest-mint/45 text-nest-teal">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.08em] text-nest-teal">{title}</h3>
        <p className="mt-1 text-sm font-medium leading-6 text-nest-ink/68">{text}</p>
      </div>
    </div>
  );
}

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="h-full rounded-[1.7rem] border border-nest-gold/12 bg-nest-cream/55 p-5 shadow-sm transition hover:-translate-y-1 hover:bg-white">
      <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-nest-teal shadow-sm">{icon}</div>
      <h3 className="text-lg font-black text-nest-teal">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}
