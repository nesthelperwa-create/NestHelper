import Image from "next/image";
import Link from "next/link";
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
      <section className="relative isolate overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-80" />
        <div className="absolute inset-0 -z-10 bg-white/42" />
        <div className="absolute -left-24 top-20 -z-10 h-80 w-80 rounded-full bg-nest-mint/70 blur-3xl" />
        <div className="absolute -right-20 bottom-10 -z-10 h-80 w-80 rounded-full bg-nest-gold/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
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
          </AnimatedSection>

          <AnimatedSection className="order-1 lg:order-2">
            <div className="relative">
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
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <TrustMini icon={<ShieldCheck />} title="Checked help model" text="Helpers and partner providers are reviewed before being sent to families." />
          <TrustMini icon={<Heart />} title="Parent-focused" text="Built around real household overwhelm, not random job posts." />
          <TrustMini icon={<MessageCircle />} title="Coordinated for you" text="We review scope, timing, access, pets, and safety before checkout." />
          <TrustMini icon={<CreditCard />} title="Secure checkout" text="Approved requests receive a secure payment link or invoice." />
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
              Choose a package, submit details, and NestHelper reviews the request before payment. It is cleaner than messaging strangers, negotiating scope, and hoping someone shows up.
            </p>
          </div>
          <div className="mt-10 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => <ServiceCard key={service.id} service={service} />)}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="pro-card overflow-hidden rounded-[2.5rem] p-6 sm:p-8">
          <div className="rounded-[2rem] bg-nest-cream p-6">
            <Image src={siteConfig.assets.badge} alt="NestHelper Gold Star Checked badge" width={600} height={600} className="mx-auto max-h-[420px] w-full object-contain animate-float" />
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
              <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 font-black text-nest-ink/78 shadow-sm">
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

function TrustMini({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="card-hover rounded-[1.6rem] border border-nest-gold/15 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/45 p-3 text-nest-teal">{icon}</div>
      <h3 className="text-lg font-black text-nest-teal">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-nest-ink/70">{text}</p>
    </div>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.7rem] border border-white/15 bg-white/10 p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/14">
      <div className="mb-4 inline-flex rounded-2xl bg-white/14 p-3 text-nest-gold2">{icon}</div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-white/75">{text}</p>
    </div>
  );
}
