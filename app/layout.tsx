import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/lib/siteConfig";
import { HashScrollManager } from "@/components/HashScrollManager";

export const metadata: Metadata = {
  title: {
    default: "NestHelper | Mother’s Helper & Parent Help in Woodinville, WA",
    template: "%s | NestHelper",
  },
  description: "Local parent help for Woodinville, Bothell, Kirkland, Redmond, and nearby Eastside families: home reset help, laundry rescue, errands, and household support.",
  keywords: [
    "mother’s helper Woodinville",
    "mothers helper Woodinville",
    "mothers help Woodinville",
    "mother help Woodinville",
    "parent help Woodinville",
    "parent help near me",
    "family helper service",
    "household help for busy parents",
    "home reset help",
    "laundry help for families",
    "errand help for parents",
    "Woodinville home help",
    "Bothell parent help",
    "Kirkland parent help",
    "Redmond parent help",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    title: "NestHelper | Mother’s Helper & Parent Help in Woodinville, WA",
    description: "Mother’s helper-style household support, parent help, home resets, laundry rescue, and errands for busy Eastside families.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [siteConfig.assets.og],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NestHelper | Mother’s Helper & Parent Help in Woodinville, WA",
    description: "Local parent help, home reset help, laundry rescue, errands, and household support for busy Eastside families.",
    images: [siteConfig.assets.og],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" }
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }]
  }
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteConfig.url}/#organization`,
  name: siteConfig.name,
  legalName: "NestHelper LLC",
  url: siteConfig.url,
  image: `${siteConfig.url}${siteConfig.assets.logo}`,
  logo: `${siteConfig.url}${siteConfig.assets.icon}`,
  telephone: siteConfig.phone,
  email: siteConfig.emails.support,
  description:
    "NestHelper provides mother’s helper-style parent help, home reset help, laundry rescue, errands, and household support for busy families in Woodinville and nearby Eastside communities.",
  areaServed: [
    "Woodinville, WA",
    "Bothell, WA",
    "Kirkland, WA",
    "Redmond, WA",
    "Nearby Eastside communities",
  ],
  knowsAbout: [
    "mother’s helper-style household support",
    "parent help",
    "home reset help",
    "laundry help for families",
    "errand help for parents",
  ],
  makesOffer: [
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Parent help and home reset support" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Laundry rescue for families" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Errand help for parents" } },
  ],
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
