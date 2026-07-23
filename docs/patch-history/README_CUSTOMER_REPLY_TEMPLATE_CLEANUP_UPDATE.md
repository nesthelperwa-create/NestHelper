# Customer Reply Template Cleanup Update

Files included:
- lib/sendAdminEmail.ts

What changed:
- Cleans up the customer reply template generated from admin notification emails.
- Removes the raw request dump from customer-facing reply drafts.
- Stops including internal/campaign fields like gclid, campaignSource, campaignLandingPage, timestamps, duplicate address fields, upload metadata, and raw field keys in customer replies.
- Replaces the raw details section with a short customer-friendly line saying NestHelper has the request details/photos on file and the customer can reply with changes.

What stays the same:
- The admin notification email still includes the full raw request details for Leo/Gen to review.
- The admin dashboard data is unchanged.
- The compose/reply button still opens a draft email to the customer.
- Service-specific intro wording is preserved.

What did NOT change:
- No request form logic.
- No admin dashboard UI logic.
- No routing logic.
- No Stripe logic.
- No payment logic.
- No tax rules.
- No pricing math.
