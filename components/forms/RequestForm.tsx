"use client";

import { useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import { services, laundryAddOns } from "@/lib/services";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import { PhotoUploadField, photoUploadSummary, type PhotoUpload } from "@/components/forms/PhotoUploadField";

const defaultState = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip: "",
  service: "",
  preferredDate: "",
  preferredWindow: "",
  alternateDate: "",
  urgency: "Flexible — anytime this week is okay",
  promoCode: "",
  homeType: "Single-family home",
  pets: "No pets",
  parkingAccess: "",
  supplyPreference: "NestHelper standard supplies are okay",
  homePriorities: [] as string[],
  homeAreas: [] as string[],
  requestDetails: "",
  roomsAreas: "",
  errandType: "Grocery or store pickup",
  errandDistance: "Within 5 miles",
  errandStops: "",
  errandStartArea: "",
  errandMileageAck: false,
  laundryTypes: [] as string[],
  laundryBagEstimate: "1–2 bags/hampers",
  laundryPickupSpot: "Front porch / outside door",
  detergent: "Standard detergent",
  dryPreference: "Standard dry",
  laundryAddOns: [] as string[],
  reusableBagAck: false,
  consent: false,
  textConsent: false,
  photoUploads: [] as PhotoUpload[],
};

type RequestFormState = typeof defaultState;
type Status = "idle" | "loading" | "success" | "error";

const priorityOptions = [
  "Kitchen reset",
  "Dishes / counters / surfaces",
  "Toy or living area tidy",
  "Laundry folding / put-away",
  "Pantry, entry, or kids area reset",
  "Trash / quick pickup",
  "I am not sure — help me prioritize",
];

const homeAreaOptions = [
  "Kitchen",
  "Living room",
  "Playroom / toys",
  "Bedrooms",
  "Bathrooms",
  "Laundry area",
  "Entryway / mudroom",
  "Whole-home reset",
];

const laundryTypeOptions = [
  "Adult clothes",
  "Kids clothes",
  "Baby items",
  "Towels",
  "Sheets / bedding",
  "Socks / underwear",
  "Delicates",
  "Mixed household laundry",
];

function getServiceCategory(serviceId: string) {
  if (serviceId === "laundry-rescue") return "laundry";
  if (serviceId === "errand-helper") return "errand";
  if (serviceId) return "home";
  return "none";
}

function cleanForSelectedService(form: RequestFormState) {
  const category = getServiceCategory(form.service);
  const base = {
    fullName: form.fullName,
    email: form.email,
    phone: form.phone,
    address: form.address,
    city: form.city,
    zip: form.zip,
    service: form.service,
    preferredDate: form.preferredDate,
    preferredWindow: form.preferredWindow,
    alternateDate: form.alternateDate,
    urgency: form.urgency,
    promoCode: form.promoCode,
    selectedServiceTitle: services.find((service) => service.id === form.service)?.title || "",
    parkingAccess: form.parkingAccess,
    consent: form.consent,
    textConsent: form.textConsent,
    ...(form.photoUploads.length ? {
      photoUploadCount: form.photoUploads.length,
      photoUploadSummary: photoUploadSummary(form.photoUploads),
      photoUploads: form.photoUploads,
    } : {}),
    requestedAt: new Date().toISOString(),
  };

  if (category === "home") {
    return {
      ...base,
      packageType: "Home reset",
      homeType: form.homeType,
      pets: form.pets,
      supplyPreference: form.supplyPreference,
      homePriorities: form.homePriorities,
      homeAreas: form.homeAreas,
      roomsAreas: form.homeAreas.length ? form.homeAreas.join(", ") : form.roomsAreas,
      requestDetails: form.requestDetails,
    };
  }

  if (category === "errand") {
    return {
      ...base,
      packageType: "Errand Helper",
      errandType: form.errandType,
      errandDistance: form.errandDistance,
      errandStops: form.errandStops,
      errandStartArea: form.errandStartArea,
      errandMileageAck: form.errandMileageAck,
    };
  }

  if (category === "laundry") {
    return {
      ...base,
      packageType: "Laundry Rescue",
      laundryTypes: form.laundryTypes,
      laundryBagEstimate: form.laundryBagEstimate,
      laundryPickupSpot: form.laundryPickupSpot,
      detergent: form.detergent,
      dryPreference: form.dryPreference,
      laundryAddOns: form.laundryAddOns,
      reusableBagAck: form.reusableBagAck,
    };
  }

  return base;
}

export function RequestForm() {
  const params = useSearchParams();
  const requestedService = params.get("service") || "";
  const [form, setForm] = useState({ ...defaultState, service: requestedService });
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const selectedService = useMemo(() => services.find((service) => service.id === form.service), [form.service]);
  const serviceCategory = getServiceCategory(form.service);
  const isHomeReset = serviceCategory === "home";
  const isErrand = serviceCategory === "errand";
  const isLaundry = serviceCategory === "laundry";

  function update(name: keyof RequestFormState, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }) as RequestFormState);
  }

  function handleServiceChange(service: string) {
    const nextCategory = getServiceCategory(service);
    setForm((prev) => ({
      ...prev,
      service,
      homePriorities: nextCategory === "home" ? prev.homePriorities : [],
      homeAreas: nextCategory === "home" ? prev.homeAreas : [],
      requestDetails: nextCategory === "home" ? prev.requestDetails : "",
      roomsAreas: nextCategory === "home" ? prev.roomsAreas : "",
      homeType: nextCategory === "home" ? prev.homeType : defaultState.homeType,
      pets: nextCategory === "home" ? prev.pets : defaultState.pets,
      supplyPreference: nextCategory === "home" ? prev.supplyPreference : defaultState.supplyPreference,
      errandType: nextCategory === "errand" ? prev.errandType : defaultState.errandType,
      errandDistance: nextCategory === "errand" ? prev.errandDistance : defaultState.errandDistance,
      errandStops: nextCategory === "errand" ? prev.errandStops : "",
      errandStartArea: nextCategory === "errand" ? prev.errandStartArea : "",
      errandMileageAck: nextCategory === "errand" ? prev.errandMileageAck : false,
      laundryTypes: nextCategory === "laundry" ? prev.laundryTypes : [],
      laundryBagEstimate: nextCategory === "laundry" ? prev.laundryBagEstimate : defaultState.laundryBagEstimate,
      laundryPickupSpot: nextCategory === "laundry" ? prev.laundryPickupSpot : defaultState.laundryPickupSpot,
      detergent: nextCategory === "laundry" ? prev.detergent : "Standard detergent",
      dryPreference: nextCategory === "laundry" ? prev.dryPreference : "Standard dry",
      laundryAddOns: nextCategory === "laundry" ? prev.laundryAddOns : [],
      reusableBagAck: nextCategory === "laundry" ? prev.reusableBagAck : false,
    }));
  }

  function toggleList(name: "homePriorities" | "homeAreas" | "laundryTypes" | "laundryAddOns", item: string, checked: boolean) {
    setForm((prev) => {
      const current = prev[name];
      return {
        ...prev,
        [name]: checked ? [...current, item] : current.filter((value) => value !== item),
      };
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanForSelectedService(form)),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Request submission failed");

      setStatus("success");
      setMessage("Request received. We’ll review your service area, timing, scope, safety notes, and pricing before sending a secure checkout link. A confirmation email is on its way.");
      setForm({ ...defaultState, service: requestedService });
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Something went wrong. Please try again or contact NestHelper directly.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-nest-cream via-white to-nest-mint/35 p-5 shadow-sm sm:p-7">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-nest-gold/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">No payment due yet</p>
          <h2 className="mt-2 text-2xl font-black text-nest-teal sm:text-3xl">Request a Parent Reset</h2>
          <p className="mt-3 max-w-2xl leading-7 text-nest-ink/72">
            Choose a service, then answer only the questions that match that package. NestHelper reviews the request before checkout so families get the right scope, timing, helper, and price before anything is confirmed.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Step icon={<ShieldCheck className="h-5 w-5" />} title="1. We review" text="Area, safety, pets, access, and scope." />
            <Step icon={<CreditCard className="h-5 w-5" />} title="2. You approve" text="We send a secure payment link." />
            <Step icon={<CheckCircle2 className="h-5 w-5" />} title="3. We reset" text="A checked helper or vetted partner gets to work." />
          </div>
        </div>
      </div>

      <Section title="1. Contact information" description="We use this to confirm the request, send prep notes, and share the checkout link if approved.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input className="input" required autoComplete="name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} /></Field>
          <Field label="Phone"><input className="input" required autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => update("phone", formatPhoneNumber(e.target.value))} /></Field>
          <Field label="Email"><input type="email" className="input" required autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
          <Field label="Promo/referral code (optional)"><input className="input" placeholder="Optional code" value={form.promoCode} onChange={(e) => update("promoCode", e.target.value.toUpperCase())} /></Field>
        </div>
      </Section>

      <Section title="2. Service address" description="Parent Reset service is focused on Woodinville, Bothell, Kirkland, Redmond, and nearby Eastside/Northshore communities. Pierce County is currently listed for Commercial Reset only.">
        <Field label="Street address"><input className="input" required autoComplete="street-address" value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City"><input className="input" required autoComplete="address-level2" value={form.city} onChange={(e) => update("city", e.target.value)} /></Field>
          <Field label="ZIP"><input className="input" required autoComplete="postal-code" inputMode="numeric" value={form.zip} onChange={(e) => update("zip", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="3. Service and timing" description="Choose the package first. The next section changes based on the package selected.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service requested">
            <select className="input" required value={form.service} onChange={(e) => handleServiceChange(e.target.value)}>
              <option value="">Choose a service</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
            </select>
          </Field>
          <Field label="How soon do you need help?">
            <select className="input" value={form.urgency} onChange={(e) => update("urgency", e.target.value)}>
              <option>Flexible — anytime this week is okay</option>
              <option>Soon — ideally within 2-3 days</option>
              <option>Urgent — next available opening</option>
              <option>Recurring help — contact me to discuss</option>
            </select>
          </Field>
          <Field label="Preferred date"><input type="date" className="input" required value={form.preferredDate} onChange={(e) => update("preferredDate", e.target.value)} /></Field>
          <Field label="Backup date (optional)"><input type="date" className="input" value={form.alternateDate} onChange={(e) => update("alternateDate", e.target.value)} /></Field>
        </div>
        <Field label="Preferred time window"><input className="input" placeholder="Example: Friday morning, Saturday after 1pm, weekdays after 4" value={form.preferredWindow} onChange={(e) => update("preferredWindow", e.target.value)} /></Field>

        {selectedService && (
          <div className="rounded-[1.5rem] border border-nest-teal/15 bg-nest-mint/25 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">Selected package</p>
                <h3 className="mt-1 text-2xl font-black text-nest-teal">{selectedService.title}</h3>
                <p className="mt-2 text-nest-ink/72">{selectedService.description}</p>
              </div>
              <div className="rounded-3xl bg-white px-5 py-4 text-left shadow-sm sm:min-w-52">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-nest-ink/55">Starting price</p>
                <p className="mt-1 text-3xl font-black text-nest-teal">{selectedService.standardPrice}</p>
                <p className="mt-1 text-sm font-bold text-nest-gold">{selectedService.priceNote}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniInfo icon={<Clock className="h-4 w-4" />} text={selectedService.serviceTime} />
              {selectedService.travelInfo && <MiniInfo icon={<MapPin className="h-4 w-4" />} text={selectedService.travelInfo} />}
            </div>
          </div>
        )}
      </Section>

      {serviceCategory === "none" && (
        <Section title="4. Package-specific questions" description="Choose a service above and this section will only show questions that match that package.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm font-semibold leading-6 text-nest-ink/76">
            Select 2-Hour Parent Reset, 3-Hour Family Reset, 4-Hour Helper Block, Errand Helper, or Laundry Rescue to continue.
          </div>
        </Section>
      )}

      {isHomeReset && (
        <Section title="4. Home reset priorities" description="Quick checkboxes are enough. Use the notes box only for anything special or hard to explain.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Home type">
              <select className="input" value={form.homeType} onChange={(e) => update("homeType", e.target.value)}>
                <option>Single-family home</option>
                <option>Townhome</option>
                <option>Apartment / condo</option>
                <option>Multi-generational home</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Product preference">
              <select className="input" value={form.supplyPreference} onChange={(e) => update("supplyPreference", e.target.value)}>
                <option>NestHelper standard supplies are okay</option>
                <option>Non-toxic / low-odor options requested where appropriate</option>
                <option>Fragrance-free / sensitive products requested</option>
                <option>Baby/sensitive product preference</option>
                <option>I will provide products</option>
                <option>Not sure yet</option>
              </select>
            </Field>
          </div>
          <div>
            <div className="label mb-3">Main priorities</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {priorityOptions.map((item) => (
                <CheckOption key={item} checked={form.homePriorities.includes(item)} onChange={(checked) => toggleList("homePriorities", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-3">Rooms or areas involved</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {homeAreaOptions.map((item) => (
                <CheckOption key={item} checked={form.homeAreas.includes(item)} onChange={(checked) => toggleList("homeAreas", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <Field label="Anything else we should know?">
            <textarea className="input min-h-28" required placeholder="Example: dishes are backed up, toys everywhere, laundry needs folding, pantry needs a reset, or I need help catching up before guests arrive." value={form.requestDetails} onChange={(e) => update("requestDetails", e.target.value)} />
          </Field>
        </Section>
      )}

      {isErrand && (
        <Section title="4. Errand Helper details" description="Errand Helper is for local approved errands: up to 2 hours and up to 15 driving miles included.">
          <div className="rounded-3xl border border-nest-gold/20 bg-nest-cream p-5 text-sm leading-6 text-nest-ink/76">
            <strong className="text-nest-teal">Good fit:</strong> grocery pickup, returns, approved pickup/drop-off tasks, and family logistics. <strong className="text-nest-teal">Not allowed:</strong> alcohol, weapons, controlled substances, unsafe requests, or anything that requires legal/medical judgment.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Errand type">
              <select className="input" value={form.errandType} onChange={(e) => update("errandType", e.target.value)}>
                <option>Grocery or store pickup</option>
                <option>Store return / exchange</option>
                <option>Package drop-off or pickup</option>
                <option>Donation drop-off</option>
                <option>Pharmacy pickup — non-prescription only</option>
                <option>Multiple family logistics stops</option>
                <option>Other approved local errand</option>
              </select>
            </Field>
            <Field label="Estimated distance">
              <select className="input" value={form.errandDistance} onChange={(e) => update("errandDistance", e.target.value)}>
                <option>Within 5 miles</option>
                <option>5–10 miles</option>
                <option>10–15 miles</option>
                <option>More than 15 miles — quote first</option>
                <option>Not sure yet</option>
              </select>
            </Field>
          </div>
          <Field label="Errand stops or task list"><textarea className="input min-h-28" required placeholder="Example: Target return, grocery pickup at QFC, package drop-off." value={form.errandStops} onChange={(e) => update("errandStops", e.target.value)} /></Field>
          <Field label="Starting area / stores / drop-off area"><input className="input" required placeholder="Example: Woodinville QFC to my home, or Bothell return drop-off" value={form.errandStartArea} onChange={(e) => update("errandStartArea", e.target.value)} /></Field>
          <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
            <input type="checkbox" required checked={form.errandMileageAck} onChange={(e) => update("errandMileageAck", e.target.checked)} className="mt-1 h-4 w-4" />
            <span>I understand Errand Helper includes up to 2 hours and up to 15 driving miles. NestHelper will quote extra distance, complex stops, or special handling before checkout.</span>
          </label>
        </Section>
      )}

      {isLaundry && (
        <Section title="4. Laundry Rescue preferences" description="Laundry is billed by dry weight at pickup, then the final balance is sent after weigh-in.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estimated laundry amount">
              <select className="input" required value={form.laundryBagEstimate} onChange={(e) => update("laundryBagEstimate", e.target.value)}>
                <option>1–2 bags/hampers</option>
                <option>3–4 bags/hampers</option>
                <option>5+ bags/hampers</option>
                <option>Towels/sheets mostly</option>
                <option>Not sure yet</option>
              </select>
            </Field>
            <Field label="Pickup spot / access">
              <select className="input" required value={form.laundryPickupSpot} onChange={(e) => update("laundryPickupSpot", e.target.value)}>
                <option>Front porch / outside door</option>
                <option>Garage</option>
                <option>Apartment / condo door</option>
                <option>Lobby / front desk</option>
                <option>Text me on arrival</option>
                <option>Other — I’ll explain below</option>
              </select>
            </Field>
            <Field label="Detergent preference">
              <select className="input" value={form.detergent} onChange={(e) => update("detergent", e.target.value)}>
                <option>Standard detergent</option>
                <option>Baby & Sensitive Skin Detergent +$5</option>
                <option>Fragrance-free detergent +$5</option>
                <option>Customer-provided detergent</option>
                <option>No preference</option>
              </select>
            </Field>
            <Field label="Dryer preference">
              <select className="input" value={form.dryPreference} onChange={(e) => update("dryPreference", e.target.value)}>
                <option>Standard dry</option>
                <option>Low heat +$3</option>
                <option>Hang dry selected items</option>
              </select>
            </Field>
          </div>
          <div>
            <div className="label mb-3">Laundry type</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {laundryTypeOptions.map((item) => (
                <CheckOption key={item} checked={form.laundryTypes.includes(item)} onChange={(checked) => toggleList("laundryTypes", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-3">Laundry add-ons to consider</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {laundryAddOns.map((item) => (
                <CheckOption key={item} checked={form.laundryAddOns.includes(item)} onChange={(checked) => toggleList("laundryAddOns", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <label className="flex gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-semibold text-nest-ink/88 shadow-sm ring-1 ring-red-100">
            <input type="checkbox" required checked={form.reusableBagAck} onChange={(e) => update("reusableBagAck", e.target.checked)} className="mt-1 h-5 w-5 accent-red-600" />
            <span>
              <span className="mb-1 inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-black uppercase tracking-wide text-red-700 ring-1 ring-red-200">
                <span className="mr-1 text-base leading-none text-red-600">*</span> Required
              </span>
              <span className="block leading-6">
                I understand clean laundry may be returned in NestHelper reusable bags/totes that should be returned at the next pickup, scheduled drop-off, or another approved return method.
              </span>
            </span>
          </label>
        </Section>
      )}

      {isHomeReset && (
        <Section title="5. Home, pets, and access" description="Clear access notes help us avoid delays and make sure the request is safe for everyone.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pets in home">
              <select className="input" value={form.pets} onChange={(e) => update("pets", e.target.value)}>
                <option>No pets</option>
                <option>Dog(s) — will be secured</option>
                <option>Cat(s)</option>
                <option>Dog(s) and cat(s)</option>
                <option>Other pets</option>
                <option>I’ll explain below</option>
              </select>
            </Field>
            <Field label="Parking/access notes"><input className="input" placeholder="Door code, parking, apartment info, stairs, elevator, gate, where to enter, etc." value={form.parkingAccess} onChange={(e) => update("parkingAccess", e.target.value)} /></Field>
          </div>
        </Section>
      )}

      {isErrand && (
        <Section title="5. Errand access notes" description="Only include the access details needed to complete the errand or pickup/drop-off safely.">
          <Field label="Pickup/drop-off, parking, or access notes"><input className="input" placeholder="Example: leave groceries at front porch, apartment gate code, package pickup desk, parking notes" value={form.parkingAccess} onChange={(e) => update("parkingAccess", e.target.value)} /></Field>
        </Section>
      )}

      {isLaundry && (
        <Section title="5. Laundry pickup and return notes" description="Only include the access details needed for laundry pickup and return.">
          <Field label="Pickup/return, parking, or access notes"><input className="input" placeholder="Example: porch pickup, apartment gate code, text on arrival, leave clean bags by front door" value={form.parkingAccess} onChange={(e) => update("parkingAccess", e.target.value)} /></Field>
        </Section>
      )}

      {serviceCategory !== "none" && (
        <Section title="6. Optional photos" description="Photos are optional, but they can help us understand the scope before we approve, quote, or schedule the request.">
          <PhotoUploadField
            photos={form.photoUploads}
            onChange={(photos) => update("photoUploads", photos)}
            label="Upload photos (optional)"
            description="Add up to 4 optional photos. Useful for before photos, rooms/areas involved, laundry amount, access notes, or anything that helps us quote and plan accurately."
          />
        </Section>
      )}

      <div className="grid gap-4 rounded-[1.75rem] border border-nest-teal/15 bg-nest-mint/20 p-5">
        <h3 className="text-xl font-black text-nest-teal">Before you submit</h3>
        <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
          <input type="checkbox" required checked={form.consent} onChange={(e) => update("consent", e.target.checked)} className="mt-1 h-4 w-4" />
          <span>I understand this is a request, not a confirmed booking. I agree to NestHelper’s Terms, Privacy Policy, Service Scope, Cancellation, Safety, Laundry, and Reset Promise policies.</span>
        </label>
        <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
          <input type="checkbox" checked={form.textConsent} onChange={(e) => update("textConsent", e.target.checked)} className="mt-1 h-4 w-4" />
          <span>I agree NestHelper may text/email me about this request, checkout, prep notes, and service updates.</span>
        </label>
      </div>

      <button disabled={status === "loading"} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-4 text-lg font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift disabled:opacity-60">
        {status === "loading" ? "Submitting..." : "Submit Request"}
        {status !== "loading" && <ArrowRight size={19} />}
      </button>
      {message && <p className={`rounded-2xl p-4 font-semibold ${status === "success" ? "bg-nest-mint/45 text-nest-teal" : "bg-red-50 text-red-700"}`}>{message}</p>}
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const match = title.match(/^(\d+)\.\s*(.*)$/);
  const step = match?.[1];
  const cleanTitle = match?.[2] || title;

  return (
    <section className="relative grid gap-5 overflow-hidden rounded-[1.9rem] border border-nest-gold/15 bg-gradient-to-br from-white via-white to-nest-cream/30 p-5 shadow-sm sm:p-6">
      <div className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-nest-mint/35 blur-3xl" />
      <div className="relative flex gap-4">
        {step ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-nest-teal text-lg font-black text-white shadow-sm">
            {step}
          </div>
        ) : null}
        <div>
          <h3 className="text-xl font-black text-nest-teal sm:text-2xl">{cleanTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-nest-ink/68">{description}</p>
        </div>
      </div>
      <div className="relative grid gap-5">
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2"><span className="label">{label}</span>{children}</label>;
}

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <div className="text-nest-gold">{icon}</div>
      <p className="mt-2 font-black text-nest-teal">{title}</p>
      <p className="mt-1 text-sm leading-5 text-nest-ink/65">{text}</p>
    </div>
  );
}

function MiniInfo({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-nest-ink/75 shadow-sm">
      <span className="text-nest-teal">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function CheckOption({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className={`flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition ${checked ? "border-nest-gold/45 bg-nest-mint/35 text-nest-teal shadow-sm" : "border-nest-gold/10 bg-nest-cream text-nest-ink/78 hover:bg-nest-mint/25"}`}>
      <input type="checkbox" className="h-4 w-4 accent-nest-teal" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
