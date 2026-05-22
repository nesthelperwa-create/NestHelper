import { Mail, MapPin, Phone } from "lucide-react";
import { CopyEmailButton } from "@/components/CopyEmailButton";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { siteConfig } from "@/lib/siteConfig";

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Questions before you request?"
        text="Send a note and we’ll help you figure out the right Parent Reset service."
        cta={false}
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="grid gap-4 self-start rounded-[2rem] bg-white p-6 shadow-soft">
          <Info icon={<Mail />} label="Email">
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

        <ContactForm />
      </section>
    </>
  );
}

function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
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
