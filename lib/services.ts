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
  recurringRates?: { cadence: string; price: string; note?: string }[];
  note?: string;
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
    serviceTime: "2 hours of in-home help",
    travelInfo: "Core Eastside service area",
    image: "/assets/services/service-parent-reset.png",
    stripeStandardEnv: "STRIPE_PRICE_PARENT_RESET_STANDARD",
    recurringRates: [
      { cadence: "Every 2 weeks", price: "$125/visit" },
      { cadence: "Weekly", price: "$119/visit" }
    ]
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
    serviceTime: "3 hours of in-home help",
    travelInfo: "Core Eastside service area",
    image: "/assets/services/service-family-reset.png",
    stripeStandardEnv: "STRIPE_PRICE_FAMILY_RESET_STANDARD",
    recurringRates: [
      { cadence: "Every 2 weeks", price: "$189/visit" },
      { cadence: "Weekly", price: "$179/visit" }
    ]
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
    serviceTime: "4 hours of helper time",
    travelInfo: "Core Eastside service area",
    image: "/assets/services/service-helper-block.png",
    stripeStandardEnv: "STRIPE_PRICE_HELPER_BLOCK_STANDARD",
    recurringRates: [
      { cadence: "Every 2 weeks", price: "$269/visit" },
      { cadence: "Weekly", price: "$259/visit" }
    ]
  },

  {
    id: "whole-home-reset",
    title: "Whole Home Reset",
    shortTitle: "Whole Home",
    description: "Regular whole-home cleaning for families who need the main rooms cleaned in one visit — quoted after review.",
    details: [
      "Standard full-home cleaning for main living areas, kitchen, bathrooms, bedrooms, and reachable surfaces",
      "Good fit for regular cleaning, first-visit cleaning, or recurring maintenance after review",
      "Home size, bedroom/bath count, condition, pets, access, and photos help us quote accurately",
      "Optional detail add-ons like interior fridge, interior oven, baseboards, pet hair focus, or linens can be requested",
      "Best when the goal is the whole home, not just one room or specific area"
    ],
    standardPrice: "Quoted after review",
    priceNote: "Size + condition reviewed",
    serviceTime: "Scope-based visit, usually 3–6+ hours",
    travelInfo: "Core Eastside/Northshore service area",
    image: "/assets/services/service-family-reset.png",
    note: "Whole Home Reset requests are reviewed before checkout. Square footage, bedroom/bathroom count, cleaning level, condition, pets, access, optional detail add-ons, photos, and scheduling all affect the quote. Recurring maintenance can be discussed after the first approved visit."
  },
  {
    id: "specific-area-reset",
    title: "Specific Area(s) Reset",
    shortTitle: "Area Reset",
    description: "Focused help for specific rooms or zones — kitchen, bathroom(s), garage, pantry, closet, playroom, laundry room, or other areas — with optional detailed cleaning add-ons quoted after review.",
    details: [
      "Select the room or rooms that need help, such as kitchen, bathroom(s), garage, pantry, closet, playroom, or laundry room",
      "Choose the visit type: light reset, standard cleaning, deep detail focus, cleaning + organizing, or organizing only",
      "Add detail items like interior fridge, interior oven, inside cabinets/drawers, shower buildup, floors, baseboards, donation prep, or Smart Labels",
      "Good for kitchen + bath requests without turning NestHelper into a generic full-house maid service",
      "Interior appliances, heavy buildup, large clutter, donation/trash prep, and specialty needs are reviewed before quoting"
    ],
    standardPrice: "Quoted after review",
    priceNote: "Rooms + add-ons reviewed",
    serviceTime: "Scope-based visit, usually 2–4+ hours",
    travelInfo: "Core Eastside/Northshore service area",
    image: "/assets/services/service-specific-area-reset.png",
    note: "Specific Area(s) Resets are reviewed before checkout. The selected rooms, cleaning type, detailed add-ons, size/count, photos, buildup or clutter level, access, product preferences, customer-arranged trash/donation prep, and safety notes all affect the quote. Kitchen + Bath Reset requests fit here. NestHelper does not provide dump runs, junk hauling, hazardous material disposal, pest/biohazard cleanup, mold remediation, or unsafe heavy lifting."
  },
  {
    id: "move-out-cleaning",
    title: "Move-In / Move-Out Cleaning",
    shortTitle: "Move-In / Out Clean",
    description: "Empty-home cleaning for move-ins, move-outs, rentals, and listing prep — quoted after review.",
    details: [
      "Empty or mostly empty home cleaning",
      "Kitchen and bathroom focus",
      "Floors, baseboards, surfaces, and touchpoints",
      "Inside cabinets, drawers, or appliances when requested",
      "Non-toxic or low-odor product preference reviewed"
    ],
    standardPrice: "Quoted after review",
    priceNote: "Square footage + condition reviewed",
    serviceTime: "Scope-based visit, usually 2–6+ hours",
    travelInfo: "Core Eastside/Northshore service area",
    image: "/assets/services/service-move-out-cleaning.png",
    note: "Move-in / move-out cleaning is reviewed before checkout. Square footage, empty-home status, photos, kitchen/bathroom condition, appliance requests, access notes, and timing all affect the quote."
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
    note: "Best for nearby errands in and around Bothell, Woodinville, Kirkland, Redmond, and nearby Eastside/Northshore communities. Longer routes can be reviewed before checkout."
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
