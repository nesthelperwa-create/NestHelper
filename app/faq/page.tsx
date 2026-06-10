import { PageHero } from "@/components/PageHero";

const faqs = [
  ["Is this childcare?", "No. NestHelper provides household support and parent reset services. We do not provide licensed childcare, unsupervised babysitting, medical care, elder care, or emergency services."],
  ["Why do you review requests before payment?", "We review location, scope, availability, safety, pets, access, and pricing first so customers are not charged for a job we cannot safely or reliably fulfill."],
  ["Why does NestHelper cost more than hiring someone from a local group?", "NestHelper is not trying to be the cheapest option or an open marketplace. Pricing reflects a managed service: request review, helper fit, clear scope, scheduling coordination, insured local service, secure payment, and follow-up after service."],
  ["Why is availability limited?", "NestHelper is growing carefully and accepts a limited number of family requests at a time. That helps us protect service quality, avoid overbooking, and make sure each request has the right scope, timing, area, and helper fit before payment."],
  ["How does laundry pricing work?", "Laundry Rescue starts with a non-refundable minimum deposit that is credited before tax toward the final total. Laundry is weighed dry at pickup, add-ons are applied, and the final balance is handled by the option selected during checkout: auto-charge after review or final invoice before delivery."],
  ["Do I return the laundry bags?", "Yes. If NestHelper returns clean laundry in reusable NestHelper bags or totes, please empty and return them at your next Laundry Rescue pickup, scheduled drop-off, or another approved return method. Missing or damaged reusable bags may be billed a reasonable replacement fee."],
  ["Will I see the total before I pay?", "Yes. Any approved payment link or invoice will show the amount due before you submit payment. If tax or approved add-ons apply, they will be shown before checkout is completed."],
  ["Can I use a promo code?", "Yes. If NestHelper gave you a promo or referral code, enter it on the request form. We will review the code before sending your checkout link."],
  ["Are helpers background checked?", "Gold Star Checked helpers complete screening steps such as identity review, third-party background screening, reference review, and service standards. Partner providers are vetted as businesses."],
  ["What if something is missed?", "Contact us within 24 hours. If something within the agreed scope was missed, we’ll review and may offer a correction, credit, partial refund, or other resolution when appropriate."],
];

export default function FAQPage() {
  return (
    <>
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
