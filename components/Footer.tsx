import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";
import { policies } from "@/lib/policies";

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden text-white">
      <div className="teal-gradient absolute inset-0" />
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-nest-gold/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/12 bg-white/10 p-6 shadow-2xl shadow-black/10 backdrop-blur md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-nest-gold2">Parent Reset starts here</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Need extra hands this week?</h2>
              <p className="mt-3 max-w-2xl text-white/78">Submit a request, we review the details, then send a secure checkout link only after the service is approved.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/request" className="rounded-full bg-white px-6 py-3.5 text-center font-black text-nest-teal transition hover:-translate-y-0.5 hover:shadow-xl">Request Help</Link>
              <Link href="/services" className="rounded-full border border-white/20 px-6 py-3.5 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">View Services</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.75fr_0.75fr_0.95fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image src={siteConfig.assets.icon} alt="NestHelper icon" width={64} height={64} className="h-14 w-14 object-contain" />
            <div>
              <div className="text-3xl font-black">NestHelper</div>
              <div className="font-black uppercase tracking-[0.25em] text-nest-gold2">Parent Reset</div>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-white/82">
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
            { href: "/helpers", label: "For Helpers" },
          ]}
        />

        <FooterColumn
          title="For Families"
          links={[
            { href: "/request", label: "Request Help" },
            { href: "/checkout", label: "Payment Flow" },
            { href: "/services#laundry", label: "Laundry Rescue" },
            { href: "/policies", label: "All Policies" },
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
