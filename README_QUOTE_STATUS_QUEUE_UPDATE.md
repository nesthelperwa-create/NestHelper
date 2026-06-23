# NestHelper Quote Status / Queue Cleanup

This update makes the Service Requests dashboard less confusing when a quote is sent but no Stripe payment link/invoice has been sent yet.

## What changed

- Adds a separate **Quote sent** work-queue bucket for requests that are waiting for customer approval.
- Renames the old **Payment sent** queue bucket to **Invoice / checkout sent** so it only means an actual payment link or invoice is waiting for payment.
- Keeps **Quote Sent** out of the payment-sent bucket.
- Adds **Quote Drafted** as a clearer status instead of using the ambiguous old **Quoted** wording for new commercial quote drafts.
- Adds clearer helper text in the status update panel:
  - Use **Quote Sent** for quote emails.
  - Use checkout/invoice statuses only after creating a real Stripe payment link or invoice.
- Improves the customer email copy for **Quote Sent** and **Quote Approved** status emails.

## Files changed

- `components/admin/AdminTable.tsx`
- `components/admin/StatusBadge.tsx`
- `app/admin/requests/page.tsx`
- `app/api/admin/update-commercial-quote/route.ts`
- `lib/sendStatusUpdateEmail.ts`

## Local install

From PowerShell:

```powershell
cd C:\Users\inwin\nesthelper_nextjs_site

$temp = "$env:TEMP\nesthelper_quote_status_queue_update"
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue

Expand-Archive "$env:USERPROFILE\Downloads\nesthelper_quote_status_queue_update.zip" -DestinationPath $temp -Force
Copy-Item "$temp\nesthelper_quote_status_queue_update\*" . -Recurse -Force
Remove-Item $temp -Recurse -Force

npm run build
git status
git add components/admin/AdminTable.tsx components/admin/StatusBadge.tsx app/admin/requests/page.tsx app/api/admin/update-commercial-quote/route.ts lib/sendStatusUpdateEmail.ts README_QUOTE_STATUS_QUEUE_UPDATE.md
git commit -m "Clarify quote and payment queue statuses"
git push
```

## After deploy

For Vicki's request, it should show as **Quote Sent** and appear in the **Quote sent** queue bucket, not the **Invoice / checkout sent** bucket, unless you later create/send a Stripe invoice or checkout link.
