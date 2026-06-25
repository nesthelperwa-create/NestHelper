# NestHelper Card Equal Closed Height + No Row Stretch Fix

This is a small safe layout-only patch for service cards.

## What changed

- Closed service cards use a consistent minimum height so cards in the same row line up again.
- Open cards no longer make the other cards in that grid row stretch taller.
- The Services page and landing page card grids now align cards at the top instead of forcing all cards in the row to stretch.
- Text wrapping and price/helper panel wrapping are preserved.
- No branding, colors, buttons, header, footer, or page structure were redesigned.

## Files changed

- `components/ServiceCard.tsx`
- `app/page.tsx`
- `app/services/page.tsx`

## Build note

No dependency changes were made. `npm install` is not needed unless your local `next` command is still missing.
