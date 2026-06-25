# Card natural height fix

This patch keeps the current card design but stops service cards from stretching to match the tallest card in each grid row.

Updated:
- components/ServiceCard.tsx
- app/page.tsx
- app/services/page.tsx

Changes:
- Removed the equal collapsed-height prop from landing/services service card grids.
- Changed landing/services card grids from row stretch behavior to start alignment.
- Removed forced card `h-full` behavior so each card can use its own natural height.
- Kept existing styling, colors, buttons, card structure, and text.
