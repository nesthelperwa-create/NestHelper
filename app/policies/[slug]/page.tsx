import { notFound } from "next/navigation";
import Link from "next/link";
import { policies, getPolicy } from "@/lib/policies";

export function generateStaticParams(){ return policies.map((policy)=>({slug: policy.slug})); }

export function generateMetadata({ params }: { params: { slug: string } }) {
  const policy = getPolicy(params.slug);
  return { title: policy ? `${policy.title} | NestHelper` : "Policy | NestHelper" };
}

export default function PolicyPage({ params }: { params: { slug: string } }) {
  const policy = getPolicy(params.slug);
  if (!policy) notFound();
  return <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"><Link href="/policies" className="font-bold text-nest-teal">← All policies</Link><div className="mt-6 rounded-[2rem] bg-white p-8 shadow-soft"><h1 className="text-4xl font-black text-nest-teal">{policy.title}</h1><p className="mt-4 text-lg text-nest-ink/72">{policy.intro}</p><div className="mt-8 grid gap-6">{policy.sections.map((section)=><section key={section.heading} className="rounded-2xl bg-nest-cream p-5"><h2 className="text-xl font-black text-nest-teal">{section.heading}</h2><p className="mt-2 leading-7 text-nest-ink/75">{section.body}</p></section>)}</div></div></section>;
}
