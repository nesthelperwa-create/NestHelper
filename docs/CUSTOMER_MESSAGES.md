# Customer Message Templates

## Regular service approval

Hi {{FirstName}}, your NestHelper {{ServiceName}} request has been approved for {{DateTime}}.

Price: {{Price}} + applicable WA sales tax.
Promo: {{PromoCodeOrNone}}

Please complete secure checkout here to confirm your visit:
{{StripeLink}}

Once paid, we’ll send your final prep notes and confirmation.
– NestHelper

## Laundry deposit

Hi {{FirstName}}, your Laundry Rescue pickup is approved.

Please pay the {{DepositAmount}} deposit here:
{{StripeDepositLink}}

This deposit applies toward your final total. Final price is based on dry weight at pickup, selected add-ons, and applicable WA sales tax.
– NestHelper

## Laundry final balance

Hi {{FirstName}}, your laundry dry weight is {{Weight}} lbs.

Laundry Rescue: {{Weight}} × {{Rate}} = {{LaundrySubtotal}}
Add-ons: {{AddOns}}
Deposit paid: -{{Deposit}}
Applicable WA sales tax: calculated in Stripe

Please complete your final balance here:
{{StripeInvoiceLink}}

Once paid, we’ll complete wash/fold and prepare return delivery.
– NestHelper
