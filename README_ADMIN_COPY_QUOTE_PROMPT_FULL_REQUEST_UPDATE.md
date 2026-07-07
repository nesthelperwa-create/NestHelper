# Admin Copy Quote Prompt Full Request Update

Files included:
- components/admin/AdminTable.tsx

What changed:
- Rebuilt the admin dashboard “Copy quote prompt” text generator so copied prompts include a much more complete request summary.
- Kept the standard NestHelper quote rules and current pricing guidance at the top of the copied prompt.
- Added new quote-prompt instructions:
  - Carefully review all fields, including raw submitted fields, before giving the quote recommendation.
  - Do not ignore access notes, customer-provided supplies, add-ons, photos, or special instructions.
  - If any field conflicts, flag the conflict and ask for clarification.
- Added sectioned request summaries:
  - Customer / contact
  - Service / request
  - Address / access
  - Home cleaning / parent reset fields
  - Laundry Rescue fields
  - Move / organizing / commercial fields
  - Photos / uploads
- Added a final safety-net section called:
  - Raw submitted fields / full request data
- The raw field dump flattens nested request data where possible and includes non-empty fields that were not mapped into the formatted sections.
- Photo data URLs are summarized instead of pasting huge base64 image data into the clipboard.
- Laundry Rescue prompts now include the Laundry Rescue reply/payment process when the selected service is Laundry Rescue.
- Updated Laundry Rescue pricing guidance to the current intro launch wording: $59 minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs; additional laundry is $2.25/lb.

Why:
- Some request details such as customer-provided detergent, parking/access notes, garage/porch/remote access instructions, supply preferences, add-ons, and nested fields were easy to miss in the old copied prompt.
- The raw submitted field dump gives ChatGPT a backup view of the full request so quote recommendations do not miss important details.

No dependencies, Stripe logic, Firebase rules, Firestore writes, public request form, or admin payment behavior were changed.
