export const REFERRAL_PROGRAM = {
  id: "family-to-family",
  programName: "Family Referrals",
  label: "Family Referrals",
  defaultNewCustomerCredit: 25,
  laundryCredit: 15,
  referrerReward: "a NestHelper family referral credit",
  rewardLabel: "a NestHelper family referral credit",
  statuses: [
    "Pending review",
    "Pending referred family completion",
    "Claimed",
    "Reward email pending",
    "Reward sent",
    "Reward email failed",
    "Credit approved",
    "Credit sent",
    "Credit used",
    "Not eligible"
  ] as string[],
};
import crypto from "crypto";
import { FieldValue, type DocumentReference, type Firestore } from "firebase-admin/firestore";

export const FAMILY_REFERRAL_ELIGIBLE_SERVICES = new Set([
  "parent-reset-2hr",
  "family-reset-3hr",
  "helper-block-4hr",
  "errand-helper",
  "laundry-rescue",
]);

const COMPLETED_STATUSES = new Set(["completed"]);

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown) {
  return getString(value).toLowerCase();
}

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nesthelperwa.com").replace(/\/$/, "");
}

export function normalizeReferralCode(value: unknown) {
  return getString(value).toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
}

export function buildReferralUrl(code: string) {
  return `${getBaseUrl()}/referrals?ref=${encodeURIComponent(normalizeReferralCode(code))}`;
}

export function getReferralRewardLabel() {
  return process.env.REFERRAL_REWARD_LABEL || "a NestHelper family referral credit";
}

export function getFamilyReferralServiceKey(serviceId: unknown, fallback?: unknown) {
  const raw = `${getString(serviceId)} ${getString(fallback)}`.toLowerCase();
  if (raw.includes("commercial")) return "commercial-reset";
  if (raw.includes("parent-reset") || raw.includes("parent reset") || raw.includes("2-hour")) return "parent-reset-2hr";
  if (raw.includes("family-reset") || raw.includes("family reset") || raw.includes("3-hour")) return "family-reset-3hr";
  if (raw.includes("helper-block") || raw.includes("helper block") || raw.includes("4-hour")) return "helper-block-4hr";
  if (raw.includes("errand")) return "errand-helper";
  if (raw.includes("laundry")) return "laundry-rescue";
  return getString(serviceId);
}

export function isFamilyReferralEligibleService(serviceId: unknown, fallback?: unknown) {
  return FAMILY_REFERRAL_ELIGIBLE_SERVICES.has(getFamilyReferralServiceKey(serviceId, fallback));
}

export function isCompletedStatus(status: unknown) {
  return COMPLETED_STATUSES.has(getString(status).toLowerCase());
}

export function getReferralServiceTitle(serviceId: unknown, fallback?: unknown) {
  const fallbackText = getString(fallback);
  if (fallbackText) return fallbackText;
  const service = getString(serviceId);
  if (service === "parent-reset-2hr") return "2-Hour Parent Reset";
  if (service === "family-reset-3hr") return "3-Hour Family Reset";
  if (service === "helper-block-4hr") return "4-Hour Helper Block";
  if (service === "laundry-rescue") return "Laundry Rescue";
  if (service === "errand-helper") return "Errand Helper";
  if (service === "commercial-reset") return "Commercial Reset";
  return service || "NestHelper service";
}

export function getIncomingReferralCodeFromPayload(payload: Record<string, unknown>) {
  return normalizeReferralCode(payload.incomingReferralCode || payload.referralCode || payload.referralShareCode);
}

function makeReferralCodeSeed(name: unknown, requestId: string) {
  const safeName = getString(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 5);
  const suffix = requestId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `NHF-${safeName || "FAM"}${suffix}-${random}`;
}

export async function createFamilyReferralLinkForRequest({
  db,
  requestId,
  createdBy,
}: {
  db: Firestore;
  requestId: string;
  createdBy?: string | null;
}) {
  const requestRef = db.collection("serviceRequests").doc(requestId);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) {
    throw new Error("Service request not found.");
  }

  const requestData = requestSnap.data() || {};
  const serviceId = getString(requestData.service);
  const status = getString(requestData.status);
  const referrerEmail = cleanEmail(requestData.email);
  const referrerName = getString(requestData.fullName) || getString(requestData.name) || getString(requestData.contactName);

  if (serviceId === "commercial-reset") {
    throw new Error("Referral links are only for family Parent Reset services. Commercial Reset was not changed.");
  }

  if (!isFamilyReferralEligibleService(serviceId, requestData.selectedServiceTitle || requestData.packageType || requestData.requestType)) {
    throw new Error("Referral links can only be generated for completed Parent Reset, Family Reset, or Helper Block requests.");
  }

  if (!isCompletedStatus(status)) {
    throw new Error("Mark the eligible family request as Completed before generating a referral share link.");
  }

  if (!referrerEmail) {
    throw new Error("This customer does not have an email address saved.");
  }

  const existingCode = normalizeReferralCode(requestData.outgoingReferralCode);
  if (existingCode) {
    const existingUrl = buildReferralUrl(existingCode);
    const linkSnap = await db.collection("referralLinks").doc(existingCode).get();
    if (linkSnap.exists) {
      return {
        code: existingCode,
        url: existingUrl,
        reused: true,
        requestData,
        referrerEmail,
        referrerName,
        serviceTitle: getReferralServiceTitle(serviceId, requestData.selectedServiceTitle),
        linkData: linkSnap.data() || {},
      };
    }
  }

  let code = "";
  let linkRef = db.collection("referralLinks").doc("placeholder");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = normalizeReferralCode(makeReferralCodeSeed(referrerName || referrerEmail, requestId));
    const candidateRef = db.collection("referralLinks").doc(candidate);
    const candidateSnap = await candidateRef.get();
    if (!candidateSnap.exists) {
      code = candidate;
      linkRef = candidateRef;
      break;
    }
  }

  if (!code) throw new Error("Unable to generate a unique referral code. Please try again.");

  const url = buildReferralUrl(code);
  const serviceTitle = getReferralServiceTitle(serviceId, requestData.selectedServiceTitle);
  const linkPayload = {
    code,
    url,
    status: "Active",
    program: "family-to-family",
    referrerRequestId: requestId,
    referrerName,
    referrerEmail,
    referrerService: serviceId,
    referrerServiceTitle: serviceTitle,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: createdBy || "admin",
  };

  await db.runTransaction(async (transaction) => {
    const currentRequest = await transaction.get(requestRef);
    if (!currentRequest.exists) throw new Error("Service request not found.");
    const current = currentRequest.data() || {};
    if (normalizeReferralCode(current.outgoingReferralCode)) {
      throw new Error("This customer already has a referral link. Reopen the details to view or resend it.");
    }

    transaction.set(linkRef, linkPayload);
    transaction.update(requestRef, {
      outgoingReferralCode: code,
      outgoingReferralLink: url,
      outgoingReferralStatus: "Active",
      outgoingReferralProgram: "family-to-family",
      outgoingReferralGeneratedAt: FieldValue.serverTimestamp(),
      outgoingReferralGeneratedBy: createdBy || "admin",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return {
    code,
    url,
    reused: false,
    requestData,
    referrerEmail,
    referrerName,
    serviceTitle,
    linkData: linkPayload,
  };
}

export async function claimIncomingFamilyReferral({
  db,
  requestRef,
  requestId,
  payload,
}: {
  db: Firestore;
  requestRef: DocumentReference;
  requestId: string;
  payload: Record<string, unknown>;
}) {
  const code = getIncomingReferralCodeFromPayload(payload);
  if (!code) return {};

  const serviceId = getString(payload.service);
  const referredEmail = cleanEmail(payload.email);
  const referredName = getString(payload.fullName) || getString(payload.name) || getString(payload.contactName);

  if (!isFamilyReferralEligibleService(serviceId, payload.selectedServiceTitle || payload.packageType || payload.requestType)) {
    throw new Error("This referral link can only be used for an eligible family reset: Parent Reset, Family Reset, or Helper Block.");
  }

  const linkRef = db.collection("referralLinks").doc(code);
  const updatesFromClaim = await db.runTransaction(async (transaction) => {
    const linkSnap = await transaction.get(linkRef);
    if (!linkSnap.exists) {
      throw new Error("This referral link was not found. Please check the link or contact NestHelper.");
    }

    const linkData = linkSnap.data() || {};
    const status = getString(linkData.status) || "Active";

    if (status !== "Active") {
      throw new Error("This referral link has already been used. Referral links are one-time use only.");
    }

    const referrerEmail = cleanEmail(linkData.referrerEmail);
    if (referrerEmail && referredEmail && referrerEmail === referredEmail) {
      throw new Error("Referral links are family-to-family and cannot be used on the same customer email that received the share link.");
    }

    const plainClaimUpdate = {
      incomingReferralCode: code,
      incomingReferralLinkId: code,
      incomingReferralStatus: "Pending referred family completion",
      incomingReferralProgram: "family-to-family",
      incomingReferralClaimedAtIso: new Date().toISOString(),
      incomingReferralReferrerRequestId: getString(linkData.referrerRequestId),
      incomingReferralReferrerName: getString(linkData.referrerName),
      incomingReferralReferrerEmail: referrerEmail,
      incomingReferralReferrerServiceTitle: getString(linkData.referrerServiceTitle),
    };

    const claimUpdate = {
      ...plainClaimUpdate,
      incomingReferralClaimedAt: FieldValue.serverTimestamp(),
    };

    transaction.update(linkRef, {
      status: "Claimed",
      claimedAt: FieldValue.serverTimestamp(),
      claimedByRequestId: requestId,
      referredCustomerName: referredName,
      referredCustomerEmail: referredEmail,
      referredService: serviceId,
      referredServiceTitle: getReferralServiceTitle(serviceId, payload.selectedServiceTitle),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.update(requestRef, {
      ...claimUpdate,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const referrerRequestId = getString(linkData.referrerRequestId);
    if (referrerRequestId) {
      transaction.update(db.collection("serviceRequests").doc(referrerRequestId), {
        outgoingReferralStatus: "Claimed",
        outgoingReferralClaimedAt: FieldValue.serverTimestamp(),
        outgoingReferralClaimedByRequestId: requestId,
        outgoingReferralReferredCustomerName: referredName,
        outgoingReferralReferredCustomerEmail: referredEmail,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return plainClaimUpdate;
  });

  return updatesFromClaim;
}

export async function reserveReferralRewardForCompletedRequest({
  db,
  requestId,
  requestData,
}: {
  db: Firestore;
  requestId: string;
  requestData: Record<string, unknown>;
}) {
  const code = normalizeReferralCode(requestData.incomingReferralCode || requestData.incomingReferralLinkId);
  if (!code) return null;
  if (!isFamilyReferralEligibleService(requestData.service)) return null;

  const rewardCode = normalizeReferralCode(`NHF-THANKS-${code.replace(/-/g, "").slice(-6)}`);
  const linkRef = db.collection("referralLinks").doc(code);
  const referredRequestRef = db.collection("serviceRequests").doc(requestId);

  return db.runTransaction(async (transaction) => {
    const linkSnap = await transaction.get(linkRef);
    if (!linkSnap.exists) return null;

    const linkData = linkSnap.data() || {};
    if (linkData.rewardEmailSent || getString(linkData.status) === "Reward Sent") {
      return null;
    }

    const referrerEmail = cleanEmail(linkData.referrerEmail);
    if (!referrerEmail) return null;

    transaction.update(linkRef, {
      status: "Reward Email Pending",
      rewardEmailPendingAt: FieldValue.serverTimestamp(),
      rewardCode,
      completedByRequestId: requestId,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.update(referredRequestRef, {
      incomingReferralStatus: "Reward email pending",
      incomingReferralCompletedAt: FieldValue.serverTimestamp(),
      incomingReferralRewardCode: rewardCode,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const referrerRequestId = getString(linkData.referrerRequestId);
    if (referrerRequestId) {
      transaction.update(db.collection("serviceRequests").doc(referrerRequestId), {
        outgoingReferralStatus: "Reward email pending",
        outgoingReferralRewardCode: rewardCode,
        outgoingReferralCompletedByRequestId: requestId,
        outgoingReferralCompletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      code,
      rewardCode,
      rewardLabel: getReferralRewardLabel(),
      referrerEmail,
      referrerName: getString(linkData.referrerName),
      referrerRequestId: getString(linkData.referrerRequestId),
      referredName: getString(requestData.fullName) || getString(requestData.name),
      referredServiceTitle: getReferralServiceTitle(requestData.service, requestData.selectedServiceTitle),
    };
  });
}

export async function markReferralRewardSent({
  db,
  code,
  requestId,
  referrerRequestId,
  rewardCode,
}: {
  db: Firestore;
  code: string;
  requestId: string;
  referrerRequestId?: string;
  rewardCode: string;
}) {
  const batch = db.batch();
  const linkRef = db.collection("referralLinks").doc(normalizeReferralCode(code));
  const referredRequestRef = db.collection("serviceRequests").doc(requestId);

  batch.update(linkRef, {
    status: "Reward Sent",
    rewardEmailSent: true,
    rewardEmailSentAt: FieldValue.serverTimestamp(),
    rewardCode,
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.update(referredRequestRef, {
    incomingReferralStatus: "Reward sent",
    incomingReferralRewardEmailSent: true,
    incomingReferralRewardEmailSentAt: FieldValue.serverTimestamp(),
    incomingReferralRewardCode: rewardCode,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (referrerRequestId) {
    batch.update(db.collection("serviceRequests").doc(referrerRequestId), {
      outgoingReferralStatus: "Reward sent",
      outgoingReferralRewardEmailSent: true,
      outgoingReferralRewardEmailSentAt: FieldValue.serverTimestamp(),
      outgoingReferralRewardCode: rewardCode,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

export async function markReferralRewardEmailFailed({
  db,
  code,
  requestId,
  referrerRequestId,
  errorMessage,
}: {
  db: Firestore;
  code: string;
  requestId: string;
  referrerRequestId?: string;
  errorMessage: string;
}) {
  const batch = db.batch();
  const cleanCode = normalizeReferralCode(code);
  batch.update(db.collection("referralLinks").doc(cleanCode), {
    status: "Reward Email Failed",
    rewardEmailSent: false,
    rewardEmailError: errorMessage,
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.update(db.collection("serviceRequests").doc(requestId), {
    incomingReferralStatus: "Reward email failed",
    incomingReferralRewardEmailError: errorMessage,
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (referrerRequestId) {
    batch.update(db.collection("serviceRequests").doc(referrerRequestId), {
      outgoingReferralStatus: "Reward email failed",
      outgoingReferralRewardEmailError: errorMessage,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}
