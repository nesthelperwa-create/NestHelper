# Laundry Rescue Final Balance

Laundry Rescue uses a two-step payment flow: a non-refundable taxable deposit/minimum first, then an itemized final Stripe invoice after dry weigh-in.

## Step 1: Deposit / minimum

The normal admin quick checkout button sends the first Stripe Checkout link.

For Laundry Rescue, that first checkout is only the deposit/minimum. It should be treated as:

```text
Deposit Checkout Sent → Deposit Paid - Final Pending
```

not fully paid.

The deposit checkout is tax-exclusive and uses Stripe automatic tax when `ENABLE_STRIPE_AUTOMATIC_TAX=true`. The deposit/minimum is non-refundable and is credited toward the final laundry total before tax.

During Stripe checkout, the customer must choose one final-balance option:

```text
Auto-charge my saved card after dry weight is confirmed
Send me the final invoice link before delivery
```

## Step 2: Dry weigh-in and final balance

After pickup, dry-weigh the laundry and open the request in `/admin/requests`.

Use the **Laundry final balance** section to enter:

- Dry weight lbs
- Rate per lb
- Add-ons / bulky items
- Deposit credit before tax
- Optional note

The site calculates:

```text
Laundry subtotal before tax = dry weight × rate per lb + add-ons
Final taxable balance = laundry subtotal before tax - pre-tax deposit credit
```

The final balance is created as a Stripe Invoice with line-item details, not a plain Checkout link. The invoice uses positive taxable line items and an invoice discount/coupon for the non-refundable deposit credit, so Stripe taxes only the remaining final balance after the deposit credit.

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

Tax only shows when Stripe Tax is set up and `ENABLE_STRIPE_AUTOMATIC_TAX=true` in the deployed environment. For sandbox testing, it may be disabled until Stripe live/tax setup is complete.
