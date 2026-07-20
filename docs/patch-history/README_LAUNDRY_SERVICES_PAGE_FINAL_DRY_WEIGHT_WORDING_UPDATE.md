# Laundry Services Page Final Dry Weight Wording Update

This small patch updates Laundry Rescue wording so the public services page and related policy text match your real workflow.

## What this patch changes

### 1) Services page (`app/services/page.tsx`)
- Updates the main Laundry Rescue pricing paragraph.
- Replaces the old "Dry weigh-in" wording.
- Changes Step 2 to:
  - **Title:** `2. Final dry weight`
  - **Text:** `Laundry is washed, dried, and folded first. Final pricing is based on the final dry weight, and any laundry above the included amount is $2.25/lb.`

### 2) Laundry policy (`lib/policies.ts`)
- Updates the policy language so it no longer says laundry is weighed dry at pickup.

### 3) Internal documentation (`docs/LAUNDRY_FINAL_BALANCE.md`)
- Updates the internal wording to refer to **final dry weight** instead of pickup dry weigh-in.

## Files included
- `app/services/page.tsx`
- `lib/policies.ts`
- `docs/LAUNDRY_FINAL_BALANCE.md`

## How to apply
1. Extract this zip.
2. Copy the included files into your project, keeping the same folder structure.
3. Commit and deploy.

## Result
Your Laundry Rescue service page, policy wording, and internal documentation will all consistently reflect that pricing is based on the **final dry weight after washing, drying, and folding**.
