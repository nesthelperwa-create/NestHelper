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
    "Credit available",
    "Credit reserved",
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
  "whole-home-reset",
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

export function getCustomerEmailKey(value: unknown) {
  return cleanEmail(value);
}

function getSafeCreditAmount(value: unknown, fallback = 0) {
  const amount = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 500) return fallback;
  return Math.round(amount * 100) / 100;
}

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nesthelperwa.com").replace(/\/$/, "");
}

export function normalizeReferralCode(value: unknown) {
  return getString(value).toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
}

export function buildReferralRedeemUrl(code: string) {
  return `${getBaseUrl()}/referrals?ref=${encodeURIComponent(normalizeReferralCode(code))}`;
}

export function buildReferralUrl(code: string) {
  return `${getBaseUrl()}/referrals/share?ref=${encodeURIComponent(normalizeReferralCode(code))}`;
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
  if (raw.includes("whole-home-reset") || raw.includes("whole home") || raw.includes("whole-home") || raw.includes("regular cleaning")) return "whole-home-reset";
  if (raw.includes("errand")) return "errand-helper";
  if (raw.includes("laundry")) return "laundry-rescue";
  return getString(serviceId);
}

export function isFamilyReferralEligibleService(serviceId: unknown, fallback?: unknown) {
  return FAMILY_REFERRAL_ELIGIBLE_SERVICES.has(getFamilyReferralServiceKey(serviceId, fallback));
}

export function getFamilyReferralNewCustomerCreditAmount(serviceId: unknown, fallback?: unknown) {
  const serviceKey = getFamilyReferralServiceKey(serviceId, fallback);
  return serviceKey === "laundry-rescue" ? REFERRAL_PROGRAM.laundryCredit : REFERRAL_PROGRAM.defaultNewCustomerCredit;
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
  if (service === "whole-home-reset") return "Whole Home Cleaning";
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
  forceNew = false,
}: {
  db: Firestore;
  requestId: string;
  createdBy?: string | null;
  forceNew?: boolean;
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
    throw new Error("Referral links are only for eligible NestHelper family services. Commercial Reset was not changed.");
  }

  if (!isFamilyReferralEligibleService(serviceId, requestData.selectedServiceTitle || requestData.packageType || requestData.requestType)) {
    throw new Error("Referral links can only be generated for completed eligible NestHelper family service requests.");
  }

  if (!isCompletedStatus(status)) {
    throw new Error("Mark the eligible family request as Completed before generating a referral share link.");
  }

  if (!referrerEmail) {
    throw new Error("This customer does not have an email address saved.");
  }

  const existingCode = normalizeReferralCode(requestData.outgoingReferralCode);
  if (existingCode && !forceNew) {
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
        historyEntry: null,
        forceNew: false,
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

  const generatedAtIso = new Date().toISOString();
  const historyEntry = {
    code,
    url,
    status: "Active",
    program: "family-to-family",
    createdAtIso: generatedAtIso,
    generatedAtIso,
    generatedBy: createdBy || "admin",
  };

  await db.runTransaction(async (transaction) => {
    const currentRequest = await transaction.get(requestRef);
    if (!currentRequest.exists) throw new Error("Service request not found.");
    const current = currentRequest.data() || {};
    if (!forceNew && normalizeReferralCode(current.outgoingReferralCode)) {
      throw new Error("This customer already has a referral link. Reopen the details to view or resend it, or choose Generate another one-time link.");
    }

    transaction.set(linkRef, linkPayload);
    transaction.update(requestRef, {
      outgoingReferralCode: code,
      outgoingReferralLink: url,
      outgoingReferralStatus: "Active",
      outgoingReferralProgram: "family-to-family",
      outgoingReferralGeneratedAt: FieldValue.serverTimestamp(),
      outgoingReferralGeneratedBy: createdBy || "admin",
      outgoingReferralLinkCount: FieldValue.increment(1),
      outgoingReferralHistory: FieldValue.arrayUnion(historyEntry),
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
    historyEntry,
    forceNew,
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
    throw new Error("This referral link can only be used for an eligible NestHelper family service.");
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
      incomingReferralNewCustomerCreditAmount: getFamilyReferralNewCustomerCreditAmount(serviceId, payload.selectedServiceTitle || payload.packageType || payload.requestType),
      incomingReferralReferrerCreditAmount: getFamilyReferralNewCustomerCreditAmount(serviceId, payload.selectedServiceTitle || payload.packageType || payload.requestType),
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
  if (!isFamilyReferralEligibleService(requestData.service, requestData.selectedServiceTitle || requestData.packageType || requestData.requestType)) return null;

  const rewardCode = normalizeReferralCode(`NHF-THANKS-${code.replace(/-/g, "").slice(-6)}`);
  const linkRef = db.collection("referralLinks").doc(code);
  const referredRequestRef = db.collection("serviceRequests").doc(requestId);
  const creditRef = db.collection("customerCredits").doc(rewardCode);

  return db.runTransaction(async (transaction) => {
    const linkSnap = await transaction.get(linkRef);
    if (!linkSnap.exists) return null;

    const linkData = linkSnap.data() || {};
    if (linkData.rewardEmailSent || getString(linkData.status) === "Reward Sent") {
      return null;
    }

    const referrerEmail = cleanEmail(linkData.referrerEmail);
    if (!referrerEmail) return null;
    const referrerRequestId = getString(linkData.referrerRequestId);
    const creditAmount = getSafeCreditAmount(
      requestData.incomingReferralReferrerCreditAmount,
      getFamilyReferralNewCustomerCreditAmount(requestData.service, requestData.selectedServiceTitle || requestData.packageType || requestData.requestType)
    );
    const referrerName = getString(linkData.referrerName);
    const referredName = getString(requestData.fullName) || getString(requestData.name);
    const referredServiceTitle = getReferralServiceTitle(requestData.service, requestData.selectedServiceTitle);

    transaction.set(creditRef, {
      creditId: rewardCode,
      creditCode: rewardCode,
      program: "family-to-family",
      type: "family_referral",
      status: "Available",
      amount: creditAmount,
      remainingAmount: creditAmount,
      customerEmail: referrerEmail,
      customerEmailKey: referrerEmail,
      customerName: referrerName,
      sourceReferralCode: code,
      sourceReferralLinkId: code,
      sourceReferrerRequestId: referrerRequestId,
      sourceReferredRequestId: requestId,
      sourceReferredName: referredName,
      sourceReferredServiceTitle: referredServiceTitle,
      earnedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    transaction.update(linkRef, {
      status: "Reward Email Pending",
      rewardEmailPendingAt: FieldValue.serverTimestamp(),
      rewardCode,
      rewardCreditId: rewardCode,
      rewardCreditAmount: creditAmount,
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

    if (referrerRequestId) {
      transaction.update(db.collection("serviceRequests").doc(referrerRequestId), {
        outgoingReferralStatus: "Credit available",
        outgoingReferralRewardCode: rewardCode,
        outgoingReferralCreditId: rewardCode,
        outgoingReferralCreditAmount: creditAmount,
        outgoingReferralCreditStatus: "Available",
        outgoingReferralCompletedByRequestId: requestId,
        outgoingReferralCompletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      code,
      rewardCode,
      rewardLabel: `$${creditAmount} NestHelper family referral credit`,
      rewardAmount: creditAmount,
      referrerEmail,
      referrerName,
      referrerRequestId,
      referredName,
      referredServiceTitle,
    };
  });
}



export async function getOrCreateNextReferralLinkAfterReward({
  db,
  sourceReferralCode,
  referrerRequestId,
  createdBy,
}: {
  db: Firestore;
  sourceReferralCode: string;
  referrerRequestId?: string;
  createdBy?: string | null;
}) {
  const sourceCode = normalizeReferralCode(sourceReferralCode);
  const cleanReferrerRequestId = getString(referrerRequestId);
  if (!sourceCode || !cleanReferrerRequestId) return null;

  const sourceRef = db.collection("referralLinks").doc(sourceCode);
  const sourceSnap = await sourceRef.get();
  const sourceData = sourceSnap.data() || {};
  const existingCode = normalizeReferralCode(sourceData.nextReferralCode || sourceData.rewardNextReferralCode);
  const existingUrl = getString(sourceData.nextReferralUrl || sourceData.rewardNextReferralUrl);

  if (existingCode && existingUrl) {
    const existingSnap = await db.collection("referralLinks").doc(existingCode).get();
    if (existingSnap.exists) {
      return {
        code: existingCode,
        url: existingUrl,
        reused: true,
      };
    }
  }

  const generated = await createFamilyReferralLinkForRequest({
    db,
    requestId: cleanReferrerRequestId,
    createdBy: createdBy || "reward-followup",
    forceNew: true,
  });

  await sourceRef.set(
    {
      nextReferralCode: generated.code,
      nextReferralUrl: generated.url,
      rewardNextReferralCode: generated.code,
      rewardNextReferralUrl: generated.url,
      nextReferralCreatedAt: FieldValue.serverTimestamp(),
      nextReferralCreatedBy: createdBy || "reward-followup",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    code: generated.code,
    url: generated.url,
    reused: false,
  };
}

export async function ensureCustomerReferralCreditForCompletedRequest({
  db,
  requestId,
  requestData,
  createdBy,
}: {
  db: Firestore;
  requestId: string;
  requestData: Record<string, unknown>;
  createdBy?: string | null;
}) {
  const code = normalizeReferralCode(requestData.incomingReferralCode || requestData.incomingReferralLinkId);
  if (!code) return { ok: false, reason: "No incoming referral code.", created: false, existing: false };

  const completedEnough =
    isCompletedStatus(requestData.status) ||
    Boolean(requestData.incomingReferralRewardEmailSent) ||
    getString(requestData.incomingReferralStatus).toLowerCase().includes("reward");

  if (!completedEnough) return { ok: false, reason: "Referred request is not completed yet.", created: false, existing: false };
  if (!isFamilyReferralEligibleService(requestData.service, requestData.selectedServiceTitle || requestData.packageType || requestData.requestType)) {
    return { ok: false, reason: "Referred request is not an eligible family service.", created: false, existing: false };
  }

  const linkRef = db.collection("referralLinks").doc(code);
  const referredRequestRef = db.collection("serviceRequests").doc(requestId);

  return db.runTransaction(async (transaction) => {
    const linkSnap = await transaction.get(linkRef);
    if (!linkSnap.exists) return { ok: false, reason: "Referral link was not found.", created: false, existing: false };

    const linkData = linkSnap.data() || {};
    const referrerEmail = cleanEmail(linkData.referrerEmail || requestData.incomingReferralReferrerEmail);
    if (!referrerEmail) return { ok: false, reason: "Referrer email is missing.", created: false, existing: false };

    const rewardCode = normalizeReferralCode(
      linkData.rewardCode ||
        linkData.rewardCreditId ||
        requestData.incomingReferralRewardCode ||
        requestData.outgoingReferralRewardCode ||
        `NHF-THANKS-${code.replace(/-/g, "").slice(-6)}`
    );
    if (!rewardCode) return { ok: false, reason: "Reward code could not be created.", created: false, existing: false };

    const creditRef = db.collection("customerCredits").doc(rewardCode);
    const creditSnap = await transaction.get(creditRef);
    const creditAmount = getSafeCreditAmount(
      requestData.incomingReferralReferrerCreditAmount || linkData.rewardCreditAmount,
      getFamilyReferralNewCustomerCreditAmount(requestData.service, requestData.selectedServiceTitle || requestData.packageType || requestData.requestType)
    );

    if (creditSnap.exists) {
      const existing = creditSnap.data() || {};
      const existingAmount = getSafeCreditAmount(existing.remainingAmount || existing.amount);
      if (existingAmount > 0) {
        return { ok: true, reason: "Saved credit already exists.", created: false, existing: true, rewardCode, creditAmount: existingAmount, referrerEmail };
      }
    }

    const referrerRequestId = getString(linkData.referrerRequestId || requestData.incomingReferralReferrerRequestId);
    const referrerName = getString(linkData.referrerName || requestData.incomingReferralReferrerName);
    const referredName = getString(requestData.fullName) || getString(requestData.name);
    const referredServiceTitle = getReferralServiceTitle(requestData.service, requestData.selectedServiceTitle || requestData.packageType || requestData.requestType);

    transaction.set(creditRef, {
      creditId: rewardCode,
      creditCode: rewardCode,
      program: "family-to-family",
      type: "family_referral",
      status: "Available",
      amount: creditAmount,
      remainingAmount: creditAmount,
      customerEmail: referrerEmail,
      customerEmailKey: referrerEmail,
      customerName: referrerName,
      sourceReferralCode: code,
      sourceReferralLinkId: code,
      sourceReferrerRequestId: referrerRequestId,
      sourceReferredRequestId: requestId,
      sourceReferredName: referredName,
      sourceReferredServiceTitle: referredServiceTitle,
      earnedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: createdBy || "admin-sync",
      backfilled: true,
    }, { merge: true });

    transaction.update(linkRef, {
      rewardCode,
      rewardCreditId: rewardCode,
      rewardCreditAmount: creditAmount,
      completedByRequestId: requestId,
      completedAt: linkData.completedAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.update(referredRequestRef, {
      incomingReferralRewardCode: rewardCode,
      incomingReferralRewardCreditAmount: creditAmount,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (referrerRequestId) {
      transaction.update(db.collection("serviceRequests").doc(referrerRequestId), {
        outgoingReferralStatus: "Credit available",
        outgoingReferralCreditStatus: "Available",
        outgoingReferralRewardCode: rewardCode,
        outgoingReferralCreditId: rewardCode,
        outgoingReferralCreditAmount: creditAmount,
        outgoingReferralCompletedByRequestId: requestId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { ok: true, reason: "Saved credit created.", created: true, existing: false, rewardCode, creditAmount, referrerEmail };
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

  batch.update(db.collection("customerCredits").doc(normalizeReferralCode(rewardCode)), {
    status: "Available",
    rewardEmailSent: true,
    rewardEmailSentAt: FieldValue.serverTimestamp(),
    rewardEmailError: "",
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
      outgoingReferralStatus: "Credit available",
      outgoingReferralCreditStatus: "Available",
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


export async function getAvailableCustomerReferralCreditsForEmail(db: Firestore, email: unknown, excludeRequestId?: unknown) {
  const emailKey = getCustomerEmailKey(email);
  if (!emailKey) return [] as Array<Record<string, unknown> & { id: string }>;

  const snap = await db
    .collection("customerCredits")
    .where("customerEmailKey", "==", emailKey)
    .where("status", "==", "Available")
    .get();

  const excluded = getString(excludeRequestId);
  return snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() || {}) } as Record<string, unknown> & { id: string }))
    .filter((credit) => {
      if (excluded && (getString(credit.sourceReferrerRequestId) === excluded || getString(credit.sourceReferredRequestId) === excluded)) return false;
      return getSafeCreditAmount(credit.remainingAmount || credit.amount) > 0;
    });
}

export function getTotalCustomerCreditAmount(credits: Array<Record<string, unknown>>) {
  return credits.reduce((sum, credit) => sum + getSafeCreditAmount(credit.remainingAmount || credit.amount), 0);
}

function getAppliedCustomerCreditIdsFromBreakdown(breakdown: Record<string, unknown>) {
  const raw = breakdown.appliedCustomerCreditIds;
  if (!Array.isArray(raw)) return [] as string[];
  return raw.map((value) => normalizeReferralCode(value)).filter(Boolean).slice(0, 10);
}

export async function reserveAppliedCustomerReferralCreditsForPayment({
  db,
  requestId,
  requestData,
  paymentKind,
  paymentId,
  adminEmail,
}: {
  db: Firestore;
  requestId: string;
  requestData: Record<string, unknown>;
  paymentKind: string;
  paymentId: string;
  adminEmail?: string | null;
}) {
  const breakdown = (requestData.familyPaymentBreakdown || {}) as Record<string, unknown>;
  const requestedIds = getAppliedCustomerCreditIdsFromBreakdown(breakdown);
  const desiredAmount = getSafeCreditAmount(breakdown.appliedCustomerCreditAmount);
  const requestEmail = getCustomerEmailKey(requestData.email);

  let credits = [] as Array<Record<string, unknown> & { id: string }>;
  if (requestedIds.length) {
    const snaps = await Promise.all(requestedIds.map((id) => db.collection("customerCredits").doc(id).get()));
    credits = snaps.filter((snap) => snap.exists).map((snap) => ({ id: snap.id, ...(snap.data() || {}) }));
  } else if (desiredAmount > 0) {
    credits = await getAvailableCustomerReferralCreditsForEmail(db, requestEmail, requestId);
  }

  if (!credits.length) return { reserved: false, reservedAmount: 0, creditIds: [] as string[] };

  return db.runTransaction(async (transaction) => {
    let remainingToReserve = desiredAmount || getTotalCustomerCreditAmount(credits);
    let reservedAmount = 0;
    const reservedIds: string[] = [];

    for (const credit of credits) {
      if (remainingToReserve <= 0) break;
      const creditId = normalizeReferralCode(credit.id || credit.creditCode || credit.creditId);
      if (!creditId) continue;
      const creditRef = db.collection("customerCredits").doc(creditId);
      const creditSnap = await transaction.get(creditRef);
      if (!creditSnap.exists) continue;
      const current = creditSnap.data() || {};
      const currentStatus = getString(current.status);
      const currentEmail = getCustomerEmailKey(current.customerEmailKey || current.customerEmail);
      if (currentStatus === "Used") continue;
      if (currentStatus === "Reserved" && getString(current.reservedByRequestId) !== requestId) continue;
      if (currentEmail && requestEmail && currentEmail !== requestEmail) continue;

      const amount = Math.min(getSafeCreditAmount(current.remainingAmount || current.amount), remainingToReserve);
      if (amount <= 0) continue;

      transaction.update(creditRef, {
        status: "Reserved",
        remainingAmount: amount,
        reservedAmount: amount,
        reservedByRequestId: requestId,
        reservedByPaymentKind: paymentKind,
        reservedByPaymentId: paymentId,
        reservedAt: FieldValue.serverTimestamp(),
        reservedBy: adminEmail || "admin",
        updatedAt: FieldValue.serverTimestamp(),
      });
      reservedAmount += amount;
      remainingToReserve -= amount;
      reservedIds.push(creditId);
    }

    if (reservedIds.length) {
      transaction.update(db.collection("serviceRequests").doc(requestId), {
        appliedCustomerCreditIds: reservedIds,
        appliedCustomerCreditAmount: Number(reservedAmount.toFixed(2)),
        appliedCustomerCreditStatus: "Reserved",
        appliedCustomerCreditPaymentKind: paymentKind,
        appliedCustomerCreditPaymentId: paymentId,
        appliedCustomerCreditReservedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { reserved: reservedIds.length > 0, reservedAmount: Number(reservedAmount.toFixed(2)), creditIds: reservedIds };
  });
}

export async function markReservedCustomerReferralCreditsUsedForRequest({
  db,
  requestId,
  paymentKind,
  paymentId,
}: {
  db: Firestore;
  requestId: string;
  paymentKind: string;
  paymentId: string;
}) {
  const requestRef = db.collection("serviceRequests").doc(requestId);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists) return { used: false, usedAmount: 0, creditIds: [] as string[] };
  const requestData = requestSnap.data() || {};
  const creditIds = Array.isArray(requestData.appliedCustomerCreditIds)
    ? requestData.appliedCustomerCreditIds.map((value: unknown) => normalizeReferralCode(value)).filter(Boolean)
    : getAppliedCustomerCreditIdsFromBreakdown((requestData.familyPaymentBreakdown || {}) as Record<string, unknown>);

  if (!creditIds.length) return { used: false, usedAmount: 0, creditIds: [] as string[] };

  return db.runTransaction(async (transaction) => {
    let usedAmount = 0;
    const usedIds: string[] = [];

    for (const creditId of creditIds) {
      const creditRef = db.collection("customerCredits").doc(creditId);
      const creditSnap = await transaction.get(creditRef);
      if (!creditSnap.exists) continue;
      const credit = creditSnap.data() || {};
      const status = getString(credit.status);
      if (status === "Used" && getString(credit.usedByRequestId) === requestId) {
        usedIds.push(creditId);
        usedAmount += getSafeCreditAmount(credit.usedAmount || credit.amount);
        continue;
      }
      if (status !== "Reserved" && status !== "Available") continue;
      if (getString(credit.reservedByRequestId) && getString(credit.reservedByRequestId) !== requestId) continue;

      const amount = getSafeCreditAmount(credit.reservedAmount || credit.remainingAmount || credit.amount);
      if (amount <= 0) continue;

      transaction.update(creditRef, {
        status: "Used",
        remainingAmount: 0,
        usedAmount: amount,
        usedByRequestId: requestId,
        usedByPaymentKind: paymentKind,
        usedByPaymentId: paymentId,
        usedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      usedIds.push(creditId);
      usedAmount += amount;
    }

    if (usedIds.length) {
      transaction.update(requestRef, {
        appliedCustomerCreditIds: usedIds,
        appliedCustomerCreditAmount: Number(usedAmount.toFixed(2)),
        appliedCustomerCreditStatus: "Used",
        appliedCustomerCreditUsedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { used: usedIds.length > 0, usedAmount: Number(usedAmount.toFixed(2)), creditIds: usedIds };
  });
}
