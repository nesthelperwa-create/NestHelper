import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const classes =
    variant === "primary"
      ? "bg-nest-teal text-white hover:bg-nest-teal2 shadow-soft hover:shadow-lift"
      : variant === "secondary"
        ? "bg-white text-nest-teal border border-nest-teal/15 hover:border-nest-gold/45 hover:bg-white shadow-sm hover:shadow-soft"
        : "bg-transparent text-nest-teal hover:bg-white/70";

  return (
    <Link
      href={href}
      className={`focus-ring group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black transition duration-200 hover:-translate-y-0.5 sm:text-base ${classes}`}
    >
      {children}
      <ArrowRight size={18} className="transition duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
