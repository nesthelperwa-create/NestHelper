import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Sparkles, Heart, CheckCircle2, Clock, CreditCard, ClipboardCheck, Home, MapPin } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ServiceCard } from "@/components/ServiceCard";
import { services } from "@/lib/services";
import { siteConfig } from "@/lib/siteConfig";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="absolute inset-0 bg-white/30" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <AnimatedSection className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-nest-gold/25 bg-white/75 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-nest-gold shadow-sm">
              <Sparkles size={16} /> Parent Reset Concierge
            </div>
            <h1 className="text-balance mt-5 text-5xl font-black tracking-tight text-nest-teal sm:text-6xl lg:text-7xl">
              Reset the home. Reclaim the day.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-nest-ink/75 sm:text-xl">
              Trusted local help for busy parents — home resets, laundry rescue, errands, and family support without the awkward guessing game.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/request">Request Help</ButtonLink>
              <ButtonLink href="/services" variant="secondary">View Services</ButtonLink>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {["Vetted helpers", "Insured business", "Stripe secure checkout"].map((x)=><div key={x} className="glass-card rounded-2xl px-4 py-3 text-sm font-black text-nest-teal">✓ {x}</div>)}
            </div>
          </AnimatedSection>
          <AnimatedSection className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-nest-gold/15 blur-2xl" />
              <Image src={siteConfig.assets.hero} alt="NestHelper Parent Reset banner" width={1792} height={768} priority className="relative rounded-[2rem] border border-white/70 shadow-glow" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <TrustMini icon={<ShieldCheck />} title="Gold Star Checked" text="Screened, verified, service-standard trained helpers." />
          <TrustMini icon={<Heart />} title="Parent Focused" text="Built around real family overwhelm, not random job posts." />
          <TrustMini icon={<Clock />} title="Request First" text="We review availability, scope, safety, and location before checkout." />
          <TrustMini icon={<CreditCard />} title="Tax-Ready Stripe" text="Checkout/invoices are designed to include applicable WA sales tax." />
        </div>
      </AnimatedSection>

      <AnimatedSection className="bg-white/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.22em] text-nest-gold">Services</p>
            <h2 className="mt-3 text-4xl font-black text-nest-teal sm:text-5xl">Extra hands for busy parents.</h2>
            <p className="mt-4 text-lg text-nest-ink/70">Clear packages, simple request flow, and pricing reviewed before checkout.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => <ServiceCard key={service.id} service={service} />)}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="glass-card rounded-[2rem] p-8 shadow-soft">
          <Image src={siteConfig.assets.badge} alt="NestHelper Gold Star Checked badge" width={600} height={600} className="mx-auto max-h-[420px] w-full object-contain animate-float" />
        </div>
        <div className="self-center">
          <p className="font-black uppercase tracking-[0.22em] text-nest-gold">Trust & Safety</p>
          <h2 className="mt-3 text-4xl font-black text-nest-teal sm:text-5xl">Not a random helper board.</h2>
          <p className="mt-5 text-lg leading-8 text-nest-ink/72">NestHelper is built as a managed local parent-help service. We coordinate the request, set expectations, use checked helpers or vetted partner providers, and follow up after service.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {['Identity review', 'Background screening', 'Reference review', 'Service standards', 'Partner-vetted providers', 'Reset Promise'].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 font-bold shadow-sm"><CheckCircle2 className="text-nest-teal" /> {item}</div>
            ))}
          </div>
          <div className="mt-8"><ButtonLink href="/trust" variant="secondary">See Trust Standards</ButtonLink></div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="bg-nest-teal px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.22em] text-nest-gold2">How it works</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">Smooth for families. Controlled for quality.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            <Step icon={<ClipboardCheck />} title="1. Request help" text="Tell us what’s piling up, your location, preferred timing, and promo code." />
            <Step icon={<ShieldCheck />} title="2. We review" text="We check service area, availability, safety, scope, pets, access, and pricing." />
            <Step icon={<CreditCard />} title="3. Secure checkout" text="After approval, we send a Stripe checkout link by text/email with applicable tax." />
            <Step icon={<Home />} title="4. We get to work" text="A checked helper or vetted partner completes the job, then we follow up." />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-white p-8 shadow-glow md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
            <div>
              <p className="font-black uppercase tracking-[0.22em] text-nest-gold">Ready when you need a reset</p>
              <h2 className="mt-3 text-4xl font-black text-nest-teal sm:text-5xl">Need help this week?</h2>
              <p className="mt-4 text-lg text-nest-ink/72">Submit a request and we’ll review the details before sending your secure checkout link. Laundry requests use a deposit first, then a final balance after dry weigh-in.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/request">Request Help</ButtonLink><ButtonLink href="/checkout" variant="secondary">See Payment Flow</ButtonLink></div>
            </div>
            <div className="rounded-[2rem] bg-nest-cream p-6">
              <div className="flex items-center gap-2 text-nest-teal"><MapPin /> <strong>Serving</strong></div>
              <p className="mt-3 text-2xl font-black text-nest-ink">{siteConfig.serviceArea}</p>
              <p className="mt-3 text-sm font-semibold text-nest-ink/65">Requests outside the core service area may include a travel fee or may not be available during beta.</p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}

function TrustMini({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="card-hover rounded-[1.5rem] border border-nest-gold/15 bg-white p-5 shadow-sm"><div className="mb-4 inline-flex rounded-2xl bg-nest-mint/45 p-3 text-nest-teal">{icon}</div><h3 className="text-lg font-black text-nest-teal">{title}</h3><p className="mt-2 text-sm text-nest-ink/70">{text}</p></div>;
}
function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-6 backdrop-blur"><div className="mb-4 inline-flex rounded-2xl bg-white/14 p-3 text-nest-gold2">{icon}</div><h3 className="text-xl font-black">{title}</h3><p className="mt-2 text-white/75">{text}</p></div>;
}
