"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/trust", label: "Trust" },
  { href: "/helpers", label: "Helpers" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-nest-gold/15 bg-[#fffaf2]/90 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-2xl" aria-label="NestHelper home">
          <Image
            src={siteConfig.assets.icon}
            alt="NestHelper icon"
            width={56}
            height={56}
            className="h-11 w-11 object-contain drop-shadow-sm sm:h-12 sm:w-12"
            priority
          />
          <div className="leading-tight">
            <div className="text-lg font-black tracking-tight text-nest-teal sm:text-2xl">NestHelper</div>
            <div className="text-[0.70rem] font-black uppercase tracking-[0.28em] text-nest-gold">Parent Reset</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-nest-gold/15 bg-white/65 p-1 shadow-sm lg:flex" aria-label="Main navigation">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  active ? "bg-nest-teal text-white shadow-sm" : "text-nest-ink/72 hover:bg-nest-mint/35 hover:text-nest-teal"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="hidden items-center gap-2 rounded-full border border-nest-teal/10 bg-white/70 px-3 py-2 text-xs font-black text-nest-teal xl:flex">
            <ShieldCheck size={15} /> Reviewed before payment
          </div>
          <Link
            href="/request"
            className="focus-ring rounded-full bg-nest-teal px-5 py-3 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift"
          >
            Request Help
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="focus-ring rounded-full border border-nest-teal/15 bg-white/80 p-3 text-nest-teal shadow-sm lg:hidden"
          aria-label="Open menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-nest-gold/15 bg-[#fffaf2] px-4 pb-5 pt-2 shadow-soft lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2" aria-label="Mobile navigation">
            <Link onClick={() => setOpen(false)} href="/" className="rounded-2xl px-4 py-3 font-black text-nest-ink hover:bg-white">Home</Link>
            {nav.map((item) => (
              <Link key={item.href} onClick={() => setOpen(false)} href={item.href} className="rounded-2xl px-4 py-3 font-black text-nest-ink hover:bg-white">
                {item.label}
              </Link>
            ))}
            <Link onClick={() => setOpen(false)} href="/request" className="mt-2 rounded-2xl bg-nest-teal px-5 py-4 text-center font-black text-white shadow-soft">
              Request Help
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
