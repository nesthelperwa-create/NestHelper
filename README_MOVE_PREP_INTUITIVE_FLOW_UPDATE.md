# Move Prep Intuitive Flow Update

Files included:
- components/forms/RequestForm.tsx

What changed:
- Removed the confusing Supplies / packing kit dropdown from the Move Prep flow.
- Removed unrelated options like fragrance-free products from Move Prep.
- Split the Move Prep section into a clearer flow:
  1. Before-move help included in the starting package
  2. Optional priced add-ons
  3. Separate quote or review items
- Kept unpacking/home reset, kitchen reset, QR labels, supply kits, and laundry as priced add-ons.
- Made packing supplies a charged add-on starting at $59, with larger kits reviewed before checkout.

No pricing checkout logic, Stripe, Firebase, admin, or dependency changes were made.
