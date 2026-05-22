import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";
import { policies } from "@/lib/policies";

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden text-white">
      <div className="teal-gradient absolute inset-0" />
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-nest-gold/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.2rem] border border-white/16 bg-white/10 p-5 shadow-soft backdrop-blur sm:p-7 lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-nest-gold2">Start with a simple request</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">Need help getting the house back under control?</h2>
              <p className="mt-2 max-w-2xl font-medium leading-7 text-white/78">
                Tell us what is piling up. We review scope, timing, location, and safety before checkout.
              </p>
            </div>
            <Link
              href="/request"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-black text-nest-teal shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-cream"
            >
              Request Help <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

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
          <div className="mt-6 grid gap-3 text-sm text-white/78">
            <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-3 transition hover:text-white"><Mail size={17} /> {siteConfig.email}</a>
            <a href={siteConfig.phoneHref} className="flex items-center gap-3 transition hover:text-white"><Phone size={17} /> {siteConfig.phone}</a>
            <div className="flex items-center gap-3"><MapPin size={17} /> {siteConfig.serviceArea}</div>
          </div>
        </div>

        <FooterColumn
          title="Company"
          links={[
            { href: "/", label: "Home" },
            { href: "/services", label: "Services & Pricing" },
            { href: "/trust", label: "Trust & Safety" },
            { href: "/faq", label: "FAQ" },
            { href: "/contact", label: "Contact" },
            { href: "/helpers", label: "Helpers & Partners" },
          ]}
        />

        <FooterColumn
          title="Start Here"
          links={[
            { href: "/request", label: "Request Help" },
            { href: "/#how-it-works", label: "How It Works" },
            { href: "/#service-area", label: "Service Area" },
            { href: "/faq", label: "FAQ" },
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
        © {new Date().getFullYear()} NestHelper. All rights reserved. Household support only; not childcare, medical care, or emergency services.
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
