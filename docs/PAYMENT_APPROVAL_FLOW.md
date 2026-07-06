# Payment Approval Flow

## Goal

Keep NestHelper as a request-first service instead of an instant-booking site.

Customers submit a request first. Admin reviews it. Admin sends payment only after the job looks safe, serviceable, and available.

## Current helper-based launch prices

```text
2-Hour Parent Reset: $129
3-Hour Family Reset: $199
4-Hour Helper Block: $279
Errand Helper: $119
Laundry Rescue intro launch pricing: $59 minimum + $2.25/lb
Extra approved time in the family builder: $35/half-hour or $70/hour
```

## Admin steps

1. Open `/admin/requests`.
2. Click `View` on a request.
3. Review:
   - service package
   - service address and city
   - preferred date/time
   - scope/details
   - pets and access
   - promo code
   - laundry or errand-specific notes
4. In the Approval + Payment section, choose:
   - `Standard price`
   - `Internal discount price` only if you intentionally approved a discount
5. Click:
   - `Create + email checkout link`, or
   - `Create link only`
6. The request becomes `Checkout Sent`.
7. Once Stripe confirms payment through the webhook, the request becomes `Paid`.
8. After payment, schedule and confirm the job.

## When to use Create link only

Use this if you want to text the link manually, check the checkout URL first, or avoid emailing the customer twice.

## When to use Create + email checkout link

Use this after the request is approved and you are ready for the customer to pay.

## Customer message after payment

After a customer pays, send a short confirmation manually until the scheduling flow is automated:

```text
Thanks — we received your NestHelper payment. I’ll confirm the final arrival window and prep notes next. Your request is now moving from checkout to scheduling.
```

## Status meanings

- `New`: just submitted
- `Reviewed`: you looked at it but have not approved it yet
- `Approved`: good fit, ready for payment
- `Checkout Sent`: payment link was created/sent
- `Paid`: Stripe confirmed payment
- `Scheduled`: date/time confirmed
- `Completed`: job finished
- `Declined`: not a fit
- `Follow-Up Needed`: questions before approval


## Manual tax note

Keep `ENABLE_STRIPE_AUTOMATIC_TAX=false` for testing and live payments. Add sales tax only from the admin manual sales-tax control when you have verified the service is taxable and confirmed the correct rate.

## Laundry Rescue deposit + final balance flow

Laundry Rescue is treated differently from flat-price services.

1. Admin reviews the Laundry Rescue request.
2. Admin sends the normal quick checkout link. For Laundry Rescue, this is the non-refundable deposit/minimum only; manual sales tax is added only if checked.
3. During deposit checkout, Stripe asks the customer to choose one final-balance option:
   - Auto-charge my saved card after dry weight is confirmed
   - Send me the final invoice link before delivery
4. When the deposit checkout succeeds, the webhook marks the request as `Deposit Paid - Final Pending` instead of fully `Paid`.
5. After pickup, admin dry-weighs the laundry.
6. In the admin request detail view, use the **Laundry final balance** section:
   - Dry weight lbs
   - Rate per lb
   - Add-ons / bulky items
   - Deposit credit before tax
7. NestHelper calculates:

```text
Final laundry subtotal before tax = dry weight × rate per lb + add-ons
Final balance before optional manual sales tax = final laundry subtotal before tax - pre-tax deposit credit
```

8. NestHelper creates the final balance as a Stripe Invoice so the customer/admin can see the breakdown. Stripe automatic tax stays disabled; optional manual sales tax is added only when admin checks the manual sales-tax box before creating the invoice.
9. If the customer chose auto-charge and Stripe saved the payment method, the dashboard shows only **Create invoice + auto-charge saved card**. The manual sender buttons are hidden to avoid double charging.
10. If the customer chose invoice-before-delivery, admin sends the final Stripe invoice. Laundry is held until the final invoice is fully paid.
11. When the final invoice is paid, the webhook marks the request as `Fully Paid` and `Final Balance Paid`.

Use standard Laundry Rescue values:

```text
Intro launch rate: $2.25/lb
Standard deposit/minimum credit before tax: $59
Internal discount mode now uses the same Laundry Rescue minimum/intro launch rate unless you manually enter a custom amount.
```


## Laundry Rescue tax and final-balance choice note

Laundry Rescue deposits created from either Quick Checkout or the saved Family Payment Breakdown are Checkout Sessions, not normal Stripe invoices, so Stripe can collect the customer’s required final-balance choice: auto-charge saved card after weigh-in, or email final invoice before delivery. The final balance after dry weight remains a Stripe invoice with line-item details.

Laundry Rescue tax is not forced through Stripe automatic tax. Admin can add manual Washington sales tax to deposit checkout and final balance invoices only when needed and after verifying the rate.
