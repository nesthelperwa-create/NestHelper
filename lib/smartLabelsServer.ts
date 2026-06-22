import { createHash, randomBytes } from "crypto";
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
