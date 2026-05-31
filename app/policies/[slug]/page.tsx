import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { policies, getPolicy } from "@/lib/policies";

type PolicyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = getPolicy(slug);

  return {
    title: policy ? `${policy.title} | NestHelper` : "Policy | NestHelper"
  };
}

export default async function PolicyDetailPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = getPolicy(slug);

  if (!policy) notFound();

  const commercialReturnHref =
    slug === "commercial-reset-policy" || slug === "short-term-rental-turnover-policy"
      ? "/commercial-reset#commercial-policy-details"
      : null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {commercialReturnHref ? (
          <Link href={commercialReturnHref} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
            <ArrowLeft size={18} /> Back to Commercial Reset scope
          </Link>
        ) : null}

        <Link href="/policies" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-nest-gold/18 bg-white px-5 py-3 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
          <ArrowLeft size={18} /> All policies
        </Link>
      </div>

      <div className="mt-6 rounded-[2rem] border border-nest-gold/16 bg-white p-6 shadow-soft sm:p-8">
        <div className="inline-flex rounded-full bg-nest-mint/55 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-nest-teal">
          NestHelper Policy
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-nest-teal sm:text-5xl">{policy.title}</h1>
        <p className="mt-4 text-lg leading-8 text-nest-ink/72">{policy.intro}</p>

        <div className="mt-8 grid gap-5">
          {policy.sections.map((section) => (
            <section key={section.heading} className="rounded-2xl bg-nest-cream p-5">
              <h2 className="text-xl font-black text-nest-teal">{section.heading}</h2>
              <p className="mt-2 leading-7 text-nest-ink/75">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-nest-gold/20 bg-nest-gold/10 p-5 text-sm leading-6 text-nest-ink/70">
          These policies are written to set clear expectations for NestHelper customers, helpers, and partner providers. Final approval, scheduling, and pricing are reviewed before checkout.
        </div>

        {commercialReturnHref ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={commercialReturnHref} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-soft">
              <ArrowLeft size={18} /> Back to Commercial Reset scope
            </Link>
            <Link href="/policies" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-nest-gold/18 bg-white px-5 py-3 text-sm font-black text-nest-teal transition hover:-translate-y-0.5 hover:shadow-soft">
              View all policies
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
