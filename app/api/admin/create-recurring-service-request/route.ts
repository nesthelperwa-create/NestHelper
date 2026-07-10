import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

type CreateRecurringServiceBody = {
  requestId?: string;
  followUpDate?: string;
  followUpWindow?: string;
  cadence?: string;
  followUpCreateAs?: string;
  serviceTitle?: string;
  agreedPrice?: string;
  estimatedHours?: string;
  focusAreas?: string;
  includedRooms?: string;
  suppliesPreference?: string;
  petNotes?: string;
  specialInstructions?: string;
  internalNote?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getDateInput(value: unknown) {
  const clean = getString(value).slice(0, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : "";
}

function getCleanMoney(value: unknown) {
  const clean = getString(value).replace(/[^0-9.]/g, "");
  if (!clean) return "";
  const amount = Number(clean);
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : "";
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

const SERVICE_DETAIL_FIELDS = [
  "service",
  "selectedServiceTitle",
  "serviceTitle",
  "serviceLabel",
  "packageType",
  "homeSize",
  "squareFootage",
  "sqft",
  "bedrooms",
  "bathrooms",
  "rooms",
  "areas",
  "selectedAreas",
  "focusAreas",
  "areaFocus",
  "priorityAreas",
  "mainPriorities",
  "cleaningGoals",
  "specificAreas",
  "areasToClean",
  "requestDetails",
  "specialInstructions",
  "notes",
  "suppliesPreference",
  "customerSupplies",
  "cleaningSupplies",
  "petNotes",
  "pets",
  "petHair",
  "moveTiming",
  "propertyStatus",
  "errandDetails",
  "preferredWindow",
  "preferredTime",
  "preferredDate",
];

const SAFE_RAW_FIELDS = [
  "rawSubmittedFields",
  "submittedFields",
  "rawFields",
  "formData",
  "formFields",
  "requestData",
  "requestFields",
  "answers",
  "fields",
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

    const body = (await request.json().catch(() => ({}))) as CreateRecurringServiceBody;
    const requestId = getString(body.requestId);
    const followUpDate = getDateInput(body.followUpDate);
    const followUpWindow = getString(body.followUpWindow).slice(0, 140);
    const cadence = getString(body.cadence).slice(0, 80) || "One-time follow-up";
    const followUpCreateAs = getString(body.followUpCreateAs).toLowerCase() === "recurring" ? "recurring" : "one-time";
    const isRecurringFollowUp = followUpCreateAs === "recurring";
    const serviceTitle = getString(body.serviceTitle).slice(0, 180);
    const agreedPrice = getCleanMoney(body.agreedPrice);
    const estimatedHours = getString(body.estimatedHours).slice(0, 80);
    const focusAreas = getString(body.focusAreas).slice(0, 500);
    const includedRooms = getString(body.includedRooms).slice(0, 500);
    const suppliesPreference = getString(body.suppliesPreference).slice(0, 220);
    const petNotes = getString(body.petNotes).slice(0, 220);
    const specialInstructions = getString(body.specialInstructions).slice(0, 700);
    const internalNote = getString(body.internalNote).slice(0, 300);

    if (!requestId) return NextResponse.json({ ok: false, error: "Missing source request ID." }, { status: 400 });
    if (!followUpDate) return NextResponse.json({ ok: false, error: "Choose the next visit date before creating the follow-up request." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const sourceRef = db.collection("serviceRequests").doc(requestId);
    const sourceSnap = await sourceRef.get();

    if (!sourceSnap.exists) {
      return NextResponse.json({ ok: false, error: "Source request not found." }, { status: 404 });
    }

    const source = sourceSnap.data() || {};
    if (getString(source.service) === "laundry-rescue") {
      return NextResponse.json({ ok: false, error: "Use the Repeat Laundry section for Laundry Rescue." }, { status: 400 });
    }

    const sourceEmailForDuplicate = getString(source.email).toLowerCase();
    const existingFollowUpSnap = await db
      .collection("serviceRequests")
      .where("followUpFromRequestId", "==", requestId)
      .limit(25)
      .get();

    const duplicateFollowUp = existingFollowUpSnap.docs.find((doc) => {
      const existing = doc.data() || {};
      const existingEmail = getString(existing.email || existing.followUpFromCustomerEmail).toLowerCase();
      const sameCustomer = !sourceEmailForDuplicate || !existingEmail || existingEmail === sourceEmailForDuplicate;
      return sameCustomer && getString(existing.preferredDate) === followUpDate;
    });

    if (duplicateFollowUp) {
      return NextResponse.json(
        {
          ok: false,
          duplicateRequestId: duplicateFollowUp.id,
          error: "A follow-up / recurring request already exists for this source request and visit date. Open the existing request instead of creating a duplicate.",
        },
        { status: 409 }
      );
    }

    const newRequestRef = db.collection("serviceRequests").doc();
    const nowIso = new Date().toISOString();
    const newRequest: Record<string, unknown> = {};

    copyIfPresent(source, newRequest, CUSTOMER_AND_CONTACT_FIELDS);
    copyIfPresent(source, newRequest, ADDRESS_AND_ACCESS_FIELDS);
    copyIfPresent(source, newRequest, SERVICE_DETAIL_FIELDS);
    copyIfPresent(source, newRequest, SAFE_RAW_FIELDS);
    copyIfPresent(source, newRequest, TRACKING_FIELDS);

    const sourceName = getString(source.fullName || source.name);
    const sourceEmail = getString(source.email);
    const sourceServiceTitle = getString(source.selectedServiceTitle || source.serviceTitle || source.packageType || source.service);
    const finalServiceTitle = serviceTitle || sourceServiceTitle;

    const noteLines = [
      `Follow-up / recurring request created from ${requestId}.`,
      `Create as: ${isRecurringFollowUp ? "Recurring visit" : "One-time follow-up"}`,
      cadence ? `Planned cadence: ${cadence}` : "",
      finalServiceTitle ? `Service plan: ${finalServiceTitle}` : "",
      agreedPrice ? `Agreed price: $${agreedPrice}` : "",
      estimatedHours ? `Estimated helper hours: ${estimatedHours}` : "",
      focusAreas ? `Focus areas: ${focusAreas}` : "",
      includedRooms ? `Rooms / scope included: ${includedRooms}` : "",
      suppliesPreference ? `Supplies preference: ${suppliesPreference}` : "",
      petNotes ? `Pet notes: ${petNotes}` : "",
      specialInstructions ? `Special instructions: ${specialInstructions}` : "",
      internalNote ? `Internal note: ${internalNote}` : "",
    ].filter(Boolean).join("\n");

    Object.assign(newRequest, {
      selectedServiceTitle: finalServiceTitle,
      serviceTitle: finalServiceTitle,
      packageType: finalServiceTitle,
      requestType: isRecurringFollowUp ? "Recurring service visit" : "Follow-up service visit",
      status: isRecurringFollowUp ? "Recurring Scheduled" : "Follow-up Scheduled",
      paymentStatus: "Not Paid",
      preferredDate: followUpDate,
      preferredWindow: followUpWindow || getString(source.preferredWindow || source.preferredTime),
      recurringCadence: cadence,
      recurringPrice: agreedPrice,
      customInitialAmount: agreedPrice || "",
      estimatedHours,
      focusAreas,
      areaFocus: focusAreas,
      includedRooms,
      rooms: includedRooms || source.rooms || "",
      suppliesPreference,
      petNotes,
      specialInstructions,
      isFollowUpRequest: true,
      isRecurringServiceRequest: isRecurringFollowUp,
      followUpCreateAs,
      followUpFromRequestId: requestId,
      followUpFromCustomerName: sourceName,
      followUpFromCustomerEmail: sourceEmail,
      followUpCreatedAtIso: nowIso,
      followUpCreatedBy: decoded.email || "admin",
      adminNotes: noteLines,
      createdAt: FieldValue.serverTimestamp(),
      submittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: decoded.email || "admin",
      updatedBy: decoded.email || "admin",
      submittedAtIso: nowIso,
    });

    await newRequestRef.set(newRequest);

    const sourceUpdates = {
      latestFollowUpRequestId: newRequestRef.id,
      latestFollowUpVisitDate: followUpDate,
      latestFollowUpCreatedAt: FieldValue.serverTimestamp(),
      followUpChildCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    await sourceRef.update(sourceUpdates);

    return NextResponse.json({
      ok: true,
      newRequestId: newRequestRef.id,
      sourceUpdates: {
        latestFollowUpRequestId: newRequestRef.id,
        latestFollowUpVisitDate: followUpDate,
      },
    });
  } catch (error) {
    console.error("Unable to create follow-up service request", error);
    return NextResponse.json({ ok: false, error: "Unable to create follow-up service request." }, { status: 500 });
  }
}
