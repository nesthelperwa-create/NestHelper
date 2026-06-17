export const siteConfig = {
  name: "NestHelper",
  brand: "NestHelper",
  subheading: "Parent Reset",
  slogan: "Reset the home. Reclaim the day.",
  domain: "NestHelperWA.com",
  url: "https://www.nesthelperwa.com",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
  emails: {
    support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    booking: process.env.NEXT_PUBLIC_BOOKING_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    requests: process.env.NEXT_PUBLIC_REQUESTS_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    billing: process.env.NEXT_PUBLIC_BILLING_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    payments: process.env.NEXT_PUBLIC_PAYMENTS_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    laundry: process.env.NEXT_PUBLIC_LAUNDRY_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    commercial: process.env.NEXT_PUBLIC_COMMERCIAL_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    helpers: process.env.NEXT_PUBLIC_HELPERS_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    partners: process.env.NEXT_PUBLIC_PARTNERS_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    jobs: process.env.NEXT_PUBLIC_JOBS_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    admin: process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    info: process.env.NEXT_PUBLIC_INFO_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    contact: process.env.NEXT_PUBLIC_CONTACT_ALIAS_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
    help: process.env.NEXT_PUBLIC_HELP_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
  },
  phone: "(425) 790-1330",
  phoneHref: "tel:+14257901330",
  serviceArea: "Bothell, Woodinville, Kenmore, Kirkland, Redmond & nearby Eastside/Northshore communities",
  foundingCode: "FOUNDINGFAMILY",
  social: {
    facebook: "https://www.facebook.com/NestHelperLLC",
    instagram: "https://www.instagram.com/nesthelper",
  },
  socialLinks: [
    {
      name: "Facebook",
      href: "https://www.facebook.com/NestHelperLLC",
      label: "Follow NestHelper on Facebook",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/nesthelper",
      label: "Follow NestHelper on Instagram",
    },
  ],
  assets: {
    logo: "/assets/brand/nesthelper-logo.png",
    icon: "/assets/brand/nesthelper-icon.png",
    hero: "/assets/brand/nesthelper-hero-banner.png",
    badge: "/assets/brand/gold-star-checked-badge.png",
    og: "/assets/social/og-nesthelper.png"
  }
};
