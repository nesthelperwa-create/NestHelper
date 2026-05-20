export type Service = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  details: string[];
  standardPrice: string;
  foundingPrice: string;
  image: string;
  stripeStandardEnv?: string;
  stripeFoundingEnv?: string;
  note?: string;
};

export const services: Service[] = [
  {
    id: "parent-reset-2hr",
    title: "2-Hour Parent Reset",
    shortTitle: "Parent Reset",
    description: "Light home reset help so you can breathe again.",
    details: ["Kitchen reset", "Toy and living area tidy", "Dishes, counters, surfaces", "Light folding or organizing", "Simple parent relief tasks"],
    standardPrice: "$129",
    foundingPrice: "$89",
    image: "/assets/services/service-parent-reset.png",
    stripeStandardEnv: "STRIPE_PRICE_PARENT_RESET_STANDARD",
    stripeFoundingEnv: "STRIPE_PRICE_PARENT_RESET_FOUNDING"
  },
  {
    id: "family-reset-3hr",
    title: "3-Hour Family Reset",
    shortTitle: "Family Reset",
    description: "A deeper household catch-up for families who need more breathing room.",
    details: ["Everything in Parent Reset", "More time for laundry/folding", "Pantry or entry reset", "Kids area tidy", "Light household support"],
    standardPrice: "$179",
    foundingPrice: "$139",
    image: "/assets/services/service-family-reset.png",
    stripeStandardEnv: "STRIPE_PRICE_FAMILY_RESET_STANDARD",
    stripeFoundingEnv: "STRIPE_PRICE_FAMILY_RESET_FOUNDING"
  },
  {
    id: "helper-block-4hr",
    title: "4-Hour Helper Block",
    shortTitle: "Helper Block",
    description: "Half-day help for bigger resets, catch-up lists, and home support.",
    details: ["Flexible task block", "Home reset support", "Laundry folding/put-away help", "Errands by approval", "Custom checklist"],
    standardPrice: "$239",
    foundingPrice: "$179",
    image: "/assets/services/service-helper-block.png",
    stripeStandardEnv: "STRIPE_PRICE_HELPER_BLOCK_STANDARD",
    stripeFoundingEnv: "STRIPE_PRICE_HELPER_BLOCK_FOUNDING"
  },
  {
    id: "errand-helper",
    title: "Errand Helper",
    shortTitle: "Errand Helper",
    description: "Groceries, returns, pickup/drop-off errands, and family logistics help.",
    details: ["Grocery pickup", "Returns/drop-offs", "Prescription pickup only if legally allowed and approved", "No alcohol, weapons, controlled substances", "Mileage/travel limits may apply"],
    standardPrice: "$109",
    foundingPrice: "$79",
    image: "/assets/services/service-errand-helper.png",
    stripeStandardEnv: "STRIPE_PRICE_ERRAND_STANDARD",
    stripeFoundingEnv: "STRIPE_PRICE_ERRAND_FOUNDING"
  },
  {
    id: "laundry-rescue",
    title: "Laundry Rescue",
    shortTitle: "Laundry Rescue",
    description: "Pickup, dry weigh-in, wash/fold coordination, and return delivery.",
    details: ["Dry weight confirmed at pickup", "$2.99/lb standard", "$2.49/lb Founding Family beta", "Baby/sensitive detergent add-on", "Final balance sent after weigh-in"],
    standardPrice: "$59 minimum + $2.99/lb",
    foundingPrice: "$49 minimum + $2.49/lb",
    image: "/assets/services/service-laundry-rescue.png",
    stripeStandardEnv: "STRIPE_PRICE_LAUNDRY_DEPOSIT_STANDARD",
    stripeFoundingEnv: "STRIPE_PRICE_LAUNDRY_DEPOSIT_FOUNDING",
    note: "Laundry is billed by dry weight. Deposit applies to final total. Final balance is sent through Stripe invoice/payment link after pickup weigh-in."
  }
];

export const laundryAddOns = [
  "Baby & Sensitive Skin Detergent +$5/order",
  "Fragrance-free detergent +$5/order",
  "Customer-provided detergent, no fee",
  "Low heat dry +$3/order",
  "Hang dry items +$5-$10 depending on amount",
  "Rush return +$15-$25 when available",
  "Bulky items quoted separately"
];
