import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/lib/siteConfig";
import { HashScrollManager } from "@/components/HashScrollManager";

export const metadata: Metadata = {
  title: "NestHelper | Parent Reset Services",
  description: "Trusted local parent-reset help for busy families: home resets, laundry rescue, errands, and family support.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "NestHelper | Reset the home. Reclaim the day.",
    description: "Vetted, insured, parent-focused help for busy families.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [siteConfig.assets.og]
  },
  icons: {
    icon: "/favicon.png",
    apple: "/assets/brand/apple-touch-icon.png"
  }
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteConfig.url}/#organization`,
  name: siteConfig.name,
  url: siteConfig.url,
  telephone: siteConfig.phone,
  email: siteConfig.emails.support,
  sameAs: siteConfig.socialLinks.map((link) => link.href),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <HashScrollManager />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
