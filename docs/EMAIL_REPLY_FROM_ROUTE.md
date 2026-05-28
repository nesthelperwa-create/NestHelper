# Reply from the routed NestHelper alias

This update sends website admin notification emails to the routed NestHelper alias instead of `nesthelperwa@gmail.com` or only `hello@nesthelperwa.com`.

Examples:

- Billing contact topic -> admin notice is sent to `billing@nesthelperwa.com`
- Laundry contact topic -> admin notice is sent to `laundry@nesthelperwa.com`
- Support/general contact topic -> admin notice is sent to `support@nesthelperwa.com` or `hello@nesthelperwa.com`
- Service request -> admin notice is sent to `requests@nesthelperwa.com`
- Helper application -> admin notice is sent to `helpers@nesthelperwa.com`
- Partner application -> admin notice is sent to `partners@nesthelperwa.com`

The admin email still uses the customer's email as the Reply-To address. That means when you click Reply, the reply should go to the customer.

To make Gmail automatically reply from the same NestHelper alias, Gmail must be configured with each alias under **Send mail as**, and Gmail should be set to reply from the same address the message was sent to.

Recommended Gmail send-as aliases:

- `hello@nesthelperwa.com`
- `support@nesthelperwa.com`
- `billing@nesthelperwa.com`
- `laundry@nesthelperwa.com`
- `requests@nesthelperwa.com`
- `booking@nesthelperwa.com`
- `helpers@nesthelperwa.com`
- `partners@nesthelperwa.com`

For a simpler workflow, you can reply from Namecheap Private Email webmail instead of Gmail, but make sure the From address is correct before sending.
