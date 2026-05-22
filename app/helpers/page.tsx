import { CheckCircle2, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ApplicationFormChooser } from "@/components/forms/ApplicationForms";

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

      <ApplicationFormChooser />
    </>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-nest-gold/14 bg-white/90 p-6 shadow-sm">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal">{icon}</div>
      <h2 className="flex items-center gap-2 text-xl font-black text-nest-teal"><CheckCircle2 size={19} /> {title}</h2>
      <p className="mt-2 font-medium leading-7 text-nest-ink/70">{text}</p>
    </div>
  );
}
