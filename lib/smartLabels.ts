import { siteConfig } from "@/lib/siteConfig";

export const smartLabelActiveQuantities: readonly number[] = [10, 20, 30, 50];
export const smartLabelStickerOrderQuantities: readonly number[] = [500, 1000];

export const smartLabelLimits = {
  maxQuantityPerBatch: 50,
  maxStickerOrderQuantity: 1000,
  defaultQuantity: 10,
  maxPhotos: 4,
  maxPhotoDataUrlLength: 190_000,
  maxLabelName: 80,
  maxLocationName: 120,
  maxItemsInside: 1200,
  maxNotes: 1200,
  maxCustomerName: 120,
  maxCustomerEmail: 160,
  maxBatchName: 120,
};

export type SmartLabelPhoto = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

export type SmartLabelPublicFields = {
  labelName: string;
  locationName: string;
  itemsInside: string;
  notes: string;
  photos: SmartLabelPhoto[];
};

export type SmartLabelPublicPayload = SmartLabelPublicFields & {
  code: string;
  labelUrl: string;
  batchId?: string;
  batchName?: string;
  customerName?: string;
  pinEnabled: boolean;
  locked: boolean;
  updatedAtIso?: string;
  createdAtIso?: string;
};


export function getBaseSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url || "https://www.nesthelperwa.com").replace(/\/$/, "");
}

export function normalizeSmartLabelCode(value: unknown) {
  if (typeof value !== "string") return "";
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

export function getSmartLabelUrl(code: string, baseUrl = getBaseSiteUrl()) {
  return `${baseUrl.replace(/\/$/, "")}/labels/${encodeURIComponent(normalizeSmartLabelCode(code))}`;
}

export function getSmartLabelQrImageUrl(labelUrl: string, size = 760) {
  const safeSize = Math.min(1200, Math.max(220, Math.round(size)));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${safeSize}x${safeSize}&margin=10&data=${encodeURIComponent(labelUrl)}`;
}

export function cleanSmartLabelText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().slice(0, maxLength);
}

export function cleanOptionalEmail(value: unknown) {
  const email = cleanSmartLabelText(value, smartLabelLimits.maxCustomerEmail).toLowerCase();
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function parseSmartLabelQuantity(value: unknown) {
  const parsed = typeof value === "string" ? Number(value.replace(/[^0-9]/g, "")) : Number(value);
  if (!Number.isFinite(parsed)) return smartLabelLimits.defaultQuantity;
  return Math.max(1, Math.round(parsed));
}

export function cleanSmartLabelQuantity(value: unknown) {
  const parsed = parseSmartLabelQuantity(value);
  return Math.min(smartLabelLimits.maxQuantityPerBatch, Math.max(1, parsed));
}

export function getSmartLabelOrderCsvRows(codes: string[]) {
  return [
    ["URL", "Label"],
    ...codes.map((code) => {
      const cleanCode = normalizeSmartLabelCode(code);
      return [getSmartLabelUrl(cleanCode), cleanCode];
    }),
  ];
}

export function cleanSmartLabelPhotos(value: unknown): SmartLabelPhoto[] {
  if (!Array.isArray(value)) return [];
  const photos: SmartLabelPhoto[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || photos.length >= smartLabelLimits.maxPhotos) continue;
    const record = item as Record<string, unknown>;
    const dataUrl = cleanSmartLabelText(record.dataUrl, smartLabelLimits.maxPhotoDataUrlLength);
    if (!dataUrl.startsWith("data:image/")) continue;

    photos.push({
      id: cleanSmartLabelText(record.id, 80) || `${Date.now()}-${photos.length}`,
      name: cleanSmartLabelText(record.name, 100) || `Photo ${photos.length + 1}`,
      type: cleanSmartLabelText(record.type, 80) || "image/jpeg",
      size: Number.isFinite(Number(record.size)) ? Math.max(0, Math.round(Number(record.size))) : 0,
      dataUrl,
    });
  }

  return photos;
}

export function cleanSmartLabelFields(payload: Record<string, unknown>): SmartLabelPublicFields {
  return {
    labelName: cleanSmartLabelText(payload.labelName, smartLabelLimits.maxLabelName),
    locationName: cleanSmartLabelText(payload.locationName, smartLabelLimits.maxLocationName),
    itemsInside: cleanSmartLabelText(payload.itemsInside, smartLabelLimits.maxItemsInside),
    notes: cleanSmartLabelText(payload.notes, smartLabelLimits.maxNotes),
    photos: cleanSmartLabelPhotos(payload.photos),
  };
}

export function isFourDigitPin(value: unknown) {
  return typeof value === "string" && /^\d{4}$/.test(value);
}

function timestampToIso(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const maybeDate = value as { toDate?: () => Date; seconds?: number };
  if (typeof maybeDate.toDate === "function") return maybeDate.toDate().toISOString();
  if (typeof maybeDate.seconds === "number") return new Date(maybeDate.seconds * 1000).toISOString();
  return "";
}

export function serializeSmartLabel(data: Record<string, unknown>, revealDetails: boolean): SmartLabelPublicPayload {
  const code = normalizeSmartLabelCode(data.code);
  const pinEnabled = Boolean(data.pinEnabled);
  const locked = pinEnabled && !revealDetails;
  const emptyDetails: SmartLabelPublicFields = { labelName: "", locationName: "", itemsInside: "", notes: "", photos: [] };
  const details = locked ? emptyDetails : cleanSmartLabelFields(data);

  return {
    code,
    labelUrl: getSmartLabelUrl(code),
    batchId: cleanSmartLabelText(data.batchId, 120),
    batchName: cleanSmartLabelText(data.batchName, smartLabelLimits.maxBatchName),
    customerName: cleanSmartLabelText(data.customerName, smartLabelLimits.maxCustomerName),
    pinEnabled,
    locked,
    createdAtIso: timestampToIso(data.createdAt),
    updatedAtIso: timestampToIso(data.updatedAt),
    ...details,
  };
}
