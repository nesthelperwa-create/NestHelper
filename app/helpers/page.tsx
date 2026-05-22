import { PageHero } from "@/components/PageHero";
import { ApplicationFormChooser } from "@/components/forms/ApplicationForms";

export default function HelpersPage() {
  return <>
    <PageHero eyebrow="For Helpers & Partners" title="Join a parent-focused service built on trust." text="Choose whether you are applying as an individual helper or as a local partner provider. We’ll show the right application so the process feels simple and clear." cta={false} />
    <ApplicationFormChooser />
  </>
}
