import { PageHero } from "@/components/PageHero";

const faqs = [
  ["Is this childcare?", "No. NestHelper provides household support and parent reset services. We do not provide licensed childcare, unsupervised babysitting, medical care, elder care, or emergency services."],
  ["Why request-first instead of instant booking?", "We review location, scope, availability, safety, pets, access, and pricing first so customers are not charged for a job we cannot safely or reliably fulfill."],
  ["How does laundry pricing work?", "Laundry Rescue starts with a minimum deposit. Laundry is weighed dry at pickup, add-ons are applied, and final balance is sent through Stripe invoice/payment link."],
  ["Does checkout include Washington sales tax?", "The checkout and invoicing setup is designed to calculate applicable Washington sales tax through Stripe based on the service address or customer address."],
  ["Can I use the Founding Family price?", "Early beta customers can enter FOUNDINGFAMILY on the request form. If approved and spots remain, we will honor the original beta price for the first approved service."],
  ["Are helpers background checked?", "Gold Star Checked helpers complete screening steps such as identity review, third-party background screening, reference review, and service standards. Partner providers are vetted as businesses."],
  ["What if something is missed?", "Contact us within 24 hours. If something within the agreed scope was missed, we’ll review and may offer a correction, credit, partial refund, or other resolution when appropriate."]
];

export default function FAQPage(){return <><PageHero eyebrow="FAQ" title="Clear answers before you request help." text="Simple policies, clear expectations, and no awkward guessing."/><section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8"><div className="grid gap-4">{faqs.map(([q,a])=><details key={q} className="group rounded-3xl bg-white p-6 shadow-sm open:shadow-soft"><summary className="cursor-pointer text-xl font-black text-nest-teal">{q}</summary><p className="mt-3 leading-7 text-nest-ink/72">{a}</p></details>)}</div></section></>}
