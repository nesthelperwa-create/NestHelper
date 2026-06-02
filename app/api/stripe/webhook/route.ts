import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { services } from "@/lib/services";
import { sendAdminEmail } from "@/lib/sendAdminEmail";
import { sendPaymentReceivedEmail } from "@/lib/sendPaymentReceivedEmail";
import { emailAliases, getPrimaryAdminNotificationRecipients } from "@/lib/emailRouting";

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

function getCheckoutCustomFieldValue(session: Stripe.Checkout.Session, key: string) {
  const fields = Array.isArray(session.custom_fields) ? session.custom_fields : [];
  const field = fields.find((item: any) => item.key === key) as any;
  return getString(field?.dropdown?.value || field?.text?.value || field?.numeric?.value);
}

function normalizeLaundryFinalPreference(value: string) {
  const preference = getString(value).toLowerCase();
  if (preference === "autocharge" || preference === "auto_charge") return "auto_charge";
  if (preference === "invoicebeforedelivery" || preference === "invoice_before_delivery") return "invoice_before_delivery";
  return "invoice_before_delivery";
}

function getLaundryFinalPreferenceLabel(preference: string) {
  if (preference === "auto_charge") return "Auto-charge saved card after dry weigh-in";
  if (preference === "invoice_before_delivery") return "Send final invoice link before delivery";
  return "Send final invoice link before delivery";
}

function getEmailResultError(result: unknown) {
  if (!result || typeof result !== "object") return "";
  const record = result as { skipped?: boolean; error?: unknown };

  if (!record.error) return "";
  if (record.error instanceof Error) return record.error.message;
  if (typeof record.error === "object" && record.error && "message" in record.error) {
    return String((record.error as { message?: unknown }).message || "Email provider returned an error.");
  }
  return String(record.error);
}

function assertEmailDelivered(result: unknown, skippedMessage: string, fallbackErrorMessage: string) {
  const record = result && typeof result === "object" ? (result as { skipped?: boolean; error?: unknown }) : null;
  if (record?.skipped) throw new Error(skippedMessage);

  const providerError = getEmailResultError(result);
  if (providerError) throw new Error(providerError || fallbackErrorMessage);
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
        const serviceId = getString(invoice.metadata?.serviceId) || getString(existingData.service) || "commercial-reset";
        const isLaundryFinalInvoice = paymentType === "laundry_final_balance" || serviceId === "laundry-rescue";
        const isFamilyInvoice = paymentType === "family_invoice";
        const servicePeriodLabel =
          getString(invoice.metadata?.servicePeriodLabel) ||
          getString(existingData.familyInvoiceServicePeriodLabel) ||
          getString(existingData.commercialInvoiceServicePeriodLabel) ||
          getString(existingData.checkoutServicePeriodLabel);
        const zeroDollarPrefix = isLaundryFinalInvoice ? "laundryFinalInvoice" : isFamilyInvoice ? "familyInvoice" : "commercialInvoice";

        // Stripe marks $0 finalized invoices as paid immediately. Ignore those so a draft/test
        // invoice mistake does not mark a real NestHelper request as paid or email the customer.
        if ((invoice.amount_paid ?? 0) <= 0) {
          await requestRef.update({
            [`${zeroDollarPrefix}ZeroDollarPaidEventIgnored`]: true,
            [`${zeroDollarPrefix}ZeroDollarPaidEventIgnoredAt`]: FieldValue.serverTimestamp(),
            [`${zeroDollarPrefix}ZeroDollarPaidEventInvoiceId`]: invoice.id,
            [`${zeroDollarPrefix}ZeroDollarPaidEventAmountPaid`]: invoice.amount_paid ?? null,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: "stripe-webhook",
          });
          return NextResponse.json({ received: true, ignored: "zero-dollar-invoice-paid" });
        }

        if (isLaundryFinalInvoice) {
          const serviceTitle = "Laundry Rescue final balance";
          const paymentStatus = "Final Balance Paid";

          await requestRef.update({
            status: "Fully Paid",
            paymentStatus,
            laundryPaymentStatus: paymentStatus,
            laundryFinalInvoiceStatus: "Paid",
            laundryFinalInvoiceId: invoice.id,
            laundryFinalInvoicePaidAt: FieldValue.serverTimestamp(),
            laundryFinalInvoiceAmountPaid: invoice.amount_paid ?? null,
            laundryFinalInvoiceAmountDue: invoice.amount_due ?? null,
            laundryFinalInvoiceHostedUrl: invoice.hosted_invoice_url || existingData.laundryFinalInvoiceUrl || existingData.laundryFinalCheckoutUrl || "",
            laundryFinalInvoiceUrl: invoice.hosted_invoice_url || existingData.laundryFinalInvoiceUrl || existingData.laundryFinalCheckoutUrl || "",
            laundryFinalInvoicePdf: invoice.invoice_pdf || existingData.laundryFinalInvoicePdf || "",
            laundryFinalBalancePaidAt: FieldValue.serverTimestamp(),
            laundryFinalBalancePaidAmountTotal: invoice.amount_paid ?? null,
            stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : "",
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: "stripe-webhook",
          });

          const email = getString(existingData.email);
          const customerName = getString(existingData.fullName) || getString(existingData.contactName);

          if (email && !existingData.laundryFinalInvoiceConfirmationEmailSent) {
            try {
              const result = await sendPaymentReceivedEmail({
                to: email,
                customerName,
                requestId,
                serviceTitle,
                amountTotal: invoice.amount_paid,
                currency: invoice.currency,
                paymentStatus,
                replyToEmail: emailAliases.laundry,
              });
              assertEmailDelivered(
                result,
                "Laundry final invoice confirmation email skipped because RESEND_API_KEY or the customer email is missing.",
                "Laundry final invoice confirmation email failed."
              );
              await requestRef.update({
                laundryFinalInvoiceConfirmationEmailSent: true,
                laundryFinalInvoiceConfirmationEmailSentAt: FieldValue.serverTimestamp(),
                laundryFinalInvoiceConfirmationEmailError: "",
              });
            } catch (error) {
              console.error("Laundry final invoice paid confirmation email failed", error);
              await requestRef.update({
                laundryFinalInvoiceConfirmationEmailSent: false,
                laundryFinalInvoiceConfirmationEmailError: "Payment was recorded, but the NestHelper payment confirmation email failed.",
              });
            }
          }

          if (!existingData.laundryFinalInvoiceAdminPaymentEmailSent) {
            try {
              const result = await sendAdminEmail({
                subject: `Stripe Invoice Paid: ${serviceTitle}`,
                title: "Laundry final invoice paid",
                intro: "A customer paid a Laundry Rescue final balance invoice. The request is now marked fully paid in the admin dashboard.",
                adminPath: "/admin/requests",
                to: getPrimaryAdminNotificationRecipients(),
                routeLabel: "Laundry",
                routedToText: getPrimaryAdminNotificationRecipients().join(", "),
                rows: {
                  "Dashboard ID": requestId,
                  Service: serviceTitle,
                  Customer: customerName,
                  Email: email,
                  "Amount paid": formatMoney(invoice.amount_paid, invoice.currency),
                  "Dry weight": getString(existingData.laundryDryWeightLbs) ? `${getString(existingData.laundryDryWeightLbs)} lb` : "",
                  "Deposit credit": existingData.laundryDepositCredit ? `$${existingData.laundryDepositCredit}` : "",
                  Address: buildAddress(existingData),
                  "Stripe invoice": invoice.id,
                },
              });
              assertEmailDelivered(
                result,
                "Laundry final invoice admin alert skipped because RESEND_API_KEY is missing.",
                "Laundry final invoice admin alert failed."
              );
              await requestRef.update({
                laundryFinalInvoiceAdminPaymentEmailSent: true,
                laundryFinalInvoiceAdminPaymentEmailSentAt: FieldValue.serverTimestamp(),
                laundryFinalInvoiceAdminPaymentEmailError: "",
              });
            } catch (error) {
              console.error("Laundry final invoice admin alert failed", error);
              await requestRef.update({ laundryFinalInvoiceAdminPaymentEmailError: "Invoice was recorded, but the admin alert failed." });
            }
          }
        } else if (isFamilyInvoice) {
          const serviceTitle = getServiceTitle(existingData, "NestHelper family invoice");
          const paymentStatus = "Invoice Paid";

          await requestRef.update({
            status: "Invoice Paid",
            paymentStatus,
            familyInvoiceStatus: paymentStatus,
            familyInvoiceId: invoice.id,
            familyInvoicePaidAt: FieldValue.serverTimestamp(),
            familyInvoiceAmountPaid: invoice.amount_paid ?? null,
            familyInvoiceAmountDue: invoice.amount_due ?? null,
            familyInvoiceHostedUrl: invoice.hosted_invoice_url || existingData.familyInvoiceUrl || "",
            familyInvoiceUrl: invoice.hosted_invoice_url || existingData.familyInvoiceUrl || "",
            familyInvoicePdf: invoice.invoice_pdf || existingData.familyInvoicePdf || "",
            familyInvoiceServicePeriodLabel: servicePeriodLabel,
            stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : "",
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: "stripe-webhook",
          });

          const email = getString(existingData.email);
          const customerName = getString(existingData.fullName) || getString(existingData.contactName);

          if (email && !existingData.familyInvoicePaymentConfirmationEmailSent) {
            try {
              const result = await sendPaymentReceivedEmail({
                to: email,
                customerName,
                requestId,
                serviceTitle,
                amountTotal: invoice.amount_paid,
                currency: invoice.currency,
                paymentStatus,
                replyToEmail: serviceId === "laundry-rescue" ? emailAliases.laundry : emailAliases.billing,
                servicePeriodLabel,
              });
              assertEmailDelivered(
                result,
                "Family invoice confirmation email skipped because RESEND_API_KEY or the customer email is missing.",
                "Family invoice confirmation email failed."
              );
              await requestRef.update({
                familyInvoicePaymentConfirmationEmailSent: true,
                familyInvoicePaymentConfirmationEmailSentAt: FieldValue.serverTimestamp(),
                familyInvoicePaymentConfirmationEmailError: "",
              });
            } catch (error) {
              console.error("Family invoice paid confirmation email failed", error);
              await requestRef.update({
                familyInvoicePaymentConfirmationEmailSent: false,
                familyInvoicePaymentConfirmationEmailError: "Payment was recorded, but the NestHelper payment confirmation email failed.",
              });
            }
          }

          if (!existingData.familyInvoiceAdminPaymentEmailSent) {
            try {
              const routedPaymentInbox = getPrimaryAdminNotificationRecipients();
              const routeLabel = serviceId === "laundry-rescue" ? "Laundry" : "Billing";
              const result = await sendAdminEmail({
                subject: `Stripe Invoice Paid: ${serviceTitle}`,
                title: "Family invoice paid — ready to schedule",
                intro: "A customer paid a NestHelper family-service Stripe invoice. The request is now marked Invoice Paid in the admin dashboard.",
                adminPath: "/admin/requests",
                to: routedPaymentInbox,
                routeLabel,
                routedToText: routedPaymentInbox.join(", "),
                rows: {
                  "Dashboard ID": requestId,
                  Service: serviceTitle,
                  Customer: customerName,
                  Email: email,
                  "Amount paid": formatMoney(invoice.amount_paid, invoice.currency),
                  "Service period": servicePeriodLabel,
                  Address: buildAddress(existingData),
                  "Stripe invoice": invoice.id,
                },
              });
              assertEmailDelivered(
                result,
                "Family invoice admin alert skipped because RESEND_API_KEY is missing.",
                "Family invoice admin alert failed."
              );
              await requestRef.update({
                familyInvoiceAdminPaymentEmailSent: true,
                familyInvoiceAdminPaymentEmailSentAt: FieldValue.serverTimestamp(),
                familyInvoiceAdminPaymentEmailError: "",
              });
            } catch (error) {
              console.error("Family invoice admin alert failed", error);
              await requestRef.update({ familyInvoiceAdminPaymentEmailError: "Invoice was recorded, but the admin alert failed." });
            }
          }
        } else {
          const serviceTitle = getServiceTitle(existingData, "Commercial Reset invoice");
          const paymentStatus = "Invoice Paid";

          await requestRef.update({
            status: "Invoice Paid",
            paymentStatus,
            commercialInvoiceStatus: paymentStatus,
            commercialInvoiceId: invoice.id,
            commercialInvoicePaidAt: FieldValue.serverTimestamp(),
            commercialInvoiceAmountPaid: invoice.amount_paid ?? null,
            commercialInvoiceAmountDue: invoice.amount_due ?? null,
            commercialInvoiceHostedUrl: invoice.hosted_invoice_url || existingData.commercialInvoiceUrl || "",
            commercialInvoicePdf: invoice.invoice_pdf || existingData.commercialInvoicePdf || "",
            commercialInvoiceServicePeriodLabel: servicePeriodLabel,
            stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : "",
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: "stripe-webhook",
          });

          const email = getString(existingData.email);
          const customerName = getString(existingData.fullName) || getString(existingData.contactName);

          if (email && !existingData.commercialInvoicePaymentConfirmationEmailSent) {
            try {
              const result = await sendPaymentReceivedEmail({
                to: email,
                customerName,
                requestId,
                serviceTitle,
                amountTotal: invoice.amount_paid,
                currency: invoice.currency,
                paymentStatus,
                replyToEmail: emailAliases.commercial || emailAliases.billing,
                servicePeriodLabel,
              });
              assertEmailDelivered(
                result,
                "Commercial invoice confirmation email skipped because RESEND_API_KEY or the customer email is missing.",
                "Commercial invoice confirmation email failed."
              );
              await requestRef.update({
                commercialInvoicePaymentConfirmationEmailSent: true,
                commercialInvoicePaymentConfirmationEmailSentAt: FieldValue.serverTimestamp(),
                commercialInvoicePaymentConfirmationEmailError: "",
              });
            } catch (error) {
              console.error("Commercial invoice paid confirmation email failed", error);
              await requestRef.update({
                commercialInvoicePaymentConfirmationEmailSent: false,
                commercialInvoicePaymentConfirmationEmailError: "Payment was recorded, but the NestHelper payment confirmation email failed.",
              });
            }
          }

          if (!existingData.commercialInvoiceAdminPaymentEmailSent) {
            try {
              const routedPaymentInbox = getPrimaryAdminNotificationRecipients();
              const result = await sendAdminEmail({
                subject: `Stripe Invoice Paid: ${serviceTitle}`,
                title: "Commercial invoice paid — ready to schedule",
                intro: "A customer paid a Commercial Reset Stripe invoice. The request is now marked Invoice Paid in the admin dashboard.",
                adminPath: "/admin/requests",
                to: routedPaymentInbox,
                routeLabel: "Commercial",
                routedToText: routedPaymentInbox.join(", "),
                rows: {
                  "Dashboard ID": requestId,
                  Service: serviceTitle,
                  Customer: customerName,
                  Email: email,
                  "Amount paid": formatMoney(invoice.amount_paid, invoice.currency),
                  "Service period": servicePeriodLabel,
                  Address: buildAddress(existingData),
                  "Stripe invoice": invoice.id,
                },
              });
              assertEmailDelivered(
                result,
                "Commercial invoice admin alert skipped because RESEND_API_KEY is missing.",
                "Commercial invoice admin alert failed."
              );
              await requestRef.update({
                commercialInvoiceAdminPaymentEmailSent: true,
                commercialInvoiceAdminPaymentEmailSentAt: FieldValue.serverTimestamp(),
                commercialInvoiceAdminPaymentEmailError: "",
              });
            } catch (error) {
              console.error("Commercial invoice admin alert failed", error);
              await requestRef.update({ commercialInvoiceAdminPaymentEmailError: "Invoice was recorded, but the admin alert failed." });
            }
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
        const checkoutServicePeriodLabel = getString(session.metadata?.servicePeriodLabel) || getString(existingData.checkoutServicePeriodLabel) || getString(existingData.familyInvoiceServicePeriodLabel) || getString(existingData.commercialInvoiceServicePeriodLabel);
        const isLaundryDeposit = serviceId === "laundry-rescue" && !isLaundryFinalBalance && !isAdditionalPayment;
        const laundryFinalPreference = isLaundryDeposit ? normalizeLaundryFinalPreference(getCheckoutCustomFieldValue(session, "laundry_final_payment_preference")) : "";
        const laundryAutoChargeAuthorized = laundryFinalPreference === "auto_charge";
        const status = isAdditionalPayment ? "Additional Paid" : isLaundryFinalBalance ? "Fully Paid" : isLaundryDeposit ? "Deposit Paid - Final Pending" : "Paid";
        const paymentStatus = isAdditionalPayment ? "Additional Paid" : isLaundryFinalBalance ? "Final Balance Paid" : isLaundryDeposit ? "Deposit Paid - Final Pending" : "Paid";

        const updatePayload: Record<string, unknown> = {
          status,
          paymentStatus,
          amountSubtotal: session.amount_subtotal ?? null,
          amountTotal: session.amount_total ?? null,
          currency: session.currency || "usd",
          checkoutServicePeriodLabel,
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
          updatePayload.laundryPaymentStatus = "Deposit Paid - Final Pending";
          updatePayload.laundryDepositStatus = "Deposit Paid";
          updatePayload.depositPaidAmountTotal = session.amount_total ?? null;
          updatePayload.depositPaidAmountSubtotal = session.amount_subtotal ?? null;
          updatePayload.depositPaidAt = FieldValue.serverTimestamp();
          updatePayload.laundryDepositAmountTotal = session.amount_total ?? null;
          updatePayload.laundryDepositAmountSubtotal = session.amount_subtotal ?? null;
          updatePayload.laundryDepositTaxAmount = Math.max(0, (session.amount_total ?? 0) - (session.amount_subtotal ?? 0));
          updatePayload.laundryDepositPaidAt = FieldValue.serverTimestamp();
          updatePayload.laundryDepositNonRefundable = true;
          updatePayload.laundryFinalPaymentPreference = laundryFinalPreference;
          updatePayload.laundryFinalPaymentPreferenceLabel = getLaundryFinalPreferenceLabel(laundryFinalPreference);
          updatePayload.laundryAutoChargeAuthorized = laundryAutoChargeAuthorized;
          updatePayload.laundryFinalPaymentCollectionMethod = laundryAutoChargeAuthorized ? "auto_charge" : "send_invoice";
          updatePayload.laundryFinalPaymentPreferenceCapturedAt = FieldValue.serverTimestamp();
          updatePayload.laundryDepositStripeCustomerId = typeof session.customer === "string" ? session.customer : "";
        }

        if (isLaundryDeposit && laundryAutoChargeAuthorized && typeof session.customer === "string" && typeof session.payment_intent === "string") {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
            const paymentMethodId = typeof paymentIntent.payment_method === "string" ? paymentIntent.payment_method : "";

            if (paymentMethodId) {
              await stripe.customers.update(session.customer, {
                invoice_settings: { default_payment_method: paymentMethodId },
                metadata: {
                  requestId,
                  serviceId: "laundry-rescue",
                  laundryAutoChargeAuthorized: "true",
                  laundryFinalPaymentPreference: laundryFinalPreference,
                },
              });

              updatePayload.laundryAutoChargeReady = true;
              updatePayload.laundryAutoChargePaymentMethodSaved = true;
              updatePayload.laundryAutoChargePaymentMethodId = paymentMethodId;
            } else {
              updatePayload.laundryAutoChargeReady = false;
              updatePayload.laundryAutoChargePaymentMethodSaved = false;
              updatePayload.laundryAutoChargeError = "Customer chose auto-charge, but Stripe did not return a reusable payment method.";
            }
          } catch (error) {
            console.error("Unable to save laundry auto-charge payment method", error);
            updatePayload.laundryAutoChargeReady = false;
            updatePayload.laundryAutoChargePaymentMethodSaved = false;
            updatePayload.laundryAutoChargeError = "Customer chose auto-charge, but NestHelper could not save the Stripe payment method for the final invoice.";
          }
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
            const result = await sendPaymentReceivedEmail({
              to: email,
              customerName,
              requestId,
              serviceTitle,
              amountTotal: session.amount_total,
              currency: session.currency,
              paymentStatus,
              replyToEmail: serviceId === "laundry-rescue" ? emailAliases.laundry : emailAliases.billing,
              servicePeriodLabel: checkoutServicePeriodLabel,
            });
            assertEmailDelivered(
              result,
              "Payment confirmation email skipped because RESEND_API_KEY or the customer email is missing.",
              "Payment confirmation email failed."
            );

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
            const routedPaymentInbox = getPrimaryAdminNotificationRecipients();
            const routedPaymentLabel = serviceId === "laundry-rescue" ? "Laundry" : "Billing";

            const result = await sendAdminEmail({
              subject: `Stripe Payment Received: ${serviceTitle}`,
              title: isLaundryDeposit ? "Laundry deposit paid — final balance still pending" : "Payment received — ready to schedule",
              intro: isLaundryDeposit
                ? "A customer paid the non-refundable Laundry Rescue deposit/minimum. The request is not fully paid yet; dry weight/add-ons still need a final balance before delivery."
                : "A customer completed Stripe checkout. The request is now marked paid in the admin dashboard and is ready for scheduling follow-up.",
              adminPath: "/admin/requests",
              to: routedPaymentInbox,
              routeLabel: routedPaymentLabel,
              routedToText: routedPaymentInbox.join(", "),
              rows: {
                "Dashboard ID": requestId,
                Customer: customerName,
                Email: email,
                Phone: getString(existingData.phone) || getString(session.customer_details?.phone) || getString(session.metadata?.customerPhone),
                Service: serviceTitle,
                "Payment type": adminAlert.paymentLabel,
                "Payment status": paymentStatus,
                "Laundry final preference": isLaundryDeposit ? getLaundryFinalPreferenceLabel(laundryFinalPreference) : "",
                "Auto-charge saved": isLaundryDeposit ? (laundryAutoChargeAuthorized ? "Yes — hide manual final invoice sender unless auto-charge fails" : "No — send final invoice before delivery") : "",
                "Tax collected": formatMoney(Math.max(0, (session.amount_total ?? 0) - (session.amount_subtotal ?? 0)), session.currency),
                "Additional reason": getString(session.metadata?.additionalReason),
                "Additional note": getString(session.metadata?.additionalNote),
                "Service period": checkoutServicePeriodLabel,
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

            assertEmailDelivered(
              result,
              "Admin payment alert skipped because RESEND_API_KEY is missing.",
              "Admin payment notification email failed."
            );

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
