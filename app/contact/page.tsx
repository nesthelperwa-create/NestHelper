import type { Metadata } from "next";
import { Phone, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { siteConfig } from "@/lib/siteConfig";
import { SocialLinks } from "@/components/SocialLinks";

export const metadata: Metadata = {
  title: "Contact NestHelper | Household Help Questions",
  description:
    "Contact NestHelper about household help, Commercial Reset, helper applications, giving back, or service availability.",
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
  openGraph: {
    title: "Contact NestHelper",
    description:
      "Ask NestHelper about household help, laundry rescue, errands, organizing, Commercial Reset, or service availability.",
    url: `${siteConfig.url}/contact`,
    images: [siteConfig.assets.og],
  },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Questions before you request?"
        text="Send a note and we’ll help you figure out the right NestHelper service or next step. Choose the topic in the form so your message goes to the right NestHelper inbox behind the scenes."
        cta={false}
      />

      <section id="contact-form" className="scroll-mt-24 mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="self-start rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-6 text-center shadow-soft backdrop-blur lg:sticky lg:top-28">
          <p className="pill-label mx-auto w-fit"><Sparkles size={15} /> We can help</p>
          <h2 className="mt-4 text-3xl font-black text-nest-teal">Not sure what to request?</h2>
          <p className="mt-3 font-medium leading-7 text-nest-ink/70">
            Ask a question first. We’ll point you toward the right package or explain what is outside NestHelper’s service scope.
          </p>
          <div className="mt-6 grid gap-4">
            <Info icon={<Phone />} label="Phone">
              <a
                href={siteConfig.phoneHref}
                className="font-black text-nest-teal underline decoration-nest-gold/40 underline-offset-4 hover:decoration-nest-gold"
              >
                {siteConfig.phone}
              </a>
            </Info>


            <Info icon={<Sparkles />} label="Social media">
              <SocialLinks />
            </Info>
          </div>
        </div>

        <ContactForm />
      </section>
    </>
  );
}

function Info({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="group flex gap-4 rounded-2xl bg-nest-cream p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-nest-teal shadow-sm transition group-hover:bg-nest-teal group-hover:text-white">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-sm font-black uppercase tracking-[0.18em] text-nest-gold">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}
