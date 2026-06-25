"use client";

import { useSearchParams } from "next/navigation";
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
  homeAreas: [] as string[],
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
  detergent: "Standard detergent",
  dryPreference: "Standard dry",
  laundryAddOns: [] as string[],
  reusableBagAck: false,
  consent: false,
  photoUploads: [] as PhotoUpload[],
};

type RequestFormState = typeof defaultState;
type Status = "idle" | "loading" | "success" | "error";

const priorityOptions = [
  "Kitchen reset",
  "Dishes / counters / surfaces",
  "Toy or living area tidy",
  "Laundry folding / put-away",
  "Pantry, entry, or kids area reset",
  "Trash / quick pickup",
  "I am not sure — help me prioritize",
];

const WHOLE_HOME_OPTION = "Whole home — help me prioritize";

const homeAreaOptions = [
  "Kitchen",
  "Living room",
  "Playroom / toys",
  "Bedrooms",
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
  "Interested in weekly recurring resets after the first visit",
  "Interested in every-2-weeks recurring resets after the first visit",
  "Interested in monthly support when openings allow",
  "Not sure yet — please help me decide",
];

const smartLabelSetupOptions = [
  "No Smart Labels needed",
  "Free starter labels only — we’ll leave them with you",
  "Help me set up Smart Labels during the reset",
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

function getServiceCategory(serviceId: string) {
  if (serviceId === "laundry-rescue") return "laundry";
  if (serviceId === "errand-helper") return "errand";
  if (serviceId === "specific-area-reset") return "areaReset";
  if (serviceId === "move-out-cleaning") return "moveOut";
  if (serviceId) return "home";
  return "none";
}

function normalizeZipInput(value: string) {
  return value.replace(/[^0-9-]/g, "").slice(0, 10);
}
function normalizeReferralInput(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
}

function isReferralEligibleService(serviceId: string) {
  return ["parent-reset-2hr", "family-reset-3hr", "helper-block-4hr", "errand-helper", "laundry-rescue"].includes(serviceId);
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
    return "A 2-Hour Parent Reset is best for a few priority areas, not a full-home reset. If you choose whole home, we’ll focus on the highest-impact items first. A 3-Hour Family Reset or 4-Hour Helper Block may be a better fit for more rooms.";
  }

  if (serviceId === "parent-reset-2hr" && individualAreaCount > 3) {
    return "You selected several areas for a 2-hour visit. We may not be able to complete every area in one visit, so please list your top priorities below.";
  }

  if (serviceId === "family-reset-3hr" && wholeHomeSelected) {
    return "A 3-Hour Family Reset can cover more ground, but whole-home requests are still handled by priority. We’ll review your notes before confirming what can reasonably fit.";
  }

  if (serviceId === "family-reset-3hr" && individualAreaCount > 5) {
    return "You selected a lot of areas for a 3-hour visit. We’ll review the scope and may recommend a 4-Hour Helper Block or follow-up visit if needed.";
  }

  if (serviceId === "helper-block-4hr" && wholeHomeSelected) {
    return "A 4-Hour Helper Block gives more flexibility, but whole-home requests are still completed by priority and scope review, not guaranteed room-by-room completion.";
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
    ...(isSmartLabelEligibleCategory(category) ? {
      smartLabelSetupInterest: form.smartLabelSetupInterest,
      smartLabelEstimatedCount: form.smartLabelEstimatedCount,
      smartLabelSetupNotes: form.smartLabelSetupNotes,
    } : {}),
    requestedAt: new Date().toISOString(),
  };

  if (category === "home") {
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
      detergent: form.detergent,
      dryPreference: form.dryPreference,
      laundryAddOns: form.laundryAddOns,
      reusableBagAck: form.reusableBagAck,
    };
  }

  return base;
}

export function RequestForm() {
  const params = useSearchParams();
  const requestedService = params.get("service") || "";
  const requestedReferralCode = normalizeReferralInput(params.get("ref") || params.get("referral") || params.get("referralCode") || "");
  const [form, setForm] = useState({
    ...mergeCampaignAttribution({
      ...defaultState,
      service: requestedService,
      incomingReferralCode: requestedReferralCode,
      incomingReferralProgram: requestedReferralCode ? "family-to-family" : "",
      incomingReferralLandingPage: requestedReferralCode ? "/referrals" : "",
    }),
  });
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const selectedService = useMemo(() => services.find((service) => service.id === form.service), [form.service]);
  const serviceCategory = getServiceCategory(form.service);
  const isHomeReset = serviceCategory === "home";
  const isAreaReset = serviceCategory === "areaReset";
  const isMoveOut = serviceCategory === "moveOut";
  const isErrand = serviceCategory === "errand";
  const isLaundry = serviceCategory === "laundry";
  const smartLabelsAvailable = isSmartLabelEligibleCategory(serviceCategory);
  const wholeHomeSelected = form.homeAreas.includes(WHOLE_HOME_OPTION);
  const homeScopeWarning = isHomeReset ? getHomeScopeWarning(form.service, form.homeAreas) : "";
  const visibleAreaResetCleaningTypeOptions = isAreaReset ? getAreaResetCleaningTypeOptions(form.areaResetRooms) : [];
  const visibleAreaResetAddOnOptions = isAreaReset ? getAreaResetAddOnOptions(form.areaResetRooms) : [];
  const showSmartLabelCount = form.smartLabelSetupInterest === "Help me set up Smart Labels during the reset";
  const showSmartLabelNotes = form.smartLabelSetupInterest === "Help me set up Smart Labels during the reset" || form.smartLabelSetupInterest === "Free starter labels only — we’ll leave them with you";
  const petDetailsRequired = (isHomeReset || isAreaReset || isMoveOut) && form.pets !== "No pets" && form.pets !== "No pets now, but pets lived here before";
  const referralApplies = Boolean(form.incomingReferralCode && isReferralEligibleService(form.service));
  const referralNeedsEligiblePackage = Boolean(form.incomingReferralCode && form.service && !isReferralEligibleService(form.service));
  const showHowFoundUsDetails = shouldShowHowFoundUsDetails(form.howFoundUs);

  useEffect(() => {
    setForm((prev) => mergeCampaignAttribution(prev));
  }, []);

  function update(name: keyof RequestFormState, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }) as RequestFormState);
  }

  function handleServiceChange(service: string) {
    const nextCategory = getServiceCategory(service);
    const isHomeLike = nextCategory === "home" || nextCategory === "areaReset" || nextCategory === "moveOut";
    setForm((prev) => ({
      ...prev,
      service,
      homePriorities: nextCategory === "home" ? prev.homePriorities : [],
      homeAreas: nextCategory === "home" ? prev.homeAreas : [],
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
      areaResetBathroomCount: nextCategory === "areaReset" ? prev.areaResetBathroomCount : "",
      areaResetSize: nextCategory === "areaReset" ? prev.areaResetSize : "",
      areaResetCondition: nextCategory === "areaReset" ? prev.areaResetCondition : defaultState.areaResetCondition,
      areaResetGoals: nextCategory === "areaReset" ? prev.areaResetGoals : [],
      areaResetHauling: nextCategory === "areaReset" ? prev.areaResetHauling : defaultState.areaResetHauling,
      areaResetNotes: nextCategory === "areaReset" ? prev.areaResetNotes : "",
      homeType: isHomeLike ? prev.homeType : defaultState.homeType,
      pets: isHomeLike ? prev.pets : defaultState.pets,
      petDetails: isHomeLike ? prev.petDetails : "",
      supplyPreference: isHomeLike ? prev.supplyPreference : defaultState.supplyPreference,
      recurringResetInterest: nextCategory === "home" ? prev.recurringResetInterest : defaultState.recurringResetInterest,
      smartLabelSetupInterest: isSmartLabelEligibleCategory(nextCategory) ? prev.smartLabelSetupInterest : defaultState.smartLabelSetupInterest,
      smartLabelEstimatedCount: isSmartLabelEligibleCategory(nextCategory) ? prev.smartLabelEstimatedCount : defaultState.smartLabelEstimatedCount,
      smartLabelSetupNotes: isSmartLabelEligibleCategory(nextCategory) ? prev.smartLabelSetupNotes : "",
      squareFootage: nextCategory === "moveOut" ? prev.squareFootage : "",
      bedrooms: nextCategory === "moveOut" ? prev.bedrooms : "",
      bathrooms: nextCategory === "moveOut" ? prev.bathrooms : "",
      moveCleaningType: nextCategory === "moveOut" ? prev.moveCleaningType : defaultState.moveCleaningType,
      occupancyStatus: nextCategory === "moveOut" ? prev.occupancyStatus : defaultState.occupancyStatus,
      moveOutCondition: nextCategory === "moveOut" ? prev.moveOutCondition : defaultState.moveOutCondition,
      moveOutFocus: nextCategory === "moveOut" ? prev.moveOutFocus : [],
      moveOutAppliances: nextCategory === "moveOut" ? prev.moveOutAppliances : [],
      moveOutNotes: nextCategory === "moveOut" ? prev.moveOutNotes : "",
      errandType: nextCategory === "errand" ? prev.errandType : defaultState.errandType,
      errandDistance: nextCategory === "errand" ? prev.errandDistance : defaultState.errandDistance,
      errandStops: nextCategory === "errand" ? prev.errandStops : "",
      errandStartArea: nextCategory === "errand" ? prev.errandStartArea : "",
      errandMileageAck: nextCategory === "errand" ? prev.errandMileageAck : false,
      laundryTypes: nextCategory === "laundry" ? prev.laundryTypes : [],
      laundryBagEstimate: nextCategory === "laundry" ? prev.laundryBagEstimate : defaultState.laundryBagEstimate,
      laundryPickupSpot: nextCategory === "laundry" ? prev.laundryPickupSpot : defaultState.laundryPickupSpot,
      detergent: nextCategory === "laundry" ? prev.detergent : "Standard detergent",
      dryPreference: nextCategory === "laundry" ? prev.dryPreference : "Standard dry",
      laundryAddOns: nextCategory === "laundry" ? prev.laundryAddOns : [],
      reusableBagAck: nextCategory === "laundry" ? prev.reusableBagAck : false,
    }));
  }

  function toggleList(name: "homePriorities" | "homeAreas" | "areaResetRooms" | "areaResetAddOns" | "areaResetAdditionalAreas" | "areaResetGoals" | "moveOutFocus" | "moveOutAppliances" | "laundryTypes" | "laundryAddOns", item: string, checked: boolean) {
    setForm((prev) => {
      const current = prev[name];

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

    if (serviceCategory === "areaReset" && !form.areaResetRooms.length) {
      setStatus("error");
      setMessage("Please select at least one room or area for the Specific Area(s) Reset.");
      return;
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
      setForm(mergeCampaignAttribution({ ...defaultState, service: requestedService }));
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again or contact NestHelper directly.");
    }
  }

  return (
    <form onSubmit={onSubmit} onInvalidCapture={focusFirstInvalidField} className="grid gap-6 overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-6 lg:p-8">
      <div className="rounded-[1.75rem] border border-nest-gold/16 bg-gradient-to-br from-nest-cream via-white to-nest-mint/25 p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">No payment due yet</p>
            <h2 className="mt-2 text-2xl font-black text-nest-teal sm:text-3xl">Request details</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-nest-ink/70 sm:text-base sm:leading-7">
              Choose a service, then answer the questions that match that package. NestHelper reviews the request before checkout.
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

      <Section title="2. Service address" description="NestHelper reviews each address for service area, timing, access, and helper availability before payment.">
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

      <Section title="3. Service and timing" description="Choose the package first. The next section changes based on the package selected.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service requested" required>
            <select className="input" required value={form.service} onChange={(e) => handleServiceChange(e.target.value)}>
              <option value="">Choose a service</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
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

      {serviceCategory === "none" && (
        <Section title="4. Package-specific questions" description="Choose a service above and this section will only show questions that match that package.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm font-semibold leading-6 text-nest-ink/76">
            Select 2-Hour Parent Reset, 3-Hour Family Reset, 4-Hour Helper Block, Specific Area(s) Reset, Move-In / Move-Out Cleaning, Errand Helper, or Laundry Rescue to continue.
          </div>
        </Section>
      )}

      {isHomeReset && (
        <Section title="4. Home reset focus" description="Choose what needs attention. We review your package, time block, notes, and photos before confirming what can reasonably fit.">
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
              First resets stay at standard pricing. Recurring rates may be offered after the first completed visit when schedule, scope, service area, and helper fit are consistent.
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
          <div>
            <div className="label mb-2">Where should we focus first?</div>
            <p className="mb-3 text-sm leading-6 text-nest-ink/65">
              Choose the areas you’d like help with. If you choose whole home, we’ll help prioritize instead of promising every room can be completed in one visit.
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
                Whole home requests are handled as a priority walkthrough. Tell us the top 2–3 things that would make the biggest difference, and we’ll review the right time block before checkout.
              </ScopeNotice>
            )}
            {homeScopeWarning && <ScopeNotice tone="warning">{homeScopeWarning}</ScopeNotice>}
          </div>
          <Field label={wholeHomeSelected ? "Top 2–3 must-do priorities for this visit" : "Top priorities for this visit"} required>
            <textarea className="input min-h-28" required placeholder="Example: If time runs short, please handle kitchen counters, dishes, toy pickup in the living room, and the laundry pile first." value={form.requestDetails} onChange={(e) => update("requestDetails", e.target.value)} />
          </Field>
        </Section>
      )}

      {isAreaReset && (
        <Section title="4. Specific Area(s) scope" description="Pick the room or rooms first. The form will show only the cleaning types and add-ons that match those selected rooms so customers are not staring at one long checklist.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm leading-6 text-nest-ink/76">
            <strong className="text-nest-teal">Good fit:</strong> kitchen and bathroom cleaning, pantry, closet, playroom, laundry room, garage, entry/mudroom, or another specific zone. <strong className="text-nest-teal">Quote first:</strong> interior appliances, inside cabinets or drawers, heavy buildup, large clutter, donation/trash prep, and specialty needs.
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
                <textarea className="input min-h-28" required placeholder="Example: Kitchen + 2.5 bathrooms. Standard cleaning first. Please include interior fridge, but no oven this visit. Two dogs will be secured upstairs." value={form.areaResetNotes} onChange={(e) => update("areaResetNotes", e.target.value)} />
              </Field>
            </>
          )}
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
              <input className="input" required placeholder="Example: 2 bedrooms" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
            </Field>
            <Field label="Bathrooms" required>
              <input className="input" required placeholder="Example: 2 bathrooms" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
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
        <Section title="4. Laundry Rescue preferences" description="Laundry is billed by dry weight at pickup. Your deposit is credited toward the final total, then the final balance is handled by your checkout choice: auto-charge after review or invoice before delivery.">
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
            <Field label="Pickup spot / access" required>
              <select className="input" required value={form.laundryPickupSpot} onChange={(e) => update("laundryPickupSpot", e.target.value)}>
                <option>Front porch / outside door</option>
                <option>Garage</option>
                <option>Apartment / condo door</option>
                <option>Lobby / front desk</option>
                <option>Text me on arrival</option>
                <option>Other — I’ll explain below</option>
              </select>
            </Field>
            <Field label="Detergent preference">
              <select className="input" value={form.detergent} onChange={(e) => update("detergent", e.target.value)}>
                <option>Standard detergent</option>
                <option>Baby & Sensitive Skin Detergent +$5</option>
                <option>Fragrance-free detergent +$5</option>
                <option>No preference</option>
              </select>
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
              {laundryAddOns.map((item) => (
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
        <Section title="Optional Smart Label Setup" description="Smart Labels are simple QR stickers for bins, shelves, closets, boxes, and storage areas. Choose whether you want starter labels only or setup help during the reset. Setup is quoted after review based on the number of labels, storage spots, organizing needs, and documentation needed.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm leading-6 text-nest-ink/76">
            <strong className="text-nest-teal">What they are:</strong> QR stickers your family can scan to see or update the label name, location, contents, notes, and small photos. <strong className="text-nest-teal">Labels included:</strong> starter labels may be included with qualifying resets. <strong className="text-nest-teal">Setup help:</strong> choose setup only if you want NestHelper to place, scan, name, document, and walk you through keeping them updated. Larger setups, extra labels, and detailed inventory can be included in your quote after review.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Would you like Smart Label help?">
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

      {(isHomeReset || isAreaReset || isMoveOut) && (
        <Section title="5. Home, pets, and access" description={isMoveOut ? "Clear move-in / move-out access notes help us quote accurately and avoid delays on service day." : isAreaReset ? "Clear area-reset access notes help us quote accurately, plan supplies, and avoid unsafe conditions on service day." : "Clear access notes help us avoid delays and make sure the request is safe for everyone."}>
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
        <Section title="5. Laundry pickup and return notes" description="Only include the access details needed for laundry pickup and return.">
          <Field label="Pickup/return, parking, or access notes"><input className="input" placeholder="Example: porch pickup, apartment gate code, text on arrival, leave clean bags by front door" value={form.parkingAccess} onChange={(e) => update("parkingAccess", e.target.value)} /></Field>
        </Section>
      )}

      {serviceCategory !== "none" && (
        <Section title="6. Optional photos" description={isMoveOut ? "Photos are strongly recommended for move-in / move-out cleaning so we can quote the kitchen, bathrooms, floors, appliances, and any buildup before checkout." : isAreaReset ? "Photos are strongly recommended for Specific Area(s) Resets so we can quote the selected rooms, cleaning level, clutter level, access, surfaces, buildup, and safety concerns before checkout." : "Photos are optional, but they can help us understand the scope before we approve, quote, or schedule the request."}>
          <PhotoUploadField
            photos={form.photoUploads}
            onChange={(photos) => update("photoUploads", photos)}
            label="Upload photos (optional)"
            description={isMoveOut ? "Add up to 4 photos. Kitchen, bathrooms, floors, bathtub/shower, and any heavy buildup are the most helpful." : isAreaReset ? "Add up to 4 photos. Wide shots of the selected area, kitchen/bath surfaces, floor space, shelves, buildup, piles, and anything you do not want touched are the most helpful." : "Add up to 4 optional photos. Useful for before photos, rooms/areas involved, laundry amount, access notes, or anything that helps us quote and plan accurately."}
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

function CheckOption({ checked, onChange, children, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"} ${checked ? "border-nest-gold/45 bg-nest-mint/35 text-nest-teal shadow-sm" : "border-nest-gold/10 bg-nest-cream text-nest-ink/78 hover:bg-nest-mint/25"}`}>
      <input type="checkbox" className="h-4 w-4 accent-nest-teal disabled:cursor-not-allowed" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
