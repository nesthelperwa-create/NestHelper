# Move Prep Package Explanation Update

This small update makes the Move Prep & Home Reset request flow easier to understand.

Changed file:

- `components/forms/RequestForm.tsx`

What changed:

- Reordered the Move Prep starting package dropdown from smaller/simple packages to larger/custom review items.
- Moved `Not sure — recommend after review` to the bottom of the dropdown.
- Set the default starting point to `Move Prep Add-On — starts at $199, up to 2 helper-hours`.
- Added one short helper sentence that changes based on the selected package, so the form explains the choice without adding long paragraphs.
- Added a collapsed `Quick package guide` so customers can open it only if they want more explanation.
- Reordered the focus checklist so normal focus areas appear first and separate quote triggers are near the bottom.
- Renamed the checkbox section to `What should we focus on?`.

No intentional changes to Stripe, Google Ads, Firebase, admin routes, login/auth, service cards, or service card alignment.
