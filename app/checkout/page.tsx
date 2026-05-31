import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { services } from "@/lib/services";

type SearchParams = Record<string, string | string[] | undefined>;

type CheckoutPageProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

type PaymentType = "service_payment" | "custom_initial" | "laundry_deposit" | "laundry_final_balance" | "additional_payment";

type SuccessContent = {
  eyebrow: string;
  title: string;
  text: string;
  status: string;
  steps: string[];
  note?: string;
  closing: string;
};

function getParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getPaymentType(params: SearchParams): PaymentType {
  const rawType = getParam(params, "payment_type") || getParam(params, "type") || "service_payment";
  if (["service_payment", "custom_initial", "laundry_deposit", "laundry_final_balance", "additional_payment"].includes(rawType)) {
    return rawType as PaymentType;
  }
  return "service_payment";
}

function getServiceId(params: SearchParams) {
  return getParam(params, "service_id") || getParam(params, "service") || "";
}

function getServiceLabel(serviceId: string) {
  if (serviceId === "commercial-reset") return "Commercial Reset";
  return services.find((service) => service.id === serviceId)?.title || "NestHelper";
}

function isFamilyService(serviceId: string) {
  return ["parent-reset-2hr", "family-reset-3hr", "helper-block-4hr", "errand-helper"].includes(serviceId);
}

const baseSuccessContent: Record<PaymentType, SuccessContent> = {
  service_payment: {
    eyebrow: "Payment received",
    title: "Your NestHelper payment was successful.",
    text: "Thanks — your NestHelper payment was received. We’ll confirm timing, access details, and service notes before your visit.",
    status: "Paid ✓",
    steps: [
      "NestHelper confirms the final service window and arrival details.",
      "You receive any prep notes for access, pets, parking, or service-specific details.",
      "Your request is handled by a NestHelper checked helper or approved partner provider.",
    ],
    closing: "You can close this tab. A NestHelper confirmation/follow-up message will come by email, text, or both.",
  },
  custom_initial: {
    eyebrow: "Payment received",
    title: "Your NestHelper payment was successful.",
    text: "Thanks — your reviewed NestHelper payment was received. We’ll use the approved scope and notes to confirm scheduling and next steps.",
    status: "Payment received ✓",
    steps: [
      "NestHelper records the payment with your service request.",
      "We confirm the final service window, approved scope, and any prep notes.",
      "If anything changes before or during the visit, NestHelper will review it with you first.",
    ],
    note: "Reviewed payments are used when the service needs a custom quote, deposit, recurring plan setup, or amount that does not fit a standard package exactly.",
    closing: "You can close this tab. NestHelper will follow up with scheduling or service-specific details.",
  },
  laundry_deposit: {
    eyebrow: "Laundry deposit received",
    title: "Your Laundry Rescue deposit was successful.",
    text: "Thanks — your Laundry Rescue deposit/minimum was received. We’ll confirm pickup details, dry-weigh laundry at pickup, and send a final balance link after weight, deposit credit, and add-ons are reviewed.",
    status: "Deposit paid ✓",
    steps: [
      "NestHelper confirms the pickup window, pickup spot, and laundry notes.",
      "Laundry is dry-weighed at pickup so the total can be calculated clearly.",
      "A final balance invoice/payment link is sent after weight, deposit credit, and approved add-ons are confirmed.",
    ],
    note: "This is not always the final Laundry Rescue total. Dry weight, add-ons, bulky items, rush options, or extra work can change the final balance. If additional approved work is needed after the final balance, NestHelper may send a separate additional invoice/payment link.",
    closing: "You can close this tab. Watch for Laundry Rescue pickup details from NestHelper.",
  },
  laundry_final_balance: {
    eyebrow: "Laundry balance received",
    title: "Your Laundry Rescue balance payment was successful.",
    text: "Thanks — your Laundry Rescue balance payment was received. We’ll continue with the confirmed return or completion details.",
    status: "Balance paid ✓",
    steps: [
      "NestHelper records the laundry balance as paid.",
      "Your clean laundry return or completion details are confirmed based on the service plan.",
      "Reusable NestHelper bags or totes should be returned using the approved return method.",
    ],
    note: "This payment usually covers the balance after dry weight, deposit credit, and approved add-ons were applied. If new extra work or changes are approved after this payment, NestHelper may send a separate additional invoice/payment link.",
    closing: "You can close this tab. NestHelper will follow up with return or completion details if anything else is needed.",
  },
  additional_payment: {
    eyebrow: "Additional payment received",
    title: "Your additional NestHelper payment was successful.",
    text: "Thanks — your add-on, extra time, mileage, or balance payment was received. We’ll apply it to your existing NestHelper request.",
    status: "Additional paid ✓",
    steps: [
      "NestHelper records the additional payment with your existing request.",
      "Any approved extra time, mileage, add-ons, or balance details are added to the service notes.",
      "The request continues with the updated scope or completion plan.",
    ],
    note: "Additional payments are only for approved changes, extra time, extra miles, add-ons, or remaining balance after the original checkout.",
    closing: "You can close this tab. NestHelper will follow up if any final details are still needed.",
  },
};

function getSuccessContent(paymentType: PaymentType, serviceId: string): SuccessContent {
  const serviceLabel = getServiceLabel(serviceId);

  if (serviceId === "commercial-reset" && (paymentType === "service_payment" || paymentType === "custom_initial")) {
    return {
      eyebrow: "Commercial Reset payment received",
      title: "Your Commercial Reset payment was successful.",
      text: "Thanks — your Commercial Reset payment was received. We’ll confirm scope, access, schedule, and any service notes before the visit begins.",
      status: "Paid ✓",
      steps: [
        "NestHelper records the payment with your Commercial Reset request.",
        "We confirm access instructions, service timing, approved scope, and any prep notes.",
        "If scope changes, specialty add-ons, or extra work come up, NestHelper will review them before additional payment is requested.",
      ],
      note: "Commercial Reset payments may cover a flat visit, first visit, deposit, reviewed quote, or recurring plan setup depending on the approved scope.",
      closing: "You can close this tab. NestHelper will follow up with commercial scheduling or service-specific details.",
    };
  }

  if (isFamilyService(serviceId) && (paymentType === "service_payment" || paymentType === "custom_initial")) {
    return {
      eyebrow: `${serviceLabel} payment received`,
      title: `Your ${serviceLabel} payment was successful.`,
      text: "Thanks — your NestHelper payment was received. We’ll confirm final timing, access details, and service notes before your visit.",
      status: "Paid ✓",
      steps: [
        "NestHelper confirms the final service window and arrival details.",
        "You receive any prep notes for access, pets, parking, or service-specific details.",
        "Your visit is handled by a NestHelper checked helper or approved partner provider.",
      ],
      note: "If you later approve extra time, add-ons, mileage, or recurring service changes, NestHelper may send a separate payment link before the updated scope is completed.",
      closing: "You can close this tab. NestHelper will follow up with scheduling or service-specific details.",
    };
  }

  if (serviceId === "laundry-rescue" && paymentType === "additional_payment") {
    return {
      eyebrow: "Laundry additional payment received",
      title: "Your Laundry Rescue additional payment was successful.",
      text: "Thanks — your Laundry Rescue add-on or balance payment was received. We’ll apply it to your laundry request and continue with the confirmed completion or return details.",
      status: "Additional paid ✓",
      steps: [
        "NestHelper records the additional laundry payment with your request.",
        "Approved add-ons, bulky items, rush changes, or extra work are added to the laundry notes.",
        "Your Laundry Rescue request continues with the updated completion or return plan.",
      ],
      note: "If more approved changes come up after this payment, NestHelper may send another separate invoice/payment link before completion or return.",
      closing: "You can close this tab. NestHelper will follow up if any final laundry details are still needed.",
    };
  }

  return baseSuccessContent[paymentType];
}

const cancelledContent: Record<PaymentType, { title: string; text: string }> = {
  service_payment: {
    title: "Your service payment was not completed.",
    text: "No charge was completed from this checkout attempt. You can return to your NestHelper checkout email and try the payment link again when you are ready.",
  },
  custom_initial: {
    title: "Your payment was not completed.",
    text: "No charge was completed from this checkout attempt. You can return to your NestHelper checkout email and try again when you are ready.",
  },
  laundry_deposit: {
    title: "Your Laundry Rescue deposit was not completed.",
    text: "No charge was completed from this deposit checkout attempt. You can return to your Laundry Rescue checkout email and try again when you are ready.",
  },
  laundry_final_balance: {
    title: "Your Laundry Rescue balance payment was not completed.",
    text: "No charge was completed from this balance checkout attempt. You can return to your NestHelper email and try the payment link again when you are ready.",
  },
  additional_payment: {
    title: "Your additional payment was not completed.",
    text: "No charge was completed from this additional-payment checkout attempt. You can return to your NestHelper email and try again when you are ready.",
  },
};

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-nest-cream p-4 text-left">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nest-teal text-sm font-black text-white">
        {number}
      </span>
      <span className="font-semibold text-nest-ink/80">{children}</span>
    </li>
  );
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await Promise.resolve(searchParams || {});
  const success = getParam(params, "success") === "true";
  const cancelled = getParam(params, "cancelled") === "true";
  const sessionId = getParam(params, "session_id");
  const paymentType = getPaymentType(params);
  const serviceId = getServiceId(params);
  const content = getSuccessContent(paymentType, serviceId);

  if (success) {
    return (
      <>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#075c58] via-[#0b6f69] to-[#073f3c] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-nest-gold/20 blur-3xl" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-5xl shadow-2xl shadow-black/20">
              ✓
            </div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-nest-gold">{content.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">{content.title}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/85">
              {content.text}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-[2rem] border border-nest-gold/20 bg-white p-7 shadow-soft">
              <h2 className="text-2xl font-black text-nest-teal">What happens next</h2>
              <ol className="mt-5 grid gap-3">
                {content.steps.map((step, index) => (
                  <Step key={step} number={index + 1}>{step}</Step>
                ))}
              </ol>
              {content.note ? (
                <div className="mt-7 rounded-2xl bg-nest-gold/10 p-5 text-sm font-semibold leading-7 text-nest-ink/75">
                  {content.note}
                </div>
              ) : null}
            </div>

            <aside className="rounded-[2rem] border border-nest-gold/20 bg-nest-cream p-7 shadow-soft">
              <h2 className="text-2xl font-black text-nest-teal">Payment status</h2>
              <div className="mt-5 rounded-2xl bg-white p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-nest-gold">Status</p>
                <p className="mt-2 text-3xl font-black text-nest-teal">{content.status}</p>
                {sessionId ? (
                  <p className="mt-3 break-all text-xs font-semibold text-nest-ink/50">Stripe session: {sessionId}</p>
                ) : null}
              </div>
              <p className="mt-5 text-sm font-semibold leading-7 text-nest-ink/70">
                {content.closing}
              </p>
              <div className="mt-6 grid gap-3">
                <Link href="/" className="rounded-full bg-nest-teal px-5 py-3 text-center font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                  Back to home
                </Link>
                <Link href="/contact" className="rounded-full border border-nest-teal/20 bg-white px-5 py-3 text-center font-black text-nest-teal transition hover:-translate-y-0.5 hover:shadow-lg">
                  Contact NestHelper
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </>
    );
  }

  if (cancelled) {
    const cancelledCopy = cancelledContent[paymentType];

    return (
      <>
        <PageHero
          eyebrow="Checkout not completed"
          title={cancelledCopy.title}
          text={cancelledCopy.text}
        />
        <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-nest-gold/20 bg-white p-7 shadow-soft">
            <h2 className="text-2xl font-black text-nest-teal">Need help?</h2>
            <p className="mt-3 font-semibold leading-7 text-nest-ink/70">
              Reply to your NestHelper checkout email or contact us if the payment link is not working.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="rounded-full bg-nest-teal px-5 py-3 font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                Contact NestHelper
              </Link>
              <Link href="/" className="rounded-full border border-nest-teal/20 bg-white px-5 py-3 font-black text-nest-teal transition hover:-translate-y-0.5 hover:shadow-lg">
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Checkout Flow"
        title="Payment happens after approval."
        text="NestHelper uses a request-first flow so customers only pay after service area, scope, safety, staffing, promo code, and pricing have been reviewed."
      />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Flow
            title="Regular services"
            steps={[
              "Customer submits request",
              "NestHelper reviews service area, scope, safety, pets, access, and availability",
              "NestHelper sends secure Stripe checkout link by text/email",
              "Payment confirms the visit",
              "NestHelper sends prep notes and final confirmation",
            ]}
          />
          <Flow
            title="Laundry Rescue"
            steps={[
              "Customer submits laundry request",
              "NestHelper approves pickup and sends deposit link",
              "Customer pays the minimum deposit",
              "Laundry is dry-weighed at pickup",
              "Add-ons are confirmed",
              "Final balance is sent by Stripe invoice/payment link before completion or delivery",
            ]}
          />
        </div>
        <div className="mt-8 rounded-[2rem] border border-nest-gold/20 bg-nest-gold/10 p-6">
          <h2 className="text-2xl font-black text-nest-teal">Request-first checkout</h2>
          <p className="mt-2 text-nest-ink/75">
            Customers submit a request first. NestHelper reviews the request and sends a secure checkout link only after the service is approved.
          </p>
        </div>
      </section>
    </>
  );
}

function Flow({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-black text-nest-teal">{title}</h2>
      <ol className="mt-5 grid gap-3">
        {steps.map((s, i) => (
          <Step key={s} number={i + 1}>{s}</Step>
        ))}
      </ol>
    </div>
  );
}
