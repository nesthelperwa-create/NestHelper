Commercial service-address tax support update

What this update does
- Updates the Commercial Reset invoice route so Stripe receives the saved commercial service address as the Stripe customer address and shipping/service address.
- Keeps Commercial Reset quote/page/form layout unchanged.
- Keeps Commercial Reset line-item tax behavior:
  - taxable commercial add-on/specialty/reset lines use the commercial cleaning tax code and Stripe automatic tax
  - routine/repetitive janitorial-style lines use the nontaxable tax code
- Blocks sending a taxable commercial invoice if the saved service address is missing the ZIP code needed for Stripe Tax.
- Saves tax status, service address, taxable line count, and nontaxable line count back to the admin request record.

After applying
- Create a new Commercial Reset invoice from a request with a full service address.
- Old Stripe invoice links will not update; create a new invoice to test.
- No Firebase rules deploy is needed.
