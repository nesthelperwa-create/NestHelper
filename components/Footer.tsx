import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";
import { policies } from "@/lib/policies";

export function Footer() {
  return (
    <footer className="teal-gradient mt-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image src={siteConfig.assets.icon} alt="NestHelper icon" width={64} height={64} className="h-14 w-14 object-contain" />
            <div>
              <div className="text-3xl font-black">NestHelper</div>
              <div className="font-bold uppercase tracking-[0.25em] text-nest-gold2">Parent Reset</div>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-white/82">
            Reset the home. Reclaim the day. Trusted local help for busy parents — coordinated with care, clear standards, and follow-up.
          </p>
          <p className="mt-4 text-sm text-white/70">
            NestHelper provides household support and parent reset services. We do not provide licensed childcare, unsupervised babysitting, medical care, elder care, emergency services, or legal/financial advice.
          </p>
        </div>

        <FooterColumn
          title="Company"
          links={[
            { href: "/", label: "Home" },
            { href: "/services", label: "Services & Pricing" },
            { href: "/trust", label: "Trust & Safety" },
            { href: "/faq", label: "FAQ" },
            { href: "/contact", label: "Contact" }
          ]}
        />

        <FooterColumn
          title="For Families"
          links={[
            { href: "/request", label: "Request Help" },
            { href: "/checkout", label: "Checkout Flow" },
            { href: "/services#laundry", label: "Laundry Rescue" },
            { href: "/policies", label: "All Policies" }
          ]}
        />

        <div>
          <h3 className="font-black text-nest-gold2">Policies</h3>
          <div className="mt-4 grid gap-2 text-sm">
            {policies.map((policy) => (
              <Link key={policy.slug} href={`/policies/${policy.slug}`} className="text-white/80 transition hover:text-white">
                {policy.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/12 px-4 py-5 text-center text-sm text-white/70">
        © {new Date().getFullYear()} NestHelper LLC. All rights reserved. Serving {siteConfig.serviceArea}.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="font-black text-nest-gold2">{title}</h3>
      <div className="mt-4 grid gap-2 text-sm">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-white/80 transition hover:text-white">
            {link.label}
          </Link>
        ))}
        {title === "Company" && (
          <Link href="/helpers" className="text-white/80 transition hover:text-white">
            Become a Helper
          </Link>
        )}
      </div>
    </div>
  );
}
