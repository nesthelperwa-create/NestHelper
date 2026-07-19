import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/lib/siteConfig";
import { HashScrollManager } from "@/components/HashScrollManager";

const siteUrl = siteConfig.url.replace(/\/$/, "");
const absoluteUrl = (path: string) => `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-64FSF1JRDH";
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
const googleTagLoaderId = googleAdsId || googleAnalyticsId;
const googleTagConfigLines = [googleAnalyticsId, googleAdsId]
  .filter(Boolean)
  .map((id) => `gtag('config', ${JSON.stringify(id)});`)
  .join("\n            ");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteConfig.name,
  title: {
    default: "NestHelper | Household Help in Bothell, Eastside & Snohomish County WA",
    template: "%s | NestHelper",
  },
  description: "NestHelper helps busy Bothell, Eastside, and select Snohomish County families with home resets, laundry help, errands, and household support.",
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
    "Lynnwood laundry help",
    "Mill Creek home cleaning",
    "Snohomish County home help",
  ],
  openGraph: {
    title: "NestHelper | Household Help in Bothell, Eastside & Snohomish County WA",
    description: "NestHelper helps busy Bothell, Eastside, and select Snohomish County families with home resets, laundry help, errands, and household support.",
    url: siteUrl,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.assets.og,
        width: 1200,
        height: 630,
        alt: "NestHelper household help for busy families",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NestHelper | Household Help in Bothell, Eastside & Snohomish County WA",
    description: "NestHelper helps busy Bothell, Eastside, and select Snohomish County families with home resets, laundry help, errands, and household support.",
    images: [siteConfig.assets.og],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  other: {
    "msapplication-TileColor": "#0f4f4a",
    "msapplication-TileImage": "/icon.png",
    "msapplication-config": "/browserconfig.xml",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#organization`,
  name: siteConfig.name,
  legalName: "NestHelper LLC",
  url: siteUrl,
  image: [
    absoluteUrl(siteConfig.assets.logo),
    absoluteUrl(siteConfig.assets.icon),
    absoluteUrl(siteConfig.assets.og),
  ],
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl("/icon.png"),
    width: 512,
    height: 512,
  },
  telephone: siteConfig.phone,
  email: siteConfig.emails.support,
  description:
    "NestHelper provides managed household support, home reset help, laundry catch-up, errands, organizing, simple in-home meal prep support, and move-related reset help for busy families in Bothell, Eastside, Northshore, and select Snohomish County communities. NestHelper does not provide childcare.",
  areaServed: [
    "Bothell, WA",
    "Woodinville, WA",
    "Kirkland, WA",
    "Redmond, WA",
    "Kenmore, WA",
    "Mill Creek, WA",
    "Lynnwood, WA",
    "Edmonds, WA",
    "Mountlake Terrace, WA",
    "Snohomish, WA",
    "Mukilteo, WA",
    "Nearby Eastside communities",
    "Nearby Northshore communities",
    "Select Snohomish County communities",
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
        {googleTagLoaderId && (
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleTagLoaderId}`}
            strategy="afterInteractive"
          />
        )}
        {googleTagConfigLines && (
          <Script id="google-tag" strategy="afterInteractive">
            {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            ${googleTagConfigLines}
          `}
          </Script>
        )}
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
