NestHelper Google sitemap fix

Replace:
- app/sitemap.ts
- app/robots.ts

This version hard-codes the sitemap base URL from lib/siteConfig.ts instead of using NEXT_PUBLIC_SITE_URL, so Vercel/local env values cannot accidentally generate localhost sitemap URLs.

After deploy, check:
https://www.nesthelperwa.com/sitemap.xml

Search the page for:
/giving-back
localhost

You want /giving-back to appear and localhost to have zero matches.
