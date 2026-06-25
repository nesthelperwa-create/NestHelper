import { NextResponse } from "next/server";

type SubmissionCollection = "serviceRequests" | "helperApplications" | "partnerApplications" | "contactMessages";

export type PublicSubmissionFile = {
  fieldName: string;
  label: string;
  file: File;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_APPLICATION_DOCUMENTS = 5;
const MAX_APPLICATION_DOCUMENT_BYTES = 3 * 1024 * 1024;
const MAX_APPLICATION_DOCUMENT_TOTAL_BYTES = 3_600_000;

const allowedApplicationDocumentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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
  "requestedAt",
  "howFoundUs",
  "howFoundUsDetails",
  "campaignSource",
  "campaignMedium",
  "campaignName",
  "campaignContent",
  "campaignTerm",
  "campaignLandingPage",
  "campaignReferrer",
  "campaignCapturedAtIso",
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
  "smartLabelSetupInterest",
  "smartLabelSetupNotes",
  "homePriorities",
  "homeAreas",
  "areaResetArea",
  "areaResetOtherArea",
  "areaResetAdditionalAreas",
  "areaResetAdditionalAreaSummary",
  "areaResetOtherAdditionalArea",
  "areaResetCleaningType",
  "areaResetBathroomCount",
  "areaResetSize",
  "areaResetCondition",
  "areaResetGoals",
  "areaResetGoalSummary",
  "areaResetHauling",
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
  "howFoundUs",
  "howFoundUsDetails",
  "campaignSource",
  "campaignMedium",
  "campaignName",
  "campaignContent",
  "campaignTerm",
  "campaignLandingPage",
  "campaignReferrer",
  "campaignCapturedAtIso",
  "availability",
  "weeklyCapacity",
  "services",
  "experienceLevel",
  "experience",
  "transportation",
  "travelRadius",
  "workStyle",
  "comfortLevel",
  "notWillingToDo",
  "references",
  "notes",
  "uploadedDocumentLabels",
  "uploadedDocumentSummary",
  "backgroundConsent",
];

const partnerAllowedFields = [
  "businessName",
  "ownerName",
  "email",
  "phone",
  "serviceType",
  "website",
  "howFoundUs",
  "howFoundUsDetails",
  "campaignSource",
  "campaignMedium",
  "campaignName",
  "campaignContent",
  "campaignTerm",
  "campaignLandingPage",
  "campaignReferrer",
  "campaignCapturedAtIso",
  "businessStructure",
  "serviceArea",
  "serviceAreaDetails",
  "licenseStatus",
  "insuranceStatus",
  "licenseInfo",
  "insuranceInfo",
  "capacity",
  "availability",
  "documentsAvailable",
  "uploadedDocumentLabels",
  "uploadedDocumentSummary",
  "notes",
  "consent",
];

const contactAllowedFields = [
  "name",
  "email",
  "phone",
  "topic",
  "howFoundUs",
  "howFoundUsDetails",
  "campaignSource",
  "campaignMedium",
  "campaignName",
  "campaignContent",
  "campaignTerm",
  "campaignLandingPage",
  "campaignReferrer",
  "campaignCapturedAtIso",
  "subject",
  "message",
];

const allowedFieldsByCollection: Record<SubmissionCollection, string[]> = {
  serviceRequests: serviceRequestAllowedFields,
  helperApplications: helperAllowedFields,
  partnerApplications: partnerAllowedFields,
  contactMessages: contactAllowedFields,
};

const maxPayloadBytesByCollection: Record<SubmissionCollection, number> = {
  serviceRequests: 3_000_000,
  helperApplications: 160_000,
  partnerApplications: 160_000,
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
  areaResetArea: 180,
  areaResetOtherArea: 500,
  areaResetAdditionalAreaSummary: 700,
  areaResetOtherAdditionalArea: 500,
  areaResetCleaningType: 220,
  areaResetBathroomCount: 140,
  areaResetSize: 500,
  areaResetCondition: 220,
  areaResetGoalSummary: 900,
  areaResetHauling: 220,
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
  serviceAreaDetails: 1200,
  licenseInfo: 1200,
  insuranceInfo: 1200,
  capacity: 1000,
  uploadedDocumentSummary: 900,
  howFoundUs: 180,
  howFoundUsDetails: 500,
  smartLabelSetupInterest: 220,
  smartLabelSetupNotes: 700,
  campaignSource: 140,
  campaignMedium: 140,
  campaignName: 180,
  campaignContent: 180,
  campaignTerm: 180,
  campaignLandingPage: 500,
  campaignReferrer: 500,
  campaignCapturedAtIso: 80,
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
  const requireArray = (field: string, label = field) => {
    if (!Array.isArray(payload[field]) || !(payload[field] as unknown[]).filter(Boolean).length) missing.push(label);
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
    requireArray("serviceType", "service type");
    requireTrue("consent", "partner acknowledgement");
  }

  if (collection === "serviceRequests") {
    requireEmail();
    requireText("phone", "phone");
    requireText("service", "service");
    requireTrue("consent", "service acknowledgement");

    requireStreetAddress();
    requireZip();

    if (trimText(payload.service) === "commercial-reset") {
      requireText("businessName", "business name");
      requireText("contactName", "contact name");
      requireText("city", "city");
      requireText("frequency", "frequency");
    } else {
      requireText("fullName", "full name");
      requireText("city", "city");

      if (trimText(payload.service) === "specific-area-reset") {
        requireText("areaResetArea", "primary area");
        requireText("areaResetCleaningType", "cleaning / reset type");
        requireText("areaResetSize", "area size or count");
        requireText("requestDetails", "top priorities and safety notes");

        const primaryArea = trimText(payload.areaResetArea, 220).toLowerCase();
        const additionalAreas = Array.isArray(payload.areaResetAdditionalAreas)
          ? (payload.areaResetAdditionalAreas as unknown[]).map((item) => trimText(item, 220).toLowerCase())
          : [];

        if (primaryArea.includes("other") && !trimText(payload.areaResetOtherArea)) {
          missing.push("other primary area");
        }

        if (additionalAreas.some((item) => item.includes("other")) && !trimText(payload.areaResetOtherAdditionalArea)) {
          missing.push("other add-on area");
        }

        if ((primaryArea.includes("bathroom") || additionalAreas.some((item) => item.includes("bathroom"))) && !trimText(payload.areaResetBathroomCount)) {
          missing.push("bathroom count");
        }
      }
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

function isAllowedApplicationDocument(file: File) {
  const type = (file.type || "").toLowerCase();
  if (allowedApplicationDocumentTypes.has(type)) return true;
  const name = file.name.toLowerCase();
  return /\.(pdf|doc|docx|jpg|jpeg|png|webp|heic|heif)$/.test(name);
}

function isFormDataFile(value: FormDataEntryValue): value is File {
  if (!value || typeof value !== "object") return false;
  const maybeFile = value as File;
  return typeof maybeFile.name === "string" && typeof maybeFile.size === "number" && typeof maybeFile.arrayBuffer === "function";
}

function cleanUploadLabel(value: unknown) {
  const label = trimText(value, 80);
  return label || "Other";
}

function parsePayloadFromFormData(formData: FormData) {
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") throw new PublicFormError("Missing application details.", 400);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    throw new PublicFormError("Invalid application details.", 400);
  }

  if (!isObject(parsed)) throw new PublicFormError("Invalid application details.", 400);
  return parsed;
}

function parseApplicationDocuments(formData: FormData) {
  const files: PublicSubmissionFile[] = [];
  let totalBytes = 0;

  for (const [fieldName, value] of formData.entries()) {
    if (!fieldName.startsWith("documentFile_")) continue;
    if (!isFormDataFile(value) || !value.name || value.size <= 0) continue;

    if (files.length >= MAX_APPLICATION_DOCUMENTS) {
      throw new PublicFormError(`Please upload no more than ${MAX_APPLICATION_DOCUMENTS} documents.`, 413);
    }

    if (value.size > MAX_APPLICATION_DOCUMENT_BYTES) {
      throw new PublicFormError(`Each document must be under ${Math.floor(MAX_APPLICATION_DOCUMENT_BYTES / (1024 * 1024))} MB.`, 413);
    }

    if (!isAllowedApplicationDocument(value)) {
      throw new PublicFormError("Documents must be PDF, Word, JPG, PNG, WEBP, HEIC, or HEIF files.", 415);
    }

    totalBytes += value.size;
    if (totalBytes > MAX_APPLICATION_DOCUMENT_TOTAL_BYTES) {
      throw new PublicFormError("Uploaded documents are too large together. Please keep optional documents under 3.6 MB total.", 413);
    }

    const index = fieldName.replace("documentFile_", "");
    files.push({
      fieldName,
      label: cleanUploadLabel(formData.get(`documentLabel_${index}`)),
      file: value,
    });
  }

  return files;
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

export async function preparePublicMultipartSubmission(request: Request, collection: "helperApplications" | "partnerApplications") {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw new PublicFormError("Invalid application format.", 415);
  }

  enforceRateLimit(request, collection);

  const formData = await request.formData();
  const parsed = parsePayloadFromFormData(formData);
  checkHoneypot(parsed);

  const cleaned = sanitizePayload(collection, parsed);
  const files = parseApplicationDocuments(formData);
  const missing = validateRequired(collection, cleaned);

  if (missing.length) {
    throw new PublicFormError(`Please complete: ${missing.join(", ")}.`, 400);
  }

  return { payload: cleaned, files };
}

export function publicFormErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof PublicFormError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ ok: false, error: fallbackMessage }, { status: 500 });
}
