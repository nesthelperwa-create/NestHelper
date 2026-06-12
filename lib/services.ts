export type Service = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  details: string[];
  standardPrice: string;
  priceNote: string;
  serviceTime: string;
  travelInfo?: string;
  image: string;
  stripeStandardEnv?: string;
  note?: string;
  recurringRates?: {
    biweekly: string;
    weekly: string;
  };
};

export const services: Service[] = [
  {
    id: "parent-reset-2hr",
    title: "2-Hour Parent Reset",
    shortTitle: "Parent Reset",
    description: "A focused home reset for the daily pile-up so you can breathe again.",
    details: [
      "Kitchen reset",
      "Toy and living area tidy",
      "Dishes, counters, and surfaces",
      "Light folding or organizing",
      "Simple parent relief tasks"
    ],
    standardPrice: "$129",
    priceNote: "Flat 2-hour visit",
    recurringRates: { biweekly: "$125/visit", weekly: "$119/visit" },
    serviceTime: "2 hours of in-home help",
    travelInfo: "Core Eastside service area",
    image: "/assets/services/service-parent-reset.png",
    stripeStandardEnv: "STRIPE_PRICE_PARENT_RESET_STANDARD"
  },
  {
    id: "family-reset-3hr",
    title: "3-Hour Family Reset",
    shortTitle: "Family Reset",
    description: "A deeper household catch-up for families who need more breathing room.",
    details: [
      "Everything in Parent Reset",
      "More time for laundry/folding",
      "Pantry, entry, or kids area reset",
      "Light household support",
      "Priority checklist help"
    ],
    standardPrice: "$199",
    priceNote: "Flat 3-hour visit",
    recurringRates: { biweekly: "$189/visit", weekly: "$179/visit" },
    serviceTime: "3 hours of in-home help",
    travelInfo: "Core Eastside service area",
    image: "/assets/services/service-family-reset.png",
    stripeStandardEnv: "STRIPE_PRICE_FAMILY_RESET_STANDARD"
  },
  {
    id: "helper-block-4hr",
    title: "4-Hour Helper Block",
    shortTitle: "Helper Block",
    description: "Half-day help for bigger resets, catch-up lists, and approved home support.",
    details: [
      "Flexible task block",
      "Home reset support",
      "Laundry folding/put-away help",
      "Approved errands or pickup help",
      "Custom checklist for the visit"
    ],
    standardPrice: "$279",
    priceNote: "Flat 4-hour visit",
    recurringRates: { biweekly: "$269/visit", weekly: "$259/visit" },
    serviceTime: "4 hours of helper time",
    travelInfo: "Core Eastside service area",
    image: "/assets/services/service-helper-block.png",
    stripeStandardEnv: "STRIPE_PRICE_HELPER_BLOCK_STANDARD"
  },
  {
    id: "errand-helper",
    title: "Errand Helper",
    shortTitle: "Errand Helper",
    description: "A local errand block for groceries, returns, pickups, and approved family logistics.",
    details: [
      "Up to 2 hours of errand help",
      "Up to 15 driving miles included",
      "Groceries, returns, and approved pickup/drop-off tasks",
      "Extra distance or complex stops quoted before checkout",
      "No alcohol, weapons, controlled substances, or unsafe requests"
    ],
    standardPrice: "$119",
    priceNote: "Up to 2 hours + 15 miles",
    serviceTime: "Up to 2 hours",
    travelInfo: "Up to 15 driving miles included",
    image: "/assets/services/service-errand-helper.png",
    stripeStandardEnv: "STRIPE_PRICE_ERRAND_STANDARD",
    note: "Best for nearby errands in and around Woodinville, Bothell, Kirkland, Redmond, and nearby Eastside communities. Longer routes can be reviewed before checkout."
  },
  {
    id: "laundry-rescue",
    title: "Laundry Rescue",
    shortTitle: "Laundry Rescue",
    description: "Pickup, dry weigh-in, wash/fold coordination, and return delivery.",
    details: [
      "Dry weight confirmed at pickup",
      "$59 minimum + $2.99/lb",
      "Pickup and return delivery",
      "Baby/sensitive or fragrance-free detergent add-on",
      "Auto-charge or invoice after weigh-in"
    ],
    standardPrice: "$59 minimum + $2.99/lb",
    priceNote: "Minimum + per-pound pricing",
    serviceTime: "Pickup + return window scheduled",
    travelInfo: "Dry weight confirmed at pickup",
    image: "/assets/services/service-laundry-rescue.png",
    stripeStandardEnv: "STRIPE_PRICE_LAUNDRY_DEPOSIT_STANDARD",
    note: "Laundry is billed by dry weight. The non-refundable deposit is credited before tax toward the final total, and any remaining balance is handled by the checkout option selected: auto-charge after review or invoice before delivery."
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
