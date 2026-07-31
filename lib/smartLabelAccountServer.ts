import { FieldValue, type DocumentData, type DocumentReference, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { cleanOptionalEmail, cleanSmartLabelFields, cleanSmartLabelText, getSmartLabelUrl, normalizeSmartLabelCode, serializeSmartLabel, type SmartLabelPublicFields } from "@/lib/smartLabels";
import { buildContentsPreview, buildSmartLabelSearchText, cleanCollectionName, cleanContainerType, cleanPublicItemName, cleanPublicMessage, getSmartLabelOwnerSummary, hasLegacyPrivateContent, hashSmartLabelActivationCode, normalizeActivationCode, type SmartLabelLostStatus, type SmartLabelUseMode } from "@/lib/smartLabelCustomer";

export type AuthenticatedUser = {
  uid: string;
  email: string;
};

export type SmartLabelDashboardLabel = SmartLabelPublicFields & {
  code: string;
  labelUrl: string;
  collectionId: string;
  collectionName: string;
  containerType: string;
  useMode: SmartLabelUseMode;
  lostStatus: SmartLabelLostStatus;
  publicItemName: string;
  publicMessage: string;
  allowFinderContact: boolean;
  allowFinderLocation: boolean;
  searchText: string;
  archived: boolean;
  updatedAtIso: string;
  createdAtIso: string;
  contentsPreview: string;
  claimStatus: string;
  status: string;
  finderMessageCount: number;
  unreadFinderMessageCount: number;
  lastFinderMessageAtIso: string;
};

export type SmartLabelPackSummary = {
  id: string;
  packId: string;
  activationCodeLastFour: string;
  buyerEmail: string;
  ownerEmail: string;
  etsyOrderNumber: string;
  sheetNumbers: string;
  trackingNumber: string;
  labelsPerKit: number;
  kitQuantity: number;
  purchasedQuantity: number;
  claimedQuantity: number;
  remainingQuantity: number;
  status: string;
  createdAtIso: string;
  activatedAtIso: string;
  shippedAtIso: string;
};

function timestampToIso(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const maybeDate = value as { toDate?: () => Date; seconds?: number };
  if (typeof maybeDate.toDate === "function") return maybeDate.toDate().toISOString();
  if (typeof maybeDate.seconds === "number") return new Date(maybeDate.seconds * 1000).toISOString();
  return "";
}

export async function verifyCustomerRequest(request: Request): Promise<AuthenticatedUser | null> {
  getFirebaseAdminDb();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token || !getApps().length) return null;
  const decoded = await getAuth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: cleanOptionalEmail(decoded.email) || cleanSmartLabelText(decoded.email, 200),
  };
}

export function serializeOwnedLabel(doc: QueryDocumentSnapshot | { id: string; data: () => DocumentData }) : SmartLabelDashboardLabel {
  const data = doc.data() || {};
  const basic = serializeSmartLabel({ code: doc.id, ...data }, true);
  const ownerSummary = getSmartLabelOwnerSummary(data);
  return {
    ...basic,
    code: basic.code || normalizeSmartLabelCode(doc.id),
    labelUrl: basic.labelUrl || getSmartLabelUrl(doc.id),
    collectionId: ownerSummary.collectionId,
    collectionName: ownerSummary.collectionName,
    containerType: ownerSummary.containerType,
    useMode: ownerSummary.useMode,
    lostStatus: ownerSummary.lostStatus,
    publicItemName: ownerSummary.publicItemName,
    publicMessage: ownerSummary.publicMessage,
    allowFinderContact: ownerSummary.allowFinderContact,
    allowFinderLocation: ownerSummary.allowFinderLocation,
    searchText: cleanSmartLabelText(data.searchText, 5000),
    archived: ownerSummary.archived || String(data.status || "") === "Archived",
    updatedAtIso: basic.updatedAtIso || timestampToIso(data.updatedAt),
    createdAtIso: basic.createdAtIso || timestampToIso(data.createdAt),
    contentsPreview: buildContentsPreview(data.itemsInside, data.notes),
    claimStatus: cleanSmartLabelText(data.claimStatus, 40) || (ownerSummary.ownerUid ? "claimed" : "unclaimed"),
    status: cleanSmartLabelText(data.status, 40) || "Ready",
    finderMessageCount: Math.max(0, Number(data.finderMessageCount || 0)),
    unreadFinderMessageCount: Math.max(0, Number(data.unreadFinderMessageCount || 0)),
    lastFinderMessageAtIso: timestampToIso(data.lastFinderMessageAt),
  };
}

export function serializePack(doc: QueryDocumentSnapshot | { id: string; data: () => DocumentData }): SmartLabelPackSummary {
  const data = doc.data() || {};
  return {
    id: doc.id,
    packId: cleanSmartLabelText(data.packId, 120) || doc.id,
    activationCodeLastFour: cleanSmartLabelText(data.activationCodeLastFour, 8),
    buyerEmail: cleanOptionalEmail(data.buyerEmail),
    ownerEmail: cleanOptionalEmail(data.ownerEmail),
    etsyOrderNumber: cleanSmartLabelText(data.etsyOrderNumber, 120),
    sheetNumbers: cleanSmartLabelText(data.sheetNumbers, 240),
    trackingNumber: cleanSmartLabelText(data.trackingNumber, 120),
    labelsPerKit: Number.isFinite(Number(data.labelsPerKit)) ? Number(data.labelsPerKit) : 24,
    kitQuantity: Number.isFinite(Number(data.kitQuantity)) ? Number(data.kitQuantity) : 1,
    purchasedQuantity: Number.isFinite(Number(data.purchasedQuantity)) ? Number(data.purchasedQuantity) : 24,
    claimedQuantity: Number.isFinite(Number(data.claimedQuantity)) ? Number(data.claimedQuantity) : 0,
    remainingQuantity: Number.isFinite(Number(data.remainingQuantity)) ? Number(data.remainingQuantity) : 0,
    status: cleanSmartLabelText(data.status, 60) || "draft",
    createdAtIso: timestampToIso(data.createdAt),
    activatedAtIso: timestampToIso(data.activatedAt),
    shippedAtIso: timestampToIso(data.shippedAt),
  };
}

export async function listCustomerLabels(user: AuthenticatedUser) {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("smartLabels").where("ownerUid", "==", user.uid).get();
  return snapshot.docs.map((doc) => serializeOwnedLabel(doc)).sort((a, b) => (b.updatedAtIso || "").localeCompare(a.updatedAtIso || ""));
}

export async function listCustomerPacks(user: AuthenticatedUser) {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("smartLabelPacks").where("ownerUid", "==", user.uid).get();
  return snapshot.docs.map((doc) => serializePack(doc)).sort((a, b) => (b.createdAtIso || "").localeCompare(a.createdAtIso || ""));
}

export async function listCustomerCollections(user: AuthenticatedUser) {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("smartLabelCollections").where("ownerUid", "==", user.uid).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    collectionId: cleanSmartLabelText(doc.get("collectionId"), 120) || doc.id,
    name: cleanCollectionName(doc.get("name")) || "Untitled collection",
    description: cleanSmartLabelText(doc.get("description"), 240),
    createdAtIso: timestampToIso(doc.get("createdAt")),
    updatedAtIso: timestampToIso(doc.get("updatedAt")),
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCustomerSummary(user: AuthenticatedUser) {
  const [labels, packs, collections] = await Promise.all([
    listCustomerLabels(user),
    listCustomerPacks(user),
    listCustomerCollections(user),
  ]);
  const purchased = packs.reduce((sum, pack) => sum + pack.purchasedQuantity, 0);
  const claimedCapacity = packs.reduce((sum, pack) => sum + pack.claimedQuantity, 0);
  const remaining = packs.reduce((sum, pack) => sum + pack.remainingQuantity, 0);
  const counts = {
    all: labels.filter((label) => !label.archived).length,
    storage: labels.filter((label) => !label.archived && label.useMode === "storage").length,
    lostAndFound: labels.filter((label) => !label.archived && label.useMode === "lost_and_found").length,
    archived: labels.filter((label) => label.archived).length,
  };
  return {
    labels,
    packs,
    collections,
    summary: {
      purchasedLabels: purchased,
      claimedLabels: claimedCapacity,
      remainingLabels: remaining,
      counts,
    },
  };
}

export async function createCollectionForUser(user: AuthenticatedUser, name: string, description = "") {
  const db = getFirebaseAdminDb();
  const trimmedName = cleanCollectionName(name);
  if (!trimmedName) throw new Error("Enter a collection name.");
  const now = FieldValue.serverTimestamp();
  const ref = db.collection("smartLabelCollections").doc();
  const collectionId = `COL-${ref.id.slice(0, 8).toUpperCase()}`;
  await ref.set({
    collectionId,
    ownerUid: user.uid,
    ownerEmail: user.email,
    name: trimmedName,
    description: cleanSmartLabelText(description, 240),
    createdAt: now,
    updatedAt: now,
  });
  const snap = await ref.get();
  return {
    id: snap.id,
    collectionId,
    name: trimmedName,
    description: cleanSmartLabelText(snap.get("description"), 240),
    createdAtIso: timestampToIso(snap.get("createdAt")),
    updatedAtIso: timestampToIso(snap.get("updatedAt")),
  };
}

export async function getOwnerLabel(user: AuthenticatedUser, code: string) {
  const db = getFirebaseAdminDb();
  const safeCode = normalizeSmartLabelCode(code);
  const snap = await db.collection("smartLabels").doc(safeCode).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  if (cleanSmartLabelText(data.ownerUid, 200) !== user.uid) return null;
  return serializeOwnedLabel({ id: snap.id, data: () => data });
}

function isBlankClaimableLabel(data: Record<string, unknown>) {
  if (cleanSmartLabelText(data.ownerUid, 200)) return false;
  if (hasLegacyPrivateContent(data)) return false;
  return true;
}

async function getOrCreateClaimableLabel(transaction: FirebaseFirestore.Transaction, code: string, user: AuthenticatedUser) {
  const db = getFirebaseAdminDb();
  const labelRef = db.collection("smartLabels").doc(code);
  const reservationRef = db.collection("smartLabelReservations").doc(code);
  const labelSnap = await transaction.get(labelRef);

  if (labelSnap.exists) {
    const labelData = (labelSnap.data() || {}) as Record<string, unknown>;
    const ownerUid = cleanSmartLabelText(labelData.ownerUid, 200);
    if (ownerUid && ownerUid !== user.uid) {
      throw new Error("This label has already been claimed.");
    }
    if (!ownerUid && !isBlankClaimableLabel(labelData)) {
      throw new Error("This label already has saved data and cannot be claimed automatically.");
    }
    return { ref: labelRef, data: labelData, created: false };
  }

  const reservationSnap = await transaction.get(reservationRef);
  if (!reservationSnap.exists) {
    throw new Error("This does not appear to be a valid unclaimed NestHelper Smart Label.");
  }

  const reservationData = (reservationSnap.data() || {}) as Record<string, unknown>;
  const labelUrl = cleanSmartLabelText(reservationData.labelUrl, 300) || getSmartLabelUrl(code);
  const now = FieldValue.serverTimestamp();
  const newLabelData = {
    code,
    batchId: cleanSmartLabelText(reservationData.batchId, 120),
    batchName: cleanSmartLabelText(reservationData.batchName, 120) || "Sticker Order Labels",
    customerName: "",
    customerEmail: "",
    labelUrl,
    publicUrl: cleanSmartLabelText(reservationData.publicUrl, 300) || labelUrl,
    sequence: Number.isFinite(Number(reservationData.sequence)) ? Number(reservationData.sequence) : 0,
    labelIndex: Number.isFinite(Number(reservationData.labelIndex)) ? Number(reservationData.labelIndex) : 0,
    status: "Ready",
    ownerMode: "customer-owned",
    pinEnabled: false,
    pinHash: "",
    labelName: "",
    locationName: "",
    itemsInside: "",
    notes: "",
    photos: [],
    activatedFromReservation: true,
    createdAt: now,
    createdAtIso: new Date().toISOString(),
    updatedAt: now,
  };

  transaction.set(labelRef, newLabelData, { merge: true });
  transaction.update(reservationRef, {
    status: "Activated",
    activatedAt: now,
    updatedAt: now,
  });
  return { ref: labelRef, data: newLabelData as Record<string, unknown>, created: true };
}

export async function claimLabelForUser(user: AuthenticatedUser, rawCode: string) {
  const code = normalizeSmartLabelCode(rawCode);
  if (!code) throw new Error("Missing label code.");
  const db = getFirebaseAdminDb();
  const ownerPacks = await db.collection("smartLabelPacks").where("ownerUid", "==", user.uid).get();
  const packRefs = ownerPacks.docs.map((doc) => doc.ref);
  if (!packRefs.length) throw new Error("Activate a label pack before claiming labels.");

  const result = await db.runTransaction(async (transaction) => {
    const packSnaps = await Promise.all(packRefs.map((ref) => transaction.get(ref)));
    const packSnap = packSnaps
      .filter((snap) => snap.exists)
      .sort((a, b) => timestampToIso(a.get("activatedAt") || a.get("createdAt")).localeCompare(timestampToIso(b.get("activatedAt") || b.get("createdAt"))))
      .find((snap) => Number(snap.get("remainingQuantity") || 0) > 0);

    if (!packSnap) {
      throw new Error("You have used all labels included with your current pack. Activate another pack to add more labels.");
    }

    const claimable = await getOrCreateClaimableLabel(transaction, code, user);
    const existingOwnerUid = cleanSmartLabelText(claimable.data.ownerUid, 200);
    if (existingOwnerUid === user.uid) {
      return { alreadyOwned: true, code, packId: cleanSmartLabelText(claimable.data.claimedFromPackId, 120) };
    }

    const packData = (packSnap.data() || {}) as Record<string, unknown>;
    const packId = cleanSmartLabelText(packData.packId, 120) || packSnap.id;
    const remainingQuantity = Math.max(0, Number(packData.remainingQuantity || 0));
    const claimedQuantity = Math.max(0, Number(packData.claimedQuantity || 0));
    const now = FieldValue.serverTimestamp();
    const labelUpdate = {
      ownerUid: user.uid,
      ownerEmail: user.email,
      claimedFromPackId: packId,
      claimedFromPackDocId: packSnap.id,
      claimStatus: "claimed",
      claimedAt: now,
      updatedAt: now,
      lastScannedAt: now,
      useMode: (cleanSmartLabelText(claimable.data.useMode, 40) === "lost_and_found" ? "lost_and_found" : "storage"),
      lostStatus: cleanSmartLabelText(claimable.data.lostStatus, 40) || "not_lost",
      collectionId: cleanSmartLabelText(claimable.data.collectionId, 120),
      collectionName: cleanCollectionName(claimable.data.collectionName),
      containerType: cleanContainerType(claimable.data.containerType),
      publicItemName: cleanPublicItemName(claimable.data.publicItemName),
      publicMessage: cleanPublicMessage(claimable.data.publicMessage),
      allowFinderContact: Boolean(claimable.data.allowFinderContact),
      allowFinderLocation: Boolean(claimable.data.allowFinderLocation),
      searchText: buildSmartLabelSearchText({
        code,
        labelName: cleanSmartLabelText(claimable.data.labelName, 120),
        locationName: cleanSmartLabelText(claimable.data.locationName, 120),
        itemsInside: cleanSmartLabelText(claimable.data.itemsInside, 1200),
        notes: cleanSmartLabelText(claimable.data.notes, 1200),
        containerType: cleanContainerType(claimable.data.containerType),
        collectionName: cleanCollectionName(claimable.data.collectionName),
      }),
      status: cleanSmartLabelText(claimable.data.status, 40) || "Ready",
      archived: false,
    };

    transaction.set(claimable.ref, labelUpdate, { merge: true });
    transaction.update(packSnap.ref, {
      claimedQuantity: claimedQuantity + 1,
      remainingQuantity: Math.max(0, remainingQuantity - 1),
      status: Math.max(0, remainingQuantity - 1) > 0 ? "claimed_partial" : "claimed_full",
      activatedAt: packData.activatedAt || now,
      updatedAt: now,
      ownerUid: user.uid,
      ownerEmail: user.email,
    });

    return { alreadyOwned: false, code, packId };
  });

  return result;
}

export async function activatePackForUser(user: AuthenticatedUser, rawActivationCode: string) {
  const activationCode = normalizeActivationCode(rawActivationCode);
  if (!activationCode || activationCode.length < 5) throw new Error("Enter the activation code included with your order.");
  const activationCodeHash = hashSmartLabelActivationCode(activationCode);
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("smartLabelPacks").where("activationCodeHash", "==", activationCodeHash).limit(1).get();
  if (snapshot.empty) throw new Error("That activation code was not found.");
  const packRef = snapshot.docs[0].ref;

  await db.runTransaction(async (transaction) => {
    const packSnap = await transaction.get(packRef);
    if (!packSnap.exists) throw new Error("That activation code was not found.");
    const data = (packSnap.data() || {}) as Record<string, unknown>;
    const ownerUid = cleanSmartLabelText(data.ownerUid, 200);
    const now = FieldValue.serverTimestamp();
    const purchasedQuantity = Math.max(0, Number(data.purchasedQuantity || 0));
    const claimedQuantity = Math.max(0, Number(data.claimedQuantity || 0));
    const remainingQuantity = Math.max(0, Number(data.remainingQuantity ?? purchasedQuantity - claimedQuantity));

    if (ownerUid && ownerUid !== user.uid) throw new Error("This activation code has already been claimed.");

    transaction.update(packRef, {
      ownerUid: user.uid,
      ownerEmail: user.email,
      status: remainingQuantity > 0 ? "claimed_open" : "claimed_full",
      remainingQuantity,
      purchasedQuantity,
      claimedQuantity,
      activatedAt: data.activatedAt || now,
      updatedAt: now,
    });
  });

  const updated = await packRef.get();
  return serializePack(updated as QueryDocumentSnapshot);
}

export async function updateOwnedLabel(user: AuthenticatedUser, rawCode: string, payload: Record<string, unknown>) {
  const code = normalizeSmartLabelCode(rawCode);
  if (!code) throw new Error("Missing label code.");
  const db = getFirebaseAdminDb();
  const ref = db.collection("smartLabels").doc(code);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Label not found.");
  const data = (snap.data() || {}) as Record<string, unknown>;
  if (cleanSmartLabelText(data.ownerUid, 200) !== user.uid) throw new Error("You do not have access to this label.");

  const useMode = payload.useMode === "lost_and_found" ? "lost_and_found" : "storage";
  const finderContactEnabled = useMode === "lost_and_found" && Boolean(payload.allowFinderContact);
  const publicItemName = useMode === "lost_and_found"
    ? cleanPublicItemName(payload.publicItemName) || cleanPublicItemName(payload.labelName) || `Smart Label ${code}`
    : cleanPublicItemName(payload.publicItemName);
  const publicMessage = useMode === "lost_and_found"
    ? cleanPublicMessage(payload.publicMessage) || "If you found this item, please send a private message to the owner."
    : cleanPublicMessage(payload.publicMessage);
  const updates: Record<string, unknown> = {
    ...cleanSmartLabelFields(payload),
    containerType: cleanContainerType(payload.containerType),
    collectionId: cleanSmartLabelText(payload.collectionId, 120),
    collectionName: cleanCollectionName(payload.collectionName),
    useMode,
    lostStatus: payload.lostStatus === "lost" || payload.lostStatus === "recovered" ? payload.lostStatus : "not_lost",
    publicItemName,
    publicMessage,
    allowFinderContact: finderContactEnabled,
    allowFinderLocation: finderContactEnabled && Boolean(payload.allowFinderLocation),
    archived: Boolean(payload.archived),
    status: Boolean(payload.archived) ? "Archived" : cleanSmartLabelText(data.status, 40) || "In use",
    updatedAt: FieldValue.serverTimestamp(),
    lastScannedAt: FieldValue.serverTimestamp(),
  };

  updates.searchText = buildSmartLabelSearchText({
    code,
    labelName: cleanSmartLabelText(updates.labelName, 120),
    locationName: cleanSmartLabelText(updates.locationName, 120),
    itemsInside: cleanSmartLabelText(updates.itemsInside, 1200),
    notes: cleanSmartLabelText(updates.notes, 1200),
    containerType: cleanContainerType(updates.containerType),
    collectionName: cleanCollectionName(updates.collectionName),
  });

  if (useMode === "storage") {
    updates.lostStatus = "not_lost";
  }

  await ref.set(updates, { merge: true });
  const updated = await ref.get();
  return serializeOwnedLabel(updated as QueryDocumentSnapshot);
}

export async function searchOwnedLabels(user: AuthenticatedUser, queryText: string) {
  const labels = await listCustomerLabels(user);
  const term = normalizeActivationCode(queryText).startsWith("NH-") ? queryText : queryText;
  const normalized = buildSmartLabelSearchText({ code: term, labelName: term, locationName: term, itemsInside: term, notes: term, containerType: term, collectionName: term });
  if (!normalized) return [];
  return labels.filter((label) => !label.archived && (label.searchText || "").includes(normalized));
}

export async function getPublicScanState(code: string) {
  const safeCode = normalizeSmartLabelCode(code);
  if (!safeCode) throw new Error("Missing label code.");
  const db = getFirebaseAdminDb();
  const labelSnap = await db.collection("smartLabels").doc(safeCode).get();
  if (labelSnap.exists) {
    const data = (labelSnap.data() || {}) as Record<string, unknown>;
    const ownerSummary = getSmartLabelOwnerSummary(data);
    const legacy = !ownerSummary.ownerUid && hasLegacyPrivateContent(data);
    return {
      code: safeCode,
      labelUrl: cleanSmartLabelText(data.labelUrl, 300) || getSmartLabelUrl(safeCode),
      state: ownerSummary.ownerUid ? "claimed" : legacy ? "legacy" : "unclaimed",
      useMode: ownerSummary.useMode,
      lostStatus: ownerSummary.lostStatus,
      publicItemName: ownerSummary.publicItemName,
      publicMessage: ownerSummary.publicMessage,
      allowFinderContact: ownerSummary.allowFinderContact,
      allowFinderLocation: ownerSummary.allowFinderLocation,
      archived: ownerSummary.archived,
      claimStatus: cleanSmartLabelText(data.claimStatus, 40) || (ownerSummary.ownerUid ? "claimed" : "unclaimed"),
      batchName: cleanSmartLabelText(data.batchName, 120),
      hasLegacyContent: legacy,
      reservedOnly: false,
    };
  }

  const reservationSnap = await db.collection("smartLabelReservations").doc(safeCode).get();
  if (reservationSnap.exists) {
    const data = (reservationSnap.data() || {}) as Record<string, unknown>;
    return {
      code: safeCode,
      labelUrl: cleanSmartLabelText(data.labelUrl, 300) || getSmartLabelUrl(safeCode),
      state: "unclaimed",
      useMode: "storage" as SmartLabelUseMode,
      lostStatus: "not_lost" as SmartLabelLostStatus,
      publicItemName: "",
      publicMessage: "",
      allowFinderContact: false,
      allowFinderLocation: false,
      archived: false,
      claimStatus: "unclaimed",
      batchName: cleanSmartLabelText(data.batchName, 120),
      hasLegacyContent: false,
      reservedOnly: true,
    };
  }

  return null;
}
