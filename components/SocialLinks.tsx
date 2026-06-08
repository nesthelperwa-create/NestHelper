import type { SVGProps } from "react";
import { siteConfig } from "@/lib/siteConfig";

type SocialLinksProps = {
  variant?: "light" | "dark";
  showLabel?: boolean;
  className?: string;
};

const socialIconMap = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
} as const;

const socialButtonStyles = {
  Facebook: {
    light:
      "border-[#1877F2]/20 bg-white text-[#1877F2] shadow-sm hover:border-[#1877F2]/40 hover:bg-[#1877F2] hover:text-white hover:shadow-lift",
    dark:
      "border-white/16 bg-white text-[#1877F2] shadow-sm hover:border-[#1877F2]/60 hover:bg-[#1877F2] hover:text-white hover:shadow-lift",
  },
  Instagram: {
    light:
      "border-white/70 bg-[linear-gradient(135deg,#833AB4_0%,#C13584_35%,#E1306C_62%,#FCAF45_100%)] text-white shadow-sm hover:brightness-110 hover:shadow-lift",
    dark:
      "border-white/16 bg-[linear-gradient(135deg,#833AB4_0%,#C13584_35%,#E1306C_62%,#FCAF45_100%)] text-white shadow-sm hover:brightness-110 hover:shadow-lift",
  },
} as const;

export function SocialLinks({ variant = "light", showLabel = false, className = "" }: SocialLinksProps) {
  const isDark = variant === "dark";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      {showLabel && (
        <span className={isDark ? "mr-1 text-xs font-black uppercase tracking-[0.18em] text-nest-gold2" : "mr-1 text-xs font-black uppercase tracking-[0.18em] text-nest-gold"}>
          Follow us
        </span>
      )}

      {siteConfig.socialLinks.map((link) => {
        const Icon = socialIconMap[link.name as keyof typeof socialIconMap];
        const platformStyle = socialButtonStyles[link.name as keyof typeof socialButtonStyles];
        const colorClass = platformStyle?.[variant] ?? (isDark ? "border-white/14 bg-white/10 text-white hover:bg-white hover:text-nest-teal" : "border-nest-gold/18 bg-white/80 text-nest-teal hover:bg-nest-teal hover:text-white");

        return (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.name}
            className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5 ${colorClass}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.02 3.66 9.19 8.44 9.94v-7.03H7.92v-2.91h2.52V9.84c0-2.49 1.48-3.86 3.75-3.86 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.24 0-1.62.77-1.62 1.55v1.88h2.76l-.44 2.91h-2.32V22C18.34 21.25 22 17.08 22 12.06Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
