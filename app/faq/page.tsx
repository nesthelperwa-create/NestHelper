import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Household Help FAQ: Home Reset, Laundry & Errands",
  description:
    "Answers about NestHelper household help, home resets, simple in-home meal prep support, kitchen and bath resets, garage and area resets, move-in / move-out cleaning, laundry, errands, organizing, pricing, safety, and no-childcare service boundaries.",
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
  openGraph: {
    title: "Household Help FAQ | NestHelper",
    description:
      "Learn how NestHelper household support, home reset help, simple in-home meal prep support, kitchen and bath resets, move-in / move-out cleaning, laundry help, organizing, and errands work for busy families.",
    url: `${siteConfig.url}/faq`,
    images: [siteConfig.assets.og],
  },
};

const faqs = [
  ["What does NestHelper help with?", "NestHelper gives busy families extra hands around the home with Parent Reset Plan visits, optional simple in-home meal prep support, whole-home cleaning, kitchen and bath resets, garage and area resets, move-in / move-out cleaning, laundry rescue, errands, organizing, and practical family support. We do not provide childcare, unsupervised babysitting, medical care, elder care, or emergency services."],
  ["Do you serve outside Bothell?", `Yes. NestHelper serves ${siteConfig.serviceArea}. If you are close by but unsure, submit a request and we will confirm availability before sending any payment link.`],
  ["Which service should I choose for whole-home cleaning, selected rooms, or moving?", "Choose Parent Reset Plan for a 3-hour busy-parent reset in selected family spaces with organizing, light cleaning, and child-safe disinfecting. Choose Whole Home Cleaning for the entire home, first-time deep cleans, first-time deep clean plus recurring maintenance, or weekly, bi-weekly, and monthly full-home support. Choose Specific Area(s) Reset when you only need selected rooms or focused areas such as kitchen, bathroom(s), pantry, fridge, oven, laundry area, garage, or a few rooms. Choose Move-In / Move-Out Cleaning for empty or mostly empty homes before moving in, after moving out, or before listing/renting."],
  ["What are NestHelper Smart Labels?", "Smart Labels are customer-owned QR stickers that may be included with qualifying resets. Families can use them for bins, closets, shelves, moving boxes, seasonal items, garages, storage areas, pantries, and playrooms. A family can scan a label to update the name, location, items inside, notes, and small photos. Labels start with no PIN by default, and the family can add an optional 4-digit PIN later for privacy."],
  ["What is Smart Label Setup?", "Smart Label Setup is an optional add-on when you want NestHelper to do more than leave starter labels with you. Setup has simple package prices: Starter setup up to 10 labels is $49, Standard setup up to 20 labels is $79, and Full setup up to 30 labels is $109. Larger inventories, garage setups, extra labels, or photo-heavy documentation can be quoted after review."],
  ["Do you offer meal prep?", "Meal prep support is available as an optional Parent Reset Plan priority, but it is simple and in-home only. Examples include washing or chopping vegetables and fruit, portioning snacks, prepping simple ingredients, or organizing prepared items in the customer’s containers. NestHelper uses the customer’s food, kitchen, tools, containers, and instructions. We do not provide catering, private-chef service, full meal cooking, off-site food prep, nutrition planning, medical dietary decisions, or food purchased/prepared by NestHelper."],
  ["Is this childcare?", "No. NestHelper provides household support, including Parent Reset Plan visits, only. We do not provide childcare, unsupervised babysitting, medical care, elder care, or emergency services."],
  ["Why do you review requests before payment?", "We review location, scope, availability, safety, pets, access, and pricing first so customers are not charged for a job we cannot safely or reliably fulfill."],
  ["Why does NestHelper cost more than hiring someone from a local group?", "NestHelper is not trying to be the cheapest option or an open marketplace. Pricing reflects a managed service: request review, helper fit, clear scope, scheduling coordination, insured local service, secure payment, and follow-up after service."],
  ["Do recurring resets bill automatically?", "Not by default. Whole Home Cleaning can include weekly, bi-weekly, or monthly maintenance requests after review, while Specific Area(s) Reset uses repeat area support for selected rooms only. NestHelper still reviews each recurring or repeat-support payment before sending it so families are not auto-charged for a visit that has not been confirmed."],
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
