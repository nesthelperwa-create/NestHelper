import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "NestHelper | Parent Reset Services",
  description: "Trusted local parent-reset help for busy families: home resets, laundry rescue, errands, and family support.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "NestHelper | Reset the home. Reclaim the day.",
    description: "Vetted, insured, parent-focused help for busy families.",
    images: [siteConfig.assets.og]
  },
  icons: {
    icon: "/favicon.png",
    apple: "/assets/brand/apple-touch-icon.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
