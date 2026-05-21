import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin } from "lucide-react";
import type { Service } from "@/lib/services";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article
      id={service.id === "laundry-rescue" ? "laundry" : undefined}
      className="card-hover flex h-full min-h-[640px] flex-col overflow-hidden rounded-[2rem] border border-nest-gold/16 bg-white shadow-sm"
    >
      <div className="relative h-44 shrink-0 overflow-hidden bg-nest-cream2">
        <Image
          src={service.image}
          alt={service.title}
          fill
          className="object-cover object-top transition duration-500 hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 inline-flex w-fit rounded-full bg-nest-mint/55 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-nest-teal">
          Parent Reset Service
        </div>

        <h3 className="text-2xl font-black leading-tight text-nest-teal">{service.title}</h3>
        <p className="mt-2 min-h-[56px] text-sm leading-6 text-nest-ink/72 sm:text-base">
          {service.description}
        </p>

        <div className="mt-5 rounded-2xl bg-nest-cream p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-black text-nest-ink/70">Standard price</div>
              <div className="mt-1 text-2xl font-black leading-tight text-nest-teal sm:text-3xl">
                {service.standardPrice}
              </div>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-right text-xs font-black uppercase tracking-[0.12em] text-nest-gold shadow-sm">
              {service.priceNote}
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm font-bold text-nest-ink/72">
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

        <ul className="mt-5 grid flex-1 content-start gap-2 text-sm text-nest-ink/76">
          {service.details.map((detail) => (
            <li key={detail} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 shrink-0 text-nest-teal" size={18} />
              <span>{detail}</span>
            </li>
          ))}
        </ul>

        <Link
          href={`/request?service=${service.id}`}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-nest-teal px-5 py-3 font-black text-white shadow-soft transition hover:bg-nest-teal2"
        >
          Request This
        </Link>
      </div>
    </article>
  );
}
