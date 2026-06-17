import type { Metadata } from "next";
import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ApplicationFormChooser } from "@/components/forms/ApplicationForms";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Helpers & Partners | NestHelper",
  description:
    "Apply to work with NestHelper as an individual household helper or local partner provider supporting families with home resets, laundry, errands, and organizing.",
  alternates: {
    canonical: `${siteConfig.url}/helpers`,
  },
  openGraph: {
    title: "Helpers & Partners | NestHelper",
    description:
      "Apply to support NestHelper families as a checked household helper or local partner provider.",
    url: `${siteConfig.url}/helpers`,
    images: [siteConfig.assets.og],
  },
};

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
    <div className="group rounded-[2rem] border border-nest-gold/14 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-2 font-medium leading-7 text-nest-ink/70">{text}</p>
    </div>
  );
}
