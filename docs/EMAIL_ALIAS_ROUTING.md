# NestHelper email alias routing

This update keeps `hello@nesthelperwa.com` as the main public email while using the new aliases for clearer routing.

## Public website emails

The website now shows only the most useful public addresses:

- `hello@nesthelperwa.com` — general questions
- `support@nesthelperwa.com` — existing customer support
- `billing@nesthelperwa.com` — checkout, invoice, deposit, and payment questions
- `laundry@nesthelperwa.com` — Laundry Rescue questions
- `helpers@nesthelperwa.com` — individual helper questions
- `partners@nesthelperwa.com` — local provider / contractor questions

The other aliases can remain active behind the scenes, but they do not need to be displayed on the public website.

## Contact form routing

The contact form now includes a Topic dropdown. The selected topic routes admin notifications to the matching alias:

- General question → `hello@nesthelperwa.com`
- Existing request or service issue → `support@nesthelperwa.com`
- New request or booking question → `booking@nesthelperwa.com`
- Billing or payment question → `billing@nesthelperwa.com`
- Laundry Rescue question → `laundry@nesthelperwa.com`
- Helper application question → `helpers@nesthelperwa.com`
- Partner/provider question → `partners@nesthelperwa.com`

## Form notification routing

Website form alerts route like this:

- Request form → `requests@nesthelperwa.com`
- Helper application → `helpers@nesthelperwa.com`
- Partner application → `partners@nesthelperwa.com`
- Contact form → based on selected topic

Customer confirmation emails also use the best matching Reply-To address.

## Optional Vercel environment variables

The code has safe defaults, so you do not need to add these unless you want to change an address later.

```txt
NESTHELPER_HELLO_EMAIL=hello@nesthelperwa.com
NESTHELPER_SUPPORT_EMAIL=support@nesthelperwa.com
NESTHELPER_BOOKING_EMAIL=booking@nesthelperwa.com
NESTHELPER_REQUESTS_EMAIL=requests@nesthelperwa.com
NESTHELPER_BILLING_EMAIL=billing@nesthelperwa.com
NESTHELPER_LAUNDRY_EMAIL=laundry@nesthelperwa.com
NESTHELPER_HELPERS_EMAIL=helpers@nesthelperwa.com
NESTHELPER_PARTNERS_EMAIL=partners@nesthelperwa.com
```

For public display changes only, these optional variables are available:

```txt
NEXT_PUBLIC_CONTACT_EMAIL=hello@nesthelperwa.com
NEXT_PUBLIC_SUPPORT_EMAIL=support@nesthelperwa.com
NEXT_PUBLIC_BILLING_EMAIL=billing@nesthelperwa.com
NEXT_PUBLIC_LAUNDRY_EMAIL=laundry@nesthelperwa.com
NEXT_PUBLIC_HELPERS_EMAIL=helpers@nesthelperwa.com
NEXT_PUBLIC_PARTNERS_EMAIL=partners@nesthelperwa.com
```
