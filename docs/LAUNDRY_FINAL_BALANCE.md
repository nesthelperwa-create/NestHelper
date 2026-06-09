# Laundry Rescue Final Balance

Laundry Rescue uses a two-step payment flow: a non-refundable deposit/minimum first, then an itemized final Stripe invoice after dry weigh-in. Manual sales tax can be added by admin only when needed.

## Step 1: Deposit / minimum

The normal admin quick checkout button sends the first Stripe Checkout link.

For Laundry Rescue, that first checkout is only the deposit/minimum. It should be treated as:

```text
Deposit Checkout Sent → Deposit Paid - Final Pending
```

not fully paid.

The deposit checkout keeps Stripe automatic tax disabled. If sales tax should be collected, the admin checks the manual sales-tax box and enters the verified rate before creating the checkout. The deposit/minimum is non-refundable and is credited toward the final laundry total before tax.

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
Final balance before optional manual sales tax = laundry subtotal before tax - pre-tax deposit credit
```

The final balance is created as a Stripe Invoice with line-item details, not a plain Checkout link. Stripe automatic tax stays disabled. If sales tax is needed, admin checks the manual sales-tax box before creating the invoice, and the manual tax rate is applied to the remaining balance after the deposit credit.

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

Laundry Rescue deposits created from either Quick Checkout or the saved Family Payment Breakdown are Checkout Sessions, not normal Stripe invoices, so Stripe can collect the customer’s required final-balance choice: auto-charge saved card after weigh-in, or email final invoice before delivery. The final balance after dry weight remains a Stripe invoice with line-item details.

Laundry Rescue tax is no longer forced on through Stripe automatic tax. Admin can add manual Washington sales tax to the deposit checkout or final balance invoice only when needed and after verifying the correct rate.
