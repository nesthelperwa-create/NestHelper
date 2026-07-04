# NestHelper Parent Reset Meal Prep Update

This update adds simple in-home meal prep support to the Parent Reset Plan request flow and related website wording.

## What changed

- Added “Simple in-home meal prep support” as a Parent Reset Plan priority.
- When selected, the request form now asks for simple meal prep tasks, notes/instructions, and a required acknowledgement.
- Clarified that meal prep is limited to simple prep inside the customer’s home using the customer’s food, kitchen, tools, containers, and instructions.
- Clarified exclusions: no catering, private-chef service, full meal cooking, off-site food prep, nutrition planning, medical dietary decisions, or NestHelper-provided food.
- Added meal prep fields to allowed public request payloads.
- Added meal prep details to admin request display, customer confirmation email summary, quote prompt fields, service cards, services page, request page, FAQ, service scope policy, and site metadata.

## Files included

- app/page.tsx
- app/request/page.tsx
- app/services/page.tsx
- app/faq/page.tsx
- app/layout.tsx
- components/forms/RequestForm.tsx
- components/ServiceCard.tsx
- components/admin/AdminTable.tsx
- lib/services.ts
- lib/publicFormSecurity.ts
- lib/sendCustomerConfirmationEmail.ts
- lib/policies.ts
