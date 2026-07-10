# Request Origin Badges Update

Files included:
- components/admin/AdminTable.tsx

What changed:
- Adds small admin list badges so created follow-up/repeat rows are easier to spot:
  - Repeat
  - Follow-up
  - Recurring
- Badges show on both mobile cards and the desktop table in the Status column.
- Badge detection uses safe existing fields:
  - isRepeatRequest / repeatLaundry / repeatFromRequestId
  - isFollowUpRequest / followUpFromRequestId
  - isRecurringServiceRequest
  - Repeat Scheduled / Follow-up Scheduled / Recurring Scheduled status text

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment logic.
- No customer form logic.
- No customer emails.
- No request creation logic.
- No status update logic.
- No recurring/follow-up behavior.

This is a visual admin-list polish update only.
