import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  EyeOff,
  Layers3,
  LockKeyhole,
  MessageCircle,
  PackagePlus,
  ScanLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tags,
} from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Smart QR Labels for Storage & Lost Items | NestHelper",
  description:
    "NestHelper Smart Labels connect boxes, bins, totes, and belongings to a private web dashboard with Storage Mode, Lost & Found Mode, and Find My Item search.",
  alternates: { canonical: `${siteConfig.url}/smart-labels` },
  openGraph: {
    title: "NestHelper Smart Labels",
    description: "QR labels for organized storage, moving boxes, and optional Lost & Found recovery. No app required and no GPS tracking.",
    url: `${siteConfig.url}/smart-labels`,
    images: [siteConfig.assets.og],
  },
};

const features = [
  {
    icon: <Boxes size={22} />,
    title: "Storage Mode",
    text: "Save a label name, storage location, contents, notes, photos, and collection details in your private Smart Labels dashboard.",
  },
  {
    icon: <MessageCircle size={22} />,
    title: "Lost & Found Mode",
    text: "Choose a public item name and recovery message, then optionally let a finder send you a private message without exposing your contact information.",
  },
  {
    icon: <Search size={22} />,
    title: "Find My Item",
    text: "Search your own labels by name, location, contents, notes, container type, or collection when you cannot remember which box has what.",
  },
  {
    icon: <Layers3 size={22} />,
    title: "Collections",
    text: "Group labels for a garage, move, seasonal storage, kids' items, closets, rooms, or another setup that makes sense for your home.",
  },
];

const useCases = [
  "Garage and storage totes",
  "Moving and unpacking boxes",
  "Seasonal decorations",
  "Kids' clothes and toy bins",
  "Closets, shelves, and household storage",
  "Belongings you may want returned if found",
];

const faqs = [
  {
    q: "Do I need an app?",
    a: "No. Scan a NestHelper Smart Label with your phone camera and use the secure web experience in your browser.",
  },
  {
    q: "Is this a GPS tracker?",
    a: "No. Smart Labels do not continuously track an item's location. A finder can optionally share location information only when that feature is enabled and the finder chooses to share it.",
  },
  {
    q: "What can someone see if they scan a Storage Mode label?",
    a: "A claimed Storage Mode label does not return your private contents, notes, storage location, photos, email, or phone number on the public scan page.",
  },
  {
    q: "Can I buy more after I start?",
    a: `Yes. Each retail pack includes ${siteConfig.smartLabels.retailPackSize} labels. Redeem the new activation code in the same account and the additional label allowance is added to your existing dashboard.`,
  },
  {
    q: "What if NestHelper gave me complimentary labels?",
    a: "Use the complimentary activation code in the same Smart Labels account. If you later purchase a retail pack, redeem its activation code in that account and keep using your existing labels and collections.",
  },
  {
    q: "Does scanning a label use one of my available labels?",
    a: "No. A scan by itself does not consume your allowance. An available label is used only after you successfully add an unclaimed NestHelper label to your account.",
  },
];

export default function SmartLabelsPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-75" />
        <div className="absolute inset-0 -z-10 bg-white/48" />
        <div className="absolute -left-20 top-4 -z-10 h-72 w-72 rounded-full bg-nest-mint/65 blur-3xl" />
        <div className="absolute -right-20 bottom-0 -z-10 h-72 w-72 rounded-full bg-nest-gold/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-7 overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/68 p-6 shadow-soft backdrop-blur sm:p-9 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:p-11">
          <div>
            <div className="pill-label w-fit"><Tags size={15} /> NestHelper Smart Labels</div>
            <h1 className="mt-5 text-balance text-4xl font-black tracking-tight text-nest-teal sm:text-5xl lg:text-6xl">
              Know what&apos;s where. Help lost items find their way home.
            </h1>
            <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-nest-ink/74 sm:text-lg sm:leading-8">
              QR labels connect physical boxes, bins, totes, and belongings to your private NestHelper dashboard. Use Storage Mode for organization or Lost &amp; Found Mode when you want to share a recovery message with a finder.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-sm font-black text-nest-teal">
              <span className="rounded-full border border-nest-gold/18 bg-white px-4 py-2 shadow-sm">{siteConfig.smartLabels.retailPackSize} labels per retail pack</span>
              <span className="rounded-full border border-nest-gold/18 bg-white px-4 py-2 shadow-sm">No app required</span>
              <span className="rounded-full border border-nest-gold/18 bg-white px-4 py-2 shadow-sm">Not GPS tracking</span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={siteConfig.smartLabels.etsyListingUrl}
                target="_blank"
                rel="noreferrer"
                className="focus-ring group inline-flex w-full items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-3.5 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift sm:w-auto sm:text-base"
              >
                <ShoppingBag size={18} /> Buy {siteConfig.smartLabels.retailPackSize} Labels on Etsy <ExternalLink size={15} className="transition group-hover:translate-x-0.5" />
              </a>
              <Link
                href="/my-labels"
                className="focus-ring group inline-flex w-full items-center justify-center gap-2 rounded-full border border-nest-teal/15 bg-white px-6 py-3.5 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold/45 hover:shadow-soft sm:w-auto sm:text-base"
              >
                Already have labels? Open My Labels <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-[2rem] border border-nest-gold/20 bg-[#fbf6ea] p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">Example setup</p>
                  <h2 className="mt-1 text-2xl font-black text-nest-teal">Garage storage</h2>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-nest-teal shadow-sm"><ScanLine size={28} /></div>
              </div>

              <div className="mt-5 grid gap-3">
                <DemoLabel title="Holiday decorations" code="NH-••••" location="Garage · Top shelf" contents="Lights, ornaments, stockings" />
                <DemoLabel title="Kids' next sizes" code="NH-••••" location="Garage · Blue tote" contents="2T–4T clothes and shoes" />
                <DemoLabel title="Camping gear" code="NH-••••" location="Garage · Rack 2" contents="Lanterns, cookware, tent stakes" />
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-nest-teal/10 bg-white p-4 text-sm font-bold leading-6 text-nest-ink/70 shadow-sm">
                <Search className="shrink-0 text-nest-teal" size={19} />
                Search your labels later instead of opening every box.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
              <div className="inline-flex rounded-2xl bg-nest-mint/35 p-3 text-nest-teal">{feature.icon}</div>
              <h2 className="mt-4 text-xl font-black text-nest-teal">{feature.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/66">{feature.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <section className="rounded-[2.25rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/25 p-6 shadow-soft sm:p-7">
            <p className="pill-label w-fit"><ScanLine size={15} /> Setup</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-nest-teal">Activate. Scan. Add. Find.</h2>
            <ol className="mt-5 grid gap-3">
              <Step number="1" title="Activate your allowance" text="Create or sign into your account and redeem the activation code provided with your retail or complimentary labels." />
              <Step number="2" title="Scan a physical label" text="Use your phone camera to open the QR label. Scanning alone does not use one of your available labels." />
              <Step number="3" title="Tap Add Label" text="A label allowance is consumed only after an unclaimed NestHelper label is successfully added to your account." />
              <Step number="4" title="Save what matters" text="Name it, record the location and contents, add notes or photos, and choose Storage or Lost & Found Mode." />
            </ol>
          </section>

          <section className="rounded-[2.25rem] border border-nest-gold/18 bg-white p-6 shadow-soft sm:p-7">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-nest-mint/35 p-3 text-nest-teal"><ShieldCheck size={25} /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">Privacy by mode</p>
                <h2 className="mt-1 text-3xl font-black leading-tight text-nest-teal">Your storage details stay private.</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <PrivacyCard
                icon={<EyeOff size={19} />}
                title="Storage Mode"
                items={["Private contents and notes", "Private storage location", "Private photos", "Owner email and phone are not shown publicly"]}
              />
              <PrivacyCard
                icon={<MessageCircle size={19} />}
                title="Lost & Found Mode"
                items={["You choose the public item name", "You choose the public recovery message", "Finder contact can be enabled or disabled", "Finder location sharing is voluntary — not automatic GPS"]}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
              <LockKeyhole className="mr-2 inline-block" size={17} />
              Smart Labels are useful for organization and recovery, but do not store passwords, financial information, access codes, or other highly sensitive information in label notes.
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
              <Link href="/policies/smart-label-policy" className="text-nest-teal underline decoration-nest-gold/60 underline-offset-4">Smart Label Policy</Link>
              <Link href="/policies/privacy-policy" className="text-nest-teal underline decoration-nest-gold/60 underline-offset-4">Privacy Policy</Link>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-[2.25rem] border border-nest-gold/18 bg-white p-6 shadow-soft sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <p className="pill-label w-fit"><Sparkles size={15} /> One account, more labels later</p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-nest-teal">Start with what you have. Add {siteConfig.smartLabels.retailPackSize} more whenever you need them.</h2>
              <p className="mt-3 font-medium leading-7 text-nest-ink/70">
                Complimentary labels and purchased packs can live in the same Smart Labels account. Buying another retail pack does not replace your existing labels, notes, collections, or saved setup.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href={siteConfig.smartLabels.etsyListingUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-5 py-3 font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift">
                  <PackagePlus size={18} /> Buy a {siteConfig.smartLabels.retailPackSize}-label pack <ExternalLink size={14} />
                </a>
                <Link href="/my-labels" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-nest-teal/15 bg-white px-5 py-3 font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
                  Open My Labels <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniBenefit icon={<CheckCircle2 size={18} />} title="Existing labels stay put" text="Nothing is reset when you redeem another activation code." />
              <MiniBenefit icon={<PackagePlus size={18} />} title="Allowances add up" text="Unused labels plus newly activated labels remain available in the same account." />
              <MiniBenefit icon={<Layers3 size={18} />} title="Collections stay organized" text="Keep using the same groups and storage system as your label count grows." />
              <MiniBenefit icon={<Smartphone size={18} />} title="Still no app required" text="Continue using your phone camera and browser-based dashboard." />
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="text-center">
            <p className="pill-label mx-auto w-fit"><Boxes size={15} /> Ideas</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal">Useful anywhere you keep asking, “Which box was that in?”</h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-nest-gold/14 bg-nest-cream/65 p-4 font-black text-nest-ink/74">
                <CheckCircle2 className="shrink-0 text-nest-teal" size={19} /> {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2.25rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/24 p-6 shadow-soft sm:p-7">
          <div className="text-center">
            <p className="pill-label mx-auto w-fit"><ShieldCheck size={15} /> FAQ</p>
            <h2 className="mt-4 text-3xl font-black text-nest-teal">Smart Label questions</h2>
          </div>
          <div className="mx-auto mt-6 grid max-w-5xl gap-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-nest-gold/14 bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-black text-nest-teal marker:hidden">
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm font-semibold leading-6 text-nest-ink/68">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[2.5rem] bg-nest-teal p-7 text-center text-white shadow-soft sm:p-9">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-nest-gold2">Ready to label your space?</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Get a {siteConfig.smartLabels.retailPackSize}-label pack, then keep adding packs to the same account as your setup grows.</h2>
            <p className="mx-auto mt-4 max-w-2xl font-semibold leading-7 text-white/80">Already received complimentary labels? Activate those first, and purchase more whenever you need them.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={siteConfig.smartLabels.etsyListingUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:bg-nest-cream">
                <ShoppingBag size={18} /> Buy on Etsy <ExternalLink size={14} />
              </a>
              <Link href="/my-labels" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/16">
                My Labels <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}

function DemoLabel({ title, code, location, contents }: { title: string; code: string; location: string; contents: string }) {
  return (
    <div className="rounded-2xl border border-nest-gold/14 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-nest-teal">{title}</p>
          <p className="mt-1 text-xs font-bold text-nest-ink/55">{location}</p>
        </div>
        <span className="rounded-full bg-nest-mint/35 px-3 py-1 font-mono text-[0.68rem] font-black text-nest-teal">{code}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-nest-ink/68">{contents}</p>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-white/85 p-4 shadow-sm">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-nest-teal text-sm font-black text-white">{number}</span>
      <div>
        <h3 className="font-black text-nest-teal">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/66">{text}</p>
      </div>
    </li>
  );
}

function PrivacyCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-[1.6rem] border border-nest-gold/14 bg-nest-cream/58 p-5">
      <div className="flex items-center gap-2 text-nest-teal">{icon}<h3 className="text-lg font-black">{title}</h3></div>
      <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-nest-ink/68">
        {items.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 shrink-0 text-nest-teal" size={15} />{item}</li>)}
      </ul>
    </div>
  );
}

function MiniBenefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-nest-gold/14 bg-nest-cream/65 p-4">
      <div className="flex items-center gap-2 text-nest-teal">{icon}<h3 className="font-black">{title}</h3></div>
      <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/66">{text}</p>
    </div>
  );
}
