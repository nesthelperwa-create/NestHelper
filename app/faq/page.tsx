import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Household Help FAQ: Home Reset, Laundry & Errands",
  description:
    "Answers about NestHelper household support, home reset services, Laundry Rescue, errands, organizing, pricing, trust standards, and no-childcare scope for Bothell, Woodinville, Kenmore, Kirkland, Redmond, Mill Creek, and nearby Eastside/Northshore families.",
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
  openGraph: {
    title: "Household Help FAQ | NestHelper",
    description:
      "Learn how NestHelper household support, home reset help, laundry help, organizing, and errands work for busy families.",
    url: `${siteConfig.url}/faq`,
    images: [siteConfig.assets.og],
  },
};

const faqs = [
  ["What does NestHelper help with?", "NestHelper gives busy families extra hands around the home with household support, home resets, laundry rescue, errands, organizing, and practical family support. We do not provide childcare, unsupervised babysitting, medical care, elder care, or emergency services."],
  ["Do you serve outside Bothell?", `Yes. NestHelper serves ${siteConfig.serviceArea}. If you are close by but unsure, submit a request and we will confirm availability before sending any payment link.`],
  ["Can I request home reset help, laundry help, or errand help separately?", "Yes. You can request a full Parent Reset package or a more focused service such as Laundry Rescue, approved errands, or light household catch-up support."],
  ["Is this childcare?", "No. NestHelper provides household support and Parent Reset services only. We do not provide childcare, unsupervised babysitting, medical care, elder care, or emergency services."],
  ["Why do you review requests before payment?", "We review location, scope, availability, safety, pets, access, and pricing first so customers are not charged for a job we cannot safely or reliably fulfill."],
  ["Why does NestHelper cost more than hiring someone from a local group?", "NestHelper is not trying to be the cheapest option or an open marketplace. Pricing reflects a managed service: request review, helper fit, clear scope, scheduling coordination, insured local service, secure payment, and follow-up after service."],
  ["Do recurring resets bill automatically?", "Not by default. First resets are standard price. After a completed first visit, eligible families may request weekly or every-other-week recurring rates when the schedule, scope, service area, and helper fit are consistent. NestHelper still reviews each recurring payment before sending it so families are not auto-charged for a visit that has not been confirmed."],
  ["Why is availability limited?", "NestHelper is growing carefully and accepts a limited number of family requests at a time. That helps us protect service quality, avoid overbooking, and make sure each request has the right scope, timing, area, and helper fit before payment."],
  ["How does laundry pricing work?", "Laundry Rescue starts with a non-refundable minimum deposit that is credited before tax toward the final total. Laundry is weighed dry at pickup, add-ons are applied, and the final balance is handled by the option selected during checkout: auto-charge after review or final invoice before delivery."],
  ["Do I return the laundry bags?", "Yes. If NestHelper returns clean laundry in reusable NestHelper bags or totes, please empty and return them at your next Laundry Rescue pickup, scheduled drop-off, or another approved return method. Missing or damaged reusable bags may be billed a reasonable replacement fee."],
  ["Will I see the total before I pay?", "Yes. Any approved payment link or invoice will show the amount due before you submit payment. If tax or approved add-ons apply, they will be shown before checkout is completed."],
  ["Can I use a promo code?", "Yes. If NestHelper gave you a promo or referral code, enter it on the request form. We will review the code before sending your checkout link."],
  ["Are helpers background checked?", "Gold Star Checked helpers complete screening steps such as identity review, third-party background screening, reference review, and service standards. Partner providers are vetted as businesses."],
  ["What if something is missed?", "Contact us within 24 hours. If something within the agreed scope was missed, we’ll review and may offer a correction, credit, partial refund, or other resolution when appropriate."],
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PageHero eyebrow="FAQ" title="Clear answers before you request help." text="Simple policies, clear expectations, and answers to common pricing, trust, laundry, and service-scope questions." />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-3xl border border-nest-gold/12 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold/28 open:shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-black text-nest-teal">
                {q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nest-cream text-nest-gold transition group-hover:bg-nest-teal group-hover:text-white group-open:rotate-45 group-open:bg-nest-teal group-open:text-white">+</span>
              </summary>
              <p className="mt-4 leading-7 text-nest-ink/72">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
