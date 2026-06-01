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
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (!active) return;
      setUser(currentUser);
      setAccessDenied(false);

      if (!currentUser) {
        setLoading(false);
        router.replace("/admin/login");
        return;
      }

      setCheckingAccess(true);
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json().catch(() => null);
        if (!active) return;

        if (!response.ok || !result?.authorized) {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error("Unable to verify admin access", error);
        if (active) setAccessDenied(true);
      } finally {
        if (active) {
          setCheckingAccess(false);
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  if (loading || checkingAccess) {
    return <div className="min-h-screen bg-[#fbf6ea] p-8 text-[#075c58]">Verifying NestHelper Admin access...</div>;
  }

  if (accessDenied) {
    return (
      <main className="min-h-screen bg-[#fbf6ea] px-4 py-10 text-slate-900">
        <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center">
          <div className="rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-900/5">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-rose-600">Access denied</p>
            <h1 className="mt-3 text-3xl font-bold text-[#075c58]">This admin account is not authorized.</h1>
            <p className="mt-3 text-slate-600">
              The admin dashboard is limited to emails listed in NestHelper&apos;s server-side ADMIN_EMAILS setting.
            </p>
            <button
              onClick={async () => {
                await signOut(firebaseAuth).catch(() => undefined);
                router.replace("/admin/login");
              }}
              className="mt-6 rounded-full bg-[#075c58] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01]"
            >
              Sign out and return to admin login
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fbf6ea] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-[#eadfc8] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
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
        <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-3 pb-3 sm:px-4">
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
      <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-3 py-6 sm:px-4 sm:py-8">{children}</main>
    </div>
  );
}
