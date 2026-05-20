"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/helpers", label: "Helpers" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/contact", label: "Contact" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) router.replace("/admin/login");
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-[#fbf6ea] p-8 text-[#075c58]">Loading NestHelper Admin...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fbf6ea] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-[#eadfc8] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b98a2f]">NestHelper LLC</p>
            <h1 className="text-2xl font-bold text-[#075c58]">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Signed in as {user.email}</p>
          </div>
          <button
            onClick={() => signOut(firebaseAuth)}
            className="rounded-full border border-[#075c58]/20 px-4 py-2 text-sm font-semibold text-[#075c58] transition hover:bg-[#075c58] hover:text-white"
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                pathname === link.href ? "bg-[#075c58] text-white shadow" : "bg-white text-[#075c58] hover:bg-[#e9f4f1]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
