"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, Calculator, CheckCircle2, ClipboardCheck, CreditCard, ShieldCheck } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import { focusFirstInvalidField } from "@/lib/formInvalidFocus";
import { PhotoUploadField, photoUploadSummary, type PhotoUpload } from "@/components/forms/PhotoUploadField";

const defaultState = {
  businessName: "",
  contactName: "",
  roleTitle: "",
  email: "",
  phone: "",
  address: "",
  address2: "",
  city: "",
  state: "WA",
  zip: "",
  serviceAddressConfirmed: false,
  serviceRegion: "Not sure yet",
  businessType: "",
  squareFootage: "",
  bathrooms: "",
  kitchens: "",
  showers: "",
  spaceCondition: "",
  trafficLevel: "",
  frequency: "",
  preferredDate: "",
  preferredDaysTimes: "",
  rentalBedrooms: "",
  rentalBeds: "",
  rentalCheckoutWindow: "",
  rentalLinenHandling: "",
  rentalRestockNeeds: "",
  rentalTurnoverNotes: "",
  supplies: "NestHelper brings standard supplies",
  flooringTypes: [] as string[],
  accessType: "Someone can let NestHelper in",
  accessInstructions: "",
  spaceDetails: [] as string[],
  cleaningPriorities: [] as string[],
  addOnInterests: [] as string[],
  carpetArea: "",
  carpetCondition: "",
  carpetAreaClearance: "",
  spotTreatmentCount: "",
  hardFloorArea: "",
  hardFloorMaterial: "",
  hardFloorCondition: "",
  hardFloorAreaClearance: "",
  upholsteryScope: "",
  upholsteryCondition: "",
  glassScope: "",
  glassAccess: "",
  specialNotes: "",
  photoNotes: "",
  consent: false,
  photoUploads: [] as PhotoUpload[],
};

type CommercialResetFormState = typeof defaultState;
type Status = "idle" | "loading" | "success" | "error";

function normalizeZipInput(value: string) {
  return value.replace(/[^0-9-]/g, "").slice(0, 10);
}

function hasLikelyStreetAddress(address: string) {
  return /\d/.test(address) && /[a-zA-Z]/.test(address) && address.trim().length >= 5;
}

function hasValidZip(zip: string) {
  return /^\d{5}(?:-\d{4})?$/.test(zip.trim());
}

function buildServiceAddress(form: Pick<CommercialResetFormState, "address" | "address2" | "city" | "state" | "zip">) {
  return [form.address, form.address2, form.city, form.state, form.zip].map((part) => part.trim()).filter(Boolean).join(", ");
}

function getAddressValidationMessage(form: Pick<CommercialResetFormState, "address" | "city" | "state" | "zip" | "serviceAddressConfirmed">) {
  if (!hasLikelyStreetAddress(form.address)) return "Please enter the full cleaning street address, including a street number and street name.";
  if (form.city.trim().length < 2) return "Please enter the cleaning city or community.";
  if (form.state !== "WA") return "Commercial Reset currently accepts Washington service addresses only.";
  if (!hasValidZip(form.zip)) return "Please enter a valid 5-digit ZIP code, or ZIP+4.";
  if (!form.serviceAddressConfirmed) return "Please confirm the cleaning address is complete and correct.";
  return "";
}

const businessTypes = [
  "Small office",
  "Studio / gym / wellness space",
  "Salon / barbershop",
  "Church / nonprofit",
  "Therapy / professional office",
  "Real estate / insurance office",
  "Daycare common areas",
  "Schools / learning studios",
  "Short-term rental / vacation rental",
  "Other small business",
];

const frequencies = [
  "One-time commercial reset",
  "Weekly service",
  "Twice weekly service",
  "Three times weekly service",
  "Five times weekly service",
  "Monthly / occasional support",
  "Short-term rental turnover / between-stay reset",
  "Not sure yet — help me choose",
];

const squareFootageOptions = [
  "Under 750 sq ft",
  "750–1,500 sq ft",
  "1,500–2,500 sq ft",
  "2,500–4,000 sq ft",
  "4,000–6,000 sq ft",
  "Over 6,000 sq ft",
  "Not sure yet",
];

const specialtyAreaOptions = [
  "Under 250 sq ft",
  "250–500 sq ft",
  "500–1,000 sq ft",
  "1,000–2,000 sq ft",
  "2,000–4,000 sq ft",
  "Over 4,000 sq ft",
  "Not sure yet",
];

const carpetConditionOptions = [
  "Light refresh",
  "Normal traffic wear",
  "Visible spots / stains",
  "Heavy traffic or odor concerns",
  "Not sure yet",
];

const areaClearanceOptions = [
  "Mostly cleared before service",
  "Light chairs/tables only",
  "Some furniture or obstacles need review",
  "Heavy furniture, equipment, or fragile items in the area",
  "Not sure yet",
];

const spotTreatmentOptions = [
  "1–2 spots / areas",
  "3–5 spots / areas",
  "6+ spots / areas",
  "Not sure yet",
];

const hardFloorMaterialOptions = [
  "VCT / commercial tile",
  "LVP / vinyl plank",
  "Ceramic / tile",
  "Concrete",
  "Rubber gym floor",
  "Mixed / not sure",
];

const hardFloorConditionOptions = [
  "Light refresh",
  "Dull / worn finish",
  "Heavy buildup",
  "Unknown or needs walkthrough",
];

const upholsteryScopeOptions = [
  "1–2 chairs or small items",
  "3–6 seats / waiting room chairs",
  "Small sofa or loveseat",
  "Multiple pieces / needs review",
  "Not sure yet",
];

const upholsteryConditionOptions = [
  "Light refresh",
  "Visible spots / stains",
  "Odor concerns",
  "Fabric type or condition needs review",
  "Not sure yet",
];

const glassScopeOptions = [
  "A few interior windows or mirrors",
  "Reception/front glass area",
  "Multiple rooms or glass walls",
  "Large storefront or exterior glass — needs review",
  "Not sure yet",
];

const glassAccessOptions = [
  "Reachable interior glass / mirrors only",
  "Some high glass may need review",
  "Storefront or exterior glass included",
  "Ladder work may be needed",
  "Not sure yet",
];

const bathroomOptions = ["0", "1", "2", "3", "4", "5+", "Not sure yet"];

const kitchenOptions = [
  "No kitchen/breakroom",
  "1 kitchenette/breakroom",
  "1 full kitchen",
  "2+ kitchen/break areas",
  "Not sure yet",
];

const showerOptions = ["No showers/changing areas", "1", "2", "3+", "Not sure yet"];

const conditionOptions = [
  "Regularly maintained",
  "Light reset needed",
  "First-time / catch-up reset",
  "Heavy reset needed",
  "Not sure yet",
];

const trafficOptions = [
  "Low traffic / private staff space",
  "Moderate daily traffic",
  "High public/client traffic",
  "Event or guest turnover traffic",
  "Not sure yet",
];

const bedroomOptions = ["Studio", "1 bedroom", "2 bedrooms", "3 bedrooms", "4+ bedrooms", "Not sure yet"];

const bedOptions = ["1 bed", "2 beds", "3 beds", "4+ beds", "Not sure yet"];

const flooringOptions = ["Carpet", "Tile", "LVP / vinyl", "Hardwood", "Concrete", "Rubber gym floor", "Mixed / not sure"];

const cleaningPriorityOptions = [
  "Trash / recycling",
  "Bathrooms / restrooms",
  "Breakroom / kitchenette",
  "Floors",
  "Dusting / surfaces",
  "Entry / reception",
  "High-touch areas",
  "Interior glass / mirrors",
];

const addOnOptions = [
  "Carpet deep cleaning quote",
  "Spot/stain treatment quote",
  "Floor scrub quote",
  "Buff / shine quote",
  "Wax / finish quote",
  "Strip & wax quote",
  "Upholstery quote",
  "Interior glass quote",
  "No add-ons right now",
];

const detailOptions = {
  rental: [
    "Kitchen reset",
    "Bathroom reset",
    "Beds / linen changeover",
    "Towels staged",
    "Trash removed",
    "Restock checklist",
    "Photo notes after reset",
  ],
  daycare: [
    "Classrooms / learning rooms",
    "Play/common areas",
    "Child restrooms",
    "Staff restroom",
    "Snack/kitchen area",
    "Entry / pickup area",
    "Nap or quiet area",
  ],
  salonGym: [
    "Styling/service stations",
    "Treatment rooms",
    "Mirrors / glass",
    "Locker/changing area",
    "Shower area",
    "Gym/studio floor area",
    "Towel/trash stations",
  ],
  church: [
    "Lobby / entry",
    "Sanctuary or meeting room",
    "Classrooms / nursery common areas",
    "Restrooms",
    "Kitchen / fellowship area",
    "Office area",
    "Event cleanup support",
  ],
  office: [
    "Reception / waiting area",
    "Private offices",
    "Open work area",
    "Conference rooms",
    "Restrooms",
    "Breakroom / kitchenette",
    "Client-facing rooms",
  ],
  general: [
    "Front/customer area",
    "Staff-only area",
    "Restrooms",
    "Kitchen/break area",
    "Floors",
    "Trash/recycling",
    "High-touch surfaces",
  ],
};

function getBusinessKind(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("rental") || lower.includes("vacation")) return "rental";
  if (lower.includes("daycare") || lower.includes("school") || lower.includes("learning")) return "daycare";
  if (lower.includes("salon") || lower.includes("barber") || lower.includes("gym") || lower.includes("wellness") || lower.includes("studio")) return "salonGym";
  if (lower.includes("church") || lower.includes("nonprofit")) return "church";
  if (lower.includes("office") || lower.includes("therapy") || lower.includes("real estate") || lower.includes("insurance")) return "office";
  return type ? "general" : "";
}

function getSpaceDetailOptions(type: string) {
  const kind = getBusinessKind(type);
  if (!kind) return [];
  return detailOptions[kind as keyof typeof detailOptions] || detailOptions.general;
}

type PlanningEstimate = {
  ready: boolean;
  title: string;
  primaryRange: string;
  monthlyRange?: string;
  addOnRange?: string;
  notes: string[];
  adminSummary: string;
};

type NumberRange = { low: number; high: number };

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function rangeText(range: NumberRange, suffix = "") {
  return `${dollars(range.low)}–${dollars(range.high)}${suffix}`;
}

function addRanges(...ranges: NumberRange[]) {
  return ranges.reduce(
    (total, range) => ({ low: total.low + range.low, high: total.high + range.high }),
    { low: 0, high: 0 },
  );
}

function multiplyRange(range: NumberRange, factor: number) {
  return { low: range.low * factor, high: range.high * factor };
}

function withMinimum(range: NumberRange, minimum: number) {
  return { low: Math.max(range.low, minimum), high: Math.max(range.high, minimum) };
}

function getSquareFootageRange(value: string): NumberRange | null {
  if (value === "Under 750 sq ft") return { low: 500, high: 750 };
  if (value === "750–1,500 sq ft") return { low: 750, high: 1500 };
  if (value === "1,500–2,500 sq ft") return { low: 1500, high: 2500 };
  if (value === "2,500–4,000 sq ft") return { low: 2500, high: 4000 };
  if (value === "4,000–6,000 sq ft") return { low: 4000, high: 6000 };
  if (value === "Over 6,000 sq ft") return { low: 6000, high: 8000 };
  return null;
}

function getSpecialtyAreaRange(value: string): NumberRange | null {
  if (value === "Under 250 sq ft") return { low: 125, high: 250 };
  if (value === "250–500 sq ft") return { low: 250, high: 500 };
  if (value === "500–1,000 sq ft") return { low: 500, high: 1000 };
  if (value === "1,000–2,000 sq ft") return { low: 1000, high: 2000 };
  if (value === "2,000–4,000 sq ft") return { low: 2000, high: 4000 };
  if (value === "Over 4,000 sq ft") return { low: 4000, high: 6000 };
  return null;
}

function hasAddOn(form: CommercialResetFormState, name: string) {
  return form.addOnInterests.includes(name);
}

function addOnAreaNote(label: string) {
  return `${label}: reviewed after add-on area/photos/details`;
}

function clearanceNeedsReview(value: string) {
  return Boolean(value) && value !== "Mostly cleared before service";
}

function clearanceSuffix(value: string) {
  if (!value || value === "Mostly cleared before service") return "";
  if (value === "Light chairs/tables only") return " + possible light setup time";
  return " + moving/setup reviewed separately";
}

function getVisitRateRange(frequency: string, condition: string): NumberRange | null {
  if (frequency === "Weekly service") return { low: 0.15, high: 0.22 };
  if (frequency === "Twice weekly service") return { low: 0.12, high: 0.18 };
  if (frequency === "Three times weekly service") return { low: 0.10, high: 0.16 };
  if (frequency === "Five times weekly service") return { low: 0.08, high: 0.14 };
  if (frequency === "Monthly / occasional support") return { low: 0.22, high: 0.34 };
  if (frequency === "One-time commercial reset") {
    if (condition === "Heavy reset needed") return { low: 0.35, high: 0.55 };
    if (condition === "First-time / catch-up reset") return { low: 0.30, high: 0.45 };
    return { low: 0.25, high: 0.35 };
  }
  return null;
}

function getVisitsPerMonth(frequency: string) {
  if (frequency === "Weekly service") return 4;
  if (frequency === "Twice weekly service") return 8;
  if (frequency === "Three times weekly service") return 12;
  if (frequency === "Five times weekly service") return 20;
  return null;
}

function getLayoutAdjustment(form: CommercialResetFormState): NumberRange {
  const bathroomMap: Record<string, NumberRange> = {
    "0": { low: 0, high: 0 },
    "1": { low: 0, high: 0 },
    "2": { low: 20, high: 45 },
    "3": { low: 40, high: 90 },
    "4": { low: 60, high: 130 },
    "5+": { low: 100, high: 220 },
  };
  const kitchenMap: Record<string, NumberRange> = {
    "No kitchen/breakroom": { low: 0, high: 0 },
    "1 kitchenette/breakroom": { low: 15, high: 45 },
    "1 full kitchen": { low: 35, high: 85 },
    "2+ kitchen/break areas": { low: 60, high: 140 },
  };
  const showerMap: Record<string, NumberRange> = {
    "No showers/changing areas": { low: 0, high: 0 },
    "1": { low: 25, high: 60 },
    "2": { low: 50, high: 120 },
    "3+": { low: 90, high: 220 },
  };

  return addRanges(
    bathroomMap[form.bathrooms] || { low: 0, high: 0 },
    kitchenMap[form.kitchens] || { low: 0, high: 0 },
    showerMap[form.showers] || { low: 0, high: 0 },
  );
}

function getConditionMultiplier(condition: string) {
  if (condition === "Light reset needed") return 1.08;
  if (condition === "First-time / catch-up reset") return 1.18;
  if (condition === "Heavy reset needed") return 1.35;
  return 1;
}

function getTrafficMultiplier(traffic: string) {
  if (traffic === "High public/client traffic") return 1.12;
  if (traffic === "Event or guest turnover traffic") return 1.15;
  return 1;
}

function getRentalEstimate(form: CommercialResetFormState): PlanningEstimate | null {
  if (getBusinessKind(form.businessType) !== "rental" && form.frequency !== "Short-term rental turnover / between-stay reset") return null;

  const baseByBedrooms: Record<string, NumberRange> = {
    "Studio": { low: 129, high: 179 },
    "1 bedroom": { low: 139, high: 199 },
    "2 bedrooms": { low: 169, high: 269 },
    "3 bedrooms": { low: 229, high: 369 },
    "4+ bedrooms": { low: 299, high: 549 },
  };
  const base = baseByBedrooms[form.rentalBedrooms] || { low: 129, high: 349 };
  const linen = form.rentalLinenHandling.includes("needed") ? { low: 35, high: 125 } : { low: 0, high: 0 };
  const restock = form.rentalRestockNeeds.trim() ? { low: 15, high: 65 } : { low: 0, high: 0 };
  const photoNotes = form.spaceDetails.includes("Photo notes after reset") || form.rentalTurnoverNotes.toLowerCase().includes("photo") ? { low: 15, high: 45 } : { low: 0, high: 0 };
  const total = addRanges(base, linen, restock, photoNotes);

  const notes = [
    "Planning range only — final turnover quote depends on access, condition, host checklist, timing between guests, linens/towels, restock expectations, and photos.",
    "Guest messaging, platform communication, repairs, pest issues, biohazards, and property management are outside the standard turnover scope.",
  ];

  return {
    ready: Boolean(form.businessType),
    title: "Short-term rental turnover planning range",
    primaryRange: rangeText(total, "/turnover"),
    notes,
    adminSummary: `Customer saw turnover planning range: ${rangeText(total, "/turnover")}.`,
  };
}

function getAddOnEstimate(form: CommercialResetFormState): string | undefined {
  const selected = form.addOnInterests.filter((item) => item !== "No add-ons right now");
  if (!selected.length) return undefined;

  const carpetArea = getSpecialtyAreaRange(form.carpetArea);
  const hardFloorArea = getSpecialtyAreaRange(form.hardFloorArea);
  const ranges = selected.map((item) => {
    if (item === "Carpet deep cleaning quote") {
      if (!carpetArea) return addOnAreaNote("Carpet deep cleaning");
      const multiplier = form.carpetCondition === "Heavy traffic or odor concerns" ? { low: 0.50, high: 0.75 } : { low: 0.40, high: 0.60 };
      return `Carpet deep cleaning: ${rangeText(withMinimum({ low: carpetArea.low * multiplier.low, high: carpetArea.high * multiplier.high }, 249))}${clearanceSuffix(form.carpetAreaClearance)}`;
    }

    if (item === "Spot/stain treatment quote") {
      const spotMap: Record<string, NumberRange> = {
        "1–2 spots / areas": { low: 25, high: 125 },
        "3–5 spots / areas": { low: 75, high: 275 },
        "6+ spots / areas": { low: 150, high: 450 },
      };
      return form.spotTreatmentCount && spotMap[form.spotTreatmentCount]
        ? `Spot/stain treatment: ${rangeText(spotMap[form.spotTreatmentCount])}`
        : addOnAreaNote("Spot/stain treatment");
    }

    if (item === "Floor scrub quote") {
      if (!hardFloorArea) return addOnAreaNote("Floor scrub");
      return `Floor scrub: ${rangeText({ low: hardFloorArea.low * 0.35, high: hardFloorArea.high * 0.60 })}${clearanceSuffix(form.hardFloorAreaClearance)}`;
    }

    if (item === "Buff / shine quote") {
      if (!hardFloorArea) return addOnAreaNote("Buff / shine");
      return `Buff / shine: ${rangeText({ low: hardFloorArea.low * 0.50, high: hardFloorArea.high * 0.90 })}${clearanceSuffix(form.hardFloorAreaClearance)}`;
    }

    if (item === "Wax / finish quote") {
      if (!hardFloorArea) return addOnAreaNote("Wax / finish");
      const multiplier = form.hardFloorCondition === "Heavy buildup" ? { low: 0.90, high: 1.45 } : { low: 0.75, high: 1.25 };
      return `Wax / finish: ${rangeText(withMinimum({ low: hardFloorArea.low * multiplier.low, high: hardFloorArea.high * multiplier.high }, 299))}${clearanceSuffix(form.hardFloorAreaClearance)}`;
    }

    if (item === "Strip & wax quote") {
      if (!hardFloorArea) return addOnAreaNote("Strip & wax");
      const multiplier = form.hardFloorCondition === "Heavy buildup" ? { low: 2.00, high: 2.85 } : { low: 1.75, high: 2.50 };
      return `Strip & wax: ${rangeText(withMinimum({ low: hardFloorArea.low * multiplier.low, high: hardFloorArea.high * multiplier.high }, 499))}${clearanceSuffix(form.hardFloorAreaClearance)}`;
    }

    if (item === "Upholstery quote") {
      const upholsteryMap: Record<string, NumberRange> = {
        "1–2 chairs or small items": { low: 75, high: 175 },
        "3–6 seats / waiting room chairs": { low: 150, high: 425 },
        "Small sofa or loveseat": { low: 125, high: 325 },
      };
      const scopeRange = form.upholsteryScope ? upholsteryMap[form.upholsteryScope] : undefined;
      const adjustedRange = scopeRange && (form.upholsteryCondition === "Visible spots / stains" || form.upholsteryCondition === "Odor concerns")
        ? multiplyRange(scopeRange, 1.2)
        : scopeRange;
      return adjustedRange
        ? `Upholstery: ${rangeText(adjustedRange)}`
        : addOnAreaNote("Upholstery");
    }

    if (item === "Interior glass quote") {
      const glassMap: Record<string, NumberRange> = {
        "A few interior windows or mirrors": { low: 35, high: 125 },
        "Reception/front glass area": { low: 75, high: 225 },
        "Multiple rooms or glass walls": { low: 150, high: 450 },
      };
      if (form.glassAccess === "Storefront or exterior glass included" || form.glassAccess === "Ladder work may be needed") {
        return "Glass cleaning: reviewed separately for exterior/high glass or ladder work";
      }
      return form.glassScope && glassMap[form.glassScope]
        ? `Interior glass: ${rangeText(glassMap[form.glassScope])}`
        : addOnAreaNote("Interior glass");
    }

    return `${item.replace(" quote", "")}: reviewed after photos/details`;
  });

  return ranges.join(" • ");
}

function needsSelectedCarpetClearance(form: CommercialResetFormState) {
  return hasAddOn(form, "Carpet deep cleaning quote") || hasAddOn(form, "Spot/stain treatment quote");
}

function needsSelectedHardFloorClearance(form: CommercialResetFormState) {
  return ["Floor scrub quote", "Buff / shine quote", "Wax / finish quote", "Strip & wax quote"].some((item) => hasAddOn(form, item));
}

function getCommercialPlanningEstimate(form: CommercialResetFormState): PlanningEstimate {
  const rentalEstimate = getRentalEstimate(form);
  if (rentalEstimate && (form.frequency === "Short-term rental turnover / between-stay reset" || form.businessType.includes("rental"))) return rentalEstimate;

  const sqft = getSquareFootageRange(form.squareFootage);
  const rate = getVisitRateRange(form.frequency, form.spaceCondition);
  const notes = [
    "Routine range above is for the main cleaning visit only. Selected specialty add-ons are shown separately below and are not included in the routine range unless NestHelper adds them to the final quote.",
    "Planning range only — not a final quote or payment request.",
    "Final pricing may change after NestHelper reviews the address, photos, access, condition, supplies, schedule, add-on details, and service fit.",
  ];

  if (!form.businessType || !form.squareFootage || !form.frequency || !sqft || !rate) {
    return {
      ready: false,
      title: "Estimated planning range",
      primaryRange: "Enter space size and frequency to preview a range",
      notes,
      adminSummary: "Customer did not have enough details for an automatic planning range.",
    };
  }

  const base = { low: sqft.low * rate.low, high: sqft.high * rate.high };
  const adjusted = multiplyRange(addRanges(base, getLayoutAdjustment(form)), getConditionMultiplier(form.spaceCondition) * getTrafficMultiplier(form.trafficLevel));
  const minimum = form.frequency === "One-time commercial reset" ? 249 : 175;
  const visitRange = withMinimum(adjusted, minimum);
  const visitsPerMonth = getVisitsPerMonth(form.frequency);
  const monthlyRange = visitsPerMonth ? withMinimum(multiplyRange(visitRange, visitsPerMonth), 499) : null;
  const addOnRange = getAddOnEstimate(form);

  if ((needsSelectedCarpetClearance(form) || needsSelectedHardFloorClearance(form)) && (clearanceNeedsReview(form.carpetAreaClearance) || clearanceNeedsReview(form.hardFloorAreaClearance))) {
    notes.push("Specialty floor and carpet add-on ranges assume clear, safe access. Moving heavy furniture, equipment, fragile items, stocked shelves, desks, filing cabinets, appliances, or large obstacles is not included in standard add-on pricing and may require customer preparation or a separate labor quote.");
  } else if (needsSelectedCarpetClearance(form) || needsSelectedHardFloorClearance(form)) {
    notes.push("Specialty carpet and floor add-on ranges assume the work area is reasonably cleared before service.");
  }

  if (form.spaceCondition === "First-time / catch-up reset" || form.spaceCondition === "Heavy reset needed") {
    notes.push("A first-time or heavy reset may be quoted separately before moving into a recurring maintenance plan.");
  }

  if (form.supplies !== "NestHelper brings standard supplies") {
    notes.push("Product preferences are reviewed for surface fit, availability, and scope before the final quote is confirmed.");
  }

  const isPerVisitFrequency = form.frequency.includes("service") || form.frequency === "Monthly / occasional support";
  const primaryRange = rangeText(visitRange, isPerVisitFrequency ? "/visit" : "");
  const monthlyText = monthlyRange ? rangeText(monthlyRange, "/month") : undefined;
  const estimateTitle = form.frequency === "Monthly / occasional support"
    ? "Occasional support planning range"
    : form.frequency.includes("service")
      ? "Recurring service planning range"
      : "One-time reset planning range";

  return {
    ready: true,
    title: estimateTitle,
    primaryRange,
    monthlyRange: monthlyText,
    addOnRange,
    notes,
    adminSummary: `Customer saw planning range: ${primaryRange}${monthlyText ? `; ${monthlyText}` : ""}${addOnRange ? `; Add-ons: ${addOnRange}` : ""}.`,
  };
}

function buildPayload(form: CommercialResetFormState) {
  const estimate = getCommercialPlanningEstimate(form);

  return {
    fullName: form.contactName,
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
    serviceAddressConfirmed: form.serviceAddressConfirmed,
    service: "commercial-reset",
    selectedServiceTitle: "Commercial Reset Quote",
    packageType: "Commercial Reset",
    requestType: "Commercial Reset",
    businessName: form.businessName,
    contactName: form.contactName,
    roleTitle: form.roleTitle,
    serviceRegion: form.serviceRegion,
    businessType: form.businessType,
    squareFootage: form.squareFootage,
    bathrooms: form.bathrooms,
    kitchens: form.kitchens,
    showers: form.showers,
    spaceCondition: form.spaceCondition,
    trafficLevel: form.trafficLevel,
    frequency: form.frequency,
    preferredDate: form.preferredDate,
    preferredWindow: form.preferredDaysTimes,
    preferredDaysTimes: form.preferredDaysTimes,
    rentalBedrooms: form.rentalBedrooms,
    rentalBeds: form.rentalBeds,
    rentalCheckoutWindow: form.rentalCheckoutWindow,
    rentalLinenHandling: form.rentalLinenHandling,
    rentalRestockNeeds: form.rentalRestockNeeds,
    rentalTurnoverNotes: form.rentalTurnoverNotes,
    supplies: form.supplies,
    flooringTypes: form.flooringTypes,
    accessType: form.accessType,
    accessInstructions: form.accessInstructions,
    spaceDetails: form.spaceDetails,
    cleaningPriorities: form.cleaningPriorities,
    addOnInterests: form.addOnInterests,
    carpetArea: form.carpetArea,
    carpetCondition: form.carpetCondition,
    carpetAreaClearance: form.carpetAreaClearance,
    spotTreatmentCount: form.spotTreatmentCount,
    hardFloorArea: form.hardFloorArea,
    hardFloorMaterial: form.hardFloorMaterial,
    hardFloorCondition: form.hardFloorCondition,
    hardFloorAreaClearance: form.hardFloorAreaClearance,
    upholsteryScope: form.upholsteryScope,
    upholsteryCondition: form.upholsteryCondition,
    glassScope: form.glassScope,
    glassAccess: form.glassAccess,
    specialNotes: form.specialNotes,
    photoNotes: form.photoNotes,
    quoteBasis: "NestHelper prepares a clear quoted visit price, recurring plan, or reviewed price range before service is scheduled.",
    customerEstimateReady: estimate.ready,
    customerEstimateTitle: estimate.title,
    customerEstimatePrimaryRange: estimate.primaryRange,
    customerEstimateMonthlyRange: estimate.monthlyRange || "",
    customerEstimateAddOnRange: estimate.addOnRange || "",
    customerEstimateNotes: estimate.notes,
    customerEstimateAdminSummary: estimate.adminSummary,
    ...(form.photoUploads.length ? {
      photoUploadCount: form.photoUploads.length,
      photoUploadSummary: photoUploadSummary(form.photoUploads),
      photoUploads: form.photoUploads,
    } : {}),
    consent: form.consent,
    requestedAt: new Date().toISOString(),
  };
}

export function CommercialResetForm() {
  const [form, setForm] = useState(defaultState);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const businessKind = getBusinessKind(form.businessType);
  const isShortTermRental = businessKind === "rental";
  const isDaycareOrLearning = businessKind === "daycare";
  const spaceDetailOptions = useMemo(() => getSpaceDetailOptions(form.businessType), [form.businessType]);
  const planningEstimate = useMemo(() => getCommercialPlanningEstimate(form), [form]);
  const needsCarpetDetails = hasAddOn(form, "Carpet deep cleaning quote");
  const needsSpotDetails = hasAddOn(form, "Spot/stain treatment quote");
  const needsHardFloorDetails = ["Floor scrub quote", "Buff / shine quote", "Wax / finish quote", "Strip & wax quote"].some((item) => hasAddOn(form, item));
  const needsUpholsteryDetails = hasAddOn(form, "Upholstery quote");
  const needsGlassDetails = hasAddOn(form, "Interior glass quote");
  const hasSpecialtyAddOnDetails = needsCarpetDetails || needsSpotDetails || needsHardFloorDetails || needsUpholsteryDetails || needsGlassDetails;

  function update(name: keyof CommercialResetFormState, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }) as CommercialResetFormState);
  }

  function updateBusinessType(value: string) {
    setForm((prev) => ({
      ...prev,
      businessType: value,
      spaceDetails: [],
      ...(value.toLowerCase().includes("rental") ? {} : {
        rentalBedrooms: "",
        rentalBeds: "",
        rentalCheckoutWindow: "",
        rentalLinenHandling: "",
        rentalRestockNeeds: "",
        rentalTurnoverNotes: "",
      }),
    }));
  }

  function toggleList(name: "flooringTypes" | "cleaningPriorities" | "spaceDetails" | "addOnInterests", item: string, checked: boolean) {
    setForm((prev) => {
      const current = prev[name];
      if (name === "addOnInterests") {
        if (item === "No add-ons right now" && checked) {
          return {
            ...prev,
            addOnInterests: [item],
            carpetArea: "",
            carpetCondition: "",
            carpetAreaClearance: "",
            spotTreatmentCount: "",
            hardFloorArea: "",
            hardFloorMaterial: "",
            hardFloorCondition: "",
            hardFloorAreaClearance: "",
            upholsteryScope: "",
            upholsteryCondition: "",
            glassScope: "",
            glassAccess: "",
          };
        }

        const next = checked
          ? [...current.filter((value) => value !== "No add-ons right now"), item]
          : current.filter((value) => value !== item);

        return {
          ...prev,
          addOnInterests: next,
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

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form)),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Commercial Reset submission failed");

      setStatus("success");
      setMessage("Commercial Reset quote request received. We’ll review the address, space type, square footage range, bathrooms/kitchens/showers, condition, schedule, and optional photos before sending next steps or a clear quote/payment link.");
      setForm(defaultState);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Something went wrong. Please try again or contact NestHelper directly.");
    }
  }

  return (
    <form onSubmit={onSubmit} onInvalidCapture={focusFirstInvalidField} className="grid gap-6 overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-nest-cream via-white to-nest-mint/35 p-5 shadow-sm sm:p-7">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-nest-gold/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">No payment due yet</p>
          <h2 className="mt-2 text-2xl font-black text-nest-teal sm:text-3xl">Request a Commercial Reset quote</h2>
          <p className="mt-3 max-w-2xl leading-7 text-nest-ink/72">
            This guided form stays quick, but asks the pricing details that matter: type of space, size range, restrooms, kitchens, showers, condition, frequency, and photos if helpful.
          </p>
          <p className="mt-3 text-sm font-bold text-nest-ink/65"><span className="text-red-600">*</span> Required fields</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Step icon={<ClipboardCheck className="h-5 w-5" />} title="1. Quick basics" text="Contact, address, business type, and service area." />
            <Step icon={<ShieldCheck className="h-5 w-5" />} title="2. Quote factors" text="Space size, layout, areas that need attention, condition, and frequency." />
            <Step icon={<CreditCard className="h-5 w-5" />} title="3. Clear quote" text="Flat visit price, recurring plan, or reviewed range before checkout." />
          </div>
        </div>
      </div>

      <Section title="1. Business contact" description="Who should NestHelper contact about the quote, walkthrough, and service details?">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business / property name" required><input className="input" required value={form.businessName} onChange={(e) => update("businessName", e.target.value)} /></Field>
          <Field label="Contact name" required><input className="input" required autoComplete="name" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></Field>
          <Field label="Role/title (optional)"><input className="input" placeholder="Owner, manager, host, office admin, etc." value={form.roleTitle} onChange={(e) => update("roleTitle", e.target.value)} /></Field>
          <Field label="Business or property type" required>
            <select className="input" required value={form.businessType} onChange={(e) => updateBusinessType(e.target.value)}>
              <option value="">Choose one</option>
              {businessTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Email" required><input type="email" className="input" required autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
          <Field label="Phone" required><input className="input" required autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => update("phone", formatPhoneNumber(e.target.value))} /></Field>
        </div>
      </Section>

      <Section title="2. Cleaning address" description="Commercial Reset is quoted in select Pierce County, Eastside, and Northshore areas. Parent Reset home services remain focused on the Eastside/Northshore side.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service area">
            <select className="input" value={form.serviceRegion} onChange={(e) => update("serviceRegion", e.target.value)}>
              <option>Not sure yet</option>
              <option>Pierce County commercial area</option>
              <option>Eastside / Northshore commercial area</option>
              <option>Nearby area — please review</option>
            </select>
          </Field>
          <Field label="ZIP" required><input className="input" required autoComplete="postal-code" inputMode="numeric" pattern="\d{5}(-\d{4})?" placeholder="98402" value={form.zip} onChange={(e) => update("zip", normalizeZipInput(e.target.value))} /></Field>
          <Field label="Street address" required><input className="input" required autoComplete="address-line1" placeholder="123 Main St" value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>
          <Field label="Suite / unit (optional)"><input className="input" autoComplete="address-line2" placeholder="Suite, unit, floor, gate/access note, etc." value={form.address2} onChange={(e) => update("address2", e.target.value)} /></Field>
          <Field label="City / community" required><input className="input" required autoComplete="address-level2" value={form.city} onChange={(e) => update("city", e.target.value)} /></Field>
          <Field label="State" required>
            <select className="input" required autoComplete="address-level1" value={form.state} onChange={(e) => update("state", e.target.value)}>
              <option value="WA">Washington</option>
            </select>
          </Field>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-nest-teal/15 bg-nest-mint/25 p-4 text-sm font-semibold leading-6 text-nest-ink/75">
          <input type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-nest-teal" checked={form.serviceAddressConfirmed} onChange={(e) => update("serviceAddressConfirmed", e.target.checked)} />
          <span><span className="text-red-600">*</span> I confirm this is the correct cleaning/service address for NestHelper to review service area, access, and any required sales tax.</span>
        </label>
        <p className="rounded-2xl border border-nest-gold/15 bg-nest-cream/70 px-4 py-3 text-xs font-bold leading-5 text-nest-ink/65">
          Please enter the full physical service address, including city and ZIP. If the address appears incomplete or outside our reviewed service area, NestHelper will follow up before sending a quote or payment link.
        </p>
      </Section>

      <Section title="3. About the Space" description="These quick ranges help NestHelper understand the size, layout, condition, and schedule before preparing a flat visit quote, recurring plan, or reviewed range.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Approx. square footage" required>
            <select className="input" required value={form.squareFootage} onChange={(e) => update("squareFootage", e.target.value)}>
              <option value="">Choose one</option>
              {squareFootageOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Bathrooms / restrooms" required>
            <select className="input" required value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)}>
              <option value="">Choose one</option>
              {bathroomOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Kitchens / breakrooms" required>
            <select className="input" required value={form.kitchens} onChange={(e) => update("kitchens", e.target.value)}>
              <option value="">Choose one</option>
              {kitchenOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Showers / changing areas" required>
            <select className="input" required value={form.showers} onChange={(e) => update("showers", e.target.value)}>
              <option value="">Choose one</option>
              {showerOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Current condition" required>
            <select className="input" required value={form.spaceCondition} onChange={(e) => update("spaceCondition", e.target.value)}>
              <option value="">Choose one</option>
              {conditionOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Traffic level" required>
            <select className="input" required value={form.trafficLevel} onChange={(e) => update("trafficLevel", e.target.value)}>
              <option value="">Choose one</option>
              {trafficOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Cleaning frequency" required>
            <select className="input" required value={form.frequency} onChange={(e) => update("frequency", e.target.value)}>
              <option value="">Choose one</option>
              {frequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}
            </select>
          </Field>
          <Field label="Preferred start date"><input type="date" className="input" value={form.preferredDate} onChange={(e) => update("preferredDate", e.target.value)} /></Field>
        </div>
        <Field label="Preferred days/times" required><input className="input" required placeholder="Example: after 6pm weekdays, Saturday morning, before opening" value={form.preferredDaysTimes} onChange={(e) => update("preferredDaysTimes", e.target.value)} /></Field>
        <div className="rounded-2xl border border-nest-teal/15 bg-nest-mint/25 p-4 text-sm font-semibold leading-6 text-nest-ink/76">
          These details are meant to make pricing feel fair and predictable. NestHelper will quote the visit, recurring plan, or add-on before anything is scheduled.
        </div>
      </Section>

      {form.businessType && (
        <Section title="4. What Needs Attention" description="Choose the areas and priorities that matter most. This changes based on the type of space so you are not answering unrelated questions.">
          <div>
            <div className="label mb-3">Areas included</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {spaceDetailOptions.map((item) => (
                <CheckOption key={item} checked={form.spaceDetails.includes(item)} onChange={(checked) => toggleList("spaceDetails", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-3">Main cleaning priorities</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {cleaningPriorityOptions.map((item) => (
                <CheckOption key={item} checked={form.cleaningPriorities.includes(item)} onChange={(checked) => toggleList("cleaningPriorities", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>

          {isDaycareOrLearning && (
            <div className="rounded-2xl border border-nest-gold/15 bg-nest-mint/20 p-4 text-sm font-semibold leading-6 text-nest-ink/72">
              For daycare common areas and learning spaces, NestHelper can review non-toxic, low-odor, or fragrance-free product preferences where appropriate for the surface and scope. Commercial Reset is cleaning support only and is not childcare, medical care, or a licensed sanitation program.
            </div>
          )}
        </Section>
      )}

      {isShortTermRental && (
        <Section title="5. Short-term rental turnover details" description="Only answer these if this is an Airbnb-style, vacation rental, or host-managed guest turnover request.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bedrooms / unit type">
              <select className="input" value={form.rentalBedrooms} onChange={(e) => update("rentalBedrooms", e.target.value)}>
                <option value="">Choose one</option>
                {bedroomOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Beds to reset">
              <select className="input" value={form.rentalBeds} onChange={(e) => update("rentalBeds", e.target.value)}>
                <option value="">Choose one</option>
                {bedOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Turnover window"><input className="input" placeholder="Example: guests checkout 11am, next check-in 4pm" value={form.rentalCheckoutWindow} onChange={(e) => update("rentalCheckoutWindow", e.target.value)} /></Field>
            <Field label="Linen/towel handling">
              <select className="input" value={form.rentalLinenHandling} onChange={(e) => update("rentalLinenHandling", e.target.value)}>
                <option value="">Choose one</option>
                <option>Use clean linens stored onsite</option>
                <option>Strip beds only</option>
                <option>Laundry/linen help needed — quote separately</option>
                <option>Host handles linens</option>
                <option>Not sure yet</option>
              </select>
            </Field>
          </div>
          <Field label="Restock checklist items (optional)"><input className="input" placeholder="Example: toilet paper, paper towels, coffee pods, soap, trash bags" value={form.rentalRestockNeeds} onChange={(e) => update("rentalRestockNeeds", e.target.value)} /></Field>
          <Field label="Turnover notes (optional)"><textarea className="input min-h-24" placeholder="Parking, lockbox, host checklist, photo reporting request, common guest issues, or must-check areas." value={form.rentalTurnoverNotes} onChange={(e) => update("rentalTurnoverNotes", e.target.value)} /></Field>
          <div className="rounded-2xl border border-nest-gold/15 bg-nest-mint/20 p-4 text-sm font-semibold leading-6 text-nest-ink/72">
            Short-term rental turnover cleaning is cleaning support only. Guest messaging, repairs, supply purchasing, pest issues, biohazards, damage claims, and full property management are outside the standard scope unless separately reviewed.
          </div>
        </Section>
      )}

      <Section title={isShortTermRental ? "6. Service Preferences" : form.businessType ? "5. Service Preferences" : "4. Service Preferences"} description="Confirm supplies, access, flooring, and any add-ons that should be reviewed before quoting.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Supplies preference">
            <select className="input" value={form.supplies} onChange={(e) => update("supplies", e.target.value)}>
              <option>NestHelper brings standard supplies</option>
              <option>Non-toxic / low-odor options requested where appropriate</option>
              <option>Fragrance-free products requested where appropriate</option>
              <option>Discuss with me first</option>
              <option>Not sure yet</option>
            </select>
          </Field>
          <Field label="Access type">
            <select className="input" value={form.accessType} onChange={(e) => update("accessType", e.target.value)}>
              <option>Someone can let NestHelper in</option>
              <option>Lockbox / key available</option>
              <option>Alarm or code required</option>
              <option>After-hours entry needed</option>
              <option>Walkthrough needed first</option>
              <option>Not sure yet</option>
            </select>
          </Field>
        </div>
        <div>
          <div className="label mb-3">Flooring types</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {flooringOptions.map((item) => (
              <CheckOption key={item} checked={form.flooringTypes.includes(item)} onChange={(checked) => toggleList("flooringTypes", item, checked)}>{item}</CheckOption>
            ))}
          </div>
        </div>
        <div>
          <div className="label mb-3">Possible add-ons</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {addOnOptions.map((item) => (
              <CheckOption key={item} checked={form.addOnInterests.includes(item)} onChange={(checked) => toggleList("addOnInterests", item, checked)}>{item}</CheckOption>
            ))}
          </div>
        </div>

        {hasSpecialtyAddOnDetails && (
          <div className="grid gap-4 rounded-[1.65rem] border border-nest-gold/18 bg-white/75 p-4 shadow-sm sm:p-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-nest-gold">Add-on estimate details</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-nest-ink/68">
                These only appear for selected add-ons so the estimate uses the right area, condition, item count, and access details instead of assuming the entire space needs specialty work.
              </p>
            </div>

            {needsCarpetDetails && (
              <div className="grid gap-4 rounded-2xl border border-nest-teal/10 bg-nest-mint/18 p-4 sm:grid-cols-2">
                <Field label="Approx. carpet area needing deep cleaning" required>
                  <select className="input" required value={form.carpetArea} onChange={(e) => update("carpetArea", e.target.value)}>
                    <option value="">Choose one</option>
                    {specialtyAreaOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Carpet condition" required>
                  <select className="input" required value={form.carpetCondition} onChange={(e) => update("carpetCondition", e.target.value)}>
                    <option value="">Choose one</option>
                    {carpetConditionOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Will the carpet area be cleared before service?" required>
                  <select className="input" required value={form.carpetAreaClearance} onChange={(e) => update("carpetAreaClearance", e.target.value)}>
                    <option value="">Choose one</option>
                    {areaClearanceOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <div className="rounded-2xl border border-nest-gold/12 bg-white/80 p-4 text-sm font-semibold leading-6 text-nest-ink/68">
                  Carpet ranges assume clear, safe access. Heavy furniture, electronics, desks, filing cabinets, fragile items, or large obstacles may need to be moved by the customer or quoted separately.
                </div>
              </div>
            )}

            {needsSpotDetails && (
              <div className="grid gap-4 rounded-2xl border border-nest-teal/10 bg-nest-mint/18 p-4 sm:grid-cols-2">
                <Field label="Approx. number of spots / stain areas" required>
                  <select className="input" required value={form.spotTreatmentCount} onChange={(e) => update("spotTreatmentCount", e.target.value)}>
                    <option value="">Choose one</option>
                    {spotTreatmentOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <div className="rounded-2xl border border-nest-gold/12 bg-white/80 p-4 text-sm font-semibold leading-6 text-nest-ink/68">
                  Photos help confirm whether spot treatment is realistic or if a larger carpet deep cleaning quote is needed.
                </div>
              </div>
            )}

            {needsHardFloorDetails && (
              <div className="grid gap-4 rounded-2xl border border-nest-teal/10 bg-nest-mint/18 p-4 sm:grid-cols-2">
                <Field label="Approx. hard-floor area needing specialty work" required>
                  <select className="input" required value={form.hardFloorArea} onChange={(e) => update("hardFloorArea", e.target.value)}>
                    <option value="">Choose one</option>
                    {specialtyAreaOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Hard-floor material" required>
                  <select className="input" required value={form.hardFloorMaterial} onChange={(e) => update("hardFloorMaterial", e.target.value)}>
                    <option value="">Choose one</option>
                    {hardFloorMaterialOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Hard-floor condition" required>
                  <select className="input" required value={form.hardFloorCondition} onChange={(e) => update("hardFloorCondition", e.target.value)}>
                    <option value="">Choose one</option>
                    {hardFloorConditionOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Will the hard-floor area be cleared before service?" required>
                  <select className="input" required value={form.hardFloorAreaClearance} onChange={(e) => update("hardFloorAreaClearance", e.target.value)}>
                    <option value="">Choose one</option>
                    {areaClearanceOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <div className="rounded-2xl border border-nest-gold/12 bg-white/80 p-4 text-sm font-semibold leading-6 text-nest-ink/68">
                  Floor scrub, buff, wax, and strip-and-wax pricing depends heavily on material, condition, buildup, clear access, drying time, and whether the floor must be fully cleared before work starts.
                </div>
              </div>
            )}

            {needsUpholsteryDetails && (
              <div className="grid gap-4 rounded-2xl border border-nest-teal/10 bg-nest-mint/18 p-4 sm:grid-cols-2">
                <Field label="Upholstery scope" required>
                  <select className="input" required value={form.upholsteryScope} onChange={(e) => update("upholsteryScope", e.target.value)}>
                    <option value="">Choose one</option>
                    {upholsteryScopeOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Upholstery condition" required>
                  <select className="input" required value={form.upholsteryCondition} onChange={(e) => update("upholsteryCondition", e.target.value)}>
                    <option value="">Choose one</option>
                    {upholsteryConditionOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <div className="rounded-2xl border border-nest-gold/12 bg-white/80 p-4 text-sm font-semibold leading-6 text-nest-ink/68 sm:col-span-2">
                  Fabric type, stains, odor, and drying needs may require review before a final upholstery quote.
                </div>
              </div>
            )}

            {needsGlassDetails && (
              <div className="grid gap-4 rounded-2xl border border-nest-teal/10 bg-nest-mint/18 p-4 sm:grid-cols-2">
                <Field label="Glass access / height" required>
                  <select className="input" required value={form.glassAccess} onChange={(e) => update("glassAccess", e.target.value)}>
                    <option value="">Choose one</option>
                    {glassAccessOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Interior glass / mirror scope" required>
                  <select className="input" required value={form.glassScope} onChange={(e) => update("glassScope", e.target.value)}>
                    <option value="">Choose one</option>
                    {glassScopeOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <div className="rounded-2xl border border-nest-gold/12 bg-white/80 p-4 text-sm font-semibold leading-6 text-nest-ink/68 sm:col-span-2">
                  Standard interior glass is different from exterior storefront glass, ladder work, or high glass, which may need separate review or a partner quote.
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-nest-gold/15 bg-nest-mint/20 p-4 text-sm font-semibold leading-6 text-nest-ink/72">
          Specialty add-ons are estimated separately from routine cleaning and are not included by default. Add-on ranges assume clear, safe access unless otherwise noted. Furniture moving, heavy equipment, fragile items, stocked shelves, desks, filing cabinets, appliances, exterior/high glass, or large obstacles may require customer preparation or a separate labor quote.
        </div>
      </Section>

      <Section title={isShortTermRental ? "7. Notes and optional photos" : form.businessType ? "6. Notes and optional photos" : "5. Notes and optional photos"} description="Keep this short unless something needs extra context. Photos are helpful but not required.">
        <Field label="Access instructions or special notes (optional)"><textarea className="input min-h-28" placeholder="Keys, lockbox, alarm, parking, suite number, after-hours entry, who will be onsite, current condition, daycare/common-area notes, short-term rental turnover notes, add-ons, or anything sensitive." value={form.accessInstructions} onChange={(e) => update("accessInstructions", e.target.value)} /></Field>
        <Field label="Anything else NestHelper should know? (optional)"><textarea className="input min-h-24" placeholder="Tell us anything that did not fit above." value={form.specialNotes} onChange={(e) => update("specialNotes", e.target.value)} /></Field>
        <PhotoUploadField
          photos={form.photoUploads}
          onChange={(photos) => update("photoUploads", photos)}
          label="Upload walkthrough photos (optional)"
          description="Add up to 4 optional photos of the space, flooring, carpet areas, hard-floor areas, restrooms, kitchen/break area, showers/changing areas, priority areas, access points, rental turnover condition, or anything that helps us quote accurately."
        />
        <Field label="Photo links or walkthrough notes (optional)"><textarea className="input min-h-24" placeholder="Paste a link to additional photos or describe anything a walkthrough should cover." value={form.photoNotes} onChange={(e) => update("photoNotes", e.target.value)} /></Field>
      </Section>

      <PlanningEstimateCard estimate={planningEstimate} />

      <div className="grid gap-4 rounded-[1.75rem] border border-nest-teal/15 bg-nest-mint/20 p-5">
        <h3 className="text-xl font-black text-nest-teal">Before you submit</h3>
        <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
          <input type="checkbox" required checked={form.consent} onChange={(e) => update("consent", e.target.checked)} className="mt-1 h-4 w-4" />
          <span><span className="text-red-600">*</span> I understand this is a quote request, not a confirmed booking. Commercial Reset availability depends on address, scope, schedule, turnover timing if applicable, licensing/endorsement requirements, and service fit.</span>
        </label>
      </div>

      <button disabled={status === "loading"} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-4 text-lg font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift disabled:opacity-60">
        {status === "loading" ? "Submitting..." : "Submit Commercial Quote Request"}
        {status !== "loading" && <ArrowRight size={19} />}
      </button>
      {message && <p className={`rounded-2xl p-4 font-semibold ${status === "success" ? "bg-nest-mint/45 text-nest-teal" : "bg-red-50 text-red-700"}`}>{message}</p>}
    </form>
  );
}

function PlanningEstimateCard({ estimate }: { estimate: PlanningEstimate }) {
  return (
    <div className={`overflow-hidden rounded-[1.9rem] border p-5 shadow-sm sm:p-6 ${estimate.ready ? "border-nest-gold/25 bg-gradient-to-br from-nest-cream via-white to-nest-mint/30" : "border-nest-teal/12 bg-white"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="pill-label w-fit"><Calculator size={15} /> Estimate Preview</p>
          <h3 className="mt-4 text-2xl font-black text-nest-teal">{estimate.title}</h3>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-nest-ink/68">
            The top range is the estimated routine cleaning visit based on the main space details. Any selected specialty add-ons are listed separately below and are not included in the top range unless NestHelper adds them to the final quote.
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-nest-gold/15 bg-white/85 p-4 text-left shadow-sm sm:min-w-64">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-nest-gold">Routine cleaning estimate</p>
          <p className="mt-2 text-2xl font-black text-nest-teal">{estimate.primaryRange}</p>
          {estimate.monthlyRange && <p className="mt-1 text-sm font-black text-nest-ink/68">Routine only: approx. {estimate.monthlyRange}</p>}
        </div>
      </div>

      {estimate.addOnRange && (
        <div className="mt-4 rounded-2xl border border-nest-gold/14 bg-white/80 p-4">
          <p className="text-sm font-black text-nest-teal">Selected add-ons — separate from the routine range above</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/68">{estimate.addOnRange}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-nest-gold">Add-ons may be one-time, recurring, or reviewed after photos/walkthrough depending on scope.</p>
        </div>
      )}

      <div className="mt-4 grid gap-2">
        {estimate.notes.map((note) => (
          <div key={note} className="flex gap-2 rounded-2xl bg-white/72 p-3 text-sm font-semibold leading-6 text-nest-ink/70">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-nest-teal" />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </div>
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
    <label className="grid gap-2">
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

function CheckOption({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className={`flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition ${checked ? "border-nest-gold/45 bg-nest-mint/35 text-nest-teal shadow-sm" : "border-nest-gold/10 bg-nest-cream text-nest-ink/78 hover:bg-nest-mint/25"}`}>
      <input type="checkbox" className="h-4 w-4 accent-nest-teal" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function CommercialQuoteMiniCard() {
  return (
    <div className="rounded-[1.75rem] border border-nest-gold/16 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nest-mint/45 text-nest-teal">
          <Building2 size={23} />
        </div>
        <div>
          <h3 className="text-xl font-black text-nest-teal">Commercial quote before checkout</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-nest-ink/68">
            For business spaces, NestHelper reviews the address, square footage range, bathrooms, kitchens, showers, frequency, access, product preferences, and photos before quoting or sending a payment link.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-black text-nest-teal">
              <CheckCircle2 size={16} /> No payment due when you request
            </div>
            <Link href="/commercial-reset/request" className="inline-flex w-fit items-center justify-center rounded-full bg-nest-teal px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-nest-teal2">
              Start quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
