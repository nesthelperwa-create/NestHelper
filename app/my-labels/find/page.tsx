import type { Metadata } from "next";
import FindMyItemPage from "@/components/smart-labels/FindMyItemPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Find My Item | NestHelper",
  description: "Search your NestHelper Smart Labels to find stored items.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return <FindMyItemPage />;
}
