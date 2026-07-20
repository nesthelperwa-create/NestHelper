# Status Email Note Formatting Update

Files included:
- lib/sendStatusUpdateEmail.ts

What changed:
- Updates the customer status-update email note block so Outlook preserves the way the admin note was typed.
- Converts single line breaks into real HTML line breaks.
- Converts blank lines into paragraph breaks.
- Keeps note text escaped before inserting into email HTML.

Why:
- The prior email used CSS `white-space: pre-wrap`, which many email clients, especially Outlook desktop, do not consistently respect.
- Outlook was collapsing the admin note into one run-on paragraph.

What did NOT change:
- No status workflow logic.
- No admin dashboard UI logic.
- No request data logic.
- No Stripe logic.
- No payment logic.
- No tax rules.
- No pricing math.
- No email recipients or routing logic.
