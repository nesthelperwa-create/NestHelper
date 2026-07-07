import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import Stripe from "stripe";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { sendLaundryFinalBalanceEmail } from "@/lib/sendLaundryFinalBalanceEmail";
import { getManualSalesTaxFirestoreFields, getManualSalesTaxMetadata, getOrCreateManualSalesTaxRate, manualTaxRatesParam, resolveManualSalesTaxConfig } from "@/lib/stripeManualTax";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const laundryProductTaxCode = (process.env.STRIPE_LAUNDRY_TAX_CODE || process.env.STRIPE_PRODUCT_TAX_CODE || process.env.STRIPE_TAX_CODE || "txcd_20090012").trim();
const laundryIntroMinimum = 59;
const laundryDefaultAdditionalRatePerLb = 2.25;
const laundryDisplayIncludedLbs = 26.2;

type LaundryFinalBalanceBody = {
  requestId?: string;
  dryWeightLbs?: number;
  ratePerLb?: number;
  addOnsAmount?: number;
  depositCredit?: number;
  finalBalanceNote?: string;
  sendEmail?: boolean;
  manualSalesTax?: boolean | string;
  manualSalesTaxRate?: number | string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function moneyToCents(value: number) {
  return Math.round(Math.max(0, value) * 100);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2).replace(/\.?0+$/, "") : "0";
}

function getAddress(data: Record<string, unknown>): Stripe.AddressParam | undefined {
  const line1 = getString(data.serviceAddress) || getString(data.address) || getString(data.streetAddress);
  const city = getString(data.city);
  const state = getString(data.state) || "WA";
  const postal_code = getString(data.zip) || getString(data.zipCode) || getString(data.postalCode);

  if (!line1 && !city && !postal_code) return undefined;
  return {
    line1: line1 || undefined,
    city: city || undefined,
    state: state || undefined,
    postal_code: postal_code || undefined,
    country: "US",
  };
}

function getDepositCreditFromRecord(data: Record<string, unknown>, providedDepositCredit: number) {
  if (providedDepositCredit > 0) return providedDepositCredit;

  const subtotalCents = cleanNumber(data.laundryDepositAmountSubtotal) || cleanNumber(data.depositPaidAmountSubtotal);
  if (subtotalCents > 0) return subtotalCents / 100;

  const candidateCents = [
    cleanNumber(data.laundryDepositCreditCents),
    cleanNumber(data.laundryDepositExpectedAmountCents),
  ].find((value) => value > 0);

  if (candidateCents) return candidateCents / 100;

  const amountTotal = cleanNumber(data.amountSubtotal) || cleanNumber(data.amountTotal);
  const paymentStatus = getString(data.paymentStatus || data.laundryPaymentStatus || data.status);
  if (amountTotal > 0 && ["Paid", "Deposit Paid", "Deposit Paid - Final Pending"].includes(paymentStatus)) return amountTotal / 100;

  return laundryIntroMinimum;
}

function getLaundryDepositTaxCollectedCents(data: Record<string, unknown>) {
  const directCandidates = [
    cleanNumber(data.laundryDepositTaxAmount),
    cleanNumber(data.depositPaidTaxAmount),
    cleanNumber(data.laundryDepositSalesTaxCents),
    cleanNumber(data.depositSalesTaxCents),
  ].filter((value) => value > 0);

  if (directCandidates.length) return Math.round(directCandidates[0]);

  const totalSubtotalPairs = [
    [cleanNumber(data.laundryDepositAmountTotal), cleanNumber(data.laundryDepositAmountSubtotal)],
    [cleanNumber(data.depositPaidAmountTotal), cleanNumber(data.depositPaidAmountSubtotal)],
    [cleanNumber(data.amountTotal), cleanNumber(data.amountSubtotal)],
  ];

  const paymentStatus = getString(data.paymentStatus || data.laundryPaymentStatus || data.status);
  const paidEnoughToTrust = ["Paid", "Deposit Paid", "Deposit Paid - Final Pending", "Final Invoice Sent", "Final Invoice Created", "Final Balance Paid"].includes(paymentStatus);

  for (const [total, subtotal] of totalSubtotalPairs) {
    const diff = Math.round(total - subtotal);
    if (paidEnoughToTrust && total > 0 && subtotal > 0 && diff > 0) return diff;
  }

  return 0;
}

function getLaundryDepositTaxCatchUp({
  manualSalesTaxEnabled,
  manualSalesTaxRate,
  depositCredit,
  depositTaxCollectedCents,
}: {
  manualSalesTaxEnabled: boolean;
  manualSalesTaxRate: number;
  depositCredit: number;
  depositTaxCollectedCents: number;
}) {
  if (!manualSalesTaxEnabled || manualSalesTaxRate <= 0 || depositCredit <= 0 || depositTaxCollectedCents > 0) {
    return { required: false, amountCents: 0, taxableBaseCents: 0 };
  }

  const taxableBaseCents = moneyToCents(depositCredit);
  return {
    required: true,
    amountCents: Math.round(taxableBaseCents * (manualSalesTaxRate / 100)),
    taxableBaseCents,
  };
}

function shouldAutoChargeFinalBalance(data: Record<string, unknown>) {
  return Boolean(data.laundryAutoChargeAuthorized) && getString(data.laundryFinalPaymentCollectionMethod) === "auto_charge";
}

function getInvoiceTaxAmount(invoice: Stripe.Invoice) {
  const totalTaxes = Array.isArray(invoice.total_taxes)
    ? (invoice.total_taxes as Array<{ amount?: number | null }>).reduce((sum: number, item) => sum + cleanNumber(item.amount), 0)
    : 0;
  if (totalTaxes > 0) return totalTaxes;

  const totalDiscounts = Array.isArray(invoice.total_discount_amounts)
    ? (invoice.total_discount_amounts as Array<{ amount?: number | null }>).reduce((sum: number, item) => sum + cleanNumber(item.amount), 0)
    : 0;
  return Math.max(0, cleanNumber(invoice.total) - Math.max(0, cleanNumber(invoice.subtotal) - totalDiscounts));
}

async function getOrCreateStripeCustomer(data: Record<string, unknown>, requestId: string, fullName: string, email: string) {
  if (!stripe) throw new Error("Stripe is not configured.");

  const existingCustomerId = getString(data.laundryDepositStripeCustomerId) || getString(data.stripeCustomerId) || getString(data.laundryFinalInvoiceCustomerId);
  const customerParams: Stripe.CustomerCreateParams = {
    email,
    name: fullName,
    phone: getString(data.phone) || undefined,
    address: getAddress(data),
    metadata: { requestId, serviceId: "laundry-rescue" },
  };

  if (existingCustomerId) {
    await stripe.customers.update(existingCustomerId, customerParams as Stripe.CustomerUpdateParams);
    return existingCustomerId;
  }

  const customer = await stripe.customers.create(customerParams);
  return customer.id;
}


export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    if (!stripe) {
      return NextResponse.json({ ok: false, error: "Stripe is not configured. Add STRIPE_SECRET_KEY in Vercel." }, { status: 500 });
    }

    const body = (await request.json().catch(() => null)) as LaundryFinalBalanceBody | null;
    const requestId = getString(body?.requestId);
    const dryWeightLbs = cleanNumber(body?.dryWeightLbs);
    const ratePerLb = cleanNumber(body?.ratePerLb) || laundryDefaultAdditionalRatePerLb;
    const addOnsAmount = Math.max(0, cleanNumber(body?.addOnsAmount));
    const finalBalanceNote = getString(body?.finalBalanceNote);
    const shouldSendEmail = body?.sendEmail !== false;
    const manualSalesTax = resolveManualSalesTaxConfig({ enabled: body?.manualSalesTax, rate: body?.manualSalesTaxRate });

    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });
    if (dryWeightLbs <= 0) return NextResponse.json({ ok: false, error: "Enter the dry weight before creating a final balance invoice." }, { status: 400 });
    if (ratePerLb <= 0) return NextResponse.json({ ok: false, error: "Enter a valid per-pound rate." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });

    const data = requestSnap.data() || {};
    const serviceId = getString(data.service);

    if (serviceId !== "laundry-rescue") {
      return NextResponse.json({ ok: false, error: "Final balance invoice is only for Laundry Rescue requests." }, { status: 400 });
    }

    const email = getString(data.email);
    if (!email) return NextResponse.json({ ok: false, error: "Customer email is missing." }, { status: 400 });

    const fullName = getString(data.fullName) || "NestHelper customer";
    const city = getString(data.city);
    const preferredDate = getString(data.preferredDate);
    const preferredWindow = getString(data.preferredWindow);
    const depositCredit = getDepositCreditFromRecord(data, cleanNumber(body?.depositCredit));
    const depositTaxCollectedCents = getLaundryDepositTaxCollectedCents(data);
    const depositTaxCatchUp = getLaundryDepositTaxCatchUp({
      manualSalesTaxEnabled: manualSalesTax.enabled,
      manualSalesTaxRate: manualSalesTax.rate,
      depositCredit,
      depositTaxCollectedCents,
    });
    const includedWeightLbs = ratePerLb > 0 ? Math.max(laundryDisplayIncludedLbs, depositCredit / ratePerLb) : laundryDisplayIncludedLbs;
    const additionalWeightLbs = Math.max(0, dryWeightLbs - includedWeightLbs);
    const laundryBaseAmount = additionalWeightLbs * ratePerLb;
    const laundrySubtotal = laundryBaseAmount + addOnsAmount;
    const depositTaxCatchUpAmount = depositTaxCatchUp.amountCents / 100;
    const balanceDue = Math.max(0, laundrySubtotal + depositTaxCatchUpAmount);
    const balanceDueCents = moneyToCents(balanceDue);
    const autoCharge = shouldAutoChargeFinalBalance(data);
    const savedPaymentMethodId = getString(data.laundryAutoChargePaymentMethodId);

    const updateBase = {
      laundryDryWeightLbs: Number(dryWeightLbs.toFixed(2)),
      laundryIncludedWeightLbs: Number(includedWeightLbs.toFixed(2)),
      laundryAdditionalWeightLbs: Number(additionalWeightLbs.toFixed(2)),
      laundryRatePerLb: Number(ratePerLb.toFixed(2)),
      laundryBaseAmount: Number(laundryBaseAmount.toFixed(2)),
      laundryAdditionalWeightAmount: Number(laundryBaseAmount.toFixed(2)),
      laundryBaseAmountCents: moneyToCents(laundryBaseAmount),
      laundryAddOnsAmount: Number(addOnsAmount.toFixed(2)),
      laundryAddOnsAmountCents: moneyToCents(addOnsAmount),
      laundryDepositCredit: Number(depositCredit.toFixed(2)),
      laundryDepositCreditCents: moneyToCents(depositCredit),
      laundrySubtotal: Number(laundrySubtotal.toFixed(2)),
      laundrySubtotalCents: moneyToCents(laundrySubtotal),
      laundryDepositTaxCollectedCents: depositTaxCollectedCents,
      laundryDepositTaxCollectedAmount: Number((depositTaxCollectedCents / 100).toFixed(2)),
      laundryDepositTaxAlreadyCollected: depositTaxCollectedCents > 0,
      laundryDepositTaxCatchUpRequired: depositTaxCatchUp.required,
      laundryDepositTaxCatchUpTaxableBaseCents: depositTaxCatchUp.taxableBaseCents,
      laundryDepositTaxCatchUpTaxableBaseAmount: Number((depositTaxCatchUp.taxableBaseCents / 100).toFixed(2)),
      laundryDepositTaxCatchUpCents: depositTaxCatchUp.amountCents,
      laundryDepositTaxCatchUpAmount: Number(depositTaxCatchUpAmount.toFixed(2)),
      laundryBalanceDue: Number(balanceDue.toFixed(2)),
      laundryBalanceDueCents: balanceDueCents,
      laundryFinalBalanceNote: finalBalanceNote,
      laundryFinalBalanceTaxMode: manualSalesTax.enabled
        ? depositTaxCatchUp.required
          ? "Manual sales tax on final balance plus one-time intro minimum tax catch-up"
          : depositTaxCollectedCents > 0
            ? "Manual sales tax on final balance; intro minimum tax already collected"
            : "Manual sales tax on final balance"
        : "No sales tax applied",
      ...getManualSalesTaxFirestoreFields(manualSalesTax),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    if (balanceDueCents <= 0) {
      await requestRef.update({
        ...updateBase,
        status: "Fully Paid",
        paymentStatus: "Final Balance Paid",
        laundryPaymentStatus: "Final Balance Paid",
        laundryFinalBalanceCreatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ ok: true, noBalanceDue: true, message: "No final balance is due. Request marked fully paid." });
    }

    if (autoCharge && !savedPaymentMethodId) {
      await requestRef.update({
        ...updateBase,
        laundryAutoChargeReady: false,
        laundryAutoChargeError: "Customer chose auto-charge, but no saved Stripe payment method is available. Send a final invoice instead or have the customer re-authorize payment.",
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Customer chose auto-charge, but no saved Stripe payment method is available. Send a final invoice instead or have the customer re-authorize payment.",
        },
        { status: 400 }
      );
    }

    const customerId = await getOrCreateStripeCustomer(data, requestId, fullName, email);
    const manualSalesTaxRateId = await getOrCreateManualSalesTaxRate(stripe, manualSalesTax, { requestId, serviceId: "laundry-rescue", paymentType: "laundry_final_balance" });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const collectionMethod: "charge_automatically" | "send_invoice" = autoCharge ? "charge_automatically" : "send_invoice";
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: collectionMethod,
      ...(autoCharge ? { default_payment_method: savedPaymentMethodId } : { days_until_due: 7 }),
      automatic_tax: { enabled: false },
      auto_advance: false,
      description: autoCharge ? "Laundry Rescue final balance — auto-charge authorized" : "Laundry Rescue final balance",
      footer: autoCharge
        ? "This invoice reflects the final Laundry Rescue balance for additional laundry above the included minimum weight, plus selected add-ons or bulky items. The $59 minimum was already paid and includes pickup, wash, dry, fold, return, and up to about 26.2 lbs. The customer authorized NestHelper to charge the saved payment method for this final balance."
        : "This invoice reflects the final Laundry Rescue balance for additional laundry above the included minimum weight, plus selected add-ons or bulky items. The $59 minimum was already paid and includes pickup, wash, dry, fold, return, and up to about 26.2 lbs. Laundry is held until the final balance is fully paid.",
      custom_fields: [
        { name: "Dry weight", value: `${formatNumber(dryWeightLbs)} lb` },
        { name: "Included in minimum", value: `Up to about ${formatNumber(laundryDisplayIncludedLbs)} lb` },
        { name: "Additional weight", value: `${formatNumber(additionalWeightLbs)} lb` },
        { name: "Additional rate", value: `${formatMoney(ratePerLb)} / lb` },
        { name: "Minimum already paid", value: formatMoney(depositCredit) },
        {
          name: "Intro tax status",
          value: manualSalesTax.enabled
            ? depositTaxCatchUp.required
              ? `Catch-up: ${formatMoney(depositTaxCatchUpAmount)}`
              : depositTaxCollectedCents > 0
                ? "Already collected"
                : "No catch-up needed"
            : "Not applied",
        },
        { name: "Final collection", value: autoCharge ? "Auto-charge authorized" : "Invoice before delivery" },
      ],
      metadata: {
        requestId,
        serviceId: "laundry-rescue",
        serviceTitle: "Laundry Rescue final balance",
        paymentType: "laundry_final_balance",
        collectionMethod: autoCharge ? "auto_charge" : "send_invoice",
        dryWeightLbs: String(Number(dryWeightLbs.toFixed(2))),
        includedWeightLbs: String(Number(includedWeightLbs.toFixed(2))),
        additionalWeightLbs: String(Number(additionalWeightLbs.toFixed(2))),
        ratePerLb: String(Number(ratePerLb.toFixed(2))),
        addOnsAmount: String(Number(addOnsAmount.toFixed(2))),
        depositCredit: String(Number(depositCredit.toFixed(2))),
        depositTaxCollectedCents: String(depositTaxCollectedCents),
        depositTaxCatchUpRequired: depositTaxCatchUp.required ? "true" : "false",
        depositTaxCatchUpAmount: String(Number(depositTaxCatchUpAmount.toFixed(2))),
        balanceDue: String(Number(balanceDue.toFixed(2))),
        siteUrl,
        taxHandling: manualSalesTax.enabled ? "manual_sales_tax" : "no_sales_tax",
        ...getManualSalesTaxMetadata(manualSalesTax, manualSalesTaxRateId),
      },
    });

    if (moneyToCents(laundryBaseAmount) > 0) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        currency: "usd",
        amount: moneyToCents(laundryBaseAmount),
        tax_behavior: "exclusive",
        tax_code: laundryProductTaxCode,
        description: [
          "Laundry Rescue additional laundry above the included intro minimum",
          `Included minimum: ${formatMoney(depositCredit)} covers pickup, wash, dry, fold, return, and up to about ${formatNumber(laundryDisplayIncludedLbs)} lb`,
          `Additional laundry: ${formatNumber(additionalWeightLbs)} lb × ${formatMoney(ratePerLb)} per lb`,
        ].join("\n"),
        metadata: { requestId, serviceId: "laundry-rescue", lineType: "additional_weight", taxMode: manualSalesTax.enabled ? "manual_sales_tax" : "no_sales_tax" },
        ...manualTaxRatesParam(manualSalesTaxRateId),
      } as any);
    }

    if (addOnsAmount > 0) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        currency: "usd",
        amount: moneyToCents(addOnsAmount),
        tax_behavior: "exclusive",
        tax_code: laundryProductTaxCode,
        description: [
          "Laundry add-ons / bulky items / approved extra work",
          "Includes approved items such as bulky pieces, rush changes, special handling, extra sorting, stain attention, or other reviewed laundry extras.",
          finalBalanceNote ? `Admin note: ${finalBalanceNote}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        metadata: { requestId, serviceId: "laundry-rescue", lineType: "add_ons", taxMode: manualSalesTax.enabled ? "manual_sales_tax" : "no_sales_tax" },
        ...manualTaxRatesParam(manualSalesTaxRateId),
      } as any);
    }

    if (depositTaxCatchUp.amountCents > 0) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        currency: "usd",
        amount: depositTaxCatchUp.amountCents,
        description: [
          "Sales tax catch-up on previously paid Laundry Rescue intro minimum",
          `Taxable minimum already paid: ${formatMoney(depositCredit)}`,
          `Manual tax rate: ${formatNumber(manualSalesTax.rate)}%`,
          "This line charges only the missed tax amount so the $59 minimum is not charged twice.",
        ].join("\n"),
        metadata: {
          requestId,
          serviceId: "laundry-rescue",
          lineType: "intro_minimum_tax_catch_up",
          taxableBaseCents: String(depositTaxCatchUp.taxableBaseCents),
          taxRatePercent: String(Number(manualSalesTax.rate.toFixed(4))),
          taxMode: "tax_only_catch_up_no_double_tax",
        },
      } as any);
    }

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
    const hostedInvoiceUrl = finalized.hosted_invoice_url || "";
    const invoicePdf = finalized.invoice_pdf || "";

    if ((finalized.amount_due ?? 0) <= 0) {
      await requestRef.update({
        ...updateBase,
        laundryFinalInvoiceId: finalized.id,
        laundryFinalInvoiceNumber: finalized.number || "",
        laundryFinalInvoiceUrl: hostedInvoiceUrl,
        laundryFinalInvoicePdf: invoicePdf,
        laundryFinalInvoiceAmountDue: finalized.amount_due ?? null,
        laundryFinalInvoiceEmailWarning:
          "Stripe finalized this laundry final balance invoice at $0.00, so NestHelper did not email or auto-charge it. Review the weight, included minimum, add-ons, and final-balance calculation before trying again.",
        laundryFinalBalanceCreatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Stripe finalized the laundry final balance invoice at $0.00. The invoice was not emailed or auto-charged. Review the dry weight, included weight, add-ons, and final-balance calculation and try again.",
        },
        { status: 500 }
      );
    }

    if (!hostedInvoiceUrl && !autoCharge) {
      return NextResponse.json(
        { ok: false, error: "Stripe created the laundry final balance invoice, but no hosted invoice link was returned." },
        { status: 500 }
      );
    }

    let paidInvoice: Stripe.Invoice | null = null;

    if (autoCharge) {
      try {
        paidInvoice = await stripe.invoices.pay(finalized.id, { payment_method: savedPaymentMethodId });
      } catch (error: any) {
        console.error("Laundry final auto-charge failed", error);
        await requestRef.update({
          ...updateBase,
          status: "Final Auto-Charge Failed",
          paymentStatus: "Final Auto-Charge Failed",
          laundryPaymentStatus: "Final Auto-Charge Failed",
          laundryFinalInvoiceId: finalized.id,
          laundryFinalInvoiceNumber: finalized.number || "",
          laundryFinalInvoiceUrl: hostedInvoiceUrl,
          laundryFinalInvoicePdf: invoicePdf,
          laundryFinalInvoiceAmountDue: finalized.amount_due ?? null,
          laundryFinalInvoiceCollectionMethod: "auto_charge",
          laundryAutoChargeAttemptedAt: FieldValue.serverTimestamp(),
          laundryAutoChargeError: error?.message || "Stripe could not auto-charge the saved payment method.",
          laundryFinalBalanceCreatedAt: FieldValue.serverTimestamp(),
          laundryFinalBalanceCreatedBy: decoded.email || "admin",
      laundryFinalInvoiceTaxMode: manualSalesTax.enabled ? "Manual sales tax" : "No sales tax",
      ...getManualSalesTaxFirestoreFields(manualSalesTax, manualSalesTaxRateId),
          laundryFinalCheckoutUrl: hostedInvoiceUrl,
          laundryFinalCheckoutSessionId: "",
        });

        return NextResponse.json(
          {
            ok: false,
            error: error?.message || "Stripe could not auto-charge the saved payment method. Use the invoice link or have the customer update payment.",
            invoiceId: finalized.id,
            invoiceUrl: hostedInvoiceUrl,
            invoicePdf,
          },
          { status: 500 }
        );
      }
    }

    let emailSent = false;
    let emailError = "";

    if (!autoCharge && shouldSendEmail && email && hostedInvoiceUrl) {
      try {
        const result = (await sendLaundryFinalBalanceEmail({
          to: email,
          customerName: fullName,
          requestId,
          invoiceUrl: hostedInvoiceUrl,
          invoicePdf,
          invoiceNumber: finalized.number || undefined,
          dryWeightLbs,
          includedWeightLbs,
          additionalWeightLbs,
          ratePerLb,
          addOnsAmount,
          depositCredit,
          balanceDue: (finalized.amount_due ?? balanceDueCents) / 100,
          note: [
            finalBalanceNote,
            depositTaxCatchUp.required ? `Includes ${formatMoney(depositTaxCatchUpAmount)} sales tax catch-up for the previously paid Laundry Rescue intro minimum. The $59 minimum itself is not being charged again.` : "",
          ].filter(Boolean).join("\n"),
          preferredDate,
          preferredWindow,
          city,
        })) as any;

        if (result?.skipped) {
          emailError = "Final balance invoice was created, but the NestHelper email was skipped. Copy and send the invoice link manually.";
        } else if (result?.error) {
          emailError = result.error?.message || "Final balance invoice was created, but the NestHelper email failed. Copy and send the invoice link manually.";
        } else {
          emailSent = true;
        }
      } catch (error) {
        console.error("Laundry final balance invoice email failed", error);
        emailError = "Final balance invoice was created, but the email failed. Copy and send the invoice link manually.";
      }
    }

    const autoChargeSucceeded = Boolean(autoCharge && paidInvoice && (paidInvoice.amount_paid ?? 0) > 0 && paidInvoice.status === "paid");
    const nextStatus = autoCharge
      ? autoChargeSucceeded
        ? "Fully Paid"
        : "Final Auto-Charge Processing"
      : shouldSendEmail && emailSent
        ? "Final Invoice Sent"
        : "Final Invoice Created";
    const nextPaymentStatus = autoCharge
      ? autoChargeSucceeded
        ? "Final Balance Paid"
        : "Final Auto-Charge Processing"
      : nextStatus;
    const responseInvoice = paidInvoice || finalized;

    await requestRef.update({
      ...updateBase,
      status: nextStatus,
      paymentStatus: nextPaymentStatus,
      laundryPaymentStatus: nextPaymentStatus,
      laundryFinalInvoiceStatus: responseInvoice.status || (autoChargeSucceeded ? "Paid" : "Open"),
      laundryFinalInvoiceId: responseInvoice.id,
      laundryFinalInvoiceNumber: responseInvoice.number || finalized.number || "",
      laundryFinalInvoiceUrl: responseInvoice.hosted_invoice_url || hostedInvoiceUrl,
      laundryFinalInvoicePdf: responseInvoice.invoice_pdf || invoicePdf,
      laundryFinalInvoiceAmountDue: responseInvoice.amount_due ?? finalized.amount_due ?? null,
      laundryFinalInvoiceAmountPaid: responseInvoice.amount_paid ?? null,
      laundryFinalInvoiceSubtotal: responseInvoice.subtotal ?? null,
      laundryFinalInvoiceTotal: responseInvoice.total ?? null,
      laundryFinalInvoiceTaxAmount: getInvoiceTaxAmount(responseInvoice),
      laundryFinalInvoiceCustomerId: customerId,
      laundryFinalInvoiceCollectionMethod: autoCharge ? "auto_charge" : "send_invoice",
      laundryFinalInvoiceEmailSent: !autoCharge && emailSent,
      laundryFinalInvoiceEmailError: emailError,
      laundryFinalInvoiceCreatedAt: FieldValue.serverTimestamp(),
      laundryFinalInvoiceSentAt: !autoCharge && shouldSendEmail && emailSent ? FieldValue.serverTimestamp() : null,
      laundryAutoChargeAttemptedAt: autoCharge ? FieldValue.serverTimestamp() : null,
      laundryAutoChargePaidAt: autoChargeSucceeded ? FieldValue.serverTimestamp() : null,
      laundryAutoChargeError: "",
      laundryFinalBalanceCreatedAt: FieldValue.serverTimestamp(),
      laundryFinalBalanceCreatedBy: decoded.email || "admin",
      laundryFinalInvoiceTaxMode: manualSalesTax.enabled ? "Manual sales tax" : "No sales tax",
      ...getManualSalesTaxFirestoreFields(manualSalesTax, manualSalesTaxRateId),
      // Keep older dashboard fields populated so existing buttons and filters do not break.
      laundryFinalCheckoutUrl: responseInvoice.hosted_invoice_url || hostedInvoiceUrl,
      laundryFinalCheckoutSessionId: "",
    });

    return NextResponse.json({
      ok: true,
      invoiceId: responseInvoice.id,
      invoiceNumber: responseInvoice.number || finalized.number,
      invoiceUrl: responseInvoice.hosted_invoice_url || hostedInvoiceUrl,
      invoicePdf: responseInvoice.invoice_pdf || invoicePdf,
      url: responseInvoice.hosted_invoice_url || hostedInvoiceUrl,
      emailSent,
      emailError,
      autoCharge,
      autoChargeSucceeded,
      balanceDue: (responseInvoice.amount_due ?? finalized.amount_due ?? balanceDueCents) / 100,
      amountPaid: (responseInvoice.amount_paid ?? 0) / 100,
      status: nextStatus,
      paymentStatus: nextPaymentStatus,
      manualSalesTaxEnabled: manualSalesTax.enabled,
      manualSalesTaxRate: manualSalesTax.rate,
      depositTaxAlreadyCollected: depositTaxCollectedCents > 0,
      depositTaxCollectedAmount: depositTaxCollectedCents / 100,
      depositTaxCatchUpAmount,
      depositTaxCatchUpRequired: depositTaxCatchUp.required,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error?.message || "Unable to create laundry final balance invoice." }, { status: 500 });
  }
}
