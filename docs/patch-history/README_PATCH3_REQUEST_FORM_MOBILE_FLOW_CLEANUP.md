# Patch 3 Request Form Mobile Flow Cleanup

Files included:
- components/forms/RequestForm.tsx

What changed:
- Reordered the top of the request form so customers choose the service and timing before entering the full service address.
- Tightened the request form intro copy so the direction is simpler on mobile.
- Kept the form as one page, but made the order feel more natural:
  1. Contact information
  2. Choose service and timing
  3. Service address
  4. Service-specific questions
  5. Access notes
  6. Optional photos
- Simplified the Move Prep add-on display so only supply kit descriptions stay visible by default; other add-on descriptions appear after selection.
- Removed lingering laundry wording from the Move Prep helper text.
- Clarified “After-move kitchen setup/reset” in the Move Prep pricing guide.
- Improved Laundry Rescue flow:
  - Added a return/drop-off spot field.
  - Moved “Customer-provided detergent, no fee” into the detergent dropdown.
  - Removed customer-provided detergent from the general laundry add-ons list.
  - Added a clear note telling customers to leave their detergent with the laundry.
  - Strengthened garage/porch/remote access note wording.

No Stripe, Firebase, admin, backend, checkout, pricing logic, icons, or dependency changes were made.
