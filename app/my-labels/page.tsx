import type { Metadata } from "next";
import MyLabelsDashboard from "@/components/smart-labels/MyLabelsDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "My Labels | NestHelper",
  description: "Activate your NestHelper Smart Label packs and manage claimed labels.",
  robots: { index: false, follow: false, nocache: true },
};

export default function MyLabelsPage() {
  return <MyLabelsDashboard />;
}
