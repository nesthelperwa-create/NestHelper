import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Home, Mail, Phone, ShieldCheck } from "lucide-react";
import { services } from "@/lib/services";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "NestHelper Checkout Status",
  description: "NestHelper payment status page.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

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
    closing: "You can close this tab. A NestHelper confirmation or follow-up message will come by email, text, or both.",
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
    text: "Thanks — your non-refundable Laundry Rescue intro minimum was received. The $59 minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs.",
    status: "Deposit paid ✓",
    steps: [
      "NestHelper confirms the pickup window, pickup spot, and laundry notes.",
      "Laundry is dry-weighed at pickup. Additional laundry above about 26.2 lbs is $2.25/lb.",
      "If you selected auto-charge, NestHelper may charge the saved payment method after additional weight, tax, and approved add-ons are confirmed. If you selected invoice-before-delivery, a final invoice link is sent before delivery.",
    ],
    note: "This minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs of laundry. Additional laundry, add-ons, bulky items, rush options, or extra work can change the final balance. Laundry is not released until the final balance is fully paid.",
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

function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[url('/assets/backgrounds/warm-mint-gradient.png')] bg-cover opacity-70" />
      <div className="absolute inset-0 -z-10 bg-white/58" />
      <div className="absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-nest-mint/65 blur-3xl" />
      <div className="absolute -right-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-nest-gold/20 blur-3xl" />
      {children}
    </section>
  );
}

function BrandHeader() {
  return (
    <div className="flex items-center justify-center gap-3">
      <img src={siteConfig.assets.icon} alt="" className="h-12 w-12 rounded-2xl object-contain" />
      <div className="text-left">
        <p className="text-xl font-black leading-none tracking-tight text-nest-teal">NestHelper</p>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-nest-ink/45">Secure checkout</p>
      </div>
    </div>
  );
}

function IconBadge({ tone }: { tone: "success" | "warning" | "neutral" }) {
  const className =
    tone === "warning"
      ? "bg-amber-50 text-amber-700"
      : tone === "success"
        ? "bg-nest-mint text-nest-teal"
        : "bg-nest-cream text-nest-teal";

  const Icon = tone === "warning" ? AlertTriangle : tone === "success" ? CheckCircle2 : Clock3;

  return (
    <div className={`mx-auto mt-7 flex h-16 w-16 items-center justify-center rounded-full shadow-sm ${className}`}>
      <Icon className="h-8 w-8" />
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-full bg-nest-teal px-5 py-3 text-center font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-full border border-nest-teal/20 bg-white px-5 py-3 text-center font-black text-nest-teal transition hover:-translate-y-0.5 hover:shadow-lg">
      {children}
    </Link>
  );
}

function Step({ number, children }: { number: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-nest-cream p-4 text-left">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nest-teal text-sm font-black text-white">
        {number}
      </span>
      <span className="font-semibold leading-6 text-nest-ink/80">{children}</span>
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
      <CheckoutShell>
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/86 p-5 text-center shadow-soft backdrop-blur sm:p-8 lg:p-10">
          <BrandHeader />
          <IconBadge tone="success" />

          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-nest-gold">{content.eyebrow}</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-balance text-3xl font-black tracking-tight text-nest-teal sm:text-5xl">
            {content.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-nest-ink/75 sm:text-lg sm:leading-8">
            {content.text}
          </p>

          <div className="mx-auto mt-8 grid max-w-4xl gap-5 text-left lg:grid-cols-[1.25fr_.75fr]">
            <div className="rounded-[1.75rem] border border-nest-teal/12 bg-white/82 p-5 shadow-sm">
              <h2 className="text-center text-xl font-black text-nest-teal sm:text-2xl">What happens next</h2>
              <ol className="mt-5 grid gap-3">
                {content.steps.map((step, index) => (
                  <Step key={step} number={index + 1}>{step}</Step>
                ))}
              </ol>
              {content.note ? (
                <div className="mt-5 rounded-2xl bg-nest-gold/10 p-4 text-sm font-semibold leading-7 text-nest-ink/75">
                  {content.note}
                </div>
              ) : null}
            </div>

            <aside className="rounded-[1.75rem] border border-nest-teal/12 bg-nest-cream p-5 text-center shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-nest-gold">Status</p>
              <p className="mt-2 text-2xl font-black text-nest-teal">{content.status}</p>
              {sessionId ? (
                <p className="mt-3 break-all text-xs font-semibold text-nest-ink/45">Stripe session: {sessionId}</p>
              ) : null}

              <p className="mt-5 text-sm font-semibold leading-7 text-nest-ink/70">
                {content.closing}
              </p>

              <div className="mt-5 grid gap-3">
                <PrimaryLink href="/">Back to home</PrimaryLink>
                <SecondaryLink href="/contact">Contact NestHelper</SecondaryLink>
              </div>
            </aside>
          </div>
        </div>
      </CheckoutShell>
    );
  }

  if (cancelled) {
    const cancelledCopy = cancelledContent[paymentType];

    return (
      <CheckoutShell>
        <div className="mx-auto max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/86 p-5 text-center shadow-soft backdrop-blur sm:p-8 lg:p-10">
          <BrandHeader />
          <IconBadge tone="warning" />

          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-nest-gold">Checkout not completed</p>
          <h1 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-black tracking-tight text-nest-teal sm:text-5xl">
            {cancelledCopy.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-nest-ink/75 sm:text-lg sm:leading-8">
            {cancelledCopy.text}
          </p>

          <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-nest-teal/12 bg-white/72 p-5 text-left shadow-sm sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nest-mint text-nest-teal">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="font-black text-nest-teal">Use the same email link</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/70">
                  Return to your NestHelper checkout email or text thread when you are ready.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nest-mint text-nest-teal">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="font-black text-nest-teal">Need help?</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/70">
                  Text NestHelper at {siteConfig.phone}, and we can check the payment link.
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
            <PrimaryLink href="/contact">Contact NestHelper</PrimaryLink>
            <SecondaryLink href="/">Back home</SecondaryLink>
          </div>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell>
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/86 p-5 text-center shadow-soft backdrop-blur sm:p-8 lg:p-10">
        <BrandHeader />
        <IconBadge tone="neutral" />

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-nest-gold">Request-first checkout</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-balance text-3xl font-black tracking-tight text-nest-teal sm:text-5xl">
          Payment happens after approval.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-nest-ink/75 sm:text-lg sm:leading-8">
          NestHelper reviews service area, scope, safety, staffing, promo code, and pricing before sending a secure checkout link.
        </p>

        <div className="mt-8 grid gap-5 text-left md:grid-cols-2">
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

        <div className="mx-auto mt-8 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
          <PrimaryLink href="/request">Request help</PrimaryLink>
          <SecondaryLink href="/">Back home</SecondaryLink>
        </div>
      </div>
    </CheckoutShell>
  );
}

function Flow({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-[1.75rem] border border-nest-teal/12 bg-white/82 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nest-mint text-nest-teal">
          {title === "Laundry Rescue" ? <ShieldCheck className="h-5 w-5" /> : <Home className="h-5 w-5" />}
        </span>
        <h2 className="text-xl font-black text-nest-teal">{title}</h2>
      </div>
      <ol className="mt-5 grid gap-3">
        {steps.map((s, i) => (
          <Step key={s} number={i + 1}>{s}</Step>
        ))}
      </ol>
    </div>
  );
}
