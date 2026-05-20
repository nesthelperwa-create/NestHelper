export const dynamic = "force-dynamic";

"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      router.push("/admin");
    } catch (err) {
      setError("Login failed. Check your email/password and make sure this admin account exists in Firebase Auth.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf6ea] px-4 py-10 text-slate-900">
      <div className="mx-auto grid min-h-[80vh] max-w-5xl place-items-center">
        <div className="w-full max-w-md rounded-[2rem] border border-[#eadfc8] bg-white p-8 shadow-2xl shadow-[#075c58]/10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#b98a2f]">NestHelper LLC</p>
          <h1 className="mt-2 text-3xl font-bold text-[#075c58]">Admin Login</h1>
          <p className="mt-2 text-slate-600">Private dashboard for service requests and applications.</p>
          <form onSubmit={login} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded-2xl border border-[#eadfc8] px-4 py-3 outline-none focus:border-[#075c58]" />
            </label>
            {error && <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <button disabled={loading} className="w-full rounded-full bg-[#075c58] px-5 py-3 font-bold text-white shadow-lg shadow-[#075c58]/20 transition hover:scale-[1.01] disabled:opacity-60">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

