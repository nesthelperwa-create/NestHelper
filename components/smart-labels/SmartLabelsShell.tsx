"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageSearch, ScanLine, Layers3, UserCircle2 } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const navItems = [
  { href: "/my-labels", label: "My Labels", icon: <ScanLine size={16} /> },
  { href: "/my-labels/sets", label: "Label Sets", icon: <Layers3 size={16} /> },
  { href: "/my-labels/find", label: "Find My Item", icon: <PackageSearch size={16} /> },
  { href: "/my-labels/account", label: "Account", icon: <UserCircle2 size={16} /> },
];

export function SmartLabelsShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#fbf6ea] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-nest-gold/16 bg-white shadow-soft">
          <div className="border-b border-nest-gold/12 bg-gradient-to-br from-white via-nest-cream to-nest-mint/20 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Image src={siteConfig.assets.logo} alt="NestHelper" width={190} height={60} className="h-auto w-40" priority />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-nest-gold">Smart Labels</p>
                  <h1 className="text-2xl font-black text-nest-teal sm:text-3xl">{title}</h1>
                  <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{subtitle}</p>
                </div>
              </div>
              <div className="inline-flex items-center justify-center rounded-full border border-nest-teal/12 bg-white px-4 py-2 text-sm font-black text-nest-teal shadow-sm">Built for quick phone scanning</div>
            </div>
          </div>

          <nav className="border-b border-nest-gold/12 bg-white/90 px-4 py-3 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/50 ${active ? "bg-nest-teal text-white shadow-lg shadow-[#075c58]/18 hover:-translate-y-0.5 hover:bg-nest-teal3 hover:shadow-xl" : "border border-nest-gold/20 bg-white text-nest-teal shadow-sm hover:-translate-y-0.5 hover:border-nest-teal/30 hover:bg-nest-mint/30 hover:shadow-md"}`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
