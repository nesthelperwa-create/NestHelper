import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/lib/siteConfig";
import { HashScrollManager } from "@/components/HashScrollManager";

export const metadata: Metadata = {
  title: {
    default: "NestHelper | Household Help in Bothell & Eastside WA",
    template: "%s | NestHelper",
  },
  description: "NestHelper helps busy families with household support, home resets, laundry catch-up, errands, and organizing in Bothell, Woodinville, and nearby Eastside/Northshore areas. No childcare services.",
  keywords: [
    "household help Bothell",
    "household help Woodinville",
    "household help near me",
    "busy parents household help",
    "family household support",
    "household help for busy parents",
    "no childcare household help",
    "home reset help",
    "laundry help for families",
    "errand help for parents",
    "Bothell home help",
    "Woodinville home help",
    "Bothell household help",
    "Kirkland household help",
    "Redmond household help",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    title: "NestHelper | Household Help in Bothell & Eastside WA",
    description: "Managed household support, home resets, laundry catch-up, errands, and organizing for busy Eastside/Northshore families. No childcare.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [siteConfig.assets.og],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NestHelper | Household Help in Bothell & Eastside WA",
    description: "Local household support, home resets, laundry catch-up, errands, and organizing for busy Eastside/Northshore families. No childcare.",
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
    "NestHelper provides managed household support, home reset help, laundry catch-up, errands, organizing, and extra hands around the house for busy families in Bothell, Woodinville, and nearby Eastside/Northshore communities. NestHelper does not provide childcare.",
  areaServed: [
    "Bothell, WA",
    "Woodinville, WA",
    "Kirkland, WA",
    "Redmond, WA",
    "Kenmore, WA",
    "Nearby Eastside communities",
    "Nearby Northshore communities",
  ],
  knowsAbout: [
    "household help for busy parents",
    "managed household support",
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
