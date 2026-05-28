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
      <section className="relative isolate overflow-hidden px-4 pb-10 pt-7 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-80" />
        <div className="absolute inset-0 -z-10 bg-white/44" />
        <div className="absolute -left-24 top-20 -z-10 h-80 w-80 rounded-full bg-nest-mint/70 blur-3xl" />
        <div className="absolute -right-20 bottom-10 -z-10 h-80 w-80 rounded-full bg-nest-gold/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
          <AnimatedSection className="order-1 min-w-0 text-center lg:text-left">
            <div className="pill-label mx-auto max-w-full lg:mx-0">
              <Sparkles size={16} /> Parent Reset Concierge
            </div>
            <h1 className="text-balance mx-auto mt-4 max-w-3xl text-[2.55rem] font-black leading-[0.95] tracking-tight text-nest-teal sm:text-6xl sm:leading-[0.96] lg:mx-0 lg:text-7xl">
              Reset the home. Reclaim the day.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-nest-ink/74 sm:text-xl sm:leading-8 lg:mx-0">
              Trusted local help for busy parents — home resets, laundry rescue, errands, and family support without the awkward marketplace guessing game.
            </p>
            <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row lg:mx-0">
              <ButtonLink href="/request">Request Help</ButtonLink>
              <ButtonLink href="/services" variant="secondary">View Services</ButtonLink>
            </div>
            <div id="service-area" className="mx-auto mt-6 inline-flex max-w-full scroll-mt-24 items-start gap-2 rounded-3xl border border-nest-gold/18 bg-white/78 px-4 py-2 text-left text-sm font-black leading-5 text-nest-teal shadow-sm backdrop-blur sm:items-center sm:rounded-full lg:mx-0">
              <MapPin size={16} className="shrink-0 text-nest-gold" />
              <span>Serving {siteConfig.serviceArea}</span>
            </div>
          </AnimatedSection>

          <AnimatedSection className="order-2 min-w-0 lg:order-2">
            <div className="relative mx-auto w-full max-w-[24rem] sm:max-w-2xl lg:max-w-none">
              <div className="absolute -inset-3 rounded-[2rem] bg-nest-gold/16 blur-2xl sm:-inset-5 sm:rounded-[2.8rem]" />
              <div className="relative overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/60 p-2 shadow-glow backdrop-blur sm:rounded-[2.5rem] sm:p-3">
                <Image
                  src={siteConfig.assets.hero}
                  alt="NestHelper Parent Reset banner"
                  width={1792}
                  height={768}
                  priority
                  className="h-auto w-full rounded-[1.45rem] object-contain sm:aspect-[16/9] sm:rounded-[2rem] sm:object-cover"
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <SectionShell>
          <SectionIntro
            label="What NestHelper is"
            icon={<Heart size={15} />}
            title="Parent Reset help, coordinated for busy families."
            description="NestHelper is a managed local parent-help service for families who need extra hands at home without random group posts, stranger DMs, or awkward negotiation. Send one request and we review the scope, timing, location, safety notes, and best-fit package before checkout."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={<Home size={20} />} title="Home reset help" text="Kitchen resets, tidying support, light household catch-up, and practical help when the day gets away from you." />
            <InfoCard icon={<Sparkles size={20} />} title="Laundry rescue" text="Pickup, dry weigh-in, wash/fold coordination, return delivery, and clear reusable bag expectations." />
            <InfoCard icon={<ClipboardCheck size={20} />} title="Errands and family support" text="Approved errands, pickups, returns, and household support with a reviewed scope before payment." />
            <InfoCard icon={<MessageCircle size={20} />} title="One request, less chaos" text="No messy group posts or endless message threads. NestHelper helps coordinate the details." />
          </div>
        </SectionShell>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionShell>
          <SectionIntro
            label="Why families choose NestHelper"
            icon={<ShieldCheck size={15} />}
            title="A better choice than random unvetted help."
            description="Instead of sorting through strangers, unclear pricing, and loose promises, families get an insured service with checked helpers, vetted partners, clear packages, request review, and follow-up."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ChoiceItem title="Insured local service" text="NestHelper is insured, so families are not relying only on a handshake with a random helper." />
            <ChoiceItem title="Checked helpers" text="Helpers are reviewed before being matched to in-home family requests." />
            <ChoiceItem title="Vetted partners" text="For partner-completed services, we review the provider instead of leaving parents to guess." />
            <ChoiceItem title="Clear scope before payment" text="Timing, location, access, pets, safety notes, and package fit are reviewed before checkout." />
            <ChoiceItem title="Clear packages and follow-up" text="You get clearer pricing, better boundaries, and coordination from request to completion." />
          </div>
        </SectionShell>
      </AnimatedSection>

      <AnimatedSection id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8">
        <SectionShell>
          <SectionIntro
            label="How it works"
            icon={<Star size={15} />}
            title="Simple request. Reviewed first. Then we get to work."
            description="We review the details before payment so each visit starts with clearer expectations, safer boundaries, and a plan that makes sense for the family."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StepCard icon={<MessageCircle size={20} />} title="1. Request help" text="Tell us what is piling up, your location, timing, pets, access, and other details." />
            <StepCard icon={<ShieldCheck size={20} />} title="2. We review" text="We check service area, availability, safety notes, and whether the package is the right fit." />
            <StepCard icon={<CreditCard size={20} />} title="3. Secure checkout" text="After approval, we send a secure payment link or invoice so you know the request is confirmed." />
            <StepCard icon={<Home size={20} />} title="4. We get to work" text="A checked helper or vetted partner completes the job, and NestHelper follows up after service." />
          </div>
        </SectionShell>
      </AnimatedSection>

      <AnimatedSection id="giving-back" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/80 p-5 shadow-soft backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-nest-gold/14 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-nest-mint/55 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="pill-label w-fit"><Heart size={15} /> Giving Back</p>
              <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
                Every reset helps more than one home.
              </h2>
              <p className="mt-5 text-base font-medium leading-7 text-nest-ink/72 sm:text-lg sm:leading-8">
                NestHelper sets aside 10% of net income to give back to local churches, families, and community needs. We believe good work should serve the home in front of us and help strengthen the community around us.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <GivingBackCard icon={<CheckCircle2 size={20} />} title="10% set aside" text="A clear portion of net income is dedicated to giving back." />
              <GivingBackCard icon={<Home size={20} />} title="Families first" text="Support is directed toward local family and household needs." />
              <GivingBackCard icon={<Sparkles size={20} />} title="Faithful service" text="Built on honest work, care, and responsible stewardship." />
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="soft-section px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="pill-label w-fit"><Star size={15} /> Services</p>
              <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">Extra hands for busy parents.</h2>
            </div>
            <p className="text-base font-medium leading-7 text-nest-ink/70 sm:text-lg sm:leading-8">
              Choose a package, submit the details, and NestHelper reviews the request before payment. Open each card for what fits, pricing notes, and next steps.
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
          <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">Not a random helper board.</h2>
          <p className="mt-5 text-base font-medium leading-7 text-nest-ink/72 sm:text-lg sm:leading-8">
            NestHelper is a managed local parent-help service. We coordinate requests, set expectations, use checked helpers or vetted partner providers, and follow up after service.
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
                <ShieldCheck className="shrink-0 text-nest-teal" /> {item}
              </div>
            ))}
          </div>
          <div className="mt-8"><ButtonLink href="/trust" variant="secondary">See Trust Standards</ButtonLink></div>
        </div>
      </AnimatedSection>
    </>
  );
}

function SectionShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-nest-gold/12 bg-white/78 p-5 shadow-soft backdrop-blur sm:rounded-[2.75rem] sm:p-8 lg:p-10">
      {children}
    </div>
  );
}

function SectionIntro({
  label,
  icon,
  title,
  description,
}: {
  label: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
      <div>
        <p className="pill-label w-fit">{icon} {label}</p>
        <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
          {title}
        </h2>
      </div>
      <p className="text-base font-medium leading-7 text-nest-ink/70 sm:text-lg sm:leading-8">
        {description}
      </p>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="h-full rounded-[1.9rem] border border-nest-gold/12 bg-white/88 p-5 shadow-sm">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-7 text-nest-ink/68">{text}</p>
    </div>
  );
}

function ChoiceItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="h-full rounded-[1.9rem] border border-nest-gold/12 bg-white/88 p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-nest-mint/35 text-nest-teal">
        <CheckCircle2 size={20} />
      </div>
      <h3 className="text-base font-black uppercase tracking-[0.08em] text-nest-teal">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-7 text-nest-ink/68">{text}</p>
    </div>
  );
}

function GivingBackCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="h-full rounded-[1.75rem] border border-nest-gold/14 bg-white/90 p-5 shadow-sm">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-cream p-3 text-nest-gold">{icon}</div>
      <h3 className="text-base font-black uppercase tracking-[0.08em] text-nest-teal">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-nest-ink/68">{text}</p>
    </div>
  );
}

function StepCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="h-full rounded-[1.9rem] border border-nest-gold/12 bg-white/88 p-5 shadow-sm transition hover:-translate-y-1">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-7 text-nest-ink/68">{text}</p>
    </div>
  );
}
