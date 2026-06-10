import type { ReactNode } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  SprayCan,
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

        <div className="relative mx-auto grid max-w-[90rem] items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
          <AnimatedSection className="order-1 min-w-0 text-center lg:text-left">
            <div className="pill-label mx-auto max-w-full lg:mx-0">
              <Sparkles size={16} /> Parent Reset Concierge
            </div>
            <h1 className="text-balance mx-auto mt-4 max-w-3xl text-[2.55rem] font-black leading-[0.95] tracking-tight text-nest-teal sm:text-6xl sm:leading-[0.96] lg:mx-0 lg:text-7xl">
              Reset the home. Reclaim the day.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-nest-ink/74 sm:text-xl sm:leading-8 lg:mx-0">
              Parent Reset help for busy families — home resets, laundry rescue, errands, and household support with clear packages, reviewed requests, limited openings, and follow-up.
            </p>
            <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row lg:mx-0">
              <ButtonLink href="/request">Request Help</ButtonLink>
              <ButtonLink href="/services" variant="secondary">View Services</ButtonLink>
            </div>
            <div className="mx-auto mt-6 max-w-2xl rounded-[1.8rem] border border-nest-gold/16 bg-white/70 p-4 text-left shadow-sm backdrop-blur lg:mx-0">
              <div className="grid gap-3 sm:grid-cols-3">
                <TrustProofItem icon={<CheckCircle2 size={15} />} text="Washington business licensed" />
                <TrustProofItem icon={<ShieldCheck size={15} />} text="Insured local service" />
                <TrustProofItem icon={<ClipboardCheck size={15} />} text="Limited openings reviewed first" />
              </div>
              <div id="service-area" className="mt-4 flex scroll-mt-24 items-start gap-2 border-t border-nest-gold/14 pt-3 text-sm font-black leading-5 text-nest-teal sm:items-center">
                <MapPin size={16} className="mt-0.5 shrink-0 text-nest-gold sm:mt-0" />
                <span>Serving {siteConfig.serviceArea}</span>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection className="order-2 min-w-0 lg:order-2 lg:-mr-4 xl:-mr-8">
            <div className="relative mx-auto w-full max-w-[24rem] sm:max-w-2xl lg:max-w-none">
              <div className="absolute -inset-3 rounded-[2rem] bg-nest-gold/16 blur-2xl sm:-inset-5 sm:rounded-[2.8rem]" />
              <div className="relative overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/60 p-2 shadow-glow backdrop-blur sm:rounded-[2.5rem] sm:p-3">
                <Image
                  src={siteConfig.assets.hero}
                  alt="NestHelper Parent Reset banner"
                  width={1893}
                  height={831}
                  priority
                  className="h-auto w-full rounded-[1.45rem] object-contain sm:rounded-[2rem]"
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
            description="NestHelper is a managed local parent-help service for families who need extra hands at home without having to coordinate everything themselves. Send one request and we review the scope, timing, location, safety notes, availability, and best-fit package before checkout."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={<Home size={20} />} title="Home reset help" text="Kitchen resets, tidying support, light household catch-up, and practical help when the day gets away from you." />
            <InfoCard icon={<Sparkles size={20} />} title="Laundry rescue" text="Pickup, dry weigh-in, wash/fold coordination, return delivery, and clear reusable bag expectations." />
            <InfoCard icon={<ClipboardCheck size={20} />} title="Errands and family support" text="Approved errands, pickups, returns, and household support with a reviewed scope before payment." />
            <InfoCard icon={<MessageCircle size={20} />} title="One request, less chaos" text="NestHelper helps coordinate the details so families are not stuck managing every message, scope question, and next step alone." />
          </div>
        </SectionShell>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <SectionShell>
          <SectionIntro
            label="Limited Availability"
            icon={<Sparkles size={15} />}
            title="Limited Parent Reset Openings"
            description="NestHelper is accepting a limited number of family requests while we grow carefully. Every request is reviewed for service fit, timing, area, and helper availability so the experience stays personal, reliable, and quality-first."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard icon={<ClipboardCheck size={20} />} title="Reviewed before confirmation" text="A request is not an instant booking. We review the details first so families know what is included before payment." />
            <InfoCard icon={<ShieldCheck size={20} />} title="Quality over volume" text="We would rather accept fewer requests and do them well than overbook helpers or rush through family homes." />
            <InfoCard icon={<MessageCircle size={20} />} title="Personal follow-up" text="NestHelper stays connected from request to completion so families are not left managing the process alone." />
          </div>
        </SectionShell>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionShell>
          <SectionIntro
            label="Why families choose NestHelper"
            icon={<ShieldCheck size={15} />}
            title="Managed support, not marketplace chaos."
            description="NestHelper costs more than a casual hire because families are not just paying for a task. They are paying for request review, helper matching, clear scope, insured service, coordination, secure payment, and follow-up."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ChoiceItem icon={<CheckCircle2 size={20} />} title="Washington business licensed" text="NestHelper operates as a real local Washington business, not just a casual side arrangement." />
            <ChoiceItem icon={<ShieldCheck size={20} />} title="Insured local service" text="Families get support from an insured local service instead of only a handshake agreement." />
            <ChoiceItem icon={<Heart size={20} />} title="Checked helper model" text="Helpers and partners are reviewed before active family assignments and matched by scope, fit, and availability." />
            <ChoiceItem icon={<ClipboardCheck size={20} />} title="Clear scope before payment" text="Timing, location, access, pets, safety notes, and package fit are reviewed before checkout." />
            <ChoiceItem icon={<MessageCircle size={20} />} title="Managed start to finish" text="NestHelper coordinates the request, payment, expectations, and follow-up instead of leaving families to manage it all alone." />
          </div>

          <div className="mt-5 flex flex-col gap-4 rounded-[2rem] border border-nest-gold/16 bg-nest-mint/20 p-5 shadow-sm sm:flex-row sm:items-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-nest-teal shadow-sm">
              <SprayCan size={22} />
            </span>
            <div>
              <h3 className="text-xl font-black text-nest-teal">Premium details are reviewed</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/70">
                NestHelper brings the supplies and reviews details that matter: product preferences, surfaces, access notes, pets, timing, and scope. That extra coordination is part of the value families are paying for.
              </p>
            </div>
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
              title="A local business with a community heart."
              description="NestHelper is here to serve busy families, but the mission is bigger than one booking. As we grow, our goal is to set aside a portion of what we earn to support local family relief, community charities, neighborhood partners, and reliable helper opportunities in the community we serve."
            />

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <GivingBackCard
                icon={<Heart size={30} />}
                title="Family relief"
                textLines={["As revenue allows,", "we plan to support", "local families in need."]}
              />
              <GivingBackCard
                icon={<Home size={30} />}
                title="Community giving"
                textLines={["Our goal is to give", "to local charities, churches,", "schools, and nonprofits."]}
              />
              <GivingBackCard
                icon={<Sparkles size={30} />}
                title="Local opportunity"
                textLines={["Every booking helps", "build trusted local work", "and practical support."]}
              />
            </div>
          </SectionShell>
        </div>
      </AnimatedSection>

      <AnimatedSection className="soft-section px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="pill-label mx-auto w-fit"><Star size={15} /> Services</p>
            <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">Extra hands for busy parents.</h2>
            <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-nest-ink/70 sm:text-lg sm:leading-8">
              Choose a package, submit the details, and NestHelper reviews the request before payment. Pricing reflects a managed service: clear scope, coordination, insured support, and follow-up — not just someone showing up for an hour.
            </p>
          </div>
          <div className="mt-10 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => <ServiceCard key={service.id} service={service} />)}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/86 p-5 text-center shadow-soft backdrop-blur sm:p-8 lg:p-10">
          <div className="mx-auto max-w-4xl">
            <p className="pill-label mx-auto w-fit"><Building2 size={15} /> For Local Businesses</p>
            <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
              Commercial Reset has its own page.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-nest-ink/72 sm:text-lg sm:leading-8">
              Parent Reset stays focused on families. Commercial Reset is a separate quote-first service lane for small offices, studios, churches, daycare common areas, salons, and local business spaces in select Pierce County, Eastside, and Northshore areas that need routine cleaning support — including non-toxic or low-odor product preferences when appropriate.
            </p>
            <div className="mx-auto mt-7 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
              <ButtonLink href="/commercial-reset">Explore Commercial Reset</ButtonLink>
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              "Small offices and studios",
              "Churches and nonprofits",
              "Salons, gyms, and local shops",
              "Quoted after scope review",
              "Non-toxic / low-odor options by request",
            ].map((item) => (
              <div key={item} className="group flex h-full items-center gap-3 rounded-2xl border border-nest-gold/12 bg-nest-cream p-4 text-left font-black text-nest-ink/78 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-nest-teal shadow-sm transition group-hover:bg-nest-teal group-hover:text-white">
                  <Building2 size={17} />
                </span>
                {item}
              </div>
            ))}
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
        <div className="self-center text-center lg:text-left">
          <p className="pill-label mx-auto w-fit lg:mx-0"><ShieldCheck size={15} /> Trust & Safety</p>
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
              <div key={item} className="group flex gap-3 rounded-2xl border border-nest-gold/12 bg-white p-4 font-black text-nest-ink/78 shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold/28 hover:shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nest-mint/35 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">
                  <ShieldCheck size={18} />
                </span>
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center lg:justify-start"><ButtonLink href="/trust" variant="secondary">See Trust Standards</ButtonLink></div>
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
    <div className="mx-auto max-w-4xl text-center">
      <p className="pill-label mx-auto w-fit">{icon} {label}</p>
      <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-nest-ink/70 sm:text-lg sm:leading-8">
        {description}
      </p>
    </div>
  );
}

function TrustProofItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="group flex h-full items-center gap-3 rounded-[1.15rem] px-1 py-1 text-sm font-black leading-5 text-nest-teal transition hover:-translate-y-0.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nest-mint/45 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="group h-full rounded-[1.9rem] border border-nest-gold/12 bg-white/88 p-5 shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">{icon}</div>
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
    <div className="group relative z-10 h-full rounded-[1.9rem] border border-nest-gold/12 bg-white/92 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-nest-gold/12 bg-nest-mint/38 text-nest-teal shadow-sm transition group-hover:border-nest-teal/20 group-hover:bg-nest-teal group-hover:text-white">
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
    <div className="group flex h-full min-h-[20rem] flex-col items-center rounded-[1.9rem] border border-nest-gold/12 bg-white/92 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-nest-gold/12 bg-nest-mint/38 text-nest-teal shadow-sm transition group-hover:border-nest-teal/20 group-hover:bg-nest-teal group-hover:text-white">
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
