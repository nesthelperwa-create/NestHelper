import type { Metadata } from "next";
import AccountPage from "@/components/smart-labels/AccountPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Smart Label Account | NestHelper",
  description: "Sign in and manage your NestHelper Smart Label account.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return <AccountPage />;
}
