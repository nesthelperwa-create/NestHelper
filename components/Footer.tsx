import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";
import { policies } from "@/lib/policies";

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden text-white">
      <div className="teal-gradient absolute inset-0" />
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-nest-gold/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.75fr_0.75fr_0.95fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image src={siteConfig.assets.icon} alt="NestHelper icon" width={64} height={64} className="h-14 w-14 object-contain" />
            <div>
              <div className="text-3xl font-black">NestHelper</div>
              <div className="font-black uppercase tracking-[0.25em] text-nest-gold2">Parent Reset</div>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-white/80">
            Reset the home. Reclaim the day. Parent-focused household support coordinated with care, clear standards, and follow-up.
          </p>
          <div className="mt-5 max-w-sm rounded-3xl border border-white/12 bg-white/8 p-4 text-sm leading-6 text-white/82 shadow-sm backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-nest-gold2">
              <BookOpen size={15} /> Colossians 3:23
            </div>
            <p className="font-medium italic">
              “Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.”
            </p>
          </div>
          <Link
            href="/request"
            className="focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-black text-nest-teal shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-cream"
          >
            Request Help <ArrowRight size={17} />
          </Link>
          <div className="mt-6 grid gap-3 text-sm text-white/78">
            <a href={`mailto:${siteConfig.emails.support}`} className="flex items-center gap-3 transition hover:text-white"><Mail size={17} /> Support: {siteConfig.emails.support}</a>
            <a href={`mailto:${siteConfig.emails.commercial}`} className="flex items-center gap-3 transition hover:text-white"><Mail size={17} /> Commercial: {siteConfig.emails.commercial}</a>
            <a href={siteConfig.phoneHref} className="flex items-center gap-3 transition hover:text-white"><Phone size={17} /> {siteConfig.phone}</a>
            <div className="flex items-center gap-3"><MapPin size={17} /> Parent Reset: {siteConfig.serviceArea}</div>
          </div>
        </div>

        <FooterColumn
          title="Company"
          links={[
            { href: "/", label: "Home" },
            { href: "/services", label: "Services & Pricing" },
            { href: "/commercial-reset", label: "Commercial Reset" },
            { href: "/trust", label: "Trust & Safety" },
            { href: "/helpers", label: "Helpers & Partners" },
            { href: "/faq", label: "FAQ" },
            { href: "/contact", label: "Contact" },
          ]}
        />

        <FooterColumn
          title="Explore"
          links={[
            { href: "/request", label: "Request Help" },
            { href: "/commercial-reset/request", label: "Commercial Quote Request" },
            { href: "/#how-it-works", label: "How It Works" },
            { href: "/#giving-back", label: "Giving Back" },
            { href: "/#service-area", label: "Service Area" },
          ]}
        />

        <div>
          <h3 className="font-black text-nest-gold2">Policies</h3>
          <div className="mt-4 grid gap-2 text-sm">
            {policies.slice(0, 8).map((policy) => (
              <Link key={policy.slug} href={`/policies/${policy.slug}`} className="text-white/78 transition hover:text-white">
                {policy.title}
              </Link>
            ))}
            <Link href="/policies" className="font-black text-white transition hover:text-nest-gold2">View all policies →</Link>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/12 px-4 py-5 text-center text-sm text-white/70">
        © {new Date().getFullYear()} NestHelper. All rights reserved. Household support and routine commercial cleaning support only; not childcare, medical care, hazardous cleanup, or emergency services.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="font-black text-nest-gold2">{title}</h3>
      <div className="mt-4 grid gap-2 text-sm">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-white/78 transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
