import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import {
  cleanSmartLabelFields,
  isFourDigitPin,
  normalizeSmartLabelCode,
  serializeSmartLabel,
} from "@/lib/smartLabels";
import { hashSmartLabelPin, verifySmartLabelPin } from "@/lib/smartLabelsServer";

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
  return { ref: snap.ref, data: snap.data() || {} };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const code = await getCodeFromContext(context);
    if (!code) return NextResponse.json({ ok: false, error: "Missing label code." }, { status: 400 });

    const label = await getLabel(code);
    if (!label) return NextResponse.json({ ok: false, error: "Label not found." }, { status: 404 });

    const pinEnabled = Boolean(label.data.pinEnabled);
    return NextResponse.json({ ok: true, label: serializeSmartLabel(label.data, !pinEnabled) });
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
    if (body.action !== "unlock") return NextResponse.json({ ok: false, error: "Unsupported label action." }, { status: 400 });

    const label = await getLabel(code);
    if (!label) return NextResponse.json({ ok: false, error: "Label not found." }, { status: 404 });
    if (!label.data.pinEnabled) return NextResponse.json({ ok: true, label: serializeSmartLabel(label.data, true) });

    if (!verifySmartLabelPin(code, body.currentPin, label.data.pinHash)) {
      return NextResponse.json({ ok: false, error: "That PIN did not match." }, { status: 403 });
    }

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

    const pinEnabled = Boolean(label.data.pinEnabled);
    if (pinEnabled && !verifySmartLabelPin(code, body.currentPin, label.data.pinHash)) {
      return NextResponse.json({ ok: false, error: "Enter the current 4-digit PIN to save changes." }, { status: 403 });
    }

    const updates: Record<string, unknown> = {
      ...cleanSmartLabelFields(body),
      status: "In use",
      lastEditedBy: "customer-scan",
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.removePin === true) {
      if (pinEnabled && !verifySmartLabelPin(code, body.currentPin, label.data.pinHash)) {
        return NextResponse.json({ ok: false, error: "Enter the current PIN to remove it." }, { status: 403 });
      }
      updates.pinEnabled = false;
      updates.pinHash = "";
      updates.pinUpdatedAt = FieldValue.serverTimestamp();
    } else if (body.newPin !== undefined && String(body.newPin).trim() !== "") {
      if (!isFourDigitPin(body.newPin)) {
        return NextResponse.json({ ok: false, error: "PIN must be exactly 4 digits." }, { status: 400 });
      }
      updates.pinEnabled = true;
      updates.pinHash = hashSmartLabelPin(code, body.newPin);
      updates.pinUpdatedAt = FieldValue.serverTimestamp();
    }

    await label.ref.update(updates);
    const updated = await label.ref.get();
    return NextResponse.json({ ok: true, label: serializeSmartLabel(updated.data() || {}, true) });
  } catch (error) {
    console.error("Smart label update failed", error);
    return NextResponse.json({ ok: false, error: "Unable to save this label." }, { status: 500 });
  }
}
