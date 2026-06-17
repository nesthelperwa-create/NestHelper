"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const nav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/commercial-reset", label: "Commercial" },
  { href: "/trust", label: "Trust" },
  { href: "/helpers", label: "Helpers" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 8);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <header
      className={`sticky top-0 z-[60] border-b border-nest-gold/15 bg-[#fffaf2]/95 backdrop-blur-2xl transition-shadow duration-200 ${
        scrolled ? "shadow-[0_14px_40px_rgba(0,93,86,0.12)]" : "shadow-none"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex min-w-0 items-center gap-2 rounded-2xl sm:gap-3" aria-label="NestHelper home">
          <Image
            src={siteConfig.assets.icon}
            alt="NestHelper icon"
            width={52}
            height={52}
            className="h-10 w-10 shrink-0 object-contain drop-shadow-sm sm:h-11 sm:w-11"
            priority
          />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-lg font-black tracking-tight text-nest-teal sm:text-2xl">NestHelper</div>
            <div className="hidden text-[0.62rem] font-black uppercase tracking-[0.22em] text-nest-gold min-[380px]:block sm:text-[0.70rem] sm:tracking-[0.28em]">
              Parent Reset
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-nest-gold/15 bg-white/65 p-1 shadow-sm lg:flex" aria-label="Main navigation">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm font-black transition xl:px-4 ${
                  active ? "bg-nest-teal text-white shadow-sm" : "text-nest-ink/72 hover:bg-nest-mint/35 hover:text-nest-teal"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/request"
            className="focus-ring rounded-full bg-nest-teal px-3.5 py-2.5 text-xs font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift sm:px-5 sm:text-sm"
          >
            Request Help
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="focus-ring rounded-full border border-nest-teal/15 bg-white/85 p-2.5 text-nest-teal shadow-sm lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-nest-gold/15 bg-[#fffaf2] px-4 pb-5 pt-2 shadow-soft lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2" aria-label="Mobile navigation">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  onClick={() => setOpen(false)}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 font-black transition ${
                    active ? "bg-nest-teal text-white" : "text-nest-ink hover:bg-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
