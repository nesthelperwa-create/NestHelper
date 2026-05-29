import { HeartHandshake, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ApplicationFormChooser } from "@/components/forms/ApplicationForms";
import { siteConfig } from "@/lib/siteConfig";

export default function HelpersPage() {
  return (
    <>
      <PageHero
        eyebrow="For Helpers & Partners"
        title="Join a parent-focused service built on trust."
        text="Choose whether you are applying as an individual helper or as a local partner provider. We’ll show the right application so the process feels simple and clear."
        cta={false}
      />

      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <InfoCard icon={<ShieldCheck />} title="Trust-first" text="NestHelper reviews helper fit, standards, references, and screening before active work." />
          <InfoCard icon={<HeartHandshake />} title="Parent-focused" text="The service is built around helping overwhelmed families with household support." />
          <InfoCard icon={<Sparkles />} title="Clear expectations" text="We define service scope, communication, and standards before matching work." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-[2rem] border border-nest-gold/16 bg-white/90 p-5 shadow-sm sm:grid-cols-2 sm:p-6">
          <a href={`mailto:${siteConfig.emails.helpers}`} className="flex items-start gap-3 rounded-2xl bg-nest-cream p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
            <Mail className="mt-1 shrink-0 text-nest-teal" size={19} />
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.18em] text-nest-gold">Helper questions</span>
              <span className="mt-1 block break-all font-black text-nest-teal">{siteConfig.emails.helpers}</span>
            </span>
          </a>
          <a href={`mailto:${siteConfig.emails.partners}`} className="flex items-start gap-3 rounded-2xl bg-nest-cream p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
            <Mail className="mt-1 shrink-0 text-nest-teal" size={19} />
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.18em] text-nest-gold">Partner questions</span>
              <span className="mt-1 block break-all font-black text-nest-teal">{siteConfig.emails.partners}</span>
            </span>
          </a>
        </div>
      </section>

      <ApplicationFormChooser />
    </>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-nest-gold/14 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-2 font-medium leading-7 text-nest-ink/70">{text}</p>
    </div>
  );
}
