import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/siteConfig";

export default function TrustPage() {
  return <>
    <PageHero eyebrow="Trust & Safety" title="Screened. Verified. Trusted." text="NestHelper is built as a legitimate parent-help service with checked helpers, vetted partners, business insurance at launch, clear policies, and controlled service scope." />
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <div className="rounded-[2rem] bg-white p-8 shadow-soft"><Image src={siteConfig.assets.badge} alt="Gold Star Checked" width={700} height={700} className="w-full object-contain" /></div>
      <div className="grid gap-5">
        <h2 className="text-4xl font-black text-nest-teal">Gold Star Checked standards</h2>
        {['Identity review','Comprehensive third-party background check','Washington/local checks where applicable','Reference review','Service standards training','Driving record checks for errand helpers when applicable','Clear right-to-refuse safety rules','Customer follow-up after service'].map((item)=><div key={item} className="rounded-2xl bg-white p-5 font-bold shadow-sm">✓ {item}</div>)}
        <p className="rounded-2xl bg-nest-cream p-5 text-sm font-semibold text-nest-ink/70">No screening process can guarantee future conduct, but NestHelper uses these steps to reduce risk, set expectations, and create accountability.</p>
      </div>
    </section>
  </>
}
