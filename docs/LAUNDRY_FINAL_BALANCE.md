# Laundry Rescue Final Balance

Laundry Rescue now supports a two-step payment flow.

## Step 1: Deposit / minimum

The normal admin payment button sends the first Stripe checkout link.

For Laundry Rescue, that first payment should be treated as:

```text
Deposit Paid
```

not fully paid.

## Step 2: Dry weigh-in and final balance

After pickup, dry-weigh the laundry and open the request in `/admin/requests`.

Use the **Laundry final balance** section to enter:

- Dry weight lbs
- Rate per lb
- Add-ons / bulky items
- Deposit credit
- Optional note

The site calculates:

```text
Laundry subtotal = dry weight × rate per lb + add-ons
Balance due = laundry subtotal - deposit credit
```

If there is a balance due, the admin can create and email a Stripe checkout link for that remaining amount.

If the balance due is zero or negative, the request is marked `Fully Paid` without creating another checkout link.

## Statuses

Recommended Laundry Rescue statuses:

```text
New
Approved
Checkout Sent
Deposit Paid
Final Balance Sent
Fully Paid
Scheduled
Completed
```

## Important

The final balance link uses Stripe dynamic `price_data`, so you do not need to create a separate Stripe product/price for every laundry order.
