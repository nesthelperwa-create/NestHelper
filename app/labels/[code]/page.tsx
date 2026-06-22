import type { Metadata } from "next";
import SmartLabelEditor from "./SmartLabelEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NestHelper Smart Label",
  description: "Scan and update a customer-owned NestHelper Smart Label.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function SmartLabelPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <SmartLabelEditor code={code} />;
}
