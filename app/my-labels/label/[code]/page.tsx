import type { Metadata } from "next";
import OwnedLabelEditor from "@/components/smart-labels/OwnedLabelEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Edit Smart Label | NestHelper",
  description: "Update your claimed NestHelper Smart Label.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <OwnedLabelEditor code={code} />;
}
