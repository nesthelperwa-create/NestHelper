import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: { absolute: "NestHelper | Household Help in Bothell, Woodinville & Eastside WA" },
  description:
    "NestHelper helps busy families with household support, home resets, laundry catch-up, errands, and organizing in Bothell, Woodinville, Kenmore, Kirkland, Redmond, Mill Creek, and nearby Eastside/Northshore communities. No childcare services.",
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    title: "NestHelper | Household Help in Bothell, Woodinville & Eastside WA",
    description:
      "Local household support, home resets, laundry catch-up, errands, and organizing for busy Eastside/Northshore families. No childcare.",
    url: siteConfig.url,
    images: [siteConfig.assets.og],
  },
};


export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden px-4 pb-10 pt-7 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-80" />
        <div className="absolute inset-0 -z-10 bg-white/44" />
        <div className="absolute -left-24 top-20 -z-10 h-80 w-80 rounded-full bg-nest-mint/70 blur-3xl" />
        <div className="absolute -right-20 bottom-10 -z-10 h-80 w-80 rounded-full bg-nest-gold/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-[90rem] items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
          <AnimatedSection className="order-1 min-w-0 text-center">
            <div className="pill-label mx-auto max-w-full">
              <Sparkles size={16} /> Parent Reset Concierge
            </div>
            <h1 className="text-balance mx-auto mt-4 max-w-3xl text-[2.55rem] font-black leading-[0.95] tracking-tight text-nest-teal sm:text-6xl sm:leading-[0.96] lg:text-7xl">
              Reset the home. Reclaim the day.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-nest-ink/74 sm:text-xl sm:leading-8">
              Household help for busy families — local support for home resets, laundry rescue, errands, organizing, and extra hands around the house with clear packages, reviewed requests, limited openings, and follow-up. No childcare services.
            </p>
            <div className="mx-auto mt-7 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
              <ButtonLink href="/request">Request Help</ButtonLink>
              <ButtonLink href="/services" variant="secondary">View Services</ButtonLink>
            </div>
            <div className="mx-auto mt-6 max-w-2xl rounded-[1.8rem] border border-nest-gold/16 bg-white/70 p-4 text-left shadow-sm backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-3">
                <TrustProofItem icon={<CheckCircle2 size={15} />} text="Washington business licensed" />
                <TrustProofItem icon={<ShieldCheck size={15} />} text="Insured local service" />
                <TrustProofItem icon={<ClipboardCheck size={15} />} text="Limited openings reviewed first" />
              </div>
              <div id="service-area" className="mt-4 scroll-mt-24 border-t border-nest-gold/14 pt-3 text-left">
                <div className="flex items-start gap-2 text-sm font-black leading-5 text-nest-teal sm:items-center">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-nest-gold sm:mt-0" />
                  <span>Serving Bothell, Woodinville & nearby communities</span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-nest-ink/64">
                  Bothell, Woodinville, Kenmore, Kirkland, Redmond, Mill Creek, and nearby Eastside/Northshore areas. Send your address and we will confirm availability before payment.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Bothell", "Woodinville", "Kenmore", "Kirkland", "Redmond", "Mill Creek", "Nearby Eastside/Northshore"].map((area) => (
                    <span key={area} className="rounded-full border border-nest-gold/16 bg-nest-cream px-3 py-1 text-[0.72rem] font-black text-nest-teal">
                      {area}
                    </span>
                  ))}
                </div>
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
            title="Household help without the hiring headache."
            description="NestHelper coordinates trusted household support for busy families — home resets, laundry catch-up, errands, organizing, and extra hands around the house — with reviewed requests, clear scope, insured support, and no childcare services."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={<Home size={20} />} title="Home reset help" text="Kitchen resets, tidying support, light household catch-up, and practical help when the day gets away from you." />
            <InfoCard icon={<Sparkles size={20} />} title="Laundry rescue" text="Pickup, dry weigh-in, wash/fold coordination, return delivery, and clear reusable bag expectations." />
            <InfoCard icon={<ClipboardCheck size={20} />} title="Errands and family support" text="Approved errands, pickups, returns, and household support with a reviewed scope before payment." />
            <InfoCard icon={<MessageCircle size={20} />} title="One request, less chaos" text="NestHelper helps coordinate the details so families are not stuck managing every message, scope question, and next step alone." />
          </div>
        </SectionShell>
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

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[2.25rem] border border-nest-gold/14 bg-white/86 p-5 shadow-soft backdrop-blur sm:p-7 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="pill-label mx-auto w-fit lg:mx-0"><ShieldCheck size={15} /> Trust & Safety</p>
              <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-4xl">
                Clear standards before anyone comes to your home.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-nest-ink/72 sm:text-lg">
                NestHelper uses a managed helper model with screening steps, reviewed requests, clear service boundaries, and follow-up after service.
              </p>
              <p className="mt-3 text-sm font-black leading-6 text-nest-teal">
                No childcare, babysitting, medical care, or elder care services.
              </p>
              <div className="mt-6 flex justify-center lg:justify-start">
                <ButtonLink href="/trust" variant="secondary">Read Trust & Safety</ButtonLink>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Background-checked helpers",
                "Insured local service",
                "Scope reviewed before payment",
                "Service boundaries made clear",
              ].map((item) => (
                <div key={item} className="group flex items-center gap-3 rounded-2xl border border-nest-gold/12 bg-nest-cream p-4 text-sm font-black text-nest-ink/78 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-nest-teal shadow-sm transition group-hover:bg-nest-teal group-hover:text-white">
                    <ShieldCheck size={17} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-nest-gold/14 bg-white/86 p-5 shadow-soft backdrop-blur sm:p-6 lg:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="pill-label mx-auto w-fit lg:mx-0"><Sparkles size={15} /> Limited Availability</p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-nest-teal sm:text-3xl">
                Accepting a limited number of family requests.
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-nest-ink/70 sm:text-base sm:leading-7">
                NestHelper reviews service area, timing, scope, safety notes, and helper availability before payment so quality stays personal while we grow.
              </p>
            </div>
            <div className="mx-auto w-full max-w-xs lg:mx-0 lg:w-auto">
              <ButtonLink href="/request">Request Help</ButtonLink>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-nest-gold/14 bg-white/86 p-5 shadow-soft backdrop-blur sm:p-6 lg:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="pill-label mx-auto w-fit lg:mx-0"><Building2 size={15} /> Commercial Reset</p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-nest-teal sm:text-3xl">
                Need help for a local business space?
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-nest-ink/70 sm:text-base sm:leading-7">
                Commercial Reset is a separate quote-first service lane for small offices, studios, churches, salons, and select local business spaces.
              </p>
            </div>
            <div className="mx-auto w-full max-w-xs lg:mx-0 lg:w-auto">
              <ButtonLink href="/commercial-reset" variant="secondary">Explore Commercial Reset</ButtonLink>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div id="giving-back" className="scroll-mt-24 rounded-[2rem] border border-nest-gold/14 bg-nest-mint/18 p-5 text-center shadow-sm sm:p-6 lg:p-7">
          <p className="pill-label mx-auto w-fit"><Heart size={15} /> Giving Back</p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-nest-teal sm:text-3xl">
            A local business with a community heart.
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm font-semibold leading-6 text-nest-ink/70 sm:text-base sm:leading-7">
            As NestHelper grows, our goal is to support the families around us by giving to local churches, nonprofits, schools, and community organizations, and by helping useful family items like toys reach families going through a hard season when we can responsibly coordinate it.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-nest-gold/12 bg-white/76 p-4 text-left shadow-sm">
              <div className="mb-3 inline-flex rounded-xl bg-nest-mint/35 p-2 text-nest-teal">
                <Heart size={18} />
              </div>
              <h3 className="text-sm font-black text-nest-teal">Support local organizations</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-nest-ink/68">
                We plan to give back through churches, nonprofits, schools, and community groups as the business grows.
              </p>
            </div>
            <div className="rounded-2xl border border-nest-gold/12 bg-white/76 p-4 text-left shadow-sm">
              <div className="mb-3 inline-flex rounded-xl bg-nest-mint/35 p-2 text-nest-teal">
                <Home size={18} />
              </div>
              <h3 className="text-sm font-black text-nest-teal">Share useful family items</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-nest-ink/68">
                When appropriate, we may accept gently used toys and family items to pass along to families who need them.
              </p>
            </div>
            <div className="rounded-2xl border border-nest-gold/12 bg-white/76 p-4 text-left shadow-sm">
              <div className="mb-3 inline-flex rounded-xl bg-nest-mint/35 p-2 text-nest-teal">
                <Sparkles size={18} />
              </div>
              <h3 className="text-sm font-black text-nest-teal">Help families through hard seasons</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-nest-ink/68">
                The goal is to turn completed bookings into practical relief for local families and neighbors.
              </p>
            </div>
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-xs font-semibold leading-5 text-nest-ink/58">
            This part of NestHelper is still growing, but the mission is simple: serve families well and help the community feel supported.
          </p>
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
