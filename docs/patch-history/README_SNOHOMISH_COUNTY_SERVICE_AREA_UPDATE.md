# Snohomish County Service Area Update

Files included:
- app/page.tsx
- app/layout.tsx
- lib/siteConfig.ts
- app/manifest.ts
- public/site.webmanifest
- public/browserconfig.xml
- app/sitemap.ts
- app/services/page.tsx
- app/faq/page.tsx
- app/request/page.tsx
- app/commercial-reset/page.tsx
- app/service-area/snohomish-county/page.tsx
- components/forms/CommercialResetForm.tsx
- components/forms/ApplicationForms.tsx
- components/Footer.tsx
- lib/services.ts

What changed:
- Adds "select Snohomish County" / "South Snohomish County" service-area wording across public website copy.
- Updates homepage service-area text and chips.
- Updates global site serviceArea config.
- Updates FAQ/request/service page wording so Snohomish County requests are reviewed before payment.
- Adds a new SEO-friendly service-area page at /service-area/snohomish-county.
- Adds the new service-area page to the sitemap.
- Adds Snohomish-area helper/partner application service area options.
- Updates Commercial Reset public wording/form copy to include select Snohomish County.
- Keeps the recent shorter meta descriptions under 160 characters.
- Keeps/refreshes site.webmanifest and browserconfig.xml from the Bing/favicon work.

Recommended service-area wording used:
Bothell, Woodinville, Kenmore, Kirkland, Redmond, Mill Creek, Lynnwood, Edmonds, Mountlake Terrace, Snohomish, Mukilteo & nearby Eastside, Northshore, and South Snohomish County communities

What did NOT change:
- No Stripe logic.
- No smart checkout logic.
- No payment logic.
- No tax rules.
- No pricing math.
- No admin workflow logic.
- No customer email logic.
- No request submission/backend validation logic.
