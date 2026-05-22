# Payment Approval Flow

## Goal

Keep NestHelper as a concierge beta instead of an instant-booking site.

Customers submit a request first. Admin reviews it. Admin sends payment only after the job looks safe, serviceable, and available.

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
   - `Founding / beta price`
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
