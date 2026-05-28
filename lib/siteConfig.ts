export const siteConfig = {
  name: "NestHelper",
  brand: "NestHelper",
  subheading: "Parent Reset",
  slogan: "Reset the home. Reclaim the day.",
  domain: "NestHelperWA.com",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
  emails: {
    support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@nesthelperwa.com",
    billing: process.env.NEXT_PUBLIC_BILLING_EMAIL || "billing@nesthelperwa.com",
    laundry: process.env.NEXT_PUBLIC_LAUNDRY_EMAIL || "laundry@nesthelperwa.com",
    helpers: process.env.NEXT_PUBLIC_HELPERS_EMAIL || "helpers@nesthelperwa.com",
    partners: process.env.NEXT_PUBLIC_PARTNERS_EMAIL || "partners@nesthelperwa.com",
  },
  phone: "(425) 790-1330",
  phoneHref: "tel:+14257901330",
  serviceArea: "Woodinville, Bothell, Kirkland, Redmond & nearby Eastside communities",
  foundingCode: "FOUNDINGFAMILY",
  assets: {
    logo: "/assets/brand/nesthelper-logo.png",
    icon: "/assets/brand/nesthelper-icon.png",
    hero: "/assets/brand/nesthelper-hero-banner.png",
    badge: "/assets/brand/gold-star-checked-badge.png",
    og: "/assets/social/og-nesthelper.png"
  }
};
