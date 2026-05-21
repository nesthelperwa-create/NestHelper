import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { policies } from "@/lib/policies";

export default function PoliciesPage() {
  return (
    <>
      <PageHero
        eyebrow="Policies"
        title="Clear expectations protect families and helpers."
        text="Review scope, cancellation, laundry handling, safety, privacy, and the NestHelper Reset Promise before requesting service."
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {policies.map((policy) => (
            <Link
              href={`/policies/${policy.slug}`}
              key={policy.slug}
              className="card-hover group flex min-h-[190px] flex-col rounded-[2rem] border border-nest-gold/16 bg-white p-6 shadow-sm"
            >
              <div className="inline-flex w-fit rounded-full bg-nest-mint/55 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-nest-teal">
                NestHelper Policy
              </div>
              <h2 className="mt-4 text-2xl font-black text-nest-teal">{policy.title}</h2>
              <p className="mt-3 flex-1 leading-7 text-nest-ink/70">{policy.intro}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-black text-nest-gold transition group-hover:gap-3">
                Read policy <ArrowRight size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
