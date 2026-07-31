import type { Metadata } from "next";
import LabelSetsPage from "@/components/smart-labels/LabelSetsPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Label Sets | NestHelper",
  description: "View activated NestHelper label packs and collections.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return <LabelSetsPage />;
}
