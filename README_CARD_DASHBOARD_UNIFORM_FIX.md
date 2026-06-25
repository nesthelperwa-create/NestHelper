# Card + Dashboard Uniform Fix

This patch keeps the existing NestHelper design and makes two narrow layout fixes:

- Service cards keep matching closed heights on desktop/tablet without stretching other cards when one card is opened.
- The pricing/helper box uses a slightly taller closed-card height so shorter cards visually line up better with longer cards.
- Admin quick service filter pills use the same width so the dashboard service row looks uniform.

Files changed:

- components/ServiceCard.tsx
- components/admin/AdminTable.tsx

No dependency changes were made. `npm install` is not required unless local `node_modules` / `next` is missing.
