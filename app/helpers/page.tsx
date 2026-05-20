import { PageHero } from "@/components/PageHero";
import { HelperApplicationForm, PartnerApplicationForm } from "@/components/forms/ApplicationForms";

export default function HelpersPage() {
  return <>
    <PageHero eyebrow="For Helpers & Partners" title="Join a parent-focused service built on trust." text="Apply as a part-time helper or as an independent contractor / local partner provider. We keep these paths separate so helper onboarding and business partnerships do not get mixed together." cta={false} />
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
      <HelperApplicationForm />
      <PartnerApplicationForm />
    </section>
  </>
}
