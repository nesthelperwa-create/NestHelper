# Selective manual Stripe sales tax update

This update keeps Stripe automatic tax disabled in code and adds a manual sales-tax control inside the admin dashboard payment tools.

## What changed

- Stripe `automatic_tax` is now forced to `false` in the admin payment routes.
- Admin dashboard now shows an **Add manual Washington sales tax** checkbox and tax-rate field before creating payment links/invoices.
- Manual tax is applied only when the admin checks the box and enters a rate.
- Commercial invoices apply manual sales tax only to saved quote lines marked taxable.
- Family invoices and quick checkout links apply manual sales tax to the payment only when checked.
- Laundry deposit checkout and final laundry invoices can collect manual sales tax when checked, without re-enabling Stripe Tax automatic calculation.
- Additional payment links can also include manual sales tax when checked.
- Public checkout is also forced to `automatic_tax: false`.

## Important usage note

Keep this Vercel environment variable set to false:

```env
ENABLE_STRIPE_AUTOMATIC_TAX=false
```

Only check the manual sales-tax box when you have verified that the service is taxable and confirmed the correct customer/location tax rate. This update is a workflow control, not tax/legal advice.

## Files changed

- `lib/stripeManualTax.ts`
- `components/admin/AdminTable.tsx`
- `components/admin/CommercialQuoteBreakdownBuilder.tsx`
- `app/api/admin/create-payment-link/route.ts`
- `app/api/admin/create-family-invoice/route.ts`
- `app/api/admin/create-commercial-invoice/route.ts`
- `app/api/admin/create-laundry-final-balance/route.ts`
- `app/api/admin/create-additional-payment-link/route.ts`
- `app/api/create-checkout-session/route.ts`
- `docs/STRIPE_SETUP.md`
- `docs/LAUNDRY_FINAL_BALANCE.md`
- `docs/PAYMENT_APPROVAL_FLOW.md`
- `docs/LAUNCH_CHECKLIST.md`

## Deployment

```powershell
cd C:\Users\Leo\nesthelper_nextjs_site
npm run build
git add lib/stripeManualTax.ts components/admin/AdminTable.tsx components/admin/CommercialQuoteBreakdownBuilder.tsx app/api/admin/create-payment-link/route.ts app/api/admin/create-family-invoice/route.ts app/api/admin/create-commercial-invoice/route.ts app/api/admin/create-laundry-final-balance/route.ts app/api/admin/create-additional-payment-link/route.ts app/api/create-checkout-session/route.ts docs/STRIPE_SETUP.md docs/LAUNDRY_FINAL_BALANCE.md docs/PAYMENT_APPROVAL_FLOW.md docs/LAUNCH_CHECKLIST.md README_SELECTIVE_MANUAL_STRIPE_TAX_UPDATE.md
git commit -m "Add selective manual Stripe sales tax controls"
git push origin main
```
