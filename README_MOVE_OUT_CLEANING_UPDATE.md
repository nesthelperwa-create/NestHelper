# Move-Out Cleaning request flow update

This replacement package adds Move-Out Cleaning as a residential quote-based service and keeps it separate from Commercial Reset.

## What changed

- Added `Move-Out Cleaning` to the customer services list and service cards.
- Added a Move-Out Cleaning request path with square footage, bedrooms, bathrooms, empty-home status, condition level, product preference, priority areas, appliance add-ons, pets/pet history, access notes, and photo prompts.
- Updated admin request handling so Move-Out Cleaning is recognized with its own badge and defaults to Custom checkout / approved quote instead of a fixed standard checkout.
- Added Family Payment Breakdown presets for reviewed move-out cleaning quotes and inside-appliance add-ons.
- Updated request, services, home page, FAQ, referral policy copy, and Stripe price map for consistency.

## Apply from your project root

PowerShell:

```powershell
Expand-Archive .\nesthelper_move_out_cleaning_update_replacements.zip -DestinationPath .\move-out-update -Force
Copy-Item .\move-out-update\* . -Recurse -Force
npm run build
```

If your local dependencies are missing, run:

```powershell
npm install
npm run build
```

## Optional Stripe env

`STRIPE_PRICE_MOVE_OUT_CLEANING_STANDARD` is only needed if you later create a standard Stripe Price for Move-Out Cleaning. The admin flow now defaults Move-Out Cleaning to Custom / approved quote, so you can quote $395, $495, or any reviewed amount from the admin builder without creating a fixed Stripe price first.
