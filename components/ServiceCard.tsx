import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Service } from "@/lib/services";
import { siteConfig } from "@/lib/siteConfig";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article id={service.id === "laundry-rescue" ? "laundry" : undefined} className="card-hover overflow-hidden rounded-[2rem] border border-nest-gold/16 bg-white shadow-sm">
      <div className="relative h-48 overflow-hidden bg-nest-cream2">
        <Image src={service.image} alt={service.title} fill className="object-cover transition duration-500 hover:scale-105" />
      </div>
      <div className="p-6">
        <div className="mb-3 inline-flex rounded-full bg-nest-mint/55 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-nest-teal">Parent Reset Service</div>
        <h3 className="text-2xl font-black text-nest-teal">{service.title}</h3>
        <p className="mt-2 text-nest-ink/72">{service.description}</p>
        <div className="mt-5 rounded-2xl bg-nest-cream p-4">
          <div className="text-sm font-black text-nest-ink/70">Standard</div>
          <div className="text-3xl font-black text-nest-teal">{service.standardPrice}</div>
          <div className="mt-2 text-sm font-bold text-nest-gold">Founding Family: {service.foundingPrice} with {siteConfig.foundingCode}</div>
        </div>
        <ul className="mt-5 grid gap-2 text-sm text-nest-ink/76">
          {service.details.slice(0,4).map((detail) => (
            <li key={detail} className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-nest-teal" size={18} /> {detail}</li>
          ))}
        </ul>
        {service.note && <p className="mt-4 rounded-2xl border border-nest-gold/20 bg-nest-gold/10 p-3 text-sm font-semibold text-nest-ink/78">{service.note}</p>}
        <Link href={`/request?service=${service.id}`} className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-nest-teal px-5 py-3 font-black text-white shadow-soft transition hover:bg-nest-teal2">
          Request This
        </Link>
      </div>
    </article>
  );
}
