import Link from "next/link";
import { PageHero } from "@/components/PageHero";

type SearchParams = Record<string, string | string[] | undefined>;

type CheckoutPageProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

function getParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

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
            <p className="text-sm font-black uppercase tracking-[0.28em] text-nest-gold">Payment received</p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Your NestHelper payment was successful.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/85">
              You are all set. NestHelper received your payment and your request is moving to scheduling.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-[2rem] border border-nest-gold/20 bg-white p-7 shadow-soft">
              <h2 className="text-2xl font-black text-nest-teal">What happens next</h2>
              <ol className="mt-5 grid gap-3">
                <Step number={1}>NestHelper confirms the final service window and arrival details.</Step>
                <Step number={2}>You receive any prep notes for access, pets, laundry, or service-specific details.</Step>
                <Step number={3}>Your request is handled by a NestHelper checked helper or approved partner provider.</Step>
              </ol>
              <div className="mt-7 rounded-2xl bg-nest-gold/10 p-5 text-sm font-semibold leading-7 text-nest-ink/75">
                For Laundry Rescue, this payment may be a minimum/deposit. Dry weight, add-ons, and any final balance are confirmed separately after pickup.
              </div>
            </div>

            <aside className="rounded-[2rem] border border-nest-gold/20 bg-nest-cream p-7 shadow-soft">
              <h2 className="text-2xl font-black text-nest-teal">Payment status</h2>
              <div className="mt-5 rounded-2xl bg-white p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-nest-gold">Status</p>
                <p className="mt-2 text-3xl font-black text-nest-teal">Paid ✓</p>
                {sessionId ? (
                  <p className="mt-3 break-all text-xs font-semibold text-nest-ink/50">Stripe session: {sessionId}</p>
                ) : null}
              </div>
              <p className="mt-5 text-sm font-semibold leading-7 text-nest-ink/70">
                You can close this tab. A NestHelper confirmation/follow-up message will come by email, text, or both.
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
    return (
      <>
        <PageHero
          eyebrow="Checkout not completed"
          title="Your payment was not completed."
          text="No charge was completed from this checkout attempt. You can return to your NestHelper checkout email and try the payment link again when you are ready."
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
        text="NestHelper uses a request-first flow so families only pay after service area, scope, safety, staffing, promo code, and pricing have been reviewed."
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
            Families submit a request first. NestHelper reviews the request and sends a secure checkout link only after the service is approved.
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
