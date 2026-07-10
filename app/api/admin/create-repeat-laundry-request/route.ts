import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

type CreateRepeatLaundryBody = {
  requestId?: string;
  preferredDate?: string;
  preferredWindow?: string;
  laundryPickupSpot?: string;
  laundryReturnSpot?: string;
  laundryDetergentPreference?: string;
  laundryDryerPreference?: string;
  laundryFoldPreference?: string;
  laundryAmount?: string;
  laundrySpecialInstructions?: string;
  laundryAddOnNote?: string;
  internalNote?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getDateInput(value: unknown) {
  const clean = getString(value).slice(0, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : "";
}

function copyIfPresent(source: Record<string, unknown>, target: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value === undefined || value === null || value === "") continue;
    target[key] = value;
  }
}

const CUSTOMER_AND_CONTACT_FIELDS = [
  "fullName",
  "name",
  "firstName",
  "lastName",
  "email",
  "phone",
  "normalizedEmail",
  "customerEmailKey",
];

const ADDRESS_AND_ACCESS_FIELDS = [
  "address",
  "addressLine1",
  "addressLine2",
  "unit",
  "apt",
  "city",
  "state",
  "zip",
  "zipCode",
  "serviceAddress",
  "serviceAddressLine1",
  "serviceAddressLine2",
  "serviceCity",
  "serviceState",
  "serviceZip",
  "accessNotes",
  "entryNotes",
  "gateCode",
  "parkingNotes",
];

const LAUNDRY_PREFERENCE_FIELDS = [
  "laundryPickupSpot",
  "laundryReturnSpot",
  "laundryPickupWindow",
  "laundryAmount",
  "laundryBags",
  "laundryDetergent",
  "laundryDetergentPreference",
  "laundryCustomerProvidedDetergent",
  "laundryDryerPreference",
  "laundryTemperature",
  "laundryFoldPreference",
  "laundryHangDryItems",
  "laundrySpecialInstructions",
  "laundryNotes",
  "laundryAddOns",
  "laundryFinalPaymentPreference",
];

const TRACKING_FIELDS = [
  "campaignSource",
  "campaignMedium",
  "campaignName",
  "campaignContent",
  "campaignTerm",
  "campaignLandingPage",
  "campaignReferrer",
  "howFoundUs",
  "howFoundUsDetails",
];

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as CreateRepeatLaundryBody;
    const requestId = getString(body.requestId);
    const preferredDate = getDateInput(body.preferredDate);
    const preferredWindow = getString(body.preferredWindow).slice(0, 120);
    const laundryPickupSpot = getString(body.laundryPickupSpot).slice(0, 160);
    const laundryReturnSpot = getString(body.laundryReturnSpot).slice(0, 160);
    const laundryDetergentPreference = getString(body.laundryDetergentPreference).slice(0, 160);
    const laundryDryerPreference = getString(body.laundryDryerPreference).slice(0, 200);
    const laundryFoldPreference = getString(body.laundryFoldPreference).slice(0, 200);
    const laundryAmount = getString(body.laundryAmount).slice(0, 160);
    const laundrySpecialInstructions = getString(body.laundrySpecialInstructions).slice(0, 500);
    const laundryAddOnNote = getString(body.laundryAddOnNote).slice(0, 240);
    const internalNote = getString(body.internalNote).slice(0, 240);

    if (!requestId) return NextResponse.json({ ok: false, error: "Missing source request ID." }, { status: 400 });
    if (!preferredDate) return NextResponse.json({ ok: false, error: "Choose the next pickup date before creating the repeat request." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const sourceRef = db.collection("serviceRequests").doc(requestId);
    const sourceSnap = await sourceRef.get();

    if (!sourceSnap.exists) {
      return NextResponse.json({ ok: false, error: "Source request not found." }, { status: 404 });
    }

    const source = sourceSnap.data() || {};
    if (getString(source.service) !== "laundry-rescue") {
      return NextResponse.json({ ok: false, error: "Repeat request creation is only available for Laundry Rescue." }, { status: 400 });
    }

    const sourceEmailForDuplicate = getString(source.email).toLowerCase();
    const existingRepeatSnap = await db
      .collection("serviceRequests")
      .where("repeatFromRequestId", "==", requestId)
      .limit(25)
      .get();

    const duplicateRepeat = existingRepeatSnap.docs.find((doc) => {
      const existing = doc.data() || {};
      const existingEmail = getString(existing.email || existing.repeatFromCustomerEmail).toLowerCase();
      const sameCustomer = !sourceEmailForDuplicate || !existingEmail || existingEmail === sourceEmailForDuplicate;
      return sameCustomer && getString(existing.preferredDate) === preferredDate;
    });

    if (duplicateRepeat) {
      return NextResponse.json(
        {
          ok: false,
          duplicateRequestId: duplicateRepeat.id,
          error: "A repeat Laundry Rescue request already exists for this source request and pickup date. Open the existing request instead of creating a duplicate.",
        },
        { status: 409 }
      );
    }

    const newRequestRef = db.collection("serviceRequests").doc();
    const nowIso = new Date().toISOString();
    const newRequest: Record<string, unknown> = {};

    copyIfPresent(source, newRequest, CUSTOMER_AND_CONTACT_FIELDS);
    copyIfPresent(source, newRequest, ADDRESS_AND_ACCESS_FIELDS);
    copyIfPresent(source, newRequest, LAUNDRY_PREFERENCE_FIELDS);
    copyIfPresent(source, newRequest, TRACKING_FIELDS);

    const sourceName = getString(source.fullName || source.name);
    const sourceEmail = getString(source.email);

    const overrideNoteLines = [
      laundryAddOnNote ? `Add-on / extra item note: ${laundryAddOnNote}` : "",
      laundrySpecialInstructions ? `This pickup instructions: ${laundrySpecialInstructions}` : "",
      internalNote ? `Internal note: ${internalNote}` : "",
    ].filter(Boolean);

    Object.assign(newRequest, {
      service: "laundry-rescue",
      selectedServiceTitle: "Laundry Rescue",
      packageType: "Laundry Rescue",
      requestType: "Repeat Laundry Rescue",
      status: "Repeat Scheduled",
      paymentStatus: "Not Paid",
      laundryPaymentStatus: "Not Paid",
      preferredDate,
      preferredWindow: preferredWindow || getString(source.preferredWindow || source.laundryPickupWindow),
      laundryPickupWindow: preferredWindow || getString(source.laundryPickupWindow || source.preferredWindow),
      laundryPickupSpot: laundryPickupSpot || getString(source.laundryPickupSpot),
      laundryReturnSpot: laundryReturnSpot || getString(source.laundryReturnSpot),
      laundryDetergentPreference: laundryDetergentPreference || getString(source.laundryDetergentPreference || source.laundryDetergent),
      laundryDetergent: laundryDetergentPreference || getString(source.laundryDetergent || source.laundryDetergentPreference),
      laundryDryerPreference: laundryDryerPreference || getString(source.laundryDryerPreference),
      laundryFoldPreference: laundryFoldPreference || getString(source.laundryFoldPreference),
      laundryAmount: laundryAmount || getString(source.laundryAmount),
      laundrySpecialInstructions: laundrySpecialInstructions || getString(source.laundrySpecialInstructions || source.laundryNotes),
      laundryNotes: laundrySpecialInstructions || getString(source.laundryNotes || source.laundrySpecialInstructions),
      laundryAddOnNote,
      isRepeatRequest: true,
      repeatLaundry: true,
      repeatFromRequestId: requestId,
      repeatFromCustomerName: sourceName,
      repeatFromCustomerEmail: sourceEmail,
      repeatCreatedAtIso: nowIso,
      repeatCreatedBy: decoded.email || "admin",
      repeatInternalNote: internalNote,
      adminNotes: [
        `Repeat Laundry Rescue request created from ${requestId}.`,
        ...overrideNoteLines,
      ].filter(Boolean).join("\n"),
      createdAt: FieldValue.serverTimestamp(),
      submittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: decoded.email || "admin",
      updatedBy: decoded.email || "admin",
      submittedAtIso: nowIso,
    });

    await newRequestRef.set(newRequest);

    const sourceUpdates = {
      latestRepeatRequestId: newRequestRef.id,
      latestRepeatPickupDate: preferredDate,
      latestRepeatCreatedAt: FieldValue.serverTimestamp(),
      repeatChildCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    await sourceRef.update(sourceUpdates);

    return NextResponse.json({
      ok: true,
      newRequestId: newRequestRef.id,
      sourceUpdates: {
        latestRepeatRequestId: newRequestRef.id,
        latestRepeatPickupDate: preferredDate,
      },
    });
  } catch (error) {
    console.error("Unable to create repeat laundry request", error);
    return NextResponse.json({ ok: false, error: "Unable to create repeat laundry request." }, { status: 500 });
  }
}
