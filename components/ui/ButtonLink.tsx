import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const classes = variant === "primary"
    ? "bg-nest-teal text-white hover:bg-nest-teal2 shadow-soft"
    : "bg-white/80 text-nest-teal border border-nest-teal/15 hover:bg-white shadow-sm";
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-black transition hover:-translate-y-0.5 ${classes}`}>
      {children} <ArrowRight size={18} />
    </Link>
  );
}
