import type { Metadata } from "next";
import { Building2, CheckCircle2, Gift, Heart, Home, MessageCircle, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Giving Back | NestHelper",
  description:
    "Learn how NestHelper plans to give back through local churches, nonprofits, schools, community organizations, and useful family-item support for families going through hard seasons.",
  alternates: {
    canonical: `${siteConfig.url}/giving-back`,
  },
  openGraph: {
    title: "Giving Back | NestHelper",
    description:
      "NestHelper is building a community giving lane for churches, nonprofits, schools, local organizations, and useful family-item support.",
    url: `${siteConfig.url}/giving-back`,
    images: [siteConfig.assets.og],
  },
};

const givingWays = [
  {
    icon: <Building2 size={22} />,
    title: "Support churches and local organizations",
    text: "As the business grows, our goal is to support trusted churches, nonprofits, schools, and community groups already serving families nearby.",
  },
  {
    icon: <Gift size={22} />,
    title: "Help useful family items reach families",
    text: "When we can responsibly coordinate it, NestHelper may accept gently used toys and practical family items to help pass them along to families who need support.",
  },
  {
    icon: <Home size={22} />,
    title: "Give practical relief to families",
    text: "The heart behind NestHelper is practical relief: lighter homes, fewer overwhelming tasks, and local support for families going through a hard season.",
  },
];

const howItWorks = [
  "Tell us what you want to offer, donate, or connect us with.",
  "NestHelper reviews whether it fits our current community-support capacity.",
  "If it is a fit, we coordinate the next step before anything is dropped off or picked up.",
  "Your message is tracked in the NestHelper admin dashboard so it does not get lost in texts or DMs.",
];

export default function GivingBackPage() {
  return (
    <>
      <PageHero
        eyebrow="Giving Back"
        title="Helping families beyond the booking."
        text="NestHelper is a local household-support business with a heart for families, churches, schools, nonprofits, and community organizations. This giving-back lane is still growing, but the goal is simple: serve families well and help useful support reach the people who need it."
        ctaHref="/contact?topic=giving-back#contact-form"
        ctaLabel="Be part of giving back"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.5rem] border border-nest-gold/14 bg-white/86 p-5 shadow-soft backdrop-blur sm:p-8 lg:p-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="pill-label mx-auto w-fit"><Heart size={15} /> Community Mission</p>
            <h2 className="mt-4 text-balance text-3xl font-black leading-tight text-nest-teal sm:text-5xl">
              Built to serve families and strengthen the community around them.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-nest-ink/70 sm:text-lg sm:leading-8">
              We are not trying to create more work for families or for NestHelper. The plan is to keep this simple, track requests in one place, and only coordinate giving opportunities we can responsibly handle.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {givingWays.map((item) => (
              <div key={item.title} className="rounded-[1.9rem] border border-nest-gold/12 bg-nest-cream p-5 shadow-sm">
                <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-nest-teal shadow-sm">{item.icon}</div>
                <h3 className="text-xl font-black text-nest-teal">{item.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-nest-ink/68">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="soft-section px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-[2.5rem] border border-nest-gold/14 bg-white/88 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><MessageCircle size={15} /> How to help</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-nest-teal sm:text-4xl">
              Have items, a church contact, or an organization we should know about?
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-nest-ink/70">
              Use the contact form to tell us what you have in mind. Examples include gently used toys, family items, a church or nonprofit contact, a school/community program, or a family-support idea that may fit NestHelper later.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact?topic=giving-back#contact-form">Contact us about giving back</ButtonLink>
              <ButtonLink href="/contact" variant="secondary">General contact</ButtonLink>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-nest-gold/14 bg-white/88 p-6 shadow-soft sm:p-8">
            <p className="pill-label w-fit"><ClipboardIcon /> Simple process</p>
            <div className="mt-5 grid gap-3">
              {howItWorks.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-nest-gold/12 bg-nest-cream p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nest-teal text-sm font-black text-white shadow-sm">{index + 1}</div>
                  <p className="text-sm font-semibold leading-6 text-nest-ink/72">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-nest-gold/14 bg-nest-mint/18 p-5 text-center shadow-sm sm:p-7 lg:p-8">
          <p className="pill-label mx-auto w-fit"><ShieldCheck size={15} /> A careful start</p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-nest-teal sm:text-3xl">
            Please contact us before dropping off or sending items.
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm font-semibold leading-6 text-nest-ink/70 sm:text-base sm:leading-7">
            We are still building this program, so availability depends on storage, helper coverage, item condition, and whether we have a responsible way to connect items with families or organizations. NestHelper is not a nonprofit donation center, and any tax-deduction questions should be handled through a qualified organization or tax professional.
          </p>
        </div>
      </section>
    </>
  );
}

function ClipboardIcon() {
  return <CheckCircle2 size={15} />;
}
