import type { ReactNode } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  CalendarClock,
  ClipboardCheck,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
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
              Parent Reset help for busy families — home resets, laundry rescue, errands, and household support with clear packages, reviewed requests, and follow-up.
            </p>
            <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row lg:mx-0">
              <ButtonLink href="/request">Request Help</ButtonLink>
              <ButtonLink href="/services" variant="secondary">View Services</ButtonLink>
            </div>
            <div id="service-area" className="mx-auto mt-6 inline-flex max-w-full scroll-mt-24 items-start gap-2 rounded-3xl border border-nest-gold/18 bg-white/78 px-4 py-2 text-left text-sm font-black leading-5 text-nest-teal shadow-sm backdrop-blur sm:items-center sm:rounded-full lg:mx-0">
              <MapPin size={16} className="shrink-0 text-nest-gold" />
              <span>Serving {siteConfig.serviceArea}</span>
            </div>
            <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2 lg:mx-0 lg:justify-start">
              <TrustPill icon={<CheckCircle2 size={14} />} text="Washington business license approved" />
              <TrustPill icon={<ShieldCheck size={14} />} text="Insured service model" />
              <TrustPill icon={<ClipboardCheck size={14} />} text="Request reviewed before payment" />
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
            description="NestHelper is a managed local parent-help service for families who need extra hands at home without having to coordinate everything themselves. Send one request and we review the scope, timing, location, safety notes, and best-fit package before checkout."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={<Home size={20} />} title="Home reset help" text="Kitchen resets, tidying support, light household catch-up, and practical help when the day gets away from you." />
            <InfoCard icon={<Sparkles size={20} />} title="Laundry rescue" text="Pickup, dry weigh-in, wash/fold coordination, return delivery, and clear reusable bag expectations." />
            <InfoCard icon={<ClipboardCheck size={20} />} title="Errands and family support" text="Approved errands, pickups, returns, and household support with a reviewed scope before payment." />
            <InfoCard icon={<MessageCircle size={20} />} title="One request, less chaos" text="NestHelper helps coordinate the details so families are not stuck managing every message, scope question, and next step alone." />
          </div>
        </SectionShell>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionShell>
          <SectionIntro
            label="Why families choose NestHelper"
            icon={<ShieldCheck size={15} />}
            title="More than a cheaper marketplace hire."
            description="A lower-priced helper can look simple at first, but families are trusting someone with their home, routines, laundry, errands, and personal space. NestHelper is built for parents who want help that is reviewed, coordinated, insured, and accountable."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ChoiceItem icon={<CheckCircle2 size={20} />} title="Business license approved" text="NestHelper operates as a real Washington business, not just a casual side arrangement." />
            <ChoiceItem icon={<ShieldCheck size={20} />} title="Insured service" text="Families get an insured local service model instead of only a handshake agreement." />
            <ChoiceItem icon={<Heart size={20} />} title="Checked helper model" text="In-home requests are matched through a reviewed helper or partner process." />
            <ChoiceItem icon={<ClipboardCheck size={20} />} title="Clear scope before payment" text="Timing, location, access, pets, safety notes, and package fit are reviewed before checkout." />
            <ChoiceItem icon={<MessageCircle size={20} />} title="Coordination + follow-up" text="NestHelper stays involved from request to completion so families are not left guessing." />
          </div>
        </SectionShell>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div id="how-it-works" className="scroll-mt-24">
          <SectionShell>
            <CenteredSectionIntro
              label="How it works"
              icon={<Star size={15} />}
              title="Simple steps. Clear communication. Family-first help."
              description="We review the details before payment so each visit starts with clearer expectations, safer boundaries, and a plan that makes sense for the family."
            />

            <div className="relative mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="pointer-events-none absolute left-[18%] right-[18%] top-[4.6rem] hidden border-t-2 border-dotted border-nest-gold/50 xl:block" />
              <ProcessStepCard
                step="1"
                icon={<ClipboardCheck size={31} />}
                title="Tell us what you need"
                text="Submit a request for home reset help, laundry rescue, errands, or family support."
              />
              <ProcessStepCard
                step="2"
                icon={<ShieldCheck size={31} />}
                title="We review the request"
                text="We check scope, location, timing, pets or access, and helper fit before confirming."
              />
              <ProcessStepCard
                step="3"
                icon={<CalendarClock size={31} />}
                title="We confirm the details"
                text="If approved, we send next steps, scheduling details, and payment information."
              />
              <ProcessStepCard
                step="4"
                icon={<Home size={31} />}
                title="Your reset gets done"
                text="A checked helper or vetted partner completes the work with clear expectations and follow-up."
              />
            </div>
          </SectionShell>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div id="giving-back" className="scroll-mt-24">
          <SectionShell>
            <CenteredSectionIntro
              label="Giving Back"
              icon={<Heart size={15} />}
              title="Serving families well and supporting the community around us."
              description="NestHelper gives back to local churches, families, and community needs as part of how we do business. Every booking helps us serve one household while helping us bless others too."
            />

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <GivingBackCard
                icon={<Heart size={30} />}
                title="Community care"
                textLines={["We give back to local", "churches, families, and", "community needs."]}
              />
              <GivingBackCard
                icon={<Home size={30} />}
                title="Families first"
                textLines={["Every booking supports a", "business built around", "serving families well."]}
              />
              <GivingBackCard
                icon={<Sparkles size={30} />}
                title="Faithful service"
                textLines={["We aim to work with", "honesty, care, and excellence", "in every home we serve."]}
              />
            </div>
          </SectionShell>
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
          <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">The trust standards behind every reset.</h2>
          <p className="mt-5 text-base font-medium leading-7 text-nest-ink/72 sm:text-lg sm:leading-8">
            NestHelper uses a checked-helper and vetted-partner model with screening steps, service boundaries, and follow-up after service. The Trust & Safety page explains how we review helpers, partners, scope, and safety before matching work.
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

function TrustPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-nest-gold/18 bg-white/74 px-3 py-2 text-xs font-black text-nest-teal shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-nest-gold/35 hover:bg-white">
      <span className="text-nest-gold">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="h-full rounded-[1.9rem] border border-nest-gold/12 bg-white/88 p-5 shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-7 text-nest-ink/68">{text}</p>
    </div>
  );
}

function ChoiceItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="group h-full rounded-[1.9rem] border border-nest-gold/12 bg-white/88 p-5 shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-nest-mint/35 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">
        {icon}
      </div>
      <h3 className="text-base font-black uppercase tracking-[0.08em] text-nest-teal">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-7 text-nest-ink/68">{text}</p>
    </div>
  );
}

function CenteredSectionIntro({
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
    <div className="mx-auto max-w-4xl text-center">
      <p className="pill-label mx-auto w-fit">{icon} {label}</p>
      <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
        {title}
      </h2>
      <div className="mx-auto mt-5 flex max-w-[12rem] items-center justify-center gap-3 text-nest-gold">
        <span className="h-px flex-1 bg-nest-gold/45" />
        <Heart size={16} fill="currentColor" />
        <span className="h-px flex-1 bg-nest-gold/45" />
      </div>
      <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-nest-ink/70 sm:text-lg sm:leading-8">
        {description}
      </p>
    </div>
  );
}

function ProcessStepCard({
  step,
  icon,
  title,
  text,
}: {
  step: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="relative z-10 h-full rounded-[1.9rem] border border-nest-gold/12 bg-white/92 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-nest-gold/12 bg-nest-mint/38 text-nest-teal shadow-sm">
        {icon}
      </div>
      <div className="mx-auto -mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-nest-teal text-lg font-black text-white shadow-soft ring-4 ring-white">
        {step}
      </div>
      <div className="mx-auto mt-4 h-px w-28 bg-nest-mint" />
      <h3 className="text-balance mt-5 text-xl font-black leading-tight text-nest-teal sm:text-2xl">
        {title}
      </h3>
      <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-nest-gold/85" />
      <p className="mx-auto mt-4 max-w-[16rem] text-sm font-medium leading-7 text-nest-ink/68">
        {text}
      </p>
    </div>
  );
}

function GivingBackCard({ icon, title, textLines }: { icon: ReactNode; title: string; textLines: string[] }) {
  return (
    <div className="flex h-full min-h-[20rem] flex-col items-center rounded-[1.9rem] border border-nest-gold/12 bg-white/92 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-nest-gold/12 bg-nest-mint/38 text-nest-teal shadow-sm">
        {icon}
      </div>
      <div className="mt-6 h-0.5 w-16 shrink-0 rounded-full bg-nest-gold/85" />
      <h3 className="mt-5 flex min-h-[2rem] items-center justify-center text-2xl font-black leading-tight text-nest-teal">
        {title}
      </h3>
      <p className="mx-auto mt-3 min-h-[5.25rem] max-w-[18rem] text-sm font-medium leading-7 text-nest-ink/68">
        {textLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}
