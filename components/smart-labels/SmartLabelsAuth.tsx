"use client";

import Link from "next/link";
import { FirebaseError } from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, LogOut, Mail, UserRoundPlus } from "lucide-react";
import { firebaseAuth } from "@/lib/firebaseClient";

export function useCustomerAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (nextUser) => {
        if (active) setUser(nextUser);
      },
      (error) => {
        console.error("Firebase Authentication could not initialize.", error);
        if (active) setUser(null);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Show the sign-in experience immediately while Firebase restores any
  // existing session in the background.
  return { user, loading: false };
}

export async function getUserToken(user: User | null) {
  if (!user) return "";
  return user.getIdToken();
}

type CustomerAuthCardProps = {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

function getFriendlyAuthError(error: unknown, mode: "sign-in" | "create" | "reset") {
  const code = error instanceof FirebaseError ? error.code : "";

  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account already exists for this email. Sign in instead.";
    case "auth/weak-password":
      return "Create a password with at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts were made. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "The sign-in service could not be reached. Check your connection and try again.";
    case "auth/unauthorized-domain":
      return "This website address is not authorized for sign-in yet.";
    case "auth/operation-not-allowed":
      return "Email and password sign-in is not enabled yet.";
    default:
      if (mode === "reset") return "We could not send the reset email. Check the address and try again.";
      if (mode === "create") return "We could not create the account. Try signing in if the account already exists.";
      return "Sign in failed. Check your email and password and try again.";
  }
}

export function CustomerAuthCard({
  title = "Sign in to your Smart Label dashboard",
  subtitle = "Create an account or sign in to activate your label pack and manage your labels.",
  compact = false,
  onSuccess,
}: CustomerAuthCardProps) {
  const [mode, setMode] = useState<"sign-in" | "create" | "reset">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (busy) return;

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Enter your email address.");
      return;
    }
    if (mode !== "reset" && !password) {
      setError("Enter your password.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      // Keep the customer signed in between scans when the browser permits it.
      // Continue with the authentication attempt even if local persistence is
      // unavailable in a private browser or local network test.
      await setPersistence(firebaseAuth, browserLocalPersistence).catch((persistenceError) => {
        console.warn("Firebase local persistence is unavailable.", persistenceError);
      });

      if (mode === "create") {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        await credential.user.getIdToken(true);
        const verificationSent = await sendEmailVerification(credential.user)
          .then(() => true)
          .catch((verificationError) => {
            console.warn("Smart Labels verification email could not be sent automatically.", verificationError);
            return false;
          });
        setMessage(verificationSent
          ? "Account created. Check your inbox to verify your email address."
          : "Account created. You are signed in. If you need to migrate an older label, use the verification option on that label page.");
        onSuccess?.();
      } else if (mode === "sign-in") {
        const credential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        await credential.user.getIdToken(true);
        setMessage("Signed in successfully.");
        onSuccess?.();
      } else {
        await sendPasswordResetEmail(firebaseAuth, cleanEmail);
        setMessage("Password reset email sent. Check your inbox.");
      }
    } catch (authError) {
      console.error("Smart Labels authentication failed.", authError);
      setError(getFriendlyAuthError(authError, mode));
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || busy) return;
    event.preventDefault();
    void handleSubmit();
  }

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-nest-gold">NestHelper Smart Labels</p>
      <h2 className="mt-2 whitespace-normal break-words text-2xl font-black leading-tight text-nest-teal">{title}</h2>
      <p className="mt-2 max-w-xl whitespace-normal break-words text-sm font-semibold leading-6 text-slate-600">{subtitle}</p>

      <div className="mt-5 grid min-w-0 gap-3" role="form" aria-label={title}>
        <label className="grid gap-2">
          <span className="text-sm font-black text-nest-teal">Email</span>
          <input
            className="input"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
          />
        </label>

        {mode !== "reset" && (
          <label className="grid gap-2">
            <span className="text-sm font-black text-nest-teal">Password</span>
            <input
              className="input"
              type="password"
              autoComplete={mode === "create" ? "new-password" : "current-password"}
              placeholder={mode === "create" ? "Create a password" : "Enter your password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={busy}
            />
          </label>
        )}

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSubmit()}
          className="btn-primary w-full min-w-0 justify-center whitespace-normal text-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="animate-spin" size={18} />
          ) : mode === "create" ? (
            <UserRoundPlus size={18} />
          ) : mode === "reset" ? (
            <Mail size={18} />
          ) : (
            <KeyRound size={18} />
          )}
          {mode === "create" ? "Create account" : mode === "reset" ? "Send reset email" : "Sign in"}
        </button>

        {mode === "create" && (
          <p className="text-xs font-semibold leading-5 text-slate-500">
            By creating an account, you agree to the{" "}
            <Link href="/policies/terms-of-service" className="font-black text-nest-teal underline underline-offset-2">Terms of Service</Link>,{" "}
            <Link href="/policies/privacy-policy" className="font-black text-nest-teal underline underline-offset-2">Privacy Policy</Link>, and{" "}
            <Link href="/policies/smart-label-policy" className="font-black text-nest-teal underline underline-offset-2">Smart Label Policy</Link>.
          </p>
        )}
      </div>

      <div className={`mt-4 flex min-w-0 ${compact ? "flex-col" : "flex-wrap"} gap-3 whitespace-normal break-words text-sm font-black text-nest-teal`}>
        {mode !== "sign-in" && (
          <button
            type="button"
            className="cursor-pointer rounded-md px-1 py-0.5 text-left underline decoration-nest-gold/45 underline-offset-4 transition-colors hover:text-nest-teal2 hover:decoration-nest-teal2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45"
            onClick={() => {
              setMode("sign-in");
              setError("");
              setMessage("");
            }}
          >
            Already have an account? Sign in
          </button>
        )}
        {mode !== "create" && (
          <button
            type="button"
            className="cursor-pointer rounded-md px-1 py-0.5 text-left underline decoration-nest-gold/45 underline-offset-4 transition-colors hover:text-nest-teal2 hover:decoration-nest-teal2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45"
            onClick={() => {
              setMode("create");
              setError("");
              setMessage("");
            }}
          >
            New here? Create an account
          </button>
        )}
        {mode !== "reset" && (
          <button
            type="button"
            className="cursor-pointer rounded-md px-1 py-0.5 text-left underline decoration-nest-gold/45 underline-offset-4 transition-colors hover:text-nest-teal2 hover:decoration-nest-teal2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45"
            onClick={() => {
              setMode("reset");
              setError("");
              setMessage("");
            }}
          >
            Forgot password?
          </button>
        )}
      </div>
    </section>
  );
}

export function SignedInBadge({ user }: { user: User }) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await signOut(firebaseAuth);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-nest-gold/18 bg-white px-4 py-3 shadow-sm sm:w-auto">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Signed in</p>
      <p className="mt-1 max-w-full break-all text-sm font-black text-nest-teal">{user.email}</p>
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-nest-teal/18 bg-white px-3 py-2 text-xs font-black text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-nest-teal/35 hover:bg-nest-mint/30 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="animate-spin" size={14} /> : <LogOut size={14} />} Sign out
      </button>
    </div>
  );
}
