# NestHelper Google Ads Conversion Tracking Update

This update fixes the Google Ads conversion-tracking problem by giving Google a clean request-completion page to track.

## What changed

1. Added `/request/thank-you`.
   - This page appears only after a successful public request submission.
   - It is marked `noindex` so it does not become a search result.

2. Updated the public request form.
   - After `/api/submit-request` returns success, the form redirects to `/request/thank-you`.
   - This lets Google Ads count only completed request submissions, not everyone who simply visits `/request`.

3. Updated the site Google tag setup.
   - Existing GA4 tag remains supported.
   - Added optional Google Ads tag support using this Vercel environment variable:
     `NEXT_PUBLIC_GOOGLE_ADS_ID`
   - Use the value Google Ads gives you, usually like `AW-1234567890`.

## After deploying

In Google Ads, set the request conversion action to:

- Goal: Submit lead form
- Conversion name: Request form submitted
- Tracking type: Page load
- URL contains: `/request/thank-you`
- Optimization: Primary
- Count: One

Do not use `/request` as a Page load conversion. That would count people who only opened the form.

## Vercel environment variable

In Vercel, add:

`NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXXX`

Replace `AW-XXXXXXXXXX` with the Google Ads tag ID shown in Google Ads conversion setup.

Keep the existing GA4 ID unless you intentionally want to change it. The fallback is currently `G-64FSF1JRDH`.

## Phone calls

Set phone calls up separately in Google Ads as a call conversion:

- Goal/category: Phone call lead
- Phone: 425-790-1330
- Count: One
- Minimum call length: 60 seconds is a good starting point
- Optimization: Primary if calls are as valuable as form requests

## Local build note

No package dependencies were changed. If your local `node_modules` folder is already present, you should not need to run `npm install`.
