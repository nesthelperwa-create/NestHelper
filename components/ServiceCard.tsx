import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, MapPin, Sparkles } from "lucide-react";
import type { Service } from "@/lib/services";

const serviceStyles: Record<string, { eyebrow: string; accent: string; chip: string; price: string }> = {
  "parent-reset-2hr": {
    eyebrow: "Home reset",
    accent: "from-emerald-500/20 to-nest-mint/35",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    price: "bg-emerald-50 text-emerald-900",
  },
  "family-reset-3hr": {
    eyebrow: "Family catch-up",
    accent: "from-blue-500/18 to-sky-100",
    chip: "bg-blue-50 text-blue-800 border-blue-200",
    price: "bg-blue-50 text-blue-900",
  },
  "helper-block-4hr": {
    eyebrow: "Bigger reset",
    accent: "from-violet-500/18 to-purple-100",
    chip: "bg-violet-50 text-violet-800 border-violet-200",
    price: "bg-violet-50 text-violet-900",
  },
  "errand-helper": {
    eyebrow: "Errand support",
    accent: "from-amber-500/22 to-orange-100",
    chip: "bg-amber-50 text-amber-900 border-amber-200",
    price: "bg-amber-50 text-amber-950",
  },
  "laundry-rescue": {
    eyebrow: "Laundry relief",
    accent: "from-rose-500/18 to-pink-100",
    chip: "bg-rose-50 text-rose-800 border-rose-200",
    price: "bg-rose-50 text-rose-900",
  },
};

export function ServiceCard({ service }: { service: Service }) {
  const theme = serviceStyles[service.id] || serviceStyles["parent-reset-2hr"];

  return (
    <article
      id={service.id === "laundry-rescue" ? "laundry" : undefined}
      className="card-hover group flex h-full flex-col overflow-hidden rounded-[2rem] border border-nest-gold/18 bg-white shadow-sm"
    >
      <div className={`relative h-48 shrink-0 overflow-hidden bg-gradient-to-br ${theme.accent}`}>
        <Image
          src={service.image}
          alt={service.title}
          fill
          className="object-cover object-top transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/32 to-transparent" />
        <div className={`absolute left-4 top-4 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] shadow-sm ${theme.chip}`}>
          {theme.eyebrow}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl font-black leading-tight text-nest-teal">{service.title}</h3>
          <Sparkles className="mt-1 shrink-0 text-nest-gold" size={20} />
        </div>
        <p className="mt-3 text-sm leading-6 text-nest-ink/72 sm:text-base">
          {service.description}
        </p>

        <div className="mt-5 overflow-hidden rounded-3xl border border-nest-gold/14 bg-nest-cream">
          <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
            <div className="p-5">
              <div className="text-sm font-black uppercase tracking-[0.16em] text-nest-ink/55">Standard price</div>
              <div className="mt-1 text-3xl font-black leading-tight text-nest-teal">
                {service.standardPrice}
              </div>
              {service.foundingPrice && (
                <div className="mt-2 text-sm font-bold text-nest-ink/60">
                  Founding/Beta: <span className="text-nest-teal">{service.foundingPrice}</span>
                </div>
              )}
            </div>
            <div className={`flex items-center justify-center px-5 py-4 text-center text-xs font-black uppercase tracking-[0.13em] ${theme.price}`}>
              {service.priceNote}
            </div>
          </div>

          <div className="grid gap-2 border-t border-nest-gold/10 p-5 text-sm font-bold text-nest-ink/72">
            <div className="flex gap-2">
              <Clock className="mt-0.5 shrink-0 text-nest-teal" size={17} />
              <span>{service.serviceTime}</span>
            </div>
            {service.travelInfo && (
              <div className="flex gap-2">
                <MapPin className="mt-0.5 shrink-0 text-nest-teal" size={17} />
                <span>{service.travelInfo}</span>
              </div>
            )}
          </div>
        </div>

        <ul className="mt-5 grid flex-1 content-start gap-2.5 text-sm text-nest-ink/76">
          {service.details.slice(0, 5).map((detail) => (
            <li key={detail} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 shrink-0 text-nest-teal" size={18} />
              <span>{detail}</span>
            </li>
          ))}
        </ul>

        {service.note && (
          <p className="mt-4 rounded-2xl bg-nest-mint/25 p-4 text-xs font-semibold leading-5 text-nest-ink/68">
            {service.note}
          </p>
        )}

        <Link
          href={`/request?service=${service.id}`}
          className="focus-ring group/link mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-nest-teal px-5 py-3.5 font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift"
        >
          Request This
          <ArrowRight size={18} className="transition group-hover/link:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
