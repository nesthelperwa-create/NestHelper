"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/trust", label: "Trust & Safety" },
  { href: "/helpers", label: "For Helpers" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-nest-gold/15 bg-nest-cream/86 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 focus-ring rounded-xl" aria-label="NestHelper home">
          <Image src={siteConfig.assets.icon} alt="NestHelper icon" width={54} height={54} className="h-12 w-12 object-contain" priority />
          <div className="leading-tight">
            <div className="text-xl font-black tracking-tight text-nest-teal sm:text-2xl">NestHelper</div>
            <div className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-nest-gold">Parent Reset</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-bold text-nest-ink/80 transition hover:text-nest-teal">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/request" className="rounded-full bg-nest-teal px-5 py-3 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2">
            Request Help
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="focus-ring rounded-full border border-nest-teal/15 bg-white/70 p-3 text-nest-teal lg:hidden" aria-label="Open menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-nest-gold/15 bg-nest-cream px-4 pb-5 pt-2 shadow-soft lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2" aria-label="Mobile navigation">
            <Link onClick={() => setOpen(false)} href="/" className="rounded-xl px-4 py-3 font-bold text-nest-ink hover:bg-white">Home</Link>
            {nav.map((item) => (
              <Link key={item.href} onClick={() => setOpen(false)} href={item.href} className="rounded-xl px-4 py-3 font-bold text-nest-ink hover:bg-white">
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
