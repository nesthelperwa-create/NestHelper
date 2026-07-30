import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getAppCheck } from "firebase-admin/app-check";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import {
  LAUNCH_REWARDS_CAMPAIGN_ID,
  LAUNCH_REWARDS_GRAND_CLAIM_HOURS,
  LAUNCH_REWARDS_STANDARD_EXPIRATION_DAYS,
  getLaunchRewardPrize,
  type LaunchRewardPrize,
} from "@/lib/launchRewards";

export const REWARDS_SESSION_COOKIE = "nh_rewards_session";
export const REWARDS_DEVICE_COOKIE = "nh_rewards_device";
export const REWARDS_TEST_MODE_COOKIE = "nh_rewards_admin_test";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const TEST_MODE_MAX_AGE_SECONDS = 60 * 60 * 2;

export class LaunchRewardsError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "launch_rewards_error") {
    super(message);
    this.name = "LaunchRewardsError";
    this.status = status;
    this.code = code;
  }
}

export type RewardsSession = {
  version: 1;
  participantId: string;
  deviceId: string;
  sessionVersion: number;
  expiresAt: number;
};

export type RewardsTestModeType = "quick" | "full";

export type RewardsTestIdentity = {
  firstName: string;
  email: string;
  phone: string;
  zip: string;
};

export type RewardsTestMode = {
  version: 1;
  adminEmail: string;
  deviceId: string;
  prizeId: string;
  sessionId: string;
  expiresAt: number;
  testType?: RewardsTestModeType;
  fullVerified?: boolean;
  testIdentity?: RewardsTestIdentity;
};

function getRewardsSecret() {
  const secret = process.env.REWARDS_SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("Missing REWARDS_SESSION_SECRET. Add a long random value in Vercel and .env.local.");
  }
  return secret.replace(/\\n/g, "\n");
}

function hmac(value: string) {
  return createHmac("sha256", getRewardsSecret()).update(value).digest("base64url");
}

export function secureHash(value: string, purpose = "generic") {
  return hmac(`${LAUNCH_REWARDS_CAMPAIGN_ID}:${purpose}:${value}`);
}

export function secureValueMatches(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(`signed:${body}`)}`;
}

function verifySignedPayload<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  const [body, signature, ...rest] = token.split(".");
  if (!body || !signature || rest.length || !secureValueMatches(signature, hmac(`signed:${body}`))) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function normalizeEmailAddress(value: unknown) {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  const match = raw.match(/^([^@\s]+)@([^@\s]+)$/);
  if (!match) throw new LaunchRewardsError("Enter a valid email address.", 400, "invalid_email");

  let local = match[1];
  let domain = match[2];
  if (domain === "googlemail.com") domain = "gmail.com";

  if (["gmail.com", "outlook.com", "hotmail.com", "live.com"].includes(domain)) {
    local = local.split("+")[0];
  }
  if (domain === "gmail.com") local = local.replaceAll(".", "");

  const normalized = `${local}@${domain}`;
  if (normalized.length > 254) throw new LaunchRewardsError("Enter a valid email address.", 400, "invalid_email");
  return normalized;
}

export function normalizeUsPhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  const tenDigits = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (tenDigits.length !== 10 || tenDigits.startsWith("0") || tenDigits.startsWith("1")) {
    throw new LaunchRewardsError("Enter a valid U.S. mobile phone number.", 400, "invalid_phone");
  }
  return `+1${tenDigits}`;
}

export function normalizeZip(value: unknown) {
  const zip = String(value ?? "").trim().match(/^\d{5}(?:-\d{4})?$/)?.[0] || "";
  if (!zip) throw new LaunchRewardsError("Enter a valid ZIP code.", 400, "invalid_zip");
  return zip.slice(0, 5);
}

export function normalizeFirstName(value: unknown) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (name.length < 2) throw new LaunchRewardsError("Enter your first name.", 400, "invalid_name");
  return name;
}

export function getClientIp(request: NextRequest | Request) {
  const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-vercel-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function getClientIpHash(request: NextRequest | Request) {
  return secureHash(getClientIp(request), "ip");
}

function parseDeviceCookie(value: string | undefined) {
  const payload = verifySignedPayload<{ version: 1; deviceId: string }>(value);
  if (!payload || payload.version !== 1 || !/^[A-Za-z0-9_-]{24,80}$/.test(payload.deviceId)) return null;
  return payload.deviceId;
}

export function readRewardsDeviceId(request: NextRequest) {
  return parseDeviceCookie(request.cookies.get(REWARDS_DEVICE_COOKIE)?.value);
}

export function ensureRewardsDevice(request: NextRequest, response: NextResponse, preferredDeviceId?: string): string {
  let deviceId = parseDeviceCookie(request.cookies.get(REWARDS_DEVICE_COOKIE)?.value);
  if (!deviceId) {
    deviceId = preferredDeviceId && /^[A-Za-z0-9_-]{24,80}$/.test(preferredDeviceId)
      ? preferredDeviceId
      : randomBytes(24).toString("base64url");
    response.cookies.set(REWARDS_DEVICE_COOKIE, signPayload({ version: 1, deviceId }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS * 6,
    });
  }
  return deviceId as string;
}

export function setRewardsSession(response: NextResponse, session: RewardsSession) {
  response.cookies.set(REWARDS_SESSION_COOKIE, signPayload(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearRewardsSession(response: NextResponse) {
  response.cookies.set(REWARDS_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function setRewardsTestMode(response: NextResponse, mode: RewardsTestMode) {
  response.cookies.set(REWARDS_TEST_MODE_COOKIE, signPayload(mode), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TEST_MODE_MAX_AGE_SECONDS,
  });
}

export function clearRewardsTestMode(response: NextResponse) {
  response.cookies.set(REWARDS_TEST_MODE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function readRewardsTestMode(request: NextRequest): RewardsTestMode | null {
  const mode = verifySignedPayload<RewardsTestMode>(request.cookies.get(REWARDS_TEST_MODE_COOKIE)?.value);
  const deviceId = parseDeviceCookie(request.cookies.get(REWARDS_DEVICE_COOKIE)?.value);
  if (!mode || mode.version !== 1 || mode.expiresAt <= Date.now()) return null;
  if (!deviceId || mode.deviceId !== deviceId) return null;
  if (!mode.adminEmail || !mode.sessionId || !getLaunchRewardPrize(mode.prizeId)) return null;

  const testType: RewardsTestModeType = mode.testType === "full" ? "full" : "quick";
  const testIdentity = mode.testIdentity && typeof mode.testIdentity === "object"
    ? {
        firstName: String(mode.testIdentity.firstName || "").slice(0, 60),
        email: String(mode.testIdentity.email || "").slice(0, 254),
        phone: String(mode.testIdentity.phone || "").slice(0, 20),
        zip: String(mode.testIdentity.zip || "").slice(0, 10),
      }
    : undefined;

  return {
    ...mode,
    testType,
    fullVerified: testType === "full" && mode.fullVerified === true,
    testIdentity,
  };
}

export function readRewardsSession(request: NextRequest): RewardsSession | null {
  const session = verifySignedPayload<RewardsSession>(request.cookies.get(REWARDS_SESSION_COOKIE)?.value);
  const deviceId = parseDeviceCookie(request.cookies.get(REWARDS_DEVICE_COOKIE)?.value);
  if (!session || session.version !== 1 || session.expiresAt <= Date.now()) return null;
  if (!deviceId || session.deviceId !== deviceId) return null;
  if (!session.participantId || !Number.isInteger(session.sessionVersion)) return null;
  return session;
}

export async function requireRewardsSession(request: NextRequest) {
  const session = readRewardsSession(request);
  if (!session) throw new LaunchRewardsError("Verify your phone and email to continue.", 401, "verification_required");

  const participantRef = getFirebaseAdminDb().collection("launchRewardParticipants").doc(session.participantId);
  const snapshot = await participantRef.get();
  if (!snapshot.exists) throw new LaunchRewardsError("Your rewards session is no longer available.", 401, "invalid_session");
  const participant = snapshot.data() || {};

  if (participant.status === "blocked") {
    throw new LaunchRewardsError("This rewards account is not eligible to participate.", 403, "participant_blocked");
  }
  if (Number(participant.sessionVersion || 1) !== session.sessionVersion) {
    throw new LaunchRewardsError("Verify your information again to continue.", 401, "session_expired");
  }

  return { session, participantRef, participant };
}


export async function requireRewardsAppCheck(
  request: NextRequest | Request,
  options?: { consume?: boolean }
) {
  const token = request.headers.get("X-Firebase-AppCheck")?.trim() || "";
  if (!token) {
    throw new LaunchRewardsError("The security check could not be verified. Refresh the page and try again.", 401, "app_check_required");
  }

  getFirebaseAdminDb();
  try {
    const result = await getAppCheck().verifyToken(token, options?.consume ? { consume: true } : undefined);
    if (options?.consume && result.alreadyConsumed) {
      throw new LaunchRewardsError("This secure request was already used. Refresh the page and try again.", 409, "app_check_replayed");
    }
    return result;
  } catch (error) {
    if (error instanceof LaunchRewardsError) throw error;
    console.error("Launch Rewards App Check verification failed", error);
    throw new LaunchRewardsError("The security check could not be verified. Refresh the page and try again.", 401, "invalid_app_check");
  }
}

export async function verifyFirebasePhoneToken(idToken: string) {
  if (!idToken) throw new LaunchRewardsError("Complete phone verification first.", 401, "phone_verification_required");
  getFirebaseAdminDb();
  if (!getApps().length) throw new LaunchRewardsError("Phone verification is temporarily unavailable.", 503, "firebase_unavailable");

  try {
    const decoded = await getAuth().verifyIdToken(idToken, true);
    const phone = normalizeUsPhone(decoded.phone_number || "");
    return { uid: decoded.uid, phone };
  } catch (error) {
    console.error("Launch Rewards phone token verification failed", error);
    throw new LaunchRewardsError("Phone verification expired. Please request a new text code.", 401, "invalid_phone_token");
  }
}

export async function enforcePersistentRateLimit(input: {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
}) {
  const db = getFirebaseAdminDb();
  const now = Date.now();
  const bucket = Math.floor(now / input.windowMs);
  const id = secureHash(`${input.scope}:${input.key}:${bucket}`, "rate-limit").slice(0, 60);
  const ref = db.collection("launchRewardRateLimits").doc(id);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const count = Number(snapshot.data()?.count || 0);
    if (count >= input.limit) {
      throw new LaunchRewardsError(input.message || "Please wait before trying again.", 429, "rate_limited");
    }
    transaction.set(
      ref,
      {
        campaignId: LAUNCH_REWARDS_CAMPAIGN_ID,
        scope: input.scope,
        count: count + 1,
        windowStartedAt: Timestamp.fromMillis(bucket * input.windowMs),
        expiresAt: Timestamp.fromMillis((bucket + 2) * input.windowMs),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export function createSecureEmailVerificationCode() {
  const bytes = randomBytes(4).readUInt32BE(0);
  return String(100000 + (bytes % 900000));
}

export function hashEmailVerificationCode(input: { emailHash: string; verificationId: string; code: string }) {
  return secureHash(`${input.emailHash}:${input.verificationId}:${input.code}`, "email-code");
}

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function createRewardReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let output = "NEST-";
  for (let index = 0; index < 6; index += 1) output += alphabet[bytes[index] % alphabet.length];
  return output;
}

export function createRewardDates(prize: LaunchRewardPrize, nowMs = Date.now()) {
  const expirationMs = nowMs + LAUNCH_REWARDS_STANDARD_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
  const claimDeadlineMs = prize.requiresManualVerification
    ? nowMs + LAUNCH_REWARDS_GRAND_CLAIM_HOURS * 60 * 60 * 1000
    : null;
  return {
    expiresAt: Timestamp.fromMillis(expirationMs),
    expiresAtIso: new Date(expirationMs).toISOString(),
    claimDeadline: claimDeadlineMs ? Timestamp.fromMillis(claimDeadlineMs) : null,
    claimDeadlineIso: claimDeadlineMs ? new Date(claimDeadlineMs).toISOString() : null,
  };
}

export function getTimestampMillis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
