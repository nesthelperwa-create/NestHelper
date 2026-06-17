import Image from "next/image";
import { AlertTriangle, HeartHandshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { siteConfig } from "@/lib/siteConfig";

const standards = [
  "Identity review",
  "Third-party background screening before active helper work",
  "Washington/local checks where applicable",
  "Reference review",
  "Service standards and scope training",
  "Driving record checks for errand helpers when applicable",
  "Clear right-to-refuse safety rules",
  "Customer follow-up after service",
];

export default function TrustPage() {
  return (
    <>
      <PageHero
        eyebrow="Trust & Safety"
        title="Trust standards for family homes."
        text="NestHelper is designed as a managed household-support service with checked helpers, vetted partners, clear policies, controlled service scope, and follow-up after service."
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="pro-card h-fit rounded-[2.5rem] p-6 sm:p-8 lg:sticky lg:top-28">
          <div className="rounded-[2rem] bg-nest-cream p-5">
            <Image src={siteConfig.assets.badge} alt="Gold Star Checked" width={700} height={700} className="w-full object-contain" />
          </div>
          <div className="mt-6 rounded-2xl bg-nest-mint/25 p-5">
            <h2 className="text-2xl font-black text-nest-teal">Gold Star Checked</h2>
            <p className="mt-2 font-medium leading-7 text-nest-ink/70">
              A trust badge for individual helpers who complete NestHelper’s screening and service-standard steps before working with families.
            </p>
          </div>
          <div className="mt-4 grid gap-3 rounded-2xl border border-nest-gold/18 bg-white/82 p-5 text-sm font-black text-nest-ink/76 shadow-sm">
            <ProofLine text="Washington business licensed" />
            <ProofLine text="Insured local service" />
          </div>
        </div>

        <div className="grid gap-8">
          <div className="text-center lg:text-left">
            <p className="pill-label mx-auto w-fit lg:mx-0"><ShieldCheck size={15} /> Standards</p>
            <h2 className="text-balance mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-5xl">Built for parents who want trust, scope, and accountability.</h2>
            <p className="mt-4 text-lg font-medium leading-8 text-nest-ink/72">
              NestHelper coordinates the details, sets expectations, reviews scope, and uses checked helpers or vetted partner providers depending on the service. This page is the proof behind the homepage promise.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {standards.map((item) => (
              <div key={item} className="group flex gap-3 rounded-2xl border border-nest-gold/12 bg-white p-5 font-black text-nest-ink/78 shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold/28 hover:shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nest-mint/35 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">
                  <ShieldCheck size={18} />
                </span>
                {item}
              </div>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <TrustCard icon={<Users />} title="Managed service" text="Requests are reviewed and coordinated before payment so families understand the plan." />
            <TrustCard icon={<HeartHandshake />} title="Parent fit" text="Services are designed around household support and parent relief, not generic gig work." />
            <TrustCard icon={<Sparkles />} title="Follow-up" text="After service, NestHelper checks in so families have a point of accountability." />
          </div>

          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0 text-amber-700" />
              <div>
                <h3 className="text-xl font-black text-nest-ink">Important boundaries</h3>
                <p className="mt-2 font-medium leading-7 text-nest-ink/72">
                  NestHelper provides household support only. We do not provide licensed childcare, unsupervised babysitting, medical care, elder care, emergency services, legal services, or financial advice.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-7 text-center shadow-soft sm:p-8">
            <h2 className="text-3xl font-black text-nest-teal">Ready to request help?</h2>
            <p className="mx-auto mt-3 max-w-2xl font-medium leading-7 text-nest-ink/70">Submit the details first. We review the request before checkout so the scope is clear and the service is a fit.</p>
            <div className="mt-6"><ButtonLink href="/request">Request Help</ButtonLink></div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProofLine({ text }: { text: string }) {
  return (
    <div className="group flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nest-mint/35 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">
        <ShieldCheck size={17} />
      </span>
      <span>{text}</span>
    </div>
  );
}

function TrustCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group rounded-[2rem] border border-nest-gold/14 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-nest-gold/28 hover:shadow-soft">
      <div className="mb-4 inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal transition group-hover:bg-nest-teal group-hover:text-white">{icon}</div>
      <h3 className="text-xl font-black text-nest-teal">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-nest-ink/70">{text}</p>
    </div>
  );
}
