"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, Gift, MapPin } from "lucide-react";
import { services, laundryAddOns } from "@/lib/services";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import { focusFirstInvalidField } from "@/lib/formInvalidFocus";
import { PhotoUploadField, photoUploadSummary, type PhotoUpload } from "@/components/forms/PhotoUploadField";
import { mergeCampaignAttribution } from "@/lib/campaignAttribution";

const defaultState = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  address2: "",
  city: "",
  state: "WA",
  zip: "",
  service: "",
  preferredDate: "",
  preferredWindow: "",
  alternateDate: "",
  urgency: "Flexible around my preferred date",
  promoCode: "",
  howFoundUs: "",
  howFoundUsDetails: "",
  campaignSource: "",
  campaignMedium: "",
  campaignName: "",
  campaignContent: "",
  campaignTerm: "",
  campaignLandingPage: "",
  campaignReferrer: "",
  campaignCapturedAtIso: "",
  incomingReferralCode: "",
  incomingReferralProgram: "",
  incomingReferralLandingPage: "",
  homeType: "Single-family home",
  pets: "No pets",
  petDetails: "",
  parkingAccess: "",
  supplyPreference: "NestHelper brings standard supplies",
  recurringResetInterest: "One-time reset for now",
  smartLabelSetupInterest: "No Smart Labels needed",
  smartLabelEstimatedCount: "Not sure",
  smartLabelSetupNotes: "",
  homePriorities: [] as string[],
  mealPrepTasks: [] as string[],
  mealPrepNotes: "",
  mealPrepAck: false,
  homeAreas: [] as string[],
  movePrepPackage: "Move prep before movers arrive — starts at $199",
  movePrepOptions: [] as string[],
  movePrepNotes: "",
  movePrepAck: false,
  wholeHomeVisitType: "One-time whole home reset",
  wholeHomeRecurringCadence: "Not sure yet",
  wholeHomeCondition: "Standard cleaning / normal household use",
  wholeHomeAddOns: [] as string[],
  wholeHomeOtherAddOn: "",
  requestDetails: "",
  roomsAreas: "",
  areaResetRooms: [] as string[],
  areaResetOtherRoom: "",
  areaResetAddOns: [] as string[],
  areaResetOtherAddOn: "",
  areaResetArea: "",
  areaResetOtherArea: "",
  areaResetAdditionalAreas: [] as string[],
  areaResetOtherAdditionalArea: "",
  areaResetCleaningType: "",
  areaResetRepeatSupport: "One-time reset",
  areaResetBathroomCount: "",
  areaResetSize: "",
  areaResetCondition: "Standard cleaning / normal household use",
  areaResetGoals: [] as string[],
  areaResetHauling: "No disposal prep needed",
  areaResetNotes: "",
  squareFootage: "",
  bedrooms: "",
  bathrooms: "",
  moveCleaningType: "",
  occupancyStatus: "Empty / no furniture",
  moveOutCondition: "Normal empty-home condition",
  moveOutFocus: [] as string[],
  moveOutAppliances: [] as string[],
  moveOutNotes: "",
  errandType: "Grocery or store pickup",
  errandDistance: "Within 5 miles",
  errandStops: "",
  errandStartArea: "",
  errandMileageAck: false,
  laundryTypes: [] as string[],
  laundryBagEstimate: "1–2 bags/hampers",
  laundryPickupSpot: "Front porch / outside door",
  laundryReturnSpot: "Same as pickup spot",
  detergent: "Eco-friendly standard detergent",
  dryPreference: "Standard dry",
  laundryAddOns: [] as string[],
  reusableBagAck: false,
  consent: false,
  photoUploads: [] as PhotoUpload[],
};

type RequestFormState = typeof defaultState;
type Status = "idle" | "loading" | "success" | "error";

const MEAL_PREP_OPTION = "Simple in-home meal prep support";
const MOVE_PREP_DISCLAIMER = "NestHelper does not transport household goods or operate as a moving company. We provide in-home move prep, organizing, labeling, cleaning, unpacking, and reset support.";

const priorityOptions = [
  "Kitchen reset",
  MEAL_PREP_OPTION,
  "Dishes / counters / surfaces",
  "Toy or living area tidy",
  "Laundry folding / put-away",
  "Playroom, kids room, or family area reset",
  "Pantry, entry, or laundry area reset",
  "Child-safe disinfecting of high-touch surfaces",
  "Trash / quick pickup",
  "I am not sure — help me prioritize",
];

const mealPrepTaskOptions = [
  "Wash and chop vegetables or fruit",
  "Portion snacks or lunchbox items",
  "Prep simple ingredients for customer-planned meals",
  "Organize prepped items in customer-provided containers",
  "Follow simple written family instructions",
  "Other simple in-home prep — I’ll explain below",
];

const wholeHomeVisitTypeOptions = [
  "One-time whole home reset",
  "First-time deep clean",
  "First-time deep clean + recurring maintenance",
  "Recurring maintenance only",
];

const wholeHomeRecurringCadenceOptions = [
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "Not sure yet",
];

const wholeHomeAddOnOptions = [
  "Interior fridge",
  "Interior oven",
  "Inside cabinets or drawers",
  "Baseboards / detail dusting",
  "Heavy bathroom buildup",
  "Pet hair focus",
  "Change bed linens / light linen reset",
  "Not sure — help me prioritize",
  "Other — I’ll explain below",
];

const WHOLE_HOME_OPTION = "Whole home — help me prioritize";

const homeAreaOptions = [
  "Kitchen",
  "Living room",
  "Playroom / toys",
  "Nursery / kids room",
  "Bedrooms",
  "Pantry",
  "Bathrooms",
  "Laundry area",
  "Entryway / mudroom",
  WHOLE_HOME_OPTION,
];

const areaResetRoomOptions = [
  "Kitchen",
  "Bathroom(s)",
  "Garage",
  "Pantry",
  "Closet",
  "Playroom / toys",
  "Laundry room",
  "Nursery / kids room",
  "Entry / mudroom",
  "Bedroom(s)",
  "Living room",
  "Moving prep area",
  "Other — I’ll explain below",
];

const areaResetCleaningCoreOptions = [
  "Light reset / refresh",
  "Standard cleaning",
  "Deep cleaning / detail focus",
];

const areaResetOrganizingTypeOptions = [
  "Cleaning + organizing mix",
  "Organizing / sorting only",
];

const areaResetMovingTypeOptions = [
  "Move prep or unpacking support",
];

const areaResetCleanFirstRooms = [
  "Kitchen",
  "Bathroom(s)",
  "Laundry room",
  "Entry / mudroom",
  "Bedroom(s)",
  "Living room",
  "Nursery / kids room",
  "Other — I’ll explain below",
];

const areaResetOrganizingRooms = [
  "Garage",
  "Pantry",
  "Closet",
  "Playroom / toys",
  "Laundry room",
  "Nursery / kids room",
  "Entry / mudroom",
  "Bedroom(s)",
  "Living room",
  "Moving prep area",
  "Other — I’ll explain below",
];

const areaResetGeneralAddOnOptions = [
  "Baseboards, doors, switches, and handles",
  "Sweep, vacuum, or mop accessible floors",
];

const areaResetRoomAddOnOptions: Record<string, string[]> = {
  Kitchen: [
    "Counters, stovetop, and backsplash",
    "Interior fridge",
    "Interior oven",
    "Inside cabinets or drawers",
    "Dishes / sink reset",
    "Appliance exteriors",
  ],
  "Bathroom(s)": [
    "Shower / tub buildup",
    "Toilet, vanity, and sink detail",
    "Mirrors / glass",
    "Grout or soap-scum focus",
  ],
  Garage: [
    "Sort keep / donate / trash piles",
    "Light trash bagging or donation prep",
    "Set up shelves, bins, zones, or Smart Labels",
    "Sweep, vacuum, or mop accessible floors",
  ],
  Pantry: [
    "Pantry shelves",
    "Inside cabinets or drawers",
    "Sort keep / donate / trash piles",
    "Set up shelves, bins, zones, or Smart Labels",
  ],
  Closet: [
    "Sort keep / donate / trash piles",
    "Light trash bagging or donation prep",
    "Set up shelves, bins, zones, or Smart Labels",
  ],
  "Playroom / toys": [
    "Sort keep / donate / trash piles",
    "Light trash bagging or donation prep",
    "Set up shelves, bins, zones, or Smart Labels",
    "Sweep, vacuum, or mop accessible floors",
  ],
  "Laundry room": [
    "Washer / dryer exterior",
    "Inside cabinets or drawers",
    "Laundry sorting or folding focus",
    "Sort keep / donate / trash piles",
    "Set up shelves, bins, zones, or Smart Labels",
    "Sweep, vacuum, or mop accessible floors",
  ],
  "Nursery / kids room": [
    "Sort keep / donate / trash piles",
    "Light trash bagging or donation prep",
    "Set up shelves, bins, zones, or Smart Labels",
    "Sweep, vacuum, or mop accessible floors",
  ],
  "Entry / mudroom": [
    "Sort keep / donate / trash piles",
    "Light trash bagging or donation prep",
    "Set up shelves, bins, zones, or Smart Labels",
    "Sweep, vacuum, or mop accessible floors",
  ],
  "Bedroom(s)": [
    "Sort keep / donate / trash piles",
    "Light trash bagging or donation prep",
    "Set up shelves, bins, zones, or Smart Labels",
    "Sweep, vacuum, or mop accessible floors",
  ],
  "Living room": [
    "Sort keep / donate / trash piles",
    "Light trash bagging or donation prep",
    "Set up shelves, bins, zones, or Smart Labels",
    "Sweep, vacuum, or mop accessible floors",
  ],
  "Moving prep area": [
    "Inside cabinets or drawers",
    "Sort keep / donate / trash piles",
    "Light trash bagging or donation prep",
    "Set up shelves, bins, zones, or Smart Labels",
  ],
  "Other — I’ll explain below": [
    "Baseboards, doors, switches, and handles",
    "Sweep, vacuum, or mop accessible floors",
    "Sort keep / donate / trash piles",
    "Light trash bagging or donation prep",
    "Set up shelves, bins, zones, or Smart Labels",
  ],
};

function uniqueOptions(items: string[]) {
  return Array.from(new Set(items));
}

function getAreaResetCleaningTypeOptions(selectedRooms: string[]) {
  if (!selectedRooms.length) return [];

  const hasCleanFirstRoom = selectedRooms.some((room) => areaResetCleanFirstRooms.includes(room));
  const hasOrganizingRoom = selectedRooms.some((room) => areaResetOrganizingRooms.includes(room));
  const hasMovingPrep = selectedRooms.includes("Moving prep area");

  return uniqueOptions([
    ...(hasCleanFirstRoom ? areaResetCleaningCoreOptions : ["Light reset / refresh"]),
    ...(hasOrganizingRoom ? areaResetOrganizingTypeOptions : []),
    ...(hasMovingPrep ? areaResetMovingTypeOptions : []),
    "Not sure — please recommend after review",
  ]);
}

function getAreaResetAddOnOptions(selectedRooms: string[]) {
  if (!selectedRooms.length) return [];

  const roomSpecific = selectedRooms.flatMap((room) => areaResetRoomAddOnOptions[room] || []);
  return uniqueOptions([
    ...roomSpecific,
    ...areaResetGeneralAddOnOptions,
    "Not sure — help me prioritize",
    "Other — I’ll explain below",
  ]);
}

// Older submissions used a primary-area dropdown and add-on-area list. Keep the names below
// out of the UI but preserve backwards-compatible payload/admin support.
const areaResetAreaOptions = areaResetRoomOptions;
const areaResetAdditionalAreaOptions: string[] = [];
const areaResetGoalOptions = getAreaResetAddOnOptions(areaResetRoomOptions);

const areaResetRepeatSupportOptions = [
  "One-time reset",
  "Every 2 weeks",
  "Monthly area reset",
  "Not sure yet",
];

const areaResetHaulingOptions = [
  "No disposal prep needed",
  "Customer will handle trash/disposal",
  "Bag/box and stage trash for customer disposal",
  "Donation pickup prep only",
  "Sort into keep / donate / trash piles",
  "Not sure yet — please review",
];

const recurringResetOptions = [
  "One-time reset for now",
  "Interested in weekly repeat parent reset support after the first visit",
  "Interested in every-2-weeks repeat parent reset support after the first visit",
  "Interested in monthly parent reset support when openings allow",
  "Not sure yet — please help me decide",
];

const smartLabelSetupOptions = [
  "No Smart Labels needed",
  "Free starter labels only — included with qualifying reset",
  "Starter setup — up to 10 labels ($49)",
  "Standard setup — up to 20 labels ($79)",
  "Full setup — up to 30 labels ($109)",
  "Not sure — recommend after review",
];

const smartLabelEstimatedCountOptions = [
  "Not sure",
  "1–10 labels / storage spots",
  "11–20 labels / storage spots",
  "21–30 labels / storage spots",
  "31+ labels / quote after review",
];

const howFoundUsOptions = [
  "Google search",
  "Instagram",
  "Facebook",
  "Nextdoor",
  "Friend or family referral",
  "NestHelper referral link",
  "Local community group",
  "Flyer / QR code",
  "Existing customer",
  "Other / not listed",
];

function shouldShowHowFoundUsDetails(value: string) {
  return ["Friend or family referral", "Nextdoor", "Local community group", "Flyer / QR code", "Existing customer", "Other / not listed"].includes(value);
}

const moveOutFocusOptions = [
  "Kitchen",
  "Bathrooms",
  "Bathtub / shower buildup",
  "Cabinets and drawers",
  "Counters and surfaces",
  "Floors and baseboards",
  "Interior windows / tracks",
  "Doors, switches, and handles",
  "Whole empty home",
  "Other priority areas",
];

const moveOutApplianceOptions = [
  "Inside refrigerator",
  "Inside oven",
  "Microwave",
  "Dishwasher exterior / edge wipe",
  "Washer / dryer exterior",
  "None / not needed",
];

const movePrepPackageOptions = [
  "Move prep before movers arrive — starts at $199",
  "Focused room or area prep — $249",
  "Custom quote — garage, storage, sheds, or heavy clutter",
  "Not sure — recommend after review",
];

const movePrepPackageDescriptions: Record<string, string> = {
  "Move prep before movers arrive — starts at $199": "Best for light prep before movers come: sorting, open-first boxes, simple labels, and a short helper list. Includes up to 2 helper-hours.",
  "Focused room or area prep — $249": "Best when one room or area needs focused sorting, packing prep, organizing, or reset help. Includes up to 2.5 helper-hours.",
  "Custom quote — garage, storage, sheds, or heavy clutter": "Choose this for larger storage areas, heavy clutter, sheds, or anything that needs review before time and price are confirmed.",
  "Not sure — recommend after review": "Choose this if you want Leo/Gen to review your notes and recommend the best starting point.",
};

const movePrepBeforeMoveOptions = [
  "Sorting / decluttering help",
  "Open-first essentials boxes",
  "Light packing prep before movers arrive",
  "Donation sorting",
];

const movePrepPricedAddOnOptions = [
  "After-move unpacking / home reset — from $299",
  "After-move kitchen setup / kitchen reset — from $349",
  "QR smart label setup — $99 up to 20 labels",
  "Basic packing supply kit — from $59",
  "Larger packing supply kit — reviewed before checkout",
];

const movePrepReviewOptionOptions = [
  "Move-out cleaning quote — quoted separately",
  "Garage, storage, shed, or heavy clutter review — custom quote",
];

const movePrepOptionDescriptions: Record<string, string> = {
  "Sorting / decluttering help": "Separate keep, donate, toss, or review-later piles.",
  "Open-first essentials boxes": "Set aside must-have items for the first night, first morning, kids, pets, school, or work.",
  "Light packing prep before movers arrive": "Help group items, stage supplies, and prep simple boxes. Movers still handle the heavy lifting and transportation.",
  "Donation sorting": "Group donation items so the family can decide what leaves the home.",
  "After-move unpacking / home reset — from $299": "Add this if you want help after movers deliver: light unpacking, key-area setup, and getting the home usable faster. Starts around 3 helper-hours.",
  "After-move kitchen setup / kitchen reset — from $349": "After the move, we help set up kitchen essentials, pantry/fridge basics, cabinet zones, and everyday-item flow. Starts around 3.5 helper-hours.",
  "QR smart label setup — $99 up to 20 labels": "Add this for boxes, bins, shelves, or storage areas. Larger label setups are quoted before checkout.",
  "Basic packing supply kit — from $59": "Starter supplies for open-first boxes or one small area: a small set of boxes or bags, packing tape, marker, and simple labels. Final contents confirmed before checkout.",
  "Larger packing supply kit — reviewed before checkout": "For multiple rooms or bigger prep: more boxes, tape, packing paper or protection, labels, and marker. Quoted after review so you only pay for what is needed.",
    "Move-out cleaning quote — quoted separately": "Ask us to review a separate move-out cleaning quote after the home is empty.",
  "Garage, storage, shed, or heavy clutter review — custom quote": "Larger or heavier areas need review before we confirm time or price.",
};

const laundryTypeOptions = [
  "Adult clothes",
  "Kids clothes",
  "Baby items",
  "Towels",
  "Sheets / bedding",
  "Socks / underwear",
  "Delicates",
  "Mixed household laundry",
];

const laundryRequestAddOns = laundryAddOns.filter((item) => item !== "Customer-provided detergent, no fee");

const bedroomCountOptions = [
  "Studio / no separate bedroom",
  "1 bedroom",
  "2 bedrooms",
  "3 bedrooms",
  "4 bedrooms",
  "5+ bedrooms",
  "Not sure",
];

const bathroomCountOptions = [
  "1 bathroom",
  "1.5 bathrooms",
  "2 bathrooms",
  "2.5 bathrooms",
  "3 bathrooms",
  "3.5 bathrooms",
  "4+ bathrooms",
  "Not sure",
];

function normalizeServiceParam(serviceId: string) {
  if (serviceId === "move-in-out-cleaning") return "move-out-cleaning";
  return serviceId;
}

function getServiceCategory(serviceId: string) {
  const normalizedServiceId = normalizeServiceParam(serviceId);
  if (normalizedServiceId === "laundry-rescue") return "laundry";
  if (normalizedServiceId === "errand-helper") return "errand";
  if (normalizedServiceId === "specific-area-reset") return "areaReset";
  if (normalizedServiceId === "move-out-cleaning") return "moveOut";
  if (normalizedServiceId === "move-prep-home-reset") return "movePrep";
  if (normalizedServiceId) return "home";
  return "none";
}

function normalizeZipInput(value: string) {
  return value.replace(/[^0-9-]/g, "").slice(0, 10);
}
function normalizeReferralInput(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
}

function isReferralEligibleService(serviceId: string) {
  return ["parent-reset-2hr", "family-reset-3hr", "helper-block-4hr", "whole-home-reset", "errand-helper", "laundry-rescue"].includes(serviceId);
}

function isSmartLabelEligibleCategory(category: string) {
  return ["home", "areaReset", "moveOut"].includes(category);
}

function hasLikelyStreetAddress(address: string) {
  return /\d/.test(address) && /[a-zA-Z]/.test(address) && address.trim().length >= 5;
}

function hasValidZip(zip: string) {
  return /^\d{5}(?:-\d{4})?$/.test(zip.trim());
}

function buildServiceAddress(form: Pick<RequestFormState, "address" | "address2" | "city" | "state" | "zip">) {
  return [form.address, form.address2, form.city, form.state, form.zip].map((part) => part.trim()).filter(Boolean).join(", ");
}

function getAddressValidationMessage(form: Pick<RequestFormState, "address" | "city" | "state" | "zip">) {
  if (!hasLikelyStreetAddress(form.address)) return "Please enter the full service street address, including a street number and street name.";
  if (form.city.trim().length < 2) return "Please enter the service city.";
  if (form.state !== "WA") return "NestHelper currently accepts Washington service addresses only.";
  if (!hasValidZip(form.zip)) return "Please enter a valid 5-digit ZIP code, or ZIP+4.";
  return "";
}

function getHomeScopeWarning(serviceId: string, areas: string[]) {
  const wholeHomeSelected = areas.includes(WHOLE_HOME_OPTION);
  const individualAreaCount = areas.filter((area) => area !== WHOLE_HOME_OPTION).length;

  if (serviceId === "parent-reset-2hr" && wholeHomeSelected) {
    return "A Parent Reset Plan is best for selected family spaces, not a full-home cleaning. If you need the entire home cleaned, Whole Home Cleaning is the better fit.";
  }

  if (serviceId === "parent-reset-2hr" && individualAreaCount > 3) {
    return "You selected several areas for a 2-hour visit. We may not be able to complete every area in one visit, so please list your top priorities below.";
  }

  if (serviceId === "family-reset-3hr" && wholeHomeSelected) {
    return "A Parent Reset Plan is a 3-hour organizing and light-cleaning visit for selected family spaces. If you need the entire home cleaned, choose Whole Home Cleaning.";
  }

  if (serviceId === "family-reset-3hr" && individualAreaCount > 5) {
    return "You selected a lot of areas for a 3-hour Parent Reset Plan. We’ll review the scope and may recommend narrowing priorities or scheduling follow-up support if needed.";
  }

  if (serviceId === "helper-block-4hr" && wholeHomeSelected) {
    return "Large custom helper blocks are reviewed by scope, priority, and availability before checkout.";
  }

  return "";
}

function cleanForSelectedService(form: RequestFormState) {
  const category = getServiceCategory(form.service);
  const base = {
    fullName: form.fullName,
    email: form.email,
    phone: form.phone,
    address: form.address,
    address2: form.address2,
    city: form.city,
    state: form.state,
    zip: form.zip,
    serviceAddress: buildServiceAddress(form),
    serviceAddressLine1: form.address,
    serviceAddressLine2: form.address2,
    serviceCity: form.city,
    serviceState: form.state,
    serviceZip: form.zip,
    service: form.service,
    preferredDate: form.preferredDate,
    preferredWindow: form.preferredWindow,
    alternateDate: form.alternateDate,
    urgency: form.urgency,
    promoCode: form.promoCode,
    ...(form.incomingReferralCode ? {
      incomingReferralCode: form.incomingReferralCode,
      incomingReferralProgram: form.incomingReferralProgram || "family-to-family",
      incomingReferralLandingPage: form.incomingReferralLandingPage || "/referrals",
    } : {}),
    selectedServiceTitle: services.find((service) => service.id === form.service)?.title || "",
    parkingAccess: form.parkingAccess,
    howFoundUs: form.howFoundUs,
    howFoundUsDetails: form.howFoundUsDetails,
    campaignSource: form.campaignSource,
    campaignMedium: form.campaignMedium,
    campaignName: form.campaignName,
    campaignContent: form.campaignContent,
    campaignTerm: form.campaignTerm,
    campaignLandingPage: form.campaignLandingPage,
    campaignReferrer: form.campaignReferrer,
    campaignCapturedAtIso: form.campaignCapturedAtIso,
    consent: form.consent,
    ...(form.photoUploads.length ? {
      photoUploadCount: form.photoUploads.length,
      photoUploadSummary: photoUploadSummary(form.photoUploads),
      photoUploads: form.photoUploads,
    } : {}),
    ...(isSmartLabelEligibleCategory(category) && form.service !== "whole-home-reset" ? {
      smartLabelSetupInterest: form.smartLabelSetupInterest,
      smartLabelEstimatedCount: form.smartLabelEstimatedCount,
      smartLabelSetupNotes: form.smartLabelSetupNotes,
    } : {}),
    requestedAt: new Date().toISOString(),
  };

  if (category === "home") {
    if (form.service === "whole-home-reset") {
      const addOns = form.wholeHomeAddOns.filter(Boolean);
      const addOnSummary = addOns.join(", ");
      const sizeSummary = [
        form.squareFootage ? `${form.squareFootage} sq ft` : "",
        form.bedrooms,
        form.bathrooms,
      ].filter(Boolean).join(", ");

      return {
        ...base,
        packageType: "Whole Home Reset",
        homeType: form.homeType,
        squareFootage: form.squareFootage,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        wholeHomeVisitType: form.wholeHomeVisitType,
        wholeHomeRecurringCadence: form.wholeHomeRecurringCadence,
        wholeHomeCondition: form.wholeHomeCondition,
        wholeHomeAddOns: addOns,
        wholeHomeAddOnSummary: addOnSummary,
        wholeHomeOtherAddOn: form.wholeHomeOtherAddOn,
        pets: form.pets,
        petDetails: form.petDetails,
        supplyPreference: form.supplyPreference,
        recurringResetInterest: [form.wholeHomeVisitType, form.wholeHomeVisitType.toLowerCase().includes("recurring") ? form.wholeHomeRecurringCadence : ""].filter(Boolean).join(" — "),
        recurringResetNote: form.wholeHomeVisitType.toLowerCase().includes("recurring")
          ? "Customer is interested in full-home recurring maintenance. Cadence is request-based and depends on scope, service area, schedule, and helper fit."
          : "Customer requested a one-time whole-home visit for now.",
        homeAreas: [WHOLE_HOME_OPTION],
        homePriorities: addOns,
        roomsAreas: [
          "Whole home",
          sizeSummary,
          form.wholeHomeVisitType,
          form.wholeHomeVisitType.toLowerCase().includes("recurring") ? form.wholeHomeRecurringCadence : "",
          addOnSummary ? `Optional add-ons: ${addOnSummary}` : "",
          form.wholeHomeOtherAddOn,
        ].filter(Boolean).join(", "),
        requestDetails: form.requestDetails,
      };
    }

    return {
      ...base,
      packageType: "Home reset",
      homeType: form.homeType,
      pets: form.pets,
      petDetails: form.petDetails,
      supplyPreference: form.supplyPreference,
      recurringResetInterest: form.recurringResetInterest,
      recurringResetNote: form.recurringResetInterest !== "One-time reset for now"
        ? "Recurring rates are request-based and begin only after the first completed standard-price reset if scope, schedule, service area, and helper fit are consistent."
        : "Customer requested a one-time reset for now.",
      homePriorities: form.homePriorities,
      mealPrepRequested: form.homePriorities.includes(MEAL_PREP_OPTION),
      mealPrepTasks: form.homePriorities.includes(MEAL_PREP_OPTION) ? form.mealPrepTasks : [],
      mealPrepTaskSummary: form.homePriorities.includes(MEAL_PREP_OPTION) ? form.mealPrepTasks.join(", ") : "",
      mealPrepNotes: form.homePriorities.includes(MEAL_PREP_OPTION) ? form.mealPrepNotes : "",
      mealPrepAck: form.homePriorities.includes(MEAL_PREP_OPTION) ? form.mealPrepAck : false,
      homeAreas: form.homeAreas,
      roomsAreas: form.homeAreas.length ? form.homeAreas.join(", ") : form.roomsAreas,
      requestDetails: form.requestDetails,
    };
  }

  if (category === "areaReset") {
    const selectedRooms = form.areaResetRooms.filter(Boolean);
    const roomSummary = selectedRooms.join(", ");
    const allowedAddOns = getAreaResetAddOnOptions(selectedRooms);
    const selectedAddOns = form.areaResetAddOns.filter((item) => allowedAddOns.includes(item));
    const addOnSummary = selectedAddOns.join(", ");

    return {
      ...base,
      packageType: "Specific Area(s) Reset",
      areaResetRooms: selectedRooms,
      areaResetRoomSummary: roomSummary,
      areaResetOtherRoom: form.areaResetOtherRoom,
      areaResetAddOns: selectedAddOns,
      areaResetAddOnSummary: addOnSummary,
      areaResetOtherAddOn: form.areaResetOtherAddOn,
      // Backward-compatible summary fields used by older admin/email views.
      areaResetArea: roomSummary,
      areaResetOtherArea: form.areaResetOtherRoom,
      areaResetAdditionalAreas: [],
      areaResetAdditionalAreaSummary: "",
      areaResetOtherAdditionalArea: "",
      areaResetCleaningType: form.areaResetCleaningType,
      areaResetRepeatSupport: form.areaResetRepeatSupport,
      areaResetBathroomCount: form.areaResetBathroomCount,
      areaResetSize: form.areaResetSize,
      areaResetCondition: form.areaResetCondition,
      areaResetGoals: selectedAddOns,
      areaResetGoalSummary: addOnSummary,
      areaResetHauling: form.areaResetHauling,
      homeType: form.homeType,
      pets: form.pets,
      petDetails: form.petDetails,
      supplyPreference: form.supplyPreference,
      requestDetails: form.areaResetNotes,
      roomsAreas: [
        roomSummary,
        form.areaResetOtherRoom,
        form.areaResetRepeatSupport,
        form.areaResetBathroomCount ? `Bathrooms: ${form.areaResetBathroomCount}` : "",
        form.areaResetSize,
        addOnSummary ? `Add-ons: ${addOnSummary}` : "",
        form.areaResetOtherAddOn,
      ].filter(Boolean).join(", "),
    };
  }

  if (category === "moveOut") {
    return {
      ...base,
      packageType: "Move-In / Move-Out Cleaning",
      moveCleaningType: form.moveCleaningType,
      homeType: form.homeType,
      squareFootage: form.squareFootage,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      occupancyStatus: form.occupancyStatus,
      moveOutCondition: form.moveOutCondition,
      moveOutFocus: form.moveOutFocus,
      moveOutFocusSummary: form.moveOutFocus.join(", "),
      moveOutAppliances: form.moveOutAppliances,
      moveOutApplianceSummary: form.moveOutAppliances.join(", "),
      pets: form.pets,
      petDetails: form.petDetails,
      supplyPreference: form.supplyPreference,
      requestDetails: form.moveOutNotes,
      roomsAreas: [form.bedrooms, form.bathrooms, form.squareFootage ? `${form.squareFootage} sq ft` : ""].filter(Boolean).join(", "),
    };
  }

  if (category === "movePrep") {
    const selectedOptions = form.movePrepOptions.filter(Boolean);
    return {
      ...base,
      packageType: "Move Prep & Home Reset",
      movePrepPackage: form.movePrepPackage,
      movePrepOptions: selectedOptions,
      movePrepOptionSummary: selectedOptions.join(", "),
      movePrepNotes: form.movePrepNotes,
      movePrepAck: form.movePrepAck,
      movePrepDisclaimer: MOVE_PREP_DISCLAIMER,
      moveOutCleaningQuotedSeparately: selectedOptions.some((option) => option.toLowerCase().includes("move-out cleaning")),
      homeType: form.homeType,
      pets: form.pets,
      petDetails: form.petDetails,
      supplyPreference: form.supplyPreference,
      requestDetails: form.movePrepNotes,
      roomsAreas: [form.movePrepPackage, selectedOptions.join(", ")].filter(Boolean).join(" — "),
    };
  }

  if (category === "errand") {
    return {
      ...base,
      packageType: "Errand Helper",
      errandType: form.errandType,
      errandDistance: form.errandDistance,
      errandStops: form.errandStops,
      errandStartArea: form.errandStartArea,
      errandMileageAck: form.errandMileageAck,
    };
  }

  if (category === "laundry") {
    return {
      ...base,
      packageType: "Laundry Rescue",
      laundryTypes: form.laundryTypes,
      laundryBagEstimate: form.laundryBagEstimate,
      laundryPickupSpot: form.laundryPickupSpot,
      laundryReturnSpot: form.laundryReturnSpot,
      detergent: form.detergent,
      dryPreference: form.dryPreference,
      laundryAddOns: form.laundryAddOns,
      reusableBagAck: form.reusableBagAck,
    };
  }

  return base;
}

export function RequestForm() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedService = normalizeServiceParam(params.get("service") || "");
  const requestedReferralCode = normalizeReferralInput(params.get("ref") || params.get("referral") || params.get("referralCode") || "");
  const [form, setForm] = useState({
    ...defaultState,
    service: requestedService,
    supplyPreference: getServiceCategory(requestedService) === "movePrep" ? "Not sure yet" : defaultState.supplyPreference,
    incomingReferralCode: requestedReferralCode,
    incomingReferralProgram: requestedReferralCode ? "family-to-family" : "",
    incomingReferralLandingPage: requestedReferralCode ? "/referrals" : "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const publicRequestServices = useMemo(() => services.filter((service) => !["parent-reset-2hr", "helper-block-4hr"].includes(service.id)), []);
  const selectedService = useMemo(() => services.find((service) => service.id === form.service), [form.service]);
  const serviceCategory = getServiceCategory(form.service);
  const isHomeReset = serviceCategory === "home";
  const isAreaReset = serviceCategory === "areaReset";
  const isMoveOut = serviceCategory === "moveOut";
  const isMovePrep = serviceCategory === "movePrep";
  const isErrand = serviceCategory === "errand";
  const isLaundry = serviceCategory === "laundry";
  const isWholeHomeReset = form.service === "whole-home-reset";
  const isParentResetPlan = form.service === "family-reset-3hr";
  const mealPrepRequested = form.homePriorities.includes(MEAL_PREP_OPTION);
  const showMealPrepQuestions = isParentResetPlan && mealPrepRequested;
  const smartLabelsAvailable = isSmartLabelEligibleCategory(serviceCategory) && !isWholeHomeReset;
  const wholeHomeSelected = form.homeAreas.includes(WHOLE_HOME_OPTION);
  const homeScopeWarning = isHomeReset ? getHomeScopeWarning(form.service, form.homeAreas) : "";
  const visibleAreaResetCleaningTypeOptions = isAreaReset ? getAreaResetCleaningTypeOptions(form.areaResetRooms) : [];
  const visibleAreaResetAddOnOptions = isAreaReset ? getAreaResetAddOnOptions(form.areaResetRooms) : [];
  const showSmartLabelCount = form.smartLabelSetupInterest === "Not sure — recommend after review";
  const showSmartLabelNotes = form.smartLabelSetupInterest !== "No Smart Labels needed";
  const petDetailsRequired = (isHomeReset || isAreaReset || isMoveOut || isMovePrep) && form.pets !== "No pets" && form.pets !== "No pets now, but pets lived here before";
  const referralApplies = Boolean(form.incomingReferralCode && isReferralEligibleService(form.service));
  const referralNeedsEligiblePackage = Boolean(form.incomingReferralCode && form.service && !isReferralEligibleService(form.service));
  const showHowFoundUsDetails = shouldShowHowFoundUsDetails(form.howFoundUs);

  useEffect(() => {
    setForm((prev) => {
      try {
        return mergeCampaignAttribution(prev);
      } catch {
        return prev;
      }
    });
  }, []);

  function update(name: keyof RequestFormState, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }) as RequestFormState);
  }

  function handleServiceChange(service: string) {
    const nextCategory = getServiceCategory(service);
    const isWholeHome = service === "whole-home-reset";
    const isHomeLike = nextCategory === "home" || nextCategory === "areaReset" || nextCategory === "moveOut" || nextCategory === "movePrep";
    setForm((prev) => ({
      ...prev,
      service,
      homePriorities: nextCategory === "home" && !isWholeHome ? prev.homePriorities : [],
      mealPrepTasks: service === "family-reset-3hr" ? prev.mealPrepTasks : [],
      mealPrepNotes: service === "family-reset-3hr" ? prev.mealPrepNotes : "",
      mealPrepAck: service === "family-reset-3hr" ? prev.mealPrepAck : false,
      homeAreas: nextCategory === "home" ? (isWholeHome ? [WHOLE_HOME_OPTION] : prev.homeAreas) : [],
      wholeHomeVisitType: isWholeHome ? (prev.wholeHomeVisitType || defaultState.wholeHomeVisitType) : defaultState.wholeHomeVisitType,
      wholeHomeRecurringCadence: isWholeHome ? (prev.wholeHomeRecurringCadence || defaultState.wholeHomeRecurringCadence) : defaultState.wholeHomeRecurringCadence,
      wholeHomeCondition: isWholeHome ? (prev.wholeHomeCondition || defaultState.wholeHomeCondition) : defaultState.wholeHomeCondition,
      wholeHomeAddOns: isWholeHome ? prev.wholeHomeAddOns : [],
      wholeHomeOtherAddOn: isWholeHome ? prev.wholeHomeOtherAddOn : "",
      requestDetails: nextCategory === "home" ? prev.requestDetails : "",
      roomsAreas: nextCategory === "home" ? prev.roomsAreas : "",
      areaResetRooms: nextCategory === "areaReset" ? prev.areaResetRooms : [],
      areaResetOtherRoom: nextCategory === "areaReset" ? prev.areaResetOtherRoom : "",
      areaResetAddOns: nextCategory === "areaReset" ? prev.areaResetAddOns : [],
      areaResetOtherAddOn: nextCategory === "areaReset" ? prev.areaResetOtherAddOn : "",
      areaResetArea: nextCategory === "areaReset" ? prev.areaResetArea : defaultState.areaResetArea,
      areaResetOtherArea: nextCategory === "areaReset" ? prev.areaResetOtherArea : "",
      areaResetAdditionalAreas: nextCategory === "areaReset" ? prev.areaResetAdditionalAreas : [],
      areaResetOtherAdditionalArea: nextCategory === "areaReset" ? prev.areaResetOtherAdditionalArea : "",
      areaResetCleaningType: nextCategory === "areaReset" ? prev.areaResetCleaningType : defaultState.areaResetCleaningType,
      areaResetRepeatSupport: nextCategory === "areaReset" ? prev.areaResetRepeatSupport : defaultState.areaResetRepeatSupport,
      areaResetBathroomCount: nextCategory === "areaReset" ? prev.areaResetBathroomCount : "",
      areaResetSize: nextCategory === "areaReset" ? prev.areaResetSize : "",
      areaResetCondition: nextCategory === "areaReset" ? prev.areaResetCondition : defaultState.areaResetCondition,
      areaResetGoals: nextCategory === "areaReset" ? prev.areaResetGoals : [],
      areaResetHauling: nextCategory === "areaReset" ? prev.areaResetHauling : defaultState.areaResetHauling,
      areaResetNotes: nextCategory === "areaReset" ? prev.areaResetNotes : "",
      homeType: isHomeLike ? prev.homeType : defaultState.homeType,
      pets: isHomeLike ? prev.pets : defaultState.pets,
      petDetails: isHomeLike ? prev.petDetails : "",
      supplyPreference: nextCategory === "movePrep" ? (prev.supplyPreference === defaultState.supplyPreference ? "Not sure yet" : prev.supplyPreference) : isHomeLike ? prev.supplyPreference : defaultState.supplyPreference,
      recurringResetInterest: nextCategory === "home" ? prev.recurringResetInterest : defaultState.recurringResetInterest,
      smartLabelSetupInterest: isSmartLabelEligibleCategory(nextCategory) && !isWholeHome ? prev.smartLabelSetupInterest : defaultState.smartLabelSetupInterest,
      smartLabelEstimatedCount: isSmartLabelEligibleCategory(nextCategory) && !isWholeHome ? prev.smartLabelEstimatedCount : defaultState.smartLabelEstimatedCount,
      smartLabelSetupNotes: isSmartLabelEligibleCategory(nextCategory) && !isWholeHome ? prev.smartLabelSetupNotes : "",
      squareFootage: nextCategory === "moveOut" || isWholeHome ? prev.squareFootage : "",
      bedrooms: nextCategory === "moveOut" || isWholeHome ? prev.bedrooms : "",
      bathrooms: nextCategory === "moveOut" || isWholeHome ? prev.bathrooms : "",
      moveCleaningType: nextCategory === "moveOut" ? prev.moveCleaningType : defaultState.moveCleaningType,
      occupancyStatus: nextCategory === "moveOut" ? prev.occupancyStatus : defaultState.occupancyStatus,
      moveOutCondition: nextCategory === "moveOut" ? prev.moveOutCondition : defaultState.moveOutCondition,
      moveOutFocus: nextCategory === "moveOut" ? prev.moveOutFocus : [],
      moveOutAppliances: nextCategory === "moveOut" ? prev.moveOutAppliances : [],
      moveOutNotes: nextCategory === "moveOut" ? prev.moveOutNotes : "",
      movePrepPackage: nextCategory === "movePrep" ? (prev.movePrepPackage || defaultState.movePrepPackage) : defaultState.movePrepPackage,
      movePrepOptions: nextCategory === "movePrep" ? prev.movePrepOptions : [],
      movePrepNotes: nextCategory === "movePrep" ? prev.movePrepNotes : "",
      movePrepAck: nextCategory === "movePrep" ? prev.movePrepAck : false,
      errandType: nextCategory === "errand" ? prev.errandType : defaultState.errandType,
      errandDistance: nextCategory === "errand" ? prev.errandDistance : defaultState.errandDistance,
      errandStops: nextCategory === "errand" ? prev.errandStops : "",
      errandStartArea: nextCategory === "errand" ? prev.errandStartArea : "",
      errandMileageAck: nextCategory === "errand" ? prev.errandMileageAck : false,
      laundryTypes: nextCategory === "laundry" ? prev.laundryTypes : [],
      laundryBagEstimate: nextCategory === "laundry" ? prev.laundryBagEstimate : defaultState.laundryBagEstimate,
      laundryPickupSpot: nextCategory === "laundry" ? prev.laundryPickupSpot : defaultState.laundryPickupSpot,
      detergent: nextCategory === "laundry" ? prev.detergent : "Eco-friendly standard detergent",
      dryPreference: nextCategory === "laundry" ? prev.dryPreference : "Standard dry",
      laundryReturnSpot: nextCategory === "laundry" ? prev.laundryReturnSpot : defaultState.laundryReturnSpot,
      laundryAddOns: nextCategory === "laundry" ? prev.laundryAddOns : [],
      reusableBagAck: nextCategory === "laundry" ? prev.reusableBagAck : false,
    }));
  }

  function toggleList(name: "homePriorities" | "homeAreas" | "mealPrepTasks" | "wholeHomeAddOns" | "areaResetRooms" | "areaResetAddOns" | "areaResetAdditionalAreas" | "areaResetGoals" | "moveOutFocus" | "moveOutAppliances" | "movePrepOptions" | "laundryTypes" | "laundryAddOns", item: string, checked: boolean) {
    setForm((prev) => {
      const current = prev[name];

      if (name === "homePriorities" && item === MEAL_PREP_OPTION && !checked) {
        return {
          ...prev,
          homePriorities: current.filter((value) => value !== item),
          mealPrepTasks: [],
          mealPrepNotes: "",
          mealPrepAck: false,
        };
      }

      if (name === "homeAreas") {
        if (item === WHOLE_HOME_OPTION) {
          return {
            ...prev,
            homeAreas: checked ? [WHOLE_HOME_OPTION] : [],
          };
        }

        const withoutWholeHome = current.filter((value) => value !== WHOLE_HOME_OPTION);
        return {
          ...prev,
          homeAreas: checked ? [...withoutWholeHome, item] : withoutWholeHome.filter((value) => value !== item),
        };
      }

      if (name === "areaResetRooms") {
        const nextRooms = checked ? [...current, item] : current.filter((value) => value !== item);
        const nextAddOnOptions = getAreaResetAddOnOptions(nextRooms);
        const nextCleaningTypeOptions = getAreaResetCleaningTypeOptions(nextRooms);

        return {
          ...prev,
          areaResetRooms: nextRooms,
          areaResetAddOns: prev.areaResetAddOns.filter((value) => nextAddOnOptions.includes(value)),
          areaResetCleaningType: nextCleaningTypeOptions.includes(prev.areaResetCleaningType) ? prev.areaResetCleaningType : "",
          areaResetBathroomCount: nextRooms.includes("Bathroom(s)") ? prev.areaResetBathroomCount : "",
        };
      }

      return {
        ...prev,
        [name]: checked ? [...current, item] : current.filter((value) => value !== item),
      };
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const addressMessage = getAddressValidationMessage(form);
    if (addressMessage) {
      setStatus("error");
      setMessage(addressMessage);
      return;
    }

    if (form.service === "whole-home-reset") {
      if (!form.squareFootage.trim() || !form.bedrooms.trim() || !form.bathrooms.trim()) {
        setStatus("error");
        setMessage("Please complete the approximate square footage, bedrooms, and bathrooms for Whole Home Cleaning.");
        return;
      }

      if (!form.wholeHomeVisitType.trim()) {
        setStatus("error");
        setMessage("Please choose the Whole Home Reset visit type.");
        return;
      }

      if (form.wholeHomeVisitType.toLowerCase().includes("recurring") && !form.wholeHomeRecurringCadence.trim()) {
        setStatus("error");
        setMessage("Please choose a maintenance cadence or select Not sure yet.");
        return;
      }

      if (form.wholeHomeAddOns.includes("Other — I’ll explain below") && !form.wholeHomeOtherAddOn.trim()) {
        setStatus("error");
        setMessage("Please explain the other whole-home add-on or focus item.");
        return;
      }
    }

    if (showMealPrepQuestions) {
      if (!form.mealPrepTasks.length) {
        setStatus("error");
        setMessage("Please choose at least one simple in-home meal prep task or uncheck meal prep support.");
        return;
      }

      if (form.mealPrepTasks.includes("Other simple in-home prep — I’ll explain below") && !form.mealPrepNotes.trim()) {
        setStatus("error");
        setMessage("Please explain the other simple in-home meal prep task.");
        return;
      }

      if (!form.mealPrepAck) {
        setStatus("error");
        setMessage("Please acknowledge the simple in-home meal prep scope before submitting.");
        return;
      }
    }

    if (serviceCategory === "areaReset" && !form.areaResetRooms.length) {
      setStatus("error");
      setMessage("Please select at least one room or area for the Specific Area(s) Reset.");
      return;
    }

    if (serviceCategory === "movePrep") {
      if (!form.movePrepAck) {
        setStatus("error");
        setMessage("Please acknowledge that NestHelper does not transport household goods or operate as a moving company.");
        return;
      }
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanForSelectedService(form)),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Request submission failed");

      setStatus("success");
      setMessage(form.incomingReferralCode
        ? "Request received with the family referral link. We’ll review the request and keep the referral pending until the eligible reset is completed."
        : "Request received. We’ll review your service area, timing, scope, safety notes, and pricing before sending a secure checkout link. A confirmation email is on its way.");

      router.push("/request/thank-you");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again or contact NestHelper directly.");
    }
  }

  return (
    <form onSubmit={onSubmit} onInvalidCapture={focusFirstInvalidField} className="grid gap-5 overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-4 shadow-soft backdrop-blur sm:gap-6 sm:p-6 lg:p-8">
      <div className="rounded-[1.75rem] border border-nest-gold/16 bg-gradient-to-br from-nest-cream via-white to-nest-mint/25 p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">No payment due yet</p>
            <h2 className="mt-2 text-2xl font-black text-nest-teal sm:text-3xl">Request details</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-nest-ink/70 sm:text-base sm:leading-7">
              Start with the service and timing, then answer only the questions that apply. NestHelper reviews the request before checkout.
            </p>
            <p className="mt-2 text-sm font-bold text-nest-ink/65"><span className="text-red-600">*</span> Required fields</p>
          </div>
          <div className="grid gap-2 text-sm font-black text-nest-teal sm:grid-cols-3 lg:min-w-[17rem] lg:grid-cols-1">
            {["Area reviewed", "Scope confirmed", "Secure payment link"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-white/85 px-4 py-3 shadow-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-nest-gold" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {form.incomingReferralCode && (
        <div className={`rounded-[1.75rem] border p-5 shadow-sm ${referralNeedsEligiblePackage ? "border-amber-200 bg-amber-50 text-amber-900" : "border-nest-gold/20 bg-nest-mint/25 text-nest-ink/82"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-nest-teal shadow-sm">
              <Gift className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Family referral link</p>
              <h3 className="mt-1 text-xl font-black text-nest-teal">Referral code {form.incomingReferralCode} is attached.</h3>
              <p className="mt-2 text-sm font-semibold leading-6">
                {referralNeedsEligiblePackage
                  ? "This family referral can only be used for eligible NestHelper family services. Please choose an eligible family reset package before submitting."
                  : referralApplies
                    ? "This one-time referral will stay pending until your eligible family service is completed. After completion, the referring family gets their thank-you credit email automatically."
                    : "Choose an eligible NestHelper family service to use this referral link."}
              </p>
            </div>
          </div>
        </div>
      )}

      <Section title="1. Contact information" description="We use this to confirm the request, send prep notes, and share the checkout link if approved.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required><input className="input" required autoComplete="name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} /></Field>
          <Field label="Phone" required><input className="input" required autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => update("phone", formatPhoneNumber(e.target.value))} /></Field>
          <Field label="Email" required><input type="email" className="input" required autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
          <Field label="Promo/referral code (optional)"><input className="input" placeholder="Optional code" value={form.promoCode} onChange={(e) => update("promoCode", e.target.value.toUpperCase())} /></Field>
          <Field label="How did you hear about NestHelper?">
            <select className="input" value={form.howFoundUs} onChange={(e) => update("howFoundUs", e.target.value)}>
              <option value="">Choose one</option>
              {howFoundUsOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          {showHowFoundUsDetails && (
            <Field label="Referral/source details (optional)"><input className="input" placeholder="Name, group, flyer location, or other details" value={form.howFoundUsDetails} onChange={(e) => update("howFoundUsDetails", e.target.value)} /></Field>
          )}
        </div>
      </Section>

      <Section title="2. Choose service and timing" description="Pick the closest service. The form will only show questions that match that choice.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service requested" required>
            <select className="input" required value={form.service} onChange={(e) => handleServiceChange(e.target.value)}>
              <option value="">Choose a service</option>
              {publicRequestServices.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
            </select>
          </Field>
          <Field label="Scheduling preference">
            <select className="input" value={form.urgency} onChange={(e) => update("urgency", e.target.value)}>
              <option>Flexible around my preferred date</option>
              <option>Preferred date is important</option>
              <option>ASAP — next available opening</option>
              <option>Planning ahead for a future date</option>
              <option>Recurring help — contact me to discuss</option>
            </select>
          </Field>
          <Field label="Requested date" required><input type="date" className="input" required value={form.preferredDate} onChange={(e) => update("preferredDate", e.target.value)} /></Field>
          <Field label="Backup date (optional)"><input type="date" className="input" value={form.alternateDate} onChange={(e) => update("alternateDate", e.target.value)} /></Field>
        </div>
        <Field label="Preferred time window"><input className="input" placeholder="Example: Friday morning, Saturday after 1pm, weekdays after 4" value={form.preferredWindow} onChange={(e) => update("preferredWindow", e.target.value)} /></Field>

        {selectedService && (
          <div className="rounded-[1.5rem] border border-nest-teal/15 bg-nest-mint/25 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">Selected package</p>
                <h3 className="mt-1 text-2xl font-black text-nest-teal">{selectedService.title}</h3>
                <p className="mt-2 text-nest-ink/72">{selectedService.description}</p>
              </div>
              <div className="rounded-3xl bg-white px-5 py-4 text-left shadow-sm sm:min-w-52">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-nest-ink/55">Starting price</p>
                <p className="mt-1 text-3xl font-black text-nest-teal">{selectedService.standardPrice}</p>
                <p className="mt-1 text-sm font-bold text-nest-gold">{selectedService.priceNote}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniInfo icon={<Clock className="h-4 w-4" />} text={selectedService.serviceTime} />
              {selectedService.travelInfo && <MiniInfo icon={<MapPin className="h-4 w-4" />} text={selectedService.travelInfo} />}
            </div>
          </div>
        )}
      </Section>


      <Section title="3. Service address" description="After we know the service, we review the address for service area, timing, access, and helper availability before payment.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Street address" required><input className="input" required autoComplete="address-line1" placeholder="123 Main St" value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>
          <Field label="Apt / unit / suite (optional)"><input className="input" autoComplete="address-line2" placeholder="Apt, unit, suite, gate code note, etc." value={form.address2} onChange={(e) => update("address2", e.target.value)} /></Field>
          <Field label="City" required><input className="input" required autoComplete="address-level2" value={form.city} onChange={(e) => update("city", e.target.value)} /></Field>
          <Field label="State" required>
            <select className="input" required autoComplete="address-level1" value={form.state} onChange={(e) => update("state", e.target.value)}>
              <option value="WA">Washington</option>
            </select>
          </Field>
          <Field label="ZIP" required><input className="input" required autoComplete="postal-code" inputMode="numeric" pattern="\d{5}(-\d{4})?" placeholder="98072" value={form.zip} onChange={(e) => update("zip", normalizeZipInput(e.target.value))} /></Field>
        </div>
        <p className="rounded-2xl border border-nest-gold/15 bg-nest-cream/70 px-4 py-3 text-xs font-bold leading-5 text-nest-ink/65">
          Use the service address so we can confirm area, access, availability, and any required taxes. If an address cannot be confirmed or appears outside our service area, NestHelper will follow up before accepting payment.
        </p>
      </Section>

      {serviceCategory === "none" && (
        <Section title="4. Package-specific questions" description="Choose a service above and this section will only show questions that match that package.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm font-semibold leading-6 text-nest-ink/76">
            Select Whole Home Cleaning, Specific Area(s) Reset, Move Prep & Home Reset, Move-In / Move-Out Cleaning, Errand Helper, or Laundry Rescue to continue.
          </div>
        </Section>
      )}

      {isHomeReset && (
        <Section
          title={isWholeHomeReset ? "4. Whole home cleaning scope" : isParentResetPlan ? "4. Parent Reset Plan focus" : "4. Home reset focus"}
          description={isWholeHomeReset
            ? "Choose this for full-home cleaning, including first-time deep cleans and ongoing maintenance."
            : isParentResetPlan
              ? "Choose the family spaces that need organizing, light cleaning, and child-safe disinfecting during the 3-hour parent reset."
              : "Choose what needs attention. We review your package, time block, notes, and photos before confirming what can reasonably fit."}
        >
          {isWholeHomeReset ? (
            <>
              <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm leading-6 text-nest-ink/76">
                <strong className="text-nest-teal">Good fit:</strong> entire-home cleaning, first-time deep clean, first-time deep clean + recurring maintenance, or recurring maintenance only. <strong className="text-nest-teal">Quote first:</strong> heavy buildup, interior appliances, extra linens, pet hair focus, or unusual access notes.
              </div>
              <div className="grid items-start gap-4 sm:grid-cols-2">
                <Field label="Home type">
                  <select className="input" value={form.homeType} onChange={(e) => update("homeType", e.target.value)}>
                    <option>Single-family home</option>
                    <option>Townhome</option>
                    <option>Apartment / condo</option>
                    <option>Multi-generational home</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Approximate square footage" required>
                  <input className="input" required inputMode="numeric" placeholder="Example: 1,850" value={form.squareFootage} onChange={(e) => update("squareFootage", e.target.value.replace(/[^0-9,]/g, "").slice(0, 8))} />
                </Field>
                <Field label="Bedrooms" required>
                  <select className="input" required value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)}>
                    <option value="">Choose bedrooms</option>
                    {bedroomCountOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Bathrooms" required>
                  <select className="input" required value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)}>
                    <option value="">Choose bathrooms</option>
                    {bathroomCountOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Visit type" required>
                  <select className="input" required value={form.wholeHomeVisitType} onChange={(e) => update("wholeHomeVisitType", e.target.value)}>
                    {wholeHomeVisitTypeOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                {form.wholeHomeVisitType.toLowerCase().includes("recurring") && (
                  <Field label="Maintenance cadence">
                    <select className="input" value={form.wholeHomeRecurringCadence} onChange={(e) => update("wholeHomeRecurringCadence", e.target.value)}>
                      {wholeHomeRecurringCadenceOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="Condition level">
                  <select className="input" value={form.wholeHomeCondition} onChange={(e) => update("wholeHomeCondition", e.target.value)}>
                    <option>Light cleaning / mostly maintained</option>
                    <option>Standard cleaning / normal household use</option>
                    <option>Deep cleaning / first visit needed</option>
                    <option>Heavy buildup in kitchen or bathrooms</option>
                    <option>Needs photos or walkthrough before quoting</option>
                  </select>
                </Field>
                <Field label="Product preference">
                  <select className="input" value={form.supplyPreference} onChange={(e) => update("supplyPreference", e.target.value)}>
                    <option>NestHelper brings standard supplies</option>
                    <option>Non-toxic / low-odor options requested where appropriate</option>
                    <option>Fragrance-free / sensitive products requested</option>
                    <option>Baby/sensitive product preference</option>
                    <option>Customer-provided products only</option>
                    <option>Not sure yet</option>
                  </select>
                </Field>

              </div>

              <p className="text-sm font-semibold leading-6 text-nest-ink/62">
                Choose Whole Home Cleaning for the entire home, including first-time deep cleans and ongoing maintenance.
              </p>

              <div>
                <div className="label mb-3">Optional detail add-ons / focus items</div>
                <p className="mb-3 text-sm leading-6 text-nest-ink/65">
                  Standard whole-home cleaning covers the main rooms. Only choose these if you want extra detail items quoted or prioritized.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {wholeHomeAddOnOptions.map((item) => (
                    <CheckOption key={item} checked={form.wholeHomeAddOns.includes(item)} onChange={(checked) => toggleList("wholeHomeAddOns", item, checked)}>{item}</CheckOption>
                  ))}
                </div>
                <p className="mt-2 text-xs font-bold text-nest-ink/55">Interior appliances, heavy buildup, extra linens, and detail dusting may affect the price and time needed.</p>
              </div>

              {form.wholeHomeAddOns.includes("Other — I’ll explain below") && (
                <Field label="Other whole-home add-on / focus item" required>
                  <input className="input" required placeholder="Example: hallway walls, high chair detail, inside microwave, extra pet hair focus" value={form.wholeHomeOtherAddOn} onChange={(e) => update("wholeHomeOtherAddOn", e.target.value)} />
                </Field>
              )}

              <Field label="Top priorities and safety notes" required>
                <textarea className="input min-h-28" required placeholder="Example: Regular cleaning for entire home. Please prioritize kitchen, bathrooms, floors, and reachable dusting. Two dogs will be secured upstairs." value={form.requestDetails} onChange={(e) => update("requestDetails", e.target.value)} />
              </Field>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Home type">
                  <select className="input" value={form.homeType} onChange={(e) => update("homeType", e.target.value)}>
                    <option>Single-family home</option>
                    <option>Townhome</option>
                    <option>Apartment / condo</option>
                    <option>Multi-generational home</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Product preference">
                  <select className="input" value={form.supplyPreference} onChange={(e) => update("supplyPreference", e.target.value)}>
                    <option>NestHelper brings standard supplies</option>
                    <option>Non-toxic / low-odor options requested where appropriate</option>
                    <option>Fragrance-free / sensitive products requested</option>
                    <option>Baby/sensitive product preference</option>
                    <option>Not sure yet</option>
                  </select>
                </Field>
              </div>
              <Field label="Interested in recurring resets?">
                <select className="input" value={form.recurringResetInterest} onChange={(e) => update("recurringResetInterest", e.target.value)}>
                  {recurringResetOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/62">
                  First visits stay at standard pricing. Repeat support may be offered after the first completed visit when schedule, scope, service area, and helper fit are consistent.
                </p>
              </Field>
              <div>
                <div className="label mb-3">Main priorities</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {priorityOptions.map((item) => (
                    <CheckOption key={item} checked={form.homePriorities.includes(item)} onChange={(checked) => toggleList("homePriorities", item, checked)}>{item}</CheckOption>
                  ))}
                </div>
              </div>
              {showMealPrepQuestions && (
                <div className="rounded-[1.75rem] border border-nest-gold/20 bg-nest-cream p-5 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Simple in-home meal prep</p>
                  <h4 className="mt-1 text-xl font-black text-nest-teal">Only simple prep inside the customer’s home.</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/70">
                    Meal prep support is limited to simple hands-on prep using the customer’s food, kitchen, tools, containers, and instructions. Good examples include washing or chopping produce, portioning snacks, prepping simple ingredients, or organizing prepared items in the fridge.
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-nest-ink/68">
                    Not included: catering, private-chef service, full meal cooking, off-site food prep, nutrition or diet planning, medical dietary decisions, or food purchased/prepared by NestHelper.
                  </p>
                  <div className="mt-5">
                    <div className="label mb-3">Simple meal prep tasks <span className="text-red-600">*</span></div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {mealPrepTaskOptions.map((item) => (
                        <CheckOption key={item} checked={form.mealPrepTasks.includes(item)} onChange={(checked) => toggleList("mealPrepTasks", item, checked)}>{item}</CheckOption>
                      ))}
                    </div>
                  </div>
                  <Field label={form.mealPrepTasks.includes("Other simple in-home prep — I’ll explain below") ? "Meal prep notes / other task" : "Meal prep notes / instructions (optional)"} required={form.mealPrepTasks.includes("Other simple in-home prep — I’ll explain below")}>
                    <textarea
                      className="input min-h-24"
                      required={form.mealPrepTasks.includes("Other simple in-home prep — I’ll explain below")}
                      placeholder="Example: Please wash and chop bell peppers, cucumbers, and berries. Use the glass containers in the lower cabinet. No cooking needed."
                      value={form.mealPrepNotes}
                      onChange={(e) => update("mealPrepNotes", e.target.value)}
                    />
                  </Field>
                  <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
                    <input type="checkbox" required checked={form.mealPrepAck} onChange={(e) => update("mealPrepAck", e.target.checked)} className="mt-1 h-4 w-4" />
                    <span><span className="text-red-600">*</span> I understand simple meal prep is done only inside my home using my food, kitchen tools, containers, and instructions. NestHelper does not provide catering, private-chef service, off-site food prep, nutrition planning, or medical dietary decisions.</span>
                  </label>
                </div>
              )}

              <div>
                <div className="label mb-2">Where should we focus first?</div>
                <p className="mb-3 text-sm leading-6 text-nest-ink/65">
                  Choose the family spaces you’d like help with. Parent Reset Plan is best for selected rooms or areas; if you choose whole home, we’ll help prioritize instead of promising every room can be completed in one visit.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {homeAreaOptions.map((item) => {
                    const disabled = wholeHomeSelected && item !== WHOLE_HOME_OPTION;
                    return (
                      <CheckOption
                        key={item}
                        checked={form.homeAreas.includes(item)}
                        disabled={disabled}
                        onChange={(checked) => toggleList("homeAreas", item, checked)}
                      >
                        {item}
                      </CheckOption>
                    );
                  })}
                </div>
                {wholeHomeSelected && (
                  <ScopeNotice>
                    Whole-home requests do not usually fit a Parent Reset Plan. Tell us the top 2–3 priorities, and we’ll review whether Parent Reset Plan or Whole Home Cleaning is the better fit before checkout.
                  </ScopeNotice>
                )}
                {homeScopeWarning && <ScopeNotice tone="warning">{homeScopeWarning}</ScopeNotice>}
              </div>
              <Field label={wholeHomeSelected ? "Top 2–3 must-do priorities for this visit" : "Top priorities for this visit"} required>
                <textarea className="input min-h-28" required placeholder="Example: Please reset the playroom and kids room first, organize toys into bins, wipe reachable surfaces, disinfect high-touch areas with child-safe products, and fold the laundry pile if there is time." value={form.requestDetails} onChange={(e) => update("requestDetails", e.target.value)} />
              </Field>
            </>
          )}
        </Section>
      )}

      {isAreaReset && (
        <Section title="4. Specific Area(s) scope" description="Choose this when you only need help with selected rooms or focused areas. Pick the rooms first, then the form only shows matching cleaning types and add-ons.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm leading-6 text-nest-ink/76">
            <strong className="text-nest-teal">Good fit:</strong> selected rooms or focused areas like kitchen, bathroom(s), bedrooms, playroom, pantry, fridge, oven, laundry area, garage, or a few rooms. <strong className="text-nest-teal">Not for:</strong> entire-home recurring cleaning plans. <strong className="text-nest-teal">Quote first:</strong> interior appliances, inside cabinets or drawers, heavy buildup, large clutter, donation/trash prep, and specialty needs.
          </div>

          <div>
            <div className="label mb-3">Rooms / areas to include <span className="text-red-600">*</span></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {areaResetRoomOptions.map((item) => (
                <CheckOption key={item} checked={form.areaResetRooms.includes(item)} onChange={(checked) => toggleList("areaResetRooms", item, checked)}>{item}</CheckOption>
              ))}
            </div>
            {!form.areaResetRooms.length && (
              <p className="mt-2 text-xs font-bold text-nest-ink/55">Select at least one room or area first. Then we’ll show the matching cleaning types and add-on choices.</p>
            )}
          </div>

          {form.areaResetRooms.includes("Other — I’ll explain below") && (
            <Field label="Other room / area" required>
              <input className="input" required placeholder="Example: home office, hallway, storage room, guest room" value={form.areaResetOtherRoom} onChange={(e) => update("areaResetOtherRoom", e.target.value)} />
            </Field>
          )}

          {form.areaResetRooms.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cleaning / reset type" required>
                  <select className="input" required value={form.areaResetCleaningType} onChange={(e) => update("areaResetCleaningType", e.target.value)}>
                    <option value="">Select the type of help</option>
                    {visibleAreaResetCleaningTypeOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Is this a one-time reset or repeat area support?">
                  <select className="input" value={form.areaResetRepeatSupport} onChange={(e) => update("areaResetRepeatSupport", e.target.value)}>
                    {areaResetRepeatSupportOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                  <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/62">
                    Repeat area support is for selected rooms or areas only, not a full-home recurring cleaning plan.
                  </p>
                </Field>
                {form.areaResetRooms.includes("Bathroom(s)") && (
                  <Field label="How many bathrooms?" required>
                    <input className="input" required placeholder="Example: 2.5 bathrooms" value={form.areaResetBathroomCount} onChange={(e) => update("areaResetBathroomCount", e.target.value)} />
                  </Field>
                )}
                <Field label="Approximate size / count" required>
                  <input className="input" required placeholder="Example: kitchen + 2.5 baths, small pantry, 1-car garage, 10x12 room" value={form.areaResetSize} onChange={(e) => update("areaResetSize", e.target.value)} />
                </Field>
                <Field label="Condition level">
                  <select className="input" value={form.areaResetCondition} onChange={(e) => update("areaResetCondition", e.target.value)}>
                    <option>Light cleaning / mostly maintained</option>
                    <option>Standard cleaning / normal household use</option>
                    <option>Deep cleaning / visible buildup</option>
                    <option>Lots to sort, but walkable</option>
                    <option>Heavy clutter / limited floor space</option>
                    <option>Needs photos or walkthrough before quoting</option>
                  </select>
                </Field>
                <Field label="Trash/donation prep needed?">
                  <select className="input" value={form.areaResetHauling} onChange={(e) => update("areaResetHauling", e.target.value)}>
                    {areaResetHaulingOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Product preference">
                  <select className="input" value={form.supplyPreference} onChange={(e) => update("supplyPreference", e.target.value)}>
                    <option>NestHelper brings standard supplies</option>
                    <option>Non-toxic / low-odor options requested where appropriate</option>
                    <option>Fragrance-free / sensitive products requested</option>
                    <option>Customer-provided products only</option>
                    <option>Not sure yet</option>
                  </select>
                </Field>
              </div>

              <div>
                <div className="label mb-3">Room-specific add-ons / focus items</div>
                <p className="mb-3 text-sm leading-6 text-nest-ink/65">
                  These options are based on the room(s) selected above, so kitchen requests show kitchen details, bathroom requests show bathroom details, and organizing areas show sorting/storage choices.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {visibleAreaResetAddOnOptions.map((item) => (
                    <CheckOption key={item} checked={form.areaResetAddOns.includes(item)} onChange={(checked) => toggleList("areaResetAddOns", item, checked)}>{item}</CheckOption>
                  ))}
                </div>
                <p className="mt-2 text-xs font-bold text-nest-ink/55">Some detail items, like interior fridge, interior oven, inside cabinets, or heavy buildup, may affect the price and time needed.</p>
                {visibleAreaResetAddOnOptions.includes("Set up shelves, bins, zones, or Smart Labels") && (
                  <p className="mt-1 text-xs font-bold text-nest-ink/55">Smart Labels are simple QR stickers for bins, shelves, closets, boxes, and storage areas so your family can scan and update what belongs there.</p>
                )}
              </div>

              {form.areaResetAddOns.includes("Other — I’ll explain below") && (
                <Field label="Other add-on / focus item" required>
                  <input className="input" required placeholder="Example: inside microwave, high chair detail, hallway walls, pet hair focus" value={form.areaResetOtherAddOn} onChange={(e) => update("areaResetOtherAddOn", e.target.value)} />
                </Field>
              )}

              <Field label="Top priorities and safety notes" required>
                <textarea className="input min-h-28" required placeholder="Example: Kitchen + 2.5 bathrooms. Standard cleaning first. Please include interior fridge, but no oven this visit. Repeat area support monthly may help. Two dogs will be secured upstairs." value={form.areaResetNotes} onChange={(e) => update("areaResetNotes", e.target.value)} />
              </Field>
            </>
          )}
        </Section>
      )}


      {isMovePrep && (
        <Section title="4. Move Prep & Home Reset scope" description="Movers handle the heavy lifting. NestHelper helps with the home reset. Start with the main help you need, then add only the extras that apply.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm leading-6 text-nest-ink/76">
            <strong className="text-nest-teal">Simple flow:</strong> choose a starting package, pick before-move focus areas, then add any priced extras like after-move unpacking, after-move kitchen setup, QR labels, supply kits, or move-out cleaning review. <strong className="text-nest-teal">Boundary:</strong> {MOVE_PREP_DISCLAIMER}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Best starting point" required>
              <select className="input text-sm sm:text-base" required value={form.movePrepPackage} onChange={(e) => update("movePrepPackage", e.target.value)}>
                {movePrepPackageOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
              <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-nest-ink/65 shadow-sm">
                {movePrepPackageDescriptions[form.movePrepPackage] || "Tell us what is happening and we will recommend the best starting point."}
              </p>
            </Field>
            <Field label="Home type">
              <select className="input" value={form.homeType} onChange={(e) => update("homeType", e.target.value)}>
                <option>Single-family home</option>
                <option>Townhome</option>
                <option>Apartment / condo</option>
                <option>Multi-generational home</option>
                <option>Other</option>
              </select>
            </Field>
          </div>

          <div>
            <div className="label mb-3">1. Before-move help to include in the starting package</div>
            <p className="mb-3 text-sm leading-6 text-nest-ink/65">
              These are the normal Move Prep tasks. We will use your selected package time first, then recommend extra time only if needed.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {movePrepBeforeMoveOptions.map((item) => {
                const checked = form.movePrepOptions.includes(item);
                return (
                  <MovePrepCheckOption
                    key={item}
                    checked={checked}
                    description={movePrepOptionDescriptions[item]}
                    onChange={(nextChecked) => toggleList("movePrepOptions", item, nextChecked)}
                  >
                    {item}
                  </MovePrepCheckOption>
                );
              })}
            </div>
          </div>

          <div>
            <div className="label mb-3">2. Optional priced add-ons</div>
            <p className="mb-3 text-sm leading-6 text-nest-ink/65">
              Add these only if you want them reviewed with the request. Supply kit details stay visible; other add-on notes appear when selected.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {movePrepPricedAddOnOptions.map((item) => {
                const checked = form.movePrepOptions.includes(item);
                return (
                  <MovePrepCheckOption
                    key={item}
                    checked={checked}
                    description={movePrepOptionDescriptions[item]}
                    showDescription={item.toLowerCase().includes("supply kit")}
                    onChange={(nextChecked) => toggleList("movePrepOptions", item, nextChecked)}
                  >
                    {item}
                  </MovePrepCheckOption>
                );
              })}
            </div>
          </div>

          <div>
            <div className="label mb-3">3. Separate quote or review items</div>
            <p className="mb-3 text-sm leading-6 text-nest-ink/65">
              These are reviewed separately so the move prep price stays clear and competitive.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {movePrepReviewOptionOptions.map((item) => {
                const checked = form.movePrepOptions.includes(item);
                return (
                  <MovePrepCheckOption
                    key={item}
                    checked={checked}
                    description={movePrepOptionDescriptions[item]}
                    onChange={(nextChecked) => toggleList("movePrepOptions", item, nextChecked)}
                  >
                    {item}
                  </MovePrepCheckOption>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-nest-gold/16 bg-white p-5 text-sm font-semibold leading-6 text-nest-ink/72 shadow-sm">
            <p><strong className="text-nest-teal">Pricing guide:</strong> Move prep starts at $199. Focused room or area prep is $249. After-move unpacking/home reset starts at $299. After-move kitchen setup/reset starts at $349. QR smart labels are $99 up to 20 labels. Basic packing supply kits start at $59 and are charged separately.</p>
            <p className="mt-2">Additional approved helper time is $65 per helper-hour with a 1-hour minimum. Larger supply kits, move-out cleaning, garage/storage areas, sheds, heavy clutter, and larger QR label setups are reviewed before checkout.</p>
          </div>

          <Field label="Tell us what is happening with the move" required>
            <textarea className="input min-h-28" required placeholder="Example: Movers are coming Friday. We need help sorting the kitchen, setting aside open-first boxes, making a donation pile, and possibly adding a kitchen reset after the move." value={form.movePrepNotes} onChange={(e) => update("movePrepNotes", e.target.value)} />
          </Field>

          <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
            <input type="checkbox" required checked={form.movePrepAck} onChange={(e) => update("movePrepAck", e.target.checked)} className="mt-1 h-4 w-4" />
            <span><span className="text-red-600">*</span> I understand NestHelper does not transport household goods, load vehicles, provide moving labor, or operate as a moving company. NestHelper provides in-home move prep, organizing, labeling, cleaning, unpacking, and reset support only.</span>
          </label>
        </Section>
      )}

      {isMoveOut && (
        <Section title="4. Move-in / move-out cleaning scope" description="Move-in / move-out cleaning is quoted after review. Square footage, empty-home status, condition, photos, and priority areas help us give a clearer estimate before checkout.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm leading-6 text-nest-ink/76">
            <strong className="text-nest-teal">Good fit:</strong> empty or mostly empty homes, apartments, condos, move-ins, move-outs, rental turnovers, and listing prep. <strong className="text-nest-teal">Quote first:</strong> heavy grease, hard-water staining, inside appliances, construction dust, excessive trash, or specialty restoration.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Home type">
              <select className="input" value={form.homeType} onChange={(e) => update("homeType", e.target.value)}>
                <option>Single-family home</option>
                <option>Townhome</option>
                <option>Apartment / condo</option>
                <option>Multi-generational home</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Approximate square footage" required>
              <input className="input" required inputMode="numeric" placeholder="Example: 1,250" value={form.squareFootage} onChange={(e) => update("squareFootage", e.target.value.replace(/[^0-9,]/g, "").slice(0, 8))} />
            </Field>
            <Field label="Bedrooms" required>
              <select className="input" required value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)}>
                <option value="">Choose bedrooms</option>
                {bedroomCountOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Bathrooms" required>
              <select className="input" required value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)}>
                <option value="">Choose bathrooms</option>
                {bathroomCountOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Is this for move-in or move-out?" required>
              <select className="input" required value={form.moveCleaningType} onChange={(e) => update("moveCleaningType", e.target.value)}>
                <option value="">Choose move-in, move-out, or turnover</option>
                <option>Move-in cleaning before belongings arrive</option>
                <option>Move-out cleaning after belongings are removed</option>
                <option>Empty home deep clean / not sure</option>
                <option>Rental turnover</option>
                <option>Listing / real estate prep</option>
                <option>Other — I’ll explain below</option>
              </select>
            </Field>
            <Field label="Home status">
              <select className="input" value={form.occupancyStatus} onChange={(e) => update("occupancyStatus", e.target.value)}>
                <option>Empty / no furniture</option>
                <option>Mostly empty</option>
                <option>Partially furnished</option>
                <option>Still furnished</option>
                <option>Other — I’ll explain below</option>
              </select>
            </Field>
            <Field label="Condition level">
              <select className="input" value={form.moveOutCondition} onChange={(e) => update("moveOutCondition", e.target.value)}>
                <option>Light empty-home condition</option>
                <option>Normal empty-home condition</option>
                <option>Kitchen or bathrooms need extra attention</option>
                <option>Heavy buildup / grease / hard water</option>
                <option>Needs photos or walkthrough before quoting</option>
              </select>
            </Field>
            <Field label="Product preference">
              <select className="input" value={form.supplyPreference} onChange={(e) => update("supplyPreference", e.target.value)}>
                <option>NestHelper brings standard supplies</option>
                <option>Non-toxic / low-odor options requested where appropriate</option>
                <option>Fragrance-free / sensitive products requested</option>
                <option>Customer-provided products only</option>
                <option>Not sure yet</option>
              </select>
            </Field>
          </div>
          <div>
            <div className="label mb-3">Main cleaning focus</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {moveOutFocusOptions.map((item) => (
                <CheckOption key={item} checked={form.moveOutFocus.includes(item)} onChange={(checked) => toggleList("moveOutFocus", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-3">Inside appliances to quote if needed</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {moveOutApplianceOptions.map((item) => (
                <CheckOption key={item} checked={form.moveOutAppliances.includes(item)} onChange={(checked) => toggleList("moveOutAppliances", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <Field label="Anything we should know before quoting?" required>
            <textarea className="input min-h-28" required placeholder="Example: Empty 2 bed / 2 bath. Move-in cleaning before furniture arrives. Kitchen, bathtub, and cabinets need the most attention. Please quote non-toxic products if possible." value={form.moveOutNotes} onChange={(e) => update("moveOutNotes", e.target.value)} />
          </Field>
        </Section>
      )}

      {isErrand && (
        <Section title="4. Errand Helper details" description="Errand Helper is for local approved errands: up to 2 hours and up to 15 driving miles included.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm leading-6 text-nest-ink/76">
            <strong className="text-nest-teal">Good fit:</strong> grocery pickup, returns, approved pickup/drop-off tasks, and family logistics. <strong className="text-nest-teal">Not allowed:</strong> alcohol, weapons, controlled substances, unsafe requests, or anything that requires legal/medical judgment.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Errand type">
              <select className="input" value={form.errandType} onChange={(e) => update("errandType", e.target.value)}>
                <option>Grocery or store pickup</option>
                <option>Store return / exchange</option>
                <option>Package drop-off or pickup</option>
                <option>Donation drop-off</option>
                <option>Pharmacy pickup — non-prescription only</option>
                <option>Multiple family logistics stops</option>
                <option>Other approved local errand</option>
              </select>
            </Field>
            <Field label="Estimated distance">
              <select className="input" value={form.errandDistance} onChange={(e) => update("errandDistance", e.target.value)}>
                <option>Within 5 miles</option>
                <option>5–10 miles</option>
                <option>10–15 miles</option>
                <option>More than 15 miles — quote first</option>
                <option>Not sure yet</option>
              </select>
            </Field>
          </div>
          <Field label="Errand stops or task list" required><textarea className="input min-h-28" required placeholder="Example: Target return, grocery pickup at QFC, package drop-off." value={form.errandStops} onChange={(e) => update("errandStops", e.target.value)} /></Field>
          <Field label="Starting area / stores / drop-off area" required><input className="input" required placeholder="Example: Bothell QFC to my home, or Woodinville return drop-off" value={form.errandStartArea} onChange={(e) => update("errandStartArea", e.target.value)} /></Field>
          <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
            <input type="checkbox" required checked={form.errandMileageAck} onChange={(e) => update("errandMileageAck", e.target.checked)} className="mt-1 h-4 w-4" />
            <span><span className="text-red-600">*</span> I understand Errand Helper includes up to 2 hours and up to 15 driving miles. NestHelper will quote extra distance, complex stops, or special handling before checkout.</span>
          </label>
        </Section>
      )}

      {isLaundry && (
        <Section title="4. Laundry Rescue preferences" description="Laundry Rescue intro launch pricing: $59 minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs of laundry. Additional laundry is $2.25/lb. Eco-friendly detergent is available.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estimated laundry amount" required>
              <select className="input" required value={form.laundryBagEstimate} onChange={(e) => update("laundryBagEstimate", e.target.value)}>
                <option>1–2 bags/hampers</option>
                <option>3–4 bags/hampers</option>
                <option>5+ bags/hampers</option>
                <option>Towels/sheets mostly</option>
                <option>Not sure yet</option>
              </select>
            </Field>
            <Field label="Pickup spot" required>
              <select className="input" required value={form.laundryPickupSpot} onChange={(e) => update("laundryPickupSpot", e.target.value)}>
                <option>Front porch / outside door</option>
                <option>Garage</option>
                <option>Apartment / condo door</option>
                <option>Lobby / front desk</option>
                <option>Text me on arrival</option>
                <option>Other — I’ll explain in access notes</option>
              </select>
            </Field>
            <Field label="Return/drop-off spot">
              <select className="input" value={form.laundryReturnSpot} onChange={(e) => update("laundryReturnSpot", e.target.value)}>
                <option>Same as pickup spot</option>
                <option>Front porch / outside door</option>
                <option>Garage</option>
                <option>Apartment / condo door</option>
                <option>Lobby / front desk</option>
                <option>Text me before returning</option>
                <option>Other — I’ll explain in access notes</option>
              </select>
            </Field>
            <Field label="Detergent preference">
              <select className="input" value={form.detergent} onChange={(e) => update("detergent", e.target.value)}>
                <option>Eco-friendly standard detergent</option>
                <option>Baby & Sensitive Skin Detergent +$5</option>
                <option>Fragrance-free detergent +$5</option>
                <option>Customer-provided detergent, no fee</option>
                <option>No preference</option>
              </select>
              {form.detergent === "Customer-provided detergent, no fee" && (
                <p className="rounded-2xl bg-nest-mint/30 px-3 py-2 text-xs font-bold leading-5 text-nest-teal">
                  Please leave your detergent with the laundry. If it is not there, we’ll use NestHelper’s standard eco-friendly detergent.
                </p>
              )}
            </Field>
            <Field label="Dryer preference">
              <select className="input" value={form.dryPreference} onChange={(e) => update("dryPreference", e.target.value)}>
                <option>Standard dry</option>
                <option>Low heat +$3</option>
                <option>Hang dry selected items</option>
              </select>
            </Field>
          </div>
          <div>
            <div className="label mb-3">Laundry type</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {laundryTypeOptions.map((item) => (
                <CheckOption key={item} checked={form.laundryTypes.includes(item)} onChange={(checked) => toggleList("laundryTypes", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-3">Laundry add-ons to consider</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {laundryRequestAddOns.map((item) => (
                <CheckOption key={item} checked={form.laundryAddOns.includes(item)} onChange={(checked) => toggleList("laundryAddOns", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <label className="flex gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-semibold text-nest-ink/88 shadow-sm ring-1 ring-red-100">
            <input type="checkbox" required checked={form.reusableBagAck} onChange={(e) => update("reusableBagAck", e.target.checked)} className="mt-1 h-5 w-5 accent-red-600" />
            <span>
              <span className="mb-1 inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-black uppercase tracking-wide text-red-700 ring-1 ring-red-200">
                <span className="mr-1 text-base leading-none text-red-600">*</span> Required
              </span>
              <span className="block leading-6">
                I understand clean laundry may be returned in NestHelper reusable bags/totes that should be returned at the next pickup, scheduled drop-off, or another approved return method.
              </span>
            </span>
          </label>
        </Section>
      )}

      {smartLabelsAvailable && (
        <Section title="Optional Smart Label Setup" description="Smart Labels are simple QR stickers for bins, shelves, closets, boxes, and storage areas. Choose starter labels only, or pick a simple setup package if you want NestHelper to place and document labels during the reset.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm leading-6 text-nest-ink/76">
            <strong className="text-nest-teal">What they are:</strong> QR stickers your family can scan to see or update the label name, location, contents, notes, and small photos. <strong className="text-nest-teal">Simple setup pricing:</strong> Starter setup up to 10 labels is $49, Standard setup up to 20 labels is $79, and Full setup up to 30 labels is $109. Larger setups, extra labels, and detailed inventory can be quoted after review.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Smart Label option">
              <select className="input" value={form.smartLabelSetupInterest} onChange={(e) => update("smartLabelSetupInterest", e.target.value)}>
                {smartLabelSetupOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
            {showSmartLabelCount && (
              <Field label="Estimated label count / storage spots">
                <select className="input" value={form.smartLabelEstimatedCount} onChange={(e) => update("smartLabelEstimatedCount", e.target.value)}>
                  {smartLabelEstimatedCountOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
            )}
            {showSmartLabelNotes && (
              <Field label="Label notes (optional)">
                <input className="input" placeholder="Example: pantry shelves, garage bins, kids clothes, moving boxes, toy storage" value={form.smartLabelSetupNotes} onChange={(e) => update("smartLabelSetupNotes", e.target.value)} />
              </Field>
            )}
          </div>
        </Section>
      )}

      {(isHomeReset || isAreaReset || isMoveOut || isMovePrep) && (
        <Section title="5. Home, pets, and access" description={isMoveOut ? "Clear move-in / move-out access notes help us quote accurately and avoid delays on service day." : isMovePrep ? "Clear move prep access notes help us plan parking, entry, supplies, safe work areas, and any boxes or labels before service day." : isAreaReset ? "Clear area-reset access notes help us quote accurately, plan supplies, and avoid unsafe conditions on service day." : "Clear access notes help us avoid delays and make sure the request is safe for everyone."}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isMoveOut ? "Pets or pet history" : "Pets in home"}>
              <select className="input" value={form.pets} onChange={(e) => update("pets", e.target.value)}>
                <option>No pets</option>
                {isMoveOut && <option>No pets now, but pets lived here before</option>}
                <option>Dog(s) — will be secured</option>
                <option>Dog(s) — need to discuss</option>
                <option>Cat(s)</option>
                <option>Dog(s) and cat(s)</option>
                <option>Other pets</option>
                <option>I need to explain the pet/access situation</option>
              </select>
            </Field>
            <Field label="Parking/access notes"><input className="input" placeholder="Door code, parking, apartment info, stairs, elevator, gate, where to enter, etc." value={form.parkingAccess} onChange={(e) => update("parkingAccess", e.target.value)} /></Field>
          </div>
          {petDetailsRequired && (
            <Field label="Pet details" required>
              <textarea
                className="input min-h-24"
                required
                placeholder={isMoveOut ? "Example: No pets now, but there was a dog before the home was emptied. Please pay extra attention to floors/baseboards." : isAreaReset ? "Example: Two dogs will be secured inside while the garage is being reset. Please do not open the side gate." : "Example: Two friendly dogs will be crated upstairs. Cat may hide. Please do not let pets outside."}
                value={form.petDetails}
                onChange={(e) => update("petDetails", e.target.value)}
              />
            </Field>
          )}
        </Section>
      )}

      {isErrand && (
        <Section title="5. Errand access notes" description="Only include the access details needed to complete the errand or pickup/drop-off safely.">
          <Field label="Pickup/drop-off, parking, or access notes"><input className="input" placeholder="Example: leave groceries at front porch, apartment gate code, package pickup desk, parking notes" value={form.parkingAccess} onChange={(e) => update("parkingAccess", e.target.value)} /></Field>
        </Section>
      )}

      {isLaundry && (
        <Section title="5. Laundry pickup and return notes" description="Add porch, garage, gate, remote access, return location, or text-on-arrival details here.">
          <Field label="Pickup, return, garage, porch, or access notes"><input className="input" placeholder="Example: porch pickup, remote garage opening, return clean laundry to garage shelf, gate code, text on arrival" value={form.parkingAccess} onChange={(e) => update("parkingAccess", e.target.value)} /></Field>
        </Section>
      )}

      {serviceCategory !== "none" && (
        <Section title="6. Optional photos" description={isMoveOut ? "Photos are strongly recommended for move-in / move-out cleaning so we can quote the kitchen, bathrooms, floors, appliances, and any buildup before checkout." : isMovePrep ? "Photos are helpful for move prep so we can understand boxes, storage areas, kitchen essentials, donations, supply needs, and any heavy clutter that may require a custom quote." : isAreaReset ? "Photos are strongly recommended for Specific Area(s) Resets so we can quote the selected rooms, cleaning level, clutter level, access, surfaces, buildup, and safety concerns before checkout." : "Photos are optional, but they can help us understand the scope before we approve, quote, or schedule the request."}>
          <PhotoUploadField
            photos={form.photoUploads}
            onChange={(photos) => update("photoUploads", photos)}
            label="Upload photos (optional)"
            description={isMoveOut ? "Add up to 4 photos. Kitchen, bathrooms, floors, bathtub/shower, and any heavy buildup are the most helpful." : isMovePrep ? "Add up to 4 photos. Boxes, storage areas, kitchen essentials, donations, supply needs, and walkable work areas are the most helpful." : isAreaReset ? "Add up to 4 photos. Wide shots of the selected area, kitchen/bath surfaces, floor space, shelves, buildup, piles, and anything you do not want touched are the most helpful." : "Add up to 4 optional photos. Useful for before photos, rooms/areas involved, laundry amount, access notes, or anything that helps us quote and plan accurately."}
          />
        </Section>
      )}

      <div className="grid gap-4 rounded-[1.75rem] border border-nest-teal/15 bg-nest-mint/20 p-5">
        <h3 className="text-xl font-black text-nest-teal">Before you submit</h3>
        <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
          <input type="checkbox" required checked={form.consent} onChange={(e) => update("consent", e.target.checked)} className="mt-1 h-4 w-4" />
          <span><span className="text-red-600">*</span> I understand this is a request, not a confirmed booking. I agree to NestHelper’s Terms, Privacy Policy, Service Scope, Cancellation, Safety, Laundry, and Reset Promise policies.</span>
        </label>
      </div>

      <button disabled={status === "loading"} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-4 text-lg font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift disabled:opacity-60">
        {status === "loading" ? "Submitting..." : "Submit Request"}
        {status !== "loading" && <ArrowRight size={19} />}
      </button>
      {message && <p className={`rounded-2xl p-4 font-semibold ${status === "success" ? "bg-nest-mint/45 text-nest-teal" : "bg-red-50 text-red-700"}`}>{message}</p>}
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const match = title.match(/^(\d+)\.\s*(.*)$/);
  const step = match?.[1];
  const cleanTitle = match?.[2] || title;

  return (
    <section className="relative grid gap-5 overflow-hidden rounded-[1.9rem] border border-nest-gold/15 bg-gradient-to-br from-white via-white to-nest-cream/30 p-5 shadow-sm sm:p-6">
      <div className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-nest-mint/35 blur-3xl" />
      <div className="relative flex gap-4">
        {step ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-nest-teal text-lg font-black text-white shadow-sm">
            {step}
          </div>
        ) : null}
        <div>
          <h3 className="text-xl font-black text-nest-teal sm:text-2xl">{cleanTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-nest-ink/68">{description}</p>
        </div>
      </div>
      <div className="relative grid gap-5">
        {children}
      </div>
    </section>
  );
}

function Field({ label, children, required = false }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="grid min-w-0 content-start gap-2">
      <span className="label">
        {label}
        {required && <span className="ml-1 text-base leading-none text-red-600" aria-label="required">*</span>}
      </span>
      {children}
    </label>
  );
}

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <div className="text-nest-gold">{icon}</div>
      <p className="mt-2 font-black text-nest-teal">{title}</p>
      <p className="mt-1 text-sm leading-5 text-nest-ink/65">{text}</p>
    </div>
  );
}

function MiniInfo({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-nest-ink/75 shadow-sm">
      <span className="text-nest-teal">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ScopeNotice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  const classes = tone === "warning"
    ? "border-amber-300 bg-amber-50 text-amber-900"
    : "border-nest-teal/20 bg-nest-mint/30 text-nest-teal";

  return (
    <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-bold leading-6 ${classes}`}>
      {children}
    </div>
  );
}

function MovePrepCheckOption({ checked, onChange, children, description, showDescription = false }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; description?: string; showDescription?: boolean }) {
  return (
    <label className={`flex items-start gap-3 rounded-2xl border p-3 text-sm font-semibold transition ${checked ? "border-nest-gold/45 bg-nest-mint/35 text-nest-teal shadow-sm" : "border-nest-gold/10 bg-nest-cream text-nest-ink/78 hover:bg-nest-mint/25"}`}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-nest-teal" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0 flex-1">
        <span className="block leading-5">{children}</span>
        {(checked || showDescription) && description && <span className="mt-1 block text-xs font-semibold leading-5 text-nest-ink/62">{description}</span>}
      </span>
    </label>
  );
}

function CheckOption({ checked, onChange, children, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"} ${checked ? "border-nest-gold/45 bg-nest-mint/35 text-nest-teal shadow-sm" : "border-nest-gold/10 bg-nest-cream text-nest-ink/78 hover:bg-nest-mint/25"}`}>
      <input type="checkbox" className="h-4 w-4 accent-nest-teal disabled:cursor-not-allowed" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
