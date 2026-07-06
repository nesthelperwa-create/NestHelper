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
    title: "Parent Reset Plan",
    shortTitle: "Parent Reset",
    description: "A 3-hour room reset for busy parents who need organizing, light cleaning, child-safe disinfecting, and optional simple in-home meal prep support in the spaces their family uses most.",
    details: [
      "3-hour parent-focused room reset",
      "Playroom, kids room, living area, pantry, entry, or laundry area help",
      "Organizing, sorting, and putting everyday items back in place",
      "Light cleaning of reachable surfaces and accessible floors",
      "Simple in-home meal prep support, like washing/chopping produce or portioning snacks, when requested",
      "Child-safe disinfecting for high-touch family areas"
    ],
    standardPrice: "$199",
    priceNote: "Flat 3-hour parent reset",
    serviceTime: "3 hours of reset help",
    travelInfo: "Core Eastside service area",
    image: "/assets/services/service-family-reset.png",
    stripeStandardEnv: "STRIPE_PRICE_FAMILY_RESET_STANDARD",
    recurringRates: [
      { cadence: "Every 2 weeks", price: "$189/visit" },
      { cadence: "Weekly", price: "$179/visit" }
    ],
    note: "Parent Reset Plan is for organizing selected family spaces with light cleaning, child-safe disinfecting, and optional simple in-home meal prep support when requested. Meal prep is limited to simple prep inside the customer’s home using the customer’s food, kitchen, tools, containers, and instructions. It is not childcare, catering, private-chef service, off-site food prep, nutrition planning, a full-home cleaning plan, or a move-in / move-out clean."
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
    title: "Whole Home Cleaning",
    shortTitle: "Whole Home",
    description: "Choose this for full-home cleaning help, including first-time deep cleans and ongoing maintenance.",
    details: [
      "Entire home cleaning help",
      "First-time deep clean of the entire home",
      "First-time deep clean + recurring maintenance",
      "Weekly, bi-weekly, or monthly full-home maintenance",
      "General whole-home cleaning help"
    ],
    standardPrice: "Quoted after review",
    priceNote: "Size + condition reviewed",
    serviceTime: "Scope-based visit, usually 3–6+ hours",
    travelInfo: "Core Eastside/Northshore service area",
    image: "/assets/services/service-whole-home-reset.png",
    note: "Whole Home Cleaning requests are reviewed before checkout. Square footage, bedroom/bathroom count, visit type, condition, pets, access, optional detail add-ons, photos, and scheduling all affect the quote. Use this for the entire home; use Specific Area(s) Reset for selected rooms or focused areas only."
  },
  {
    id: "specific-area-reset",
    title: "Specific Area(s) Reset",
    shortTitle: "Area Reset",
    description: "Choose this when you only need help with selected rooms or focused areas — not the entire home.",
    details: [
      "Selected rooms or areas only, such as kitchen, bathroom(s), bedrooms, playroom, pantry, laundry area, garage, or a few rooms",
      "Kitchen add-ons can include interior fridge, interior oven, cabinets, dishes/sink, and appliance exteriors",
      "Bathroom add-ons can include shower/tub buildup, toilet/vanity/sink detail, mirrors, grout, or soap-scum focus",
      "Optional repeat area support every 2 weeks or monthly",
      "Best when you do not need the entire home cleaned"
    ],
    standardPrice: "Quoted after review",
    priceNote: "Rooms + add-ons reviewed",
    serviceTime: "Scope-based visit, usually 2–4+ hours",
    travelInfo: "Core Eastside/Northshore service area",
    image: "/assets/services/service-specific-area-reset.png",
    note: "Specific Area(s) Resets are reviewed before checkout. The selected rooms, repeat area support preference, cleaning type, detailed add-ons, size/count, photos, buildup or clutter level, access, product preferences, customer-arranged trash/donation prep, and safety notes all affect the quote. Kitchen + Bath Reset requests fit here. NestHelper does not provide dump runs, junk hauling, hazardous material disposal, pest/biohazard cleanup, mold remediation, or unsafe heavy lifting."
  },
  {
    id: "move-out-cleaning",
    title: "Move-In / Move-Out Cleaning",
    shortTitle: "Move-In / Out Clean",
    description: "Choose this for empty or mostly empty homes before moving in, after moving out, or before listing/renting.",
    details: [
      "Empty or mostly empty homes",
      "Before moving in or after moving out",
      "Before listing, renting, or turnover-style cleaning",
      "Kitchen, bathrooms, floors, baseboards, surfaces, and touchpoints",
      "Inside cabinets, drawers, or appliances when requested"
    ],
    standardPrice: "Quoted after review",
    priceNote: "Square footage + condition reviewed",
    serviceTime: "Scope-based visit, usually 2–6+ hours",
    travelInfo: "Core Eastside/Northshore service area",
    image: "/assets/services/service-move-out-cleaning.png",
    note: "Move-in / move-out cleaning is reviewed before checkout. Square footage, empty-home status, photos, kitchen/bathroom condition, appliance requests, access notes, and timing all affect the quote."
  },
  {
    id: "move-prep-home-reset",
    title: "Move Prep & Home Reset",
    shortTitle: "Move Prep",
    description: "Movers handle the heavy lifting. NestHelper helps with the home reset — in-home move prep, sorting support, open-first essentials boxes, QR Smart Labels, supplies, laundry help, and move-in reset support.",
    details: [
      "Move prep, sorting support, and room-by-room priority help",
      "Open-first essentials boxes for first night, kitchen, kids, pets, bathroom, or work items",
      "QR Smart Label setup for boxes, bins, shelves, closets, or storage areas",
      "Packing supply kits available from $59–$199",
      "Donation sorting, laundry help, unpacking, and move-in reset support",
      "Move-out cleaning can be requested, but it is quoted separately"
    ],
    standardPrice: "From $199",
    priceNote: "Up to 2 helper-hours",
    serviceTime: "Move prep packages from 2–3.5 helper-hours",
    travelInfo: "Core Eastside/Northshore service area",
    image: "/assets/services/service-move-out-cleaning.png",
    note: "Movers handle the heavy lifting. NestHelper helps with the home reset. NestHelper does not transport household goods or operate as a moving company. We provide in-home move prep, organizing, labeling, cleaning, unpacking, and reset support. Move Prep Add-On starts at $199 for up to 2 helper-hours; Focused Room Prep is $249 up to 2.5 helper-hours; Kitchen Essentials Prep is $349 up to 3.5 helper-hours; Move-In Essentials Reset is $299 up to 3 helper-hours; Smart Label Setup is $99 up to 20 QR labels; Supply Kits are $59–$199; garage, storage areas, sheds, and heavy clutter are custom quote after review. Additional approved time is $65 per helper-hour with a 1-hour minimum. Move-out cleaning is quoted separately."
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
    description: "Pickup, dry weigh-in, wash, dry, fold, and return delivery.",
    details: [
      "Dry weight confirmed at pickup",
      "Laundry Rescue intro launch pricing: $59 minimum + $2.25/lb.",
      "Wash, dry, fold, and return",
      "Eco-friendly detergent available",
      "Auto-charge or invoice after weigh-in"
    ],
    standardPrice: "$59 minimum + $2.25/lb",
    priceNote: "Intro launch pricing",
    serviceTime: "Pickup + return window scheduled",
    travelInfo: "Dry weight confirmed at pickup",
    image: "/assets/services/service-laundry-rescue.png",
    stripeStandardEnv: "STRIPE_PRICE_LAUNDRY_DEPOSIT_STANDARD",
    note: "Laundry Rescue intro launch pricing: $59 minimum + $2.25/lb. Includes wash, dry, fold, and return; eco-friendly detergent is available. Laundry is billed by dry weight. The non-refundable minimum/deposit is credited before tax toward the final total, and any remaining balance is handled by the checkout option selected: auto-charge after review or invoice before delivery."
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
