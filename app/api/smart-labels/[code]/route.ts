import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import {
  cleanSmartLabelFields,
  getSmartLabelUrl,
  isFourDigitPin,
  normalizeSmartLabelCode,
  serializeSmartLabel,
} from "@/lib/smartLabels";
import { getPublicScanState, migrateLegacyLabelToOwner, verifyCustomerRequest } from "@/lib/smartLabelAccountServer";
import { clearSmartLabelPinAttempts, consumeSmartLabelPinAttempt, hashSmartLabelPin, verifySmartLabelPin } from "@/lib/smartLabelsServer";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

type UpdateBody = Record<string, unknown> & {
  currentPin?: string;
  newPin?: string;
  removePin?: boolean;
  action?: string;
};

async function getCodeFromContext(context: RouteContext) {
  const params = await context.params;
  return normalizeSmartLabelCode(params.code);
}

async function getLabel(code: string) {
  const db = getFirebaseAdminDb();
  const snap = await db.collection("smartLabels").doc(code).get();
  if (!snap.exists) return null;
  return { ref: snap.ref, data: (snap.data() || {}) as Record<string, unknown> };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const code = await getCodeFromContext(context);
    if (!code) return NextResponse.json({ ok: false, error: "Missing label code." }, { status: 400 });

    const publicState = await getPublicScanState(code);
    if (!publicState) return NextResponse.json({ ok: false, error: "Label not found." }, { status: 404 });

    let legacyLabel = null;
    if (publicState.state === "legacy" && publicState.legacyPinEnabled) {
      const label = await getLabel(code);
      if (label) {
        legacyLabel = serializeSmartLabel(label.data, false);
      }
    }

    return NextResponse.json({ ok: true, publicState, legacyLabel });
  } catch (error) {
    console.error("Smart label load failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load this label." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const code = await getCodeFromContext(context);
    if (!code) return NextResponse.json({ ok: false, error: "Missing label code." }, { status: 400 });

    const body = (await request.json().catch(() => ({}))) as UpdateBody;

    if (body.action === "migrate") {
      const user = await verifyCustomerRequest(request);
      if (!user) return NextResponse.json({ ok: false, error: "Sign in to move this older label into My Labels." }, { status: 401 });
      try {
        const migrated = await migrateLegacyLabelToOwner(user, code);
        return NextResponse.json({ ok: true, label: migrated, message: "This older label is now protected in your My Labels account." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to move this older label into My Labels.";
        const status = message.includes("already been claimed") ? 409 : 403;
        return NextResponse.json({ ok: false, error: message }, { status });
      }
    }

    if (body.action !== "unlock") return NextResponse.json({ ok: false, error: "Unsupported label action." }, { status: 400 });

    const label = await getLabel(code);
    if (!label) return NextResponse.json({ ok: false, error: "Label not found." }, { status: 404 });
    if (label.data.ownerUid) {
      return NextResponse.json({ ok: false, error: "This claimed label must be opened from the owner dashboard." }, { status: 403 });
    }
    if (!label.data.pinEnabled) {
      return NextResponse.json({ ok: false, error: "For privacy, older labels without a PIN must be connected to the original customer's account before their saved details can be viewed." }, { status: 403 });
    }

    const attempt = await consumeSmartLabelPinAttempt(request, code);
    if (!attempt.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many PIN attempts. Wait a few minutes and try again." },
        { status: 429, headers: { "Retry-After": String(attempt.retryAfterSeconds) } },
      );
    }

    if (!verifySmartLabelPin(code, body.currentPin, label.data.pinHash)) {
      return NextResponse.json({ ok: false, error: "That PIN did not match." }, { status: 403 });
    }

    await clearSmartLabelPinAttempts(request, code);
    return NextResponse.json({ ok: true, label: serializeSmartLabel(label.data, true) });
  } catch (error) {
    console.error("Smart label unlock failed", error);
    return NextResponse.json({ ok: false, error: "Unable to unlock this label." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const code = await getCodeFromContext(context);
    if (!code) return NextResponse.json({ ok: false, error: "Missing label code." }, { status: 400 });

    const body = (await request.json().catch(() => ({}))) as UpdateBody;
    const label = await getLabel(code);
    if (!label) return NextResponse.json({ ok: false, error: "Label not found." }, { status: 404 });
    if (label.data.ownerUid) {
      return NextResponse.json({ ok: false, error: "This claimed label must be edited from the owner dashboard." }, { status: 403 });
    }

    const pinEnabled = Boolean(label.data.pinEnabled);
    if (!pinEnabled) {
      return NextResponse.json({ ok: false, error: "For privacy, older labels without a PIN must be connected to the original customer's account before they can be edited." }, { status: 403 });
    }

    const attempt = await consumeSmartLabelPinAttempt(request, code);
    if (!attempt.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many PIN attempts. Wait a few minutes and try again." },
        { status: 429, headers: { "Retry-After": String(attempt.retryAfterSeconds) } },
      );
    }
    if (!verifySmartLabelPin(code, body.currentPin, label.data.pinHash)) {
      return NextResponse.json({ ok: false, error: "Enter the current 4-digit PIN to save changes." }, { status: 403 });
    }
    await clearSmartLabelPinAttempts(request, code);

    if (body.removePin === true) {
      return NextResponse.json(
        { ok: false, error: "For privacy, legacy PIN protection cannot be turned off on the public scan page. Contact NestHelper if you want this older label moved into My Labels." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {
      ...cleanSmartLabelFields(body),
      status: "In use",
      lastEditedBy: "customer-scan-legacy",
      updatedAt: FieldValue.serverTimestamp(),
      labelUrl: typeof label.data.labelUrl === "string" && label.data.labelUrl ? label.data.labelUrl : getSmartLabelUrl(code),
    };

    if (body.newPin !== undefined && String(body.newPin).trim() !== "") {
      if (!isFourDigitPin(body.newPin)) {
        return NextResponse.json({ ok: false, error: "PIN must be exactly 4 digits." }, { status: 400 });
      }
      updates.pinEnabled = true;
      updates.pinHash = hashSmartLabelPin(code, body.newPin);
      updates.pinUpdatedAt = FieldValue.serverTimestamp();
    }

    await label.ref.set(updates, { merge: true });
    const updated = await label.ref.get();
    return NextResponse.json({ ok: true, label: serializeSmartLabel(updated.data() || {}, true) });
  } catch (error) {
    console.error("Smart label update failed", error);
    return NextResponse.json({ ok: false, error: "Unable to save this label." }, { status: 500 });
  }
}
