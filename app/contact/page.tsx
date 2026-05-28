import { Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { CopyEmailButton } from "@/components/CopyEmailButton";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { siteConfig } from "@/lib/siteConfig";

const contactRoutes = [
  {
    label: "General questions",
    email: siteConfig.email,
    text: "Start here if you are not sure who should receive your message.",
  },
  {
    label: "Customer support",
    email: siteConfig.emails.support,
    text: "Use this for existing requests, follow-up questions, or service concerns.",
  },
  {
    label: "Billing",
    email: siteConfig.emails.billing,
    text: "Use this for checkout links, invoices, deposits, and payment questions.",
  },
  {
    label: "Laundry Rescue",
    email: siteConfig.emails.laundry,
    text: "Use this for laundry pickup, return bags, add-ons, and final-balance questions.",
  },
  {
    label: "Helpers",
    email: siteConfig.emails.helpers,
    text: "Use this for individual helper application questions.",
  },
  {
    label: "Partners",
    email: siteConfig.emails.partners,
    text: "Use this for local provider or contractor partnership questions.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Questions before you request?"
        text="Send a note and we’ll help you figure out the right Parent Reset service. Most families can start with hello@nesthelperwa.com or the contact form."
        cta={false}
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="self-start rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-6 shadow-soft backdrop-blur lg:sticky lg:top-28">
          <p className="pill-label w-fit"><Sparkles size={15} /> We can help</p>
          <h2 className="mt-4 text-3xl font-black text-nest-teal">Not sure what to request?</h2>
          <p className="mt-3 font-medium leading-7 text-nest-ink/70">
            Ask a question first. We’ll point you toward the right package or explain what is outside NestHelper’s service scope.
          </p>
          <div className="mt-6 grid gap-4">
            <Info icon={<Mail />} label="Main email">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="break-all font-black text-nest-teal underline decoration-nest-gold/40 underline-offset-4 hover:decoration-nest-gold"
                >
                  {siteConfig.email}
                </a>
                <CopyEmailButton email={siteConfig.email} />
              </div>
            </Info>

            <Info icon={<Phone />} label="Phone">
              <a
                href={siteConfig.phoneHref}
                className="font-black text-nest-teal underline decoration-nest-gold/40 underline-offset-4 hover:decoration-nest-gold"
              >
                {siteConfig.phone}
              </a>
            </Info>

            <Info icon={<MapPin />} label="Serving">
              <div className="font-bold text-nest-ink/78">{siteConfig.serviceArea}</div>
            </Info>
          </div>
        </div>

        <ContactForm />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-6 shadow-soft sm:p-8">
          <div className="max-w-3xl">
            <p className="pill-label w-fit"><Mail size={15} /> Contact routes</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal">Use one main email, with specific inboxes when helpful.</h2>
            <p className="mt-3 font-medium leading-7 text-nest-ink/70">
              You do not need to memorize these. The contact form routes messages for you, but these addresses are available for direct replies and specific questions.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contactRoutes.map((route) => (
              <a key={route.email} href={`mailto:${route.email}`} className="group rounded-3xl border border-nest-gold/14 bg-nest-cream p-5 transition hover:-translate-y-0.5 hover:border-nest-gold/35 hover:shadow-sm">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-nest-gold">{route.label}</div>
                <div className="mt-2 break-all text-lg font-black text-nest-teal underline decoration-nest-gold/30 underline-offset-4 group-hover:decoration-nest-gold">{route.email}</div>
                <p className="mt-3 text-sm font-medium leading-6 text-nest-ink/66">{route.text}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Info({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl bg-nest-cream p-4">
      <div className="shrink-0 text-nest-teal">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-sm font-black uppercase tracking-[0.18em] text-nest-gold">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}
