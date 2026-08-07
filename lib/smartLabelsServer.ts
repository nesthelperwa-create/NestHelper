import { createHash, randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isFourDigitPin, normalizeSmartLabelCode } from "@/lib/smartLabels";

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeSmartLabelCode(length = 7) {
  const bytes = randomBytes(Math.max(8, length));
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += codeAlphabet[bytes[i] % codeAlphabet.length];
  }
  return code;
}

function getPinPepper() {
  return process.env.SMART_LABEL_PIN_PEPPER || process.env.FIREBASE_PROJECT_ID || "nesthelper-smart-labels";
}

export function hashSmartLabelPin(code: string, pin: string) {
  return createHash("sha256")
    .update(`${normalizeSmartLabelCode(code)}:${getPinPepper()}:${pin}`)
    .digest("hex");
}

export function verifySmartLabelPin(code: string, pin: unknown, pinHash: unknown) {
  if (!isFourDigitPin(pin) || typeof pinHash !== "string" || !pinHash) return false;
  const pinString = String(pin);
  return hashSmartLabelPin(code, pinString) === pinHash;
}

const legacyPinAttemptWindowMs = 15 * 60 * 1000;
const legacyPinMaxAttempts = 8;

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function getPinAttemptDocId(request: Request, code: string) {
  return createHash("sha256")
    .update(`${normalizeSmartLabelCode(code)}:${getClientIp(request)}:${getPinPepper()}`)
    .digest("hex");
}

export async function consumeSmartLabelPinAttempt(request: Request, code: string) {
  const db = getFirebaseAdminDb();
  const ref = db.collection("smartLabelPinRateLimits").doc(getPinAttemptDocId(request, code));
  const now = Date.now();

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const resetAtMs = Number(snap.get("resetAtMs") || 0);
    const currentCount = resetAtMs > now ? Math.max(0, Number(snap.get("count") || 0)) : 0;

    if (currentCount >= legacyPinMaxAttempts && resetAtMs > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
      };
    }

    const nextResetAtMs = resetAtMs > now ? resetAtMs : now + legacyPinAttemptWindowMs;
    transaction.set(ref, {
      labelCode: normalizeSmartLabelCode(code),
      count: currentCount + 1,
      resetAtMs: nextResetAtMs,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      allowed: true,
      retryAfterSeconds: Math.max(1, Math.ceil((nextResetAtMs - now) / 1000)),
    };
  });
}

export async function clearSmartLabelPinAttempts(request: Request, code: string) {
  const db = getFirebaseAdminDb();
  await db.collection("smartLabelPinRateLimits").doc(getPinAttemptDocId(request, code)).delete().catch(() => undefined);
}
