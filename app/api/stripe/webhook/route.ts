import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { services } from "@/lib/services";
import { sendAdminEmail } from "@/lib/sendAdminEmail";
import { sendPaymentReceivedEmail } from "@/lib/sendPaymentReceivedEmail";
import { emailAliases } from "@/lib/emailRouting";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getServiceTitle(data: Record<string, unknown>, fallback?: string) {
  const serviceId = getString(data.service);
  return getString(data.selectedServiceTitle) || fallback || services.find((item) => item.id === serviceId)?.title || serviceId || "NestHelper service";
}

function formatMoney(amountTotal?: number | null, currency?: string | null) {
  if (typeof amountTotal !== "number") return "";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(amountTotal / 100);
  } catch {
    return `$${(amountTotal / 100).toFixed(2)}`;
  }
}

function getAdminAlertFields(isLaundryDeposit: boolean, isLaundryFinalBalance: boolean, isAdditionalPayment: boolean, sessionId = "") {
  if (isAdditionalPayment) {
    const suffix = sessionId ? `_${sessionId}` : "";
    return {
      sentFlag: `additionalPaymentAdminEmailSent${suffix}`,
      sentAt: `additionalPaymentAdminEmailSentAt${suffix}`,
      errorField: `additionalPaymentAdminEmailError${suffix}`,
      paymentLabel: "Additional balance",
    };
  }

  if (isLaundryFinalBalance) {
    return {
      sentFlag: "laundryFinalAdminPaymentEmailSent",
      sentAt: "laundryFinalAdminPaymentEmailSentAt",
      errorField: "laundryFinalAdminPaymentEmailError",
      paymentLabel: "Laundry Rescue final balance",
    };
  }

  if (isLaundryDeposit) {
    return {
      sentFlag: "laundryDepositAdminPaymentEmailSent",
      sentAt: "laundryDepositAdminPaymentEmailSentAt",
      errorField: "laundryDepositAdminPaymentEmailError",
      paymentLabel: "Laundry Rescue deposit/minimum",
    };
  }

  return {
    sentFlag: "paymentAdminEmailSent",
    sentAt: "paymentAdminEmailSentAt",
    errorField: "paymentAdminEmailError",
    paymentLabel: "Service payment",
  };
}

function buildAddress(data: Record<string, unknown>) {
  return [getString(data.address), getString(data.city), getString(data.zip)].filter(Boolean).join(", ");
}

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook secret is not configured." }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ ok: false, error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const requestId = getString(invoice.metadata?.requestId);

      if (requestId) {
        const db = getFirebaseAdminDb();
        const requestRef = db.collection("serviceRequests").doc(requestId);
        const requestSnap = await requestRef.get();
        const existingData = requestSnap.exists ? requestSnap.data() || {} : {};
        const paymentType = getString(invoice.metadata?.paymentType);
        const serviceId = getString(invoice.metadata?.serviceId) || getString(existingData.service);
        const isFamilyInvoice = paymentType === "family_invoice" || (serviceId && serviceId !== "commercial-reset");

        // Stripe marks $0 finalized invoices as paid immediately. Ignore those so a draft/test
        // invoice mistake does not mark a real NestHelper request as paid or email the customer.
        if ((invoice.amount_paid ?? 0) <= 0) {
          await requestRef.update({
            [isFamilyInvoice ? "familyInvoiceZeroDollarPaidEventIgnored" : "commercialInvoiceZeroDollarPaidEventIgnored"]: true,
            [isFamilyInvoice ? "familyInvoiceZeroDollarPaidEventIgnoredAt" : "commercialInvoiceZeroDollarPaidEventIgnoredAt"]: FieldValue.serverTimestamp(),
            [isFamilyInvoice ? "familyInvoiceZeroDollarPaidEventInvoiceId" : "commercialInvoiceZeroDollarPaidEventInvoiceId"]: invoice.id,
            [isFamilyInvoice ? "familyInvoiceZeroDollarPaidEventAmountPaid" : "commercialInvoiceZeroDollarPaidEventAmountPaid"]: invoice.amount_paid ?? null,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: "stripe-webhook",
          });
          return NextResponse.json({ received: true, ignored: "zero-dollar-invoice-paid" });
        }

        const serviceTitle = getServiceTitle(existingData, isFamilyInvoice ? "NestHelper invoice" : "Commercial Reset invoice");
        const paymentStatus = "Invoice Paid";

        const updatePayload: Record<string, unknown> = {
          status: "Invoice Paid",
          paymentStatus,
          stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : "",
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "stripe-webhook",
        };

        if (isFamilyInvoice) {
          updatePayload.familyInvoiceStatus = paymentStatus;
          updatePayload.familyInvoiceId = invoice.id;
          updatePayload.familyInvoicePaidAt = FieldValue.serverTimestamp();
          updatePayload.familyInvoiceAmountPaid = invoice.amount_paid ?? null;
          updatePayload.familyInvoiceAmountDue = invoice.amount_due ?? null;
          updatePayload.familyInvoiceHostedUrl = invoice.hosted_invoice_url || existingData.familyInvoiceUrl || "";
          updatePayload.familyInvoicePdf = invoice.invoice_pdf || existingData.familyInvoicePdf || "";
        } else {
          updatePayload.commercialInvoiceStatus = paymentStatus;
          updatePayload.commercialInvoiceId = invoice.id;
          updatePayload.commercialInvoicePaidAt = FieldValue.serverTimestamp();
          updatePayload.commercialInvoiceAmountPaid = invoice.amount_paid ?? null;
          updatePayload.commercialInvoiceAmountDue = invoice.amount_due ?? null;
          updatePayload.commercialInvoiceHostedUrl = invoice.hosted_invoice_url || existingData.commercialInvoiceUrl || "";
          updatePayload.commercialInvoicePdf = invoice.invoice_pdf || existingData.commercialInvoicePdf || "";
        }

        await requestRef.update(updatePayload);

        const email = getString(existingData.email);
        const customerName = getString(existingData.fullName) || getString(existingData.contactName);
        const customerFlag = isFamilyInvoice ? "familyInvoicePaymentConfirmationEmailSent" : "commercialInvoicePaymentConfirmationEmailSent";
        const customerFlagAt = isFamilyInvoice ? "familyInvoicePaymentConfirmationEmailSentAt" : "commercialInvoicePaymentConfirmationEmailSentAt";
        const customerErrorField = isFamilyInvoice ? "familyInvoicePaymentConfirmationEmailError" : "commercialInvoicePaymentConfirmationEmailError";

        if (email && !existingData[customerFlag]) {
          try {
            await sendPaymentReceivedEmail({
              to: email,
              customerName,
              requestId,
              serviceTitle,
              amountTotal: invoice.amount_paid,
              currency: invoice.currency,
              paymentStatus,
              replyToEmail: isFamilyInvoice ? emailAliases.billing : emailAliases.commercial || emailAliases.billing,
            });
            await requestRef.update({
              [customerFlag]: true,
              [customerFlagAt]: FieldValue.serverTimestamp(),
              [customerErrorField]: "",
            });
          } catch (error) {
            console.error("Invoice paid confirmation email failed", error);
            await requestRef.update({
              [customerFlag]: false,
              [customerErrorField]: "Payment was recorded, but the NestHelper payment confirmation email failed.",
            });
          }
        }

        const adminFlag = isFamilyInvoice ? "familyInvoiceAdminPaymentEmailSent" : "commercialInvoiceAdminPaymentEmailSent";
        const adminFlagAt = isFamilyInvoice ? "familyInvoiceAdminPaymentEmailSentAt" : "commercialInvoiceAdminPaymentEmailSentAt";
        const adminErrorField = isFamilyInvoice ? "familyInvoiceAdminPaymentEmailError" : "commercialInvoiceAdminPaymentEmailError";

        if (!existingData[adminFlag]) {
          try {
            const routedPaymentInbox = isFamilyInvoice ? emailAliases.billing : emailAliases.commercial || emailAliases.billing;
            const result = await sendAdminEmail({
              subject: `Stripe Invoice Paid: ${serviceTitle}`,
              title: isFamilyInvoice ? "Family invoice paid — ready to schedule" : "Commercial invoice paid — ready to schedule",
              intro: isFamilyInvoice
                ? "A customer paid a NestHelper family Stripe invoice. The request is now marked Invoice Paid in the admin dashboard."
                : "A customer paid a Commercial Reset Stripe invoice. The request is now marked Invoice Paid in the admin dashboard.",
              adminPath: "/admin/requests",
              to: routedPaymentInbox,
              routeLabel: isFamilyInvoice ? "Family" : "Commercial",
              routedToText: routedPaymentInbox,
              rows: {
                "Dashboard ID": requestId,
                Service: serviceTitle,
                Customer: customerName,
                Email: email,
                "Amount paid": formatMoney(invoice.amount_paid, invoice.currency),
                Address: buildAddress(existingData),
                "Stripe invoice": invoice.id,
              },
            });
            await requestRef.update({
              [adminFlag]: true,
              [adminFlagAt]: FieldValue.serverTimestamp(),
              [adminErrorField]: result && "error" in result && result.error ? String(result.error) : "",
            });
          } catch (error) {
            console.error("Invoice admin alert failed", error);
            await requestRef.update({ [adminErrorField]: "Invoice was recorded, but the admin alert failed." });
          }
        }
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const requestId = session.metadata?.requestId || session.client_reference_id || "";

      if (requestId) {
        const db = getFirebaseAdminDb();
        const requestRef = db.collection("serviceRequests").doc(requestId);
        const requestSnap = await requestRef.get();
        const existingData = requestSnap.exists ? requestSnap.data() || {} : {};
        const serviceId = getString(session.metadata?.serviceId) || getString(existingData.service);
        const paymentType = getString(session.metadata?.paymentType);
        const isAdditionalPayment = paymentType === "additional_payment";
        const isLaundryFinalBalance = paymentType === "laundry_final_balance";
        const isCustomInitialPayment = getString(session.metadata?.customInitialPayment) === "true";
        const isLaundryDeposit = serviceId === "laundry-rescue" && !isLaundryFinalBalance && !isAdditionalPayment;
        const status = isAdditionalPayment ? "Additional Paid" : isLaundryFinalBalance ? "Fully Paid" : isLaundryDeposit ? "Deposit Paid" : "Paid";
        const paymentStatus = isAdditionalPayment ? "Additional Paid" : isLaundryFinalBalance ? "Final Balance Paid" : isLaundryDeposit ? "Deposit Paid" : "Paid";

        const updatePayload: Record<string, unknown> = {
          status,
          paymentStatus,
          amountSubtotal: session.amount_subtotal ?? null,
          amountTotal: session.amount_total ?? null,
          currency: session.currency || "usd",
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "stripe-webhook",
        };

        if (!isAdditionalPayment) {
          updatePayload.checkoutSessionId = session.id;
          updatePayload.paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
          updatePayload.stripeCustomerId = typeof session.customer === "string" ? session.customer : "";
          updatePayload.paidAt = FieldValue.serverTimestamp();

          if (isCustomInitialPayment) {
            updatePayload.customInitialPaymentPaid = true;
            updatePayload.customInitialPaymentPaidAt = FieldValue.serverTimestamp();
            updatePayload.customInitialPaymentPaidAmountTotal = session.amount_total ?? null;
            updatePayload.customInitialPaymentPaidAmountSubtotal = session.amount_subtotal ?? null;
          }
        }

        if (isAdditionalPayment) {
          updatePayload.additionalPaymentStatus = "Additional Paid";
          updatePayload.additionalPaymentPaidAt = FieldValue.serverTimestamp();
          updatePayload.additionalPaymentPaidAmountTotal = session.amount_total ?? null;
          updatePayload.additionalPaymentPaidAmountSubtotal = session.amount_subtotal ?? null;
          updatePayload.additionalPaymentPaidCurrency = session.currency || "usd";
          updatePayload.additionalPaymentPaidCheckoutSessionId = session.id;
          updatePayload.additionalPaymentPaidPaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
          updatePayload.additionalPaymentPaidCustomerId = typeof session.customer === "string" ? session.customer : "";
          updatePayload.additionalPaymentTotalPaidCents = FieldValue.increment(session.amount_total ?? 0);
          updatePayload.additionalPaymentPaidHistory = FieldValue.arrayUnion({
            type: "paid",
            checkoutSessionId: session.id,
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : "",
            amountTotal: session.amount_total ?? null,
            currency: session.currency || "usd",
            reason: getString(session.metadata?.additionalReason),
            note: getString(session.metadata?.additionalNote),
            paidAtIso: new Date().toISOString(),
          });
        }

        if (isLaundryDeposit) {
          updatePayload.laundryPaymentStatus = "Deposit Paid";
          updatePayload.depositPaidAmountTotal = session.amount_total ?? null;
          updatePayload.depositPaidAt = FieldValue.serverTimestamp();
          updatePayload.laundryDepositAmountTotal = session.amount_total ?? null;
          updatePayload.laundryDepositPaidAt = FieldValue.serverTimestamp();
        }

        if (isLaundryFinalBalance) {
          updatePayload.laundryPaymentStatus = "Final Balance Paid";
          updatePayload.laundryFinalBalancePaidAt = FieldValue.serverTimestamp();
          updatePayload.laundryFinalBalancePaidAmountTotal = session.amount_total ?? null;
          updatePayload.laundryFinalPaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
          updatePayload.laundryFinalCheckoutSessionId = session.id;
        }

        await requestRef.update(updatePayload);

        const email = getString(existingData.email) || getString(session.customer_details?.email) || getString(session.customer_email);
        const customerName = getString(existingData.fullName) || getString(session.customer_details?.name) || getString(session.metadata?.customerName);
        const serviceTitle = isAdditionalPayment
          ? `Additional balance for ${getServiceTitle(existingData, session.metadata?.serviceTitle)}`
          : isLaundryFinalBalance
            ? "Laundry Rescue final balance"
            : isCustomInitialPayment
              ? getString(session.metadata?.customInitialTitle) || getServiceTitle(existingData, session.metadata?.serviceTitle)
              : isLaundryDeposit
                ? "Laundry Rescue deposit/minimum"
                : getServiceTitle(existingData, session.metadata?.serviceTitle);

        const confirmationFlag = isAdditionalPayment
          ? `additionalPaymentConfirmationEmailSent_${session.id}`
          : isLaundryFinalBalance
            ? "laundryFinalConfirmationEmailSent"
            : isLaundryDeposit
              ? "laundryDepositConfirmationEmailSent"
              : "paymentConfirmationEmailSent";
        const confirmationAt = isAdditionalPayment
          ? `additionalPaymentConfirmationEmailSentAt_${session.id}`
          : isLaundryFinalBalance
            ? "laundryFinalConfirmationEmailSentAt"
            : isLaundryDeposit
              ? "laundryDepositConfirmationEmailSentAt"
              : "paymentConfirmationEmailSentAt";
        const confirmationError = isAdditionalPayment
          ? `additionalPaymentConfirmationEmailError_${session.id}`
          : isLaundryFinalBalance
            ? "laundryFinalConfirmationEmailError"
            : isLaundryDeposit
              ? "laundryDepositConfirmationEmailError"
              : "paymentConfirmationEmailError";
        const alreadySent = Boolean(existingData[confirmationFlag]);

        if (email && !alreadySent) {
          try {
            await sendPaymentReceivedEmail({
              to: email,
              customerName,
              requestId,
              serviceTitle,
              amountTotal: session.amount_total,
              currency: session.currency,
              paymentStatus,
              replyToEmail: serviceId === "laundry-rescue" ? emailAliases.laundry : emailAliases.billing,
            });

            await requestRef.update({
              [confirmationFlag]: true,
              [confirmationAt]: FieldValue.serverTimestamp(),
              [confirmationError]: "",
            });
          } catch (error) {
            console.error("Payment received email failed", error);
            await requestRef.update({
              [confirmationFlag]: false,
              [confirmationError]: "Payment was recorded, but the NestHelper payment confirmation email failed.",
            });
          }
        }

        const adminAlert = getAdminAlertFields(isLaundryDeposit, isLaundryFinalBalance, isAdditionalPayment, session.id);
        const adminAlreadySent = Boolean(existingData[adminAlert.sentFlag]);

        if (!adminAlreadySent) {
          try {
            const routedPaymentInbox = serviceId === "laundry-rescue" ? emailAliases.laundry : emailAliases.billing;
            const routedPaymentLabel = serviceId === "laundry-rescue" ? "Laundry" : "Billing";

            const result = await sendAdminEmail({
              subject: `Stripe Payment Received: ${serviceTitle}`,
              title: "Payment received — ready to schedule",
              intro: "A customer completed Stripe checkout. The request is now marked paid in the admin dashboard and is ready for scheduling follow-up.",
              adminPath: "/admin/requests",
              to: routedPaymentInbox,
              routeLabel: routedPaymentLabel,
              routedToText: routedPaymentInbox,
              rows: {
                "Dashboard ID": requestId,
                Customer: customerName,
                Email: email,
                Phone: getString(existingData.phone) || getString(session.customer_details?.phone) || getString(session.metadata?.customerPhone),
                Service: serviceTitle,
                "Payment type": adminAlert.paymentLabel,
                "Payment status": paymentStatus,
                "Additional reason": getString(session.metadata?.additionalReason),
                "Additional note": getString(session.metadata?.additionalNote),
                "Amount paid": formatMoney(session.amount_total, session.currency),
                "Preferred date": getString(existingData.preferredDate),
                "Preferred window": getString(existingData.preferredWindow),
                Address: buildAddress(existingData),
                "Urgency / timing": getString(existingData.urgency),
                "Request details": getString(existingData.requestDetails),
                "Laundry estimate": getString(existingData.laundryBagEstimate),
                "Laundry pickup spot": getString(existingData.laundryPickupSpot),
                "Parking/access notes": getString(existingData.parkingAccess),
                "Stripe checkout session": session.id,
              },
            });

            if ((result as { skipped?: boolean })?.skipped) {
              throw new Error("Admin payment alert skipped because RESEND_API_KEY is missing.");
            }

            await requestRef.update({
              [adminAlert.sentFlag]: true,
              [adminAlert.sentAt]: FieldValue.serverTimestamp(),
              [adminAlert.errorField]: "",
            });
          } catch (error) {
            console.error("Admin payment notification email failed", error);
            await requestRef.update({
              [adminAlert.sentFlag]: false,
              [adminAlert.errorField]: "Payment was recorded, but the admin payment notification email failed.",
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed", error);
    return NextResponse.json({ ok: false, error: "Webhook handling failed." }, { status: 500 });
  }
}
