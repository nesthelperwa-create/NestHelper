# Homepage Meta Description Bing Fix Update

Files included:
- app/page.tsx

What changed:
- Shortens the homepage page-level meta description that overrides the default layout description.
- Updates the homepage OpenGraph description to match.
- New homepage meta description length: 141 characters.

New description:
"NestHelper helps busy Bothell and Eastside families with home resets, laundry help, move-out cleaning, errands, and simple household support."

Why:
- Bing Live URL was still flagging the homepage because app/page.tsx had its own longer metadata description.
- app/page.tsx metadata overrides app/layout.tsx metadata for the homepage.

What did NOT change:
- No visible homepage copy.
- No admin dashboard logic.
- No request form logic.
- No Stripe logic.
- No smart checkout logic.
- No tax rules.
- No pricing math.
