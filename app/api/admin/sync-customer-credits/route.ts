import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { ensureCustomerReferralCreditForCompletedRequest } from "@/lib/referrals";

type SyncCustomerCreditsBody = {
  requestId?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown) {
  return getString(value).toLowerCase();
}

function isCompletedEnough(data: Record<string, unknown>) {
  const status = getString(data.status).toLowerCase();
  const referralStatus = getString(data.incomingReferralStatus).toLowerCase();
  return status === "completed" || Boolean(data.incomingReferralRewardEmailSent) || referralStatus.includes("reward");
}

async function getRequestData(db: Firestore, requestId: string) {
  if (!requestId) return null;
  const snap = await db.collection("serviceRequests").doc(requestId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() || {}) } as Record<string, unknown> & { id: string };
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as SyncCustomerCreditsBody;
    const requestId = getString(body.requestId);
    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const selectedRequest = await getRequestData(db, requestId);
    if (!selectedRequest) {
      return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
    }

    const candidateRequestIds = new Set<string>();

    // If the selected request itself was referred and completed, ensure that reward credit exists.
    if (getString(selectedRequest.incomingReferralCode || selectedRequest.incomingReferralLinkId)) {
      candidateRequestIds.add(requestId);
    }

    // If the selected request is the original referring customer request, check the referred request connected to it.
    [
      selectedRequest.outgoingReferralCompletedByRequestId,
      selectedRequest.outgoingReferralClaimedByRequestId,
      selectedRequest.outgoingReferralReferredRequestId,
    ].forEach((value) => {
      const next = getString(value);
      if (next) candidateRequestIds.add(next);
    });

    // Also check any referral links that belong to this customer's email. This repairs older rewards
    // where the email was sent before the customerCredits ledger existed.
    const customerEmail = cleanEmail(selectedRequest.email);
    if (customerEmail) {
      const linkSnap = await db.collection("referralLinks").where("referrerEmail", "==", customerEmail).get();
      linkSnap.forEach((doc) => {
        const link = doc.data() || {};
        [link.completedByRequestId, link.claimedByRequestId].forEach((value) => {
          const next = getString(value);
          if (next) candidateRequestIds.add(next);
        });
      });
    }

    let checked = 0;
    let created = 0;
    let existing = 0;
    const details: Array<Record<string, unknown>> = [];

    for (const candidateId of candidateRequestIds) {
      const referredRequest = await getRequestData(db, candidateId);
      if (!referredRequest || !isCompletedEnough(referredRequest)) continue;
      checked += 1;
      const result = await ensureCustomerReferralCreditForCompletedRequest({
        db,
        requestId: candidateId,
        requestData: referredRequest,
        createdBy: decoded.email || "admin-sync",
      });
      if (result.created) created += 1;
      if (result.existing) existing += 1;
      details.push({ requestId: candidateId, ...result });
    }

    return NextResponse.json({
      ok: true,
      checked,
      created,
      existing,
      details,
      message: checked
        ? "Customer credit sync finished."
        : "No completed referred-family request was found for this customer email yet.",
    });
  } catch (error) {
    console.error("Customer credit sync failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to sync customer credits." },
      { status: 500 }
    );
  }
}
