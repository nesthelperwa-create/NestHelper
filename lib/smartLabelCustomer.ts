import { createHash, randomBytes } from "crypto";
import { cleanSmartLabelText, normalizeSmartLabelCode, type SmartLabelPhoto } from "@/lib/smartLabels";

export const SMART_LABELS_PER_KIT = 24;
export const smartLabelCustomerLimits = {
  maxContainerType: 60,
  maxCollectionName: 80,
  maxPublicItemName: 90,
  maxPublicMessage: 240,
  maxFinderMessage: 600,
  maxTrackingNumber: 120,
  maxEtsyOrderNumber: 120,
  maxSheetNumbers: 240,
  maxActivationNotes: 400,
};

export type SmartLabelUseMode = "storage" | "lost_and_found";
export type SmartLabelLostStatus = "not_lost" | "lost" | "recovered";

const activationAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeSmartLabelPackId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(2, 12);
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `NH-PACK-${stamp}-${suffix}`;
}

export function makeSmartLabelActivationCode(length = 6) {
  const bytes = randomBytes(Math.max(8, length));
  let body = "";
  for (let i = 0; i < length; i += 1) {
    body += activationAlphabet[bytes[i] % activationAlphabet.length];
  }
  return `NH-${body}`;
}

function getActivationPepper() {
  return process.env.SMART_LABEL_ACTIVATION_PEPPER || process.env.FIREBASE_PROJECT_ID || "nesthelper-smart-label-activation";
}

export function hashSmartLabelActivationCode(code: string) {
  return createHash("sha256").update(`${normalizeActivationCode(code)}:${getActivationPepper()}`).digest("hex");
}

export function normalizeActivationCode(value: unknown) {
  if (typeof value !== "string") return "";
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("NH")) return `NH-${cleaned.slice(2)}`;
  return `NH-${cleaned}`;
}

export function getActivationCodeLastFour(code: string) {
  const normalized = normalizeActivationCode(code).replace(/[^A-Z0-9]/g, "");
  return normalized.slice(-4);
}

export function cleanContainerType(value: unknown) {
  return cleanSmartLabelText(value, smartLabelCustomerLimits.maxContainerType);
}

export function cleanCollectionName(value: unknown) {
  return cleanSmartLabelText(value, smartLabelCustomerLimits.maxCollectionName);
}

export function cleanPublicItemName(value: unknown) {
  return cleanSmartLabelText(value, smartLabelCustomerLimits.maxPublicItemName);
}

export function cleanPublicMessage(value: unknown) {
  return cleanSmartLabelText(value, smartLabelCustomerLimits.maxPublicMessage);
}

export function cleanTrackingNumber(value: unknown) {
  return cleanSmartLabelText(value, smartLabelCustomerLimits.maxTrackingNumber);
}

export function cleanEtsyOrderNumber(value: unknown) {
  return cleanSmartLabelText(value, smartLabelCustomerLimits.maxEtsyOrderNumber);
}

export function cleanSheetNumbers(value: unknown) {
  return cleanSmartLabelText(value, smartLabelCustomerLimits.maxSheetNumbers);
}

export function cleanActivationNotes(value: unknown) {
  return cleanSmartLabelText(value, smartLabelCustomerLimits.maxActivationNotes);
}

export function normalizeLabelSearchText(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildSmartLabelSearchText(data: {
  code?: string;
  labelName?: string;
  locationName?: string;
  itemsInside?: string;
  notes?: string;
  containerType?: string;
  collectionName?: string;
}) {
  return normalizeLabelSearchText(
    [
      data.code || "",
      data.labelName || "",
      data.locationName || "",
      data.itemsInside || "",
      data.notes || "",
      data.containerType || "",
      data.collectionName || "",
    ].join(" ")
  );
}

export function buildContentsPreview(itemsInside: unknown, fallbackNotes?: unknown) {
  const primary = cleanSmartLabelText(itemsInside, 220);
  if (primary) return primary;
  return cleanSmartLabelText(fallbackNotes, 220);
}

export function hasLegacyPrivateContent(data: Record<string, unknown>) {
  return Boolean(
    cleanSmartLabelText(data.labelName, 120) ||
      cleanSmartLabelText(data.locationName, 120) ||
      cleanSmartLabelText(data.itemsInside, 1200) ||
      cleanSmartLabelText(data.notes, 1200) ||
      (Array.isArray(data.photos) && (data.photos as SmartLabelPhoto[]).length > 0) ||
      Boolean(data.pinEnabled)
  );
}

export function getSmartLabelOwnerSummary(data: Record<string, unknown>) {
  return {
    ownerUid: cleanSmartLabelText(data.ownerUid, 200),
    ownerEmail: cleanSmartLabelText(data.ownerEmail, 200),
    claimedFromPackId: cleanSmartLabelText(data.claimedFromPackId, 120),
    collectionId: cleanSmartLabelText(data.collectionId, 120),
    collectionName: cleanCollectionName(data.collectionName),
    containerType: cleanContainerType(data.containerType),
    useMode: (data.useMode === "lost_and_found" ? "lost_and_found" : "storage") as SmartLabelUseMode,
    lostStatus: (["not_lost", "lost", "recovered"].includes(String(data.lostStatus)) ? String(data.lostStatus) : "not_lost") as SmartLabelLostStatus,
    publicItemName: cleanPublicItemName(data.publicItemName),
    publicMessage: cleanPublicMessage(data.publicMessage),
    allowFinderContact: Boolean(data.allowFinderContact),
    allowFinderLocation: Boolean(data.allowFinderLocation),
    archived: Boolean(data.archived),
  };
}
