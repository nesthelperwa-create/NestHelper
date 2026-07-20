# Laundry Rescue Final Balance

Laundry Rescue uses a two-step payment flow: a non-refundable intro minimum first, then an itemized final Stripe invoice only if there is additional weight, approved add-ons, bulky items, or other reviewed changes. Manual sales tax can be added by admin only when needed.

## Step 1: Intro minimum

The normal admin quick checkout button sends the first Stripe Checkout link.

For Laundry Rescue, that first checkout is only the intro minimum. It should be treated as:

```text
Deposit Checkout Sent → Deposit Paid - Final Pending
```

not fully paid.

The deposit checkout keeps Stripe automatic tax disabled. If sales tax should be collected, the admin checks the manual sales-tax box and enters the verified rate before creating the checkout. The $59 intro minimum is non-refundable and includes pickup, wash, dry, fold, return, and up to about 26.2 lbs of laundry.

During Stripe checkout, the customer must choose one final-balance option:

```text
Auto-charge my saved card after final dry weight is confirmed
Send me the final invoice link before delivery
```

## Step 2: Final dry weight and final balance

After washing, drying, and folding, confirm the final dry weight and open the request in `/admin/requests`.

Use the **Laundry final balance** section to enter:

- Final dry weight lbs
- Additional lb rate
- Add-ons / bulky items
- Minimum already paid / included weight
- Optional note

The site calculates:

```text
Laundry subtotal before tax = additional weight above the included minimum × additional lb rate + add-ons
Final balance before optional manual sales tax = additional-weight amount + approved add-ons/bulky items
```

The final balance is created as a Stripe Invoice with line-item details, not a plain Checkout link. Stripe automatic tax stays disabled. If sales tax is needed, admin checks the manual sales-tax box before creating the invoice, and the manual tax rate is applied only to the additional-weight amount and approved add-ons/bulky items being invoiced.

## Auto-charge customers

If the customer selected auto-charge during the deposit checkout and Stripe saved a reusable payment method, the dashboard shows one action:

```text
Create invoice + auto-charge saved card
```

The manual final invoice sender buttons are hidden so the customer is not double charged.

## Invoice-before-delivery customers

If the customer selected invoice-before-delivery, the dashboard shows:

```text
Create + email final invoice
Create final invoice only
```

Laundry should not be released until the final invoice is fully paid.

## Statuses

Recommended Laundry Rescue statuses:

```text
New
Approved
Deposit Checkout Sent
Deposit Paid - Final Pending
Final Invoice Created
Final Invoice Sent
Final Auto-Charge Processing
Final Auto-Charge Failed
Final Balance Paid
Fully Paid
Scheduled
Completed
```

## Important

Tax only shows when the admin intentionally checks the manual sales-tax box and enters a rate before creating the checkout/invoice. Keep `ENABLE_STRIPE_AUTOMATIC_TAX=false` in the deployed environment.


## Laundry Rescue tax and final-balance choice note

Laundry Rescue deposits created from either Quick Checkout or the saved Family Payment Breakdown are Checkout Sessions, not normal Stripe invoices, so Stripe can collect the customer’s required final-balance choice: auto-charge saved card after final dry weight is confirmed, or email final invoice before delivery. The final balance after dry weight remains a Stripe invoice with line-item details.

Laundry Rescue tax is no longer forced on through Stripe automatic tax. Admin can add manual Washington sales tax to the deposit checkout or final balance invoice only when needed and after verifying the correct rate.
