import { NextResponse } from "next/server";

type SubmissionCollection = "serviceRequests" | "helperApplications" | "partnerApplications" | "contactMessages";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();
const WINDOW_MS = 15 * 60 * 1000;

const commonAllowedFields = [
  "fullName",
  "name",
  "email",
  "phone",
  "address",
  "address2",
  "city",
  "state",
  "zip",
  "serviceAddress",
  "serviceAddressLine1",
  "serviceAddressLine2",
  "serviceCity",
  "serviceState",
  "serviceZip",
  "serviceAddressConfirmed",
  "requestedAt",
  "consent",
  "photoUploadCount",
  "photoUploadSummary",
  "photoUploads",
];

const serviceRequestAllowedFields = [
  ...commonAllowedFields,
  "service",
  "selectedServiceTitle",
  "packageType",
  "requestType",
  "preferredDate",
  "preferredWindow",
  "alternateDate",
  "urgency",
  "promoCode",
  "incomingReferralCode",
  "incomingReferralProgram",
  "incomingReferralLandingPage",
  "parkingAccess",
  "homeType",
  "pets",
  "petDetails",
  "supplyPreference",
  "homePriorities",
  "homeAreas",
  "requestDetails",
  "roomsAreas",
  "errandType",
  "errandDistance",
  "errandStops",
  "errandStartArea",
  "errandMileageAck",
  "laundryTypes",
  "laundryBagEstimate",
  "laundryPickupSpot",
  "detergent",
  "dryPreference",
  "laundryAddOns",
  "reusableBagAck",
  "businessName",
  "contactName",
  "roleTitle",
  "serviceRegion",
  "businessType",
  "squareFootage",
  "bathrooms",
  "kitchens",
  "showers",
  "spaceCondition",
  "trafficLevel",
  "frequency",
  "preferredDaysTimes",
  "rentalBedrooms",
  "rentalBeds",
  "rentalCheckoutWindow",
  "rentalLinenHandling",
  "rentalRestockNeeds",
  "rentalTurnoverNotes",
  "supplies",
  "flooringTypes",
  "accessType",
  "accessInstructions",
  "spaceDetails",
  "cleaningPriorities",
  "addOnInterests",
  "carpetArea",
  "carpetCondition",
  "carpetAreaClearance",
  "spotTreatmentCount",
  "hardFloorArea",
  "hardFloorMaterial",
  "hardFloorCondition",
  "hardFloorAreaClearance",
  "upholsteryScope",
  "upholsteryCondition",
  "glassScope",
  "glassAccess",
  "specialNotes",
  "photoNotes",
  "quoteBasis",
  "customerEstimateReady",
  "customerEstimateTitle",
  "customerEstimatePrimaryRange",
  "customerEstimateMonthlyRange",
  "customerEstimateAddOnRange",
  "customerEstimateNotes",
  "customerEstimateAdminSummary",
];

const helperAllowedFields = [
  "fullName",
  "email",
  "phone",
  "city",
  "availability",
  "services",
  "experience",
  "transportation",
  "backgroundConsent",
  "references",
  "notes",
];

const partnerAllowedFields = [
  "businessName",
  "ownerName",
  "email",
  "phone",
  "serviceType",
  "website",
  "serviceArea",
  "licenseInfo",
  "insuranceInfo",
  "capacity",
  "notes",
  "consent",
];

const contactAllowedFields = ["name", "email", "phone", "topic", "subject", "message"];

const allowedFieldsByCollection: Record<SubmissionCollection, string[]> = {
  serviceRequests: serviceRequestAllowedFields,
  helperApplications: helperAllowedFields,
  partnerApplications: partnerAllowedFields,
  contactMessages: contactAllowedFields,
};

const maxPayloadBytesByCollection: Record<SubmissionCollection, number> = {
  serviceRequests: 3_000_000,
  helperApplications: 80_000,
  partnerApplications: 80_000,
  contactMessages: 40_000,
};

const maxSubmissionsByCollection: Record<SubmissionCollection, number> = {
  serviceRequests: 6,
  helperApplications: 4,
  partnerApplications: 4,
  contactMessages: 5,
};

const textLimits: Record<string, number> = {
  requestDetails: 1800,
  petDetails: 1200,
  specialNotes: 1800,
  rentalTurnoverNotes: 1200,
  accessInstructions: 1200,
  photoNotes: 700,
  message: 1800,
  notes: 1800,
  experience: 1800,
  references: 1200,
  services: 1200,
  serviceArea: 1200,
  licenseInfo: 1200,
  insuranceInfo: 1200,
  capacity: 1000,
};

const honeypotFields = [
  "company",
  "nickname",
  "fax",
  "middleName",
  "homepage",
  "confirmEmail",
  "contactUrl",
  "url",
];

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function trimText(value: unknown, maxLength = 300) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function looksLikeZip(value: unknown) {
  const zip = trimText(value, 20);
  return /^\d{5}(?:-\d{4})?$/.test(zip);
}

function looksLikeStreetAddress(value: unknown) {
  const address = trimText(value, 300);
  return /\d/.test(address) && /[a-zA-Z]/.test(address) && address.length >= 5;
}

function looksLikeEmail(value: unknown) {
  const email = trimText(value, 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function cleanPrimitive(key: string, value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : "";
  if (typeof value === "string") return trimText(value, textLimits[key] || 300);
  return "";
}

function cleanArray(key: string, value: unknown) {
  if (!Array.isArray(value)) return [];

  if (key === "photoUploads") {
    return value
      .filter(isObject)
      .slice(0, 4)
      .map((photo) => ({
        id: trimText(photo.id, 80),
        name: trimText(photo.name, 120),
        type: trimText(photo.type, 80),
        size: Number.isFinite(Number(photo.size)) ? Number(photo.size) : 0,
        dataUrl: typeof photo.dataUrl === "string" ? photo.dataUrl.slice(0, 700_000) : "",
      }))
      .filter((photo) => photo.dataUrl.startsWith("data:image/"));
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => trimText(item, 180))
    .filter(Boolean)
    .slice(0, 40);
}

function sanitizePayload(collection: SubmissionCollection, payload: Record<string, unknown>) {
  const allowed = new Set(allowedFieldsByCollection[collection]);
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (!allowed.has(key)) continue;
    if (Array.isArray(value)) cleaned[key] = cleanArray(key, value);
    else if (isObject(value)) continue;
    else cleaned[key] = cleanPrimitive(key, value);
  }

  return cleaned;
}

function validateRequired(collection: SubmissionCollection, payload: Record<string, unknown>) {
  const missing: string[] = [];
  const requireText = (field: string, label = field) => {
    if (!trimText(payload[field])) missing.push(label);
  };
  const requireEmail = () => {
    if (!looksLikeEmail(payload.email)) missing.push("valid email");
  };
  const requireTrue = (field: string, label = field) => {
    if (payload[field] !== true) missing.push(label);
  };
  const requireStreetAddress = () => {
    if (!looksLikeStreetAddress(payload.address || payload.serviceAddressLine1)) missing.push("complete street address");
  };
  const requireZip = () => {
    if (!looksLikeZip(payload.zip || payload.serviceZip)) missing.push("valid ZIP code");
  };

  if (collection === "contactMessages") {
    requireText("name", "name");
    requireEmail();
    requireText("subject", "subject");
    requireText("message", "message");
  }

  if (collection === "helperApplications") {
    requireText("fullName", "full name");
    requireEmail();
    requireText("phone", "phone");
    requireText("city", "city");
    requireTrue("backgroundConsent", "background check acknowledgement");
  }

  if (collection === "partnerApplications") {
    requireText("businessName", "business name");
    requireText("ownerName", "owner/contact name");
    requireEmail();
    requireText("phone", "phone");
    requireText("serviceType", "service type");
    requireTrue("consent", "partner acknowledgement");
  }

  if (collection === "serviceRequests") {
    requireEmail();
    requireText("phone", "phone");
    requireText("service", "service");
    requireTrue("consent", "service acknowledgement");

    requireStreetAddress();
    requireZip();
    requireTrue("serviceAddressConfirmed", "service address confirmation");

    if (trimText(payload.service) === "commercial-reset") {
      requireText("businessName", "business name");
      requireText("contactName", "contact name");
      requireText("city", "city");
      requireText("frequency", "frequency");
    } else {
      requireText("fullName", "full name");
      requireText("city", "city");
    }
  }

  return missing;
}

function enforceRateLimit(request: Request, collection: SubmissionCollection) {
  const now = Date.now();
  const key = `${collection}:${clientIp(request)}`;
  const existing = rateLimitStore.get(key);
  const max = maxSubmissionsByCollection[collection];

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  if (existing.count > max) {
    throw new PublicFormError("Too many submissions. Please wait a few minutes and try again.", 429);
  }
}

function checkHoneypot(payload: Record<string, unknown>) {
  const filled = honeypotFields.some((field) => trimText(payload[field]).length > 0);
  if (filled) throw new PublicFormError("Submission could not be accepted.", 400);
}

export class PublicFormError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function preparePublicSubmission(request: Request, collection: SubmissionCollection) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new PublicFormError("Invalid submission format.", 415);
  }

  enforceRateLimit(request, collection);

  const raw = await request.text();
  const maxBytes = maxPayloadBytesByCollection[collection];
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new PublicFormError("Submission is too large. Please remove large photos or shorten the message.", 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new PublicFormError("Invalid submission data.", 400);
  }

  if (!isObject(parsed)) throw new PublicFormError("Invalid submission data.", 400);

  checkHoneypot(parsed);
  const cleaned = sanitizePayload(collection, parsed);
  const missing = validateRequired(collection, cleaned);

  if (missing.length) {
    throw new PublicFormError(`Please complete: ${missing.join(", ")}.`, 400);
  }

  return cleaned;
}

export function publicFormErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof PublicFormError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ ok: false, error: fallbackMessage }, { status: 500 });
}
