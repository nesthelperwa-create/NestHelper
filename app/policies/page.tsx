import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { policies } from "@/lib/policies";

export default function PoliciesPage(){return <><PageHero eyebrow="Policies" title="Clear expectations protect families and helpers." text="These pages explain scope, cancellation, laundry handling, safety, privacy, and the NestHelper Reset Promise."/><section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8"><div className="grid gap-5 md:grid-cols-2">{policies.map((policy)=><Link href={`/policies/${policy.slug}`} key={policy.slug} className="card-hover rounded-[2rem] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black text-nest-teal">{policy.title}</h2><p className="mt-2 text-nest-ink/70">{policy.intro}</p></Link>)}</div></section></>}
