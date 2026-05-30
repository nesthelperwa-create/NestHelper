"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, ClipboardCheck, CreditCard, ShieldCheck } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import { PhotoUploadField, photoUploadSummary, type PhotoUpload } from "@/components/forms/PhotoUploadField";

const defaultState = {
  businessName: "",
  contactName: "",
  roleTitle: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip: "",
  serviceRegion: "Not sure yet",
  businessType: "",
  squareFootage: "",
  bathrooms: "",
  kitchens: "",
  showers: "",
  spaceCondition: "",
  trafficLevel: "",
  frequency: "",
  preferredDate: "",
  preferredDaysTimes: "",
  rentalBedrooms: "",
  rentalBeds: "",
  rentalCheckoutWindow: "",
  rentalLinenHandling: "",
  rentalRestockNeeds: "",
  rentalTurnoverNotes: "",
  supplies: "NestHelper brings standard supplies",
  flooringTypes: [] as string[],
  accessType: "Someone can let NestHelper in",
  accessInstructions: "",
  spaceDetails: [] as string[],
  cleaningPriorities: [] as string[],
  addOnInterests: [] as string[],
  specialNotes: "",
  photoNotes: "",
  consent: false,
  textConsent: false,
  photoUploads: [] as PhotoUpload[],
};

type CommercialResetFormState = typeof defaultState;
type Status = "idle" | "loading" | "success" | "error";

const businessTypes = [
  "Small office",
  "Studio / gym / wellness space",
  "Salon / barbershop",
  "Church / nonprofit",
  "Therapy / professional office",
  "Real estate / insurance office",
  "Daycare common areas",
  "Schools / learning studios",
  "Short-term rental / vacation rental",
  "Other small business",
];

const frequencies = [
  "One-time commercial reset",
  "Weekly service",
  "Twice weekly service",
  "Three times weekly service",
  "Five times weekly service",
  "Monthly / occasional support",
  "Short-term rental turnover / between-stay reset",
  "Not sure yet — help me choose",
];

const squareFootageOptions = [
  "Under 750 sq ft",
  "750–1,500 sq ft",
  "1,500–2,500 sq ft",
  "2,500–4,000 sq ft",
  "4,000–6,000 sq ft",
  "Over 6,000 sq ft",
  "Not sure yet",
];

const bathroomOptions = ["0", "1", "2", "3", "4", "5+", "Not sure yet"];

const kitchenOptions = [
  "No kitchen/breakroom",
  "1 kitchenette/breakroom",
  "1 full kitchen",
  "2+ kitchen/break areas",
  "Not sure yet",
];

const showerOptions = ["No showers/changing areas", "1", "2", "3+", "Not sure yet"];

const conditionOptions = [
  "Regularly maintained",
  "Light reset needed",
  "First-time / catch-up reset",
  "Heavy reset needed",
  "Not sure yet",
];

const trafficOptions = [
  "Low traffic / private staff space",
  "Moderate daily traffic",
  "High public/client traffic",
  "Event or guest turnover traffic",
  "Not sure yet",
];

const bedroomOptions = ["Studio", "1 bedroom", "2 bedrooms", "3 bedrooms", "4+ bedrooms", "Not sure yet"];

const bedOptions = ["1 bed", "2 beds", "3 beds", "4+ beds", "Not sure yet"];

const flooringOptions = ["Carpet", "Tile", "LVP / vinyl", "Hardwood", "Concrete", "Rubber gym floor", "Mixed / not sure"];

const cleaningPriorityOptions = [
  "Trash / recycling",
  "Bathrooms / restrooms",
  "Breakroom / kitchenette",
  "Floors",
  "Dusting / surfaces",
  "Entry / reception",
  "High-touch areas",
  "Interior glass / mirrors",
];

const addOnOptions = [
  "Carpet extraction quote",
  "Floor scrub quote",
  "Buff / shine quote",
  "Wax / finish quote",
  "Strip & wax quote",
  "Upholstery quote",
  "Interior glass quote",
  "No add-ons right now",
];

const detailOptions = {
  rental: [
    "Kitchen reset",
    "Bathroom reset",
    "Beds / linen changeover",
    "Towels staged",
    "Trash removed",
    "Restock checklist",
    "Photo notes after reset",
  ],
  daycare: [
    "Classrooms / learning rooms",
    "Play/common areas",
    "Child restrooms",
    "Staff restroom",
    "Snack/kitchen area",
    "Entry / pickup area",
    "Nap or quiet area",
  ],
  salonGym: [
    "Styling/service stations",
    "Treatment rooms",
    "Mirrors / glass",
    "Locker/changing area",
    "Shower area",
    "Gym/studio floor area",
    "Towel/trash stations",
  ],
  church: [
    "Lobby / entry",
    "Sanctuary or meeting room",
    "Classrooms / nursery common areas",
    "Restrooms",
    "Kitchen / fellowship area",
    "Office area",
    "Event cleanup support",
  ],
  office: [
    "Reception / waiting area",
    "Private offices",
    "Open work area",
    "Conference rooms",
    "Restrooms",
    "Breakroom / kitchenette",
    "Client-facing rooms",
  ],
  general: [
    "Front/customer area",
    "Staff-only area",
    "Restrooms",
    "Kitchen/break area",
    "Floors",
    "Trash/recycling",
    "High-touch surfaces",
  ],
};

function getBusinessKind(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("rental") || lower.includes("vacation")) return "rental";
  if (lower.includes("daycare") || lower.includes("school") || lower.includes("learning")) return "daycare";
  if (lower.includes("salon") || lower.includes("barber") || lower.includes("gym") || lower.includes("wellness") || lower.includes("studio")) return "salonGym";
  if (lower.includes("church") || lower.includes("nonprofit")) return "church";
  if (lower.includes("office") || lower.includes("therapy") || lower.includes("real estate") || lower.includes("insurance")) return "office";
  return type ? "general" : "";
}

function getSpaceDetailOptions(type: string) {
  const kind = getBusinessKind(type);
  if (!kind) return [];
  return detailOptions[kind as keyof typeof detailOptions] || detailOptions.general;
}

function buildPayload(form: CommercialResetFormState) {
  return {
    fullName: form.contactName,
    email: form.email,
    phone: form.phone,
    address: form.address,
    city: form.city,
    zip: form.zip,
    service: "commercial-reset",
    selectedServiceTitle: "Commercial Reset Quote",
    packageType: "Commercial Reset",
    requestType: "Commercial Reset",
    businessName: form.businessName,
    contactName: form.contactName,
    roleTitle: form.roleTitle,
    serviceRegion: form.serviceRegion,
    businessType: form.businessType,
    squareFootage: form.squareFootage,
    bathrooms: form.bathrooms,
    kitchens: form.kitchens,
    showers: form.showers,
    spaceCondition: form.spaceCondition,
    trafficLevel: form.trafficLevel,
    frequency: form.frequency,
    preferredDate: form.preferredDate,
    preferredWindow: form.preferredDaysTimes,
    preferredDaysTimes: form.preferredDaysTimes,
    rentalBedrooms: form.rentalBedrooms,
    rentalBeds: form.rentalBeds,
    rentalCheckoutWindow: form.rentalCheckoutWindow,
    rentalLinenHandling: form.rentalLinenHandling,
    rentalRestockNeeds: form.rentalRestockNeeds,
    rentalTurnoverNotes: form.rentalTurnoverNotes,
    supplies: form.supplies,
    flooringTypes: form.flooringTypes,
    accessType: form.accessType,
    accessInstructions: form.accessInstructions,
    spaceDetails: form.spaceDetails,
    cleaningPriorities: form.cleaningPriorities,
    addOnInterests: form.addOnInterests,
    specialNotes: form.specialNotes,
    photoNotes: form.photoNotes,
    quoteBasis: "NestHelper prepares a clear quoted visit price, recurring plan, or reviewed price range before service is scheduled.",
    ...(form.photoUploads.length ? {
      photoUploadCount: form.photoUploads.length,
      photoUploadSummary: photoUploadSummary(form.photoUploads),
      photoUploads: form.photoUploads,
    } : {}),
    consent: form.consent,
    textConsent: form.textConsent,
    requestedAt: new Date().toISOString(),
  };
}

export function CommercialResetForm() {
  const [form, setForm] = useState(defaultState);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const businessKind = getBusinessKind(form.businessType);
  const isShortTermRental = businessKind === "rental";
  const isDaycareOrLearning = businessKind === "daycare";
  const spaceDetailOptions = useMemo(() => getSpaceDetailOptions(form.businessType), [form.businessType]);

  function update(name: keyof CommercialResetFormState, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }) as CommercialResetFormState);
  }

  function updateBusinessType(value: string) {
    setForm((prev) => ({
      ...prev,
      businessType: value,
      spaceDetails: [],
      ...(value.toLowerCase().includes("rental") ? {} : {
        rentalBedrooms: "",
        rentalBeds: "",
        rentalCheckoutWindow: "",
        rentalLinenHandling: "",
        rentalRestockNeeds: "",
        rentalTurnoverNotes: "",
      }),
    }));
  }

  function toggleList(name: "flooringTypes" | "cleaningPriorities" | "spaceDetails" | "addOnInterests", item: string, checked: boolean) {
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
        body: JSON.stringify(buildPayload(form)),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Commercial Reset submission failed");

      setStatus("success");
      setMessage("Commercial Reset quote request received. We’ll review the address, space type, square footage range, bathrooms/kitchens/showers, condition, schedule, and optional photos before sending next steps or a clear quote/payment link.");
      setForm(defaultState);
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
          <h2 className="mt-2 text-2xl font-black text-nest-teal sm:text-3xl">Request a Commercial Reset quote</h2>
          <p className="mt-3 max-w-2xl leading-7 text-nest-ink/72">
            This guided form stays quick, but asks the pricing details that matter: type of space, size range, restrooms, kitchens, showers, condition, frequency, and photos if helpful.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Step icon={<ClipboardCheck className="h-5 w-5" />} title="1. Quick basics" text="Contact, address, business type, and service area." />
            <Step icon={<ShieldCheck className="h-5 w-5" />} title="2. Quote factors" text="Space size, layout, areas that need attention, condition, and frequency." />
            <Step icon={<CreditCard className="h-5 w-5" />} title="3. Clear quote" text="Flat visit price, recurring plan, or reviewed range before checkout." />
          </div>
        </div>
      </div>

      <Section title="1. Business contact" description="Who should NestHelper contact about the quote, walkthrough, and service details?">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business / property name"><input className="input" required value={form.businessName} onChange={(e) => update("businessName", e.target.value)} /></Field>
          <Field label="Contact name"><input className="input" required autoComplete="name" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></Field>
          <Field label="Role/title (optional)"><input className="input" placeholder="Owner, manager, host, office admin, etc." value={form.roleTitle} onChange={(e) => update("roleTitle", e.target.value)} /></Field>
          <Field label="Business or property type">
            <select className="input" required value={form.businessType} onChange={(e) => updateBusinessType(e.target.value)}>
              <option value="">Choose one</option>
              {businessTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Email"><input type="email" className="input" required autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
          <Field label="Phone"><input className="input" required autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => update("phone", formatPhoneNumber(e.target.value))} /></Field>
        </div>
      </Section>

      <Section title="2. Cleaning address" description="Commercial Reset is quoted in select Pierce County, Eastside, and Northshore areas. Parent Reset home services remain focused on the Eastside/Northshore side.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service area">
            <select className="input" value={form.serviceRegion} onChange={(e) => update("serviceRegion", e.target.value)}>
              <option>Not sure yet</option>
              <option>Pierce County commercial area</option>
              <option>Eastside / Northshore commercial area</option>
              <option>Nearby area — please review</option>
            </select>
          </Field>
          <Field label="ZIP"><input className="input" required autoComplete="postal-code" inputMode="numeric" value={form.zip} onChange={(e) => update("zip", e.target.value)} /></Field>
        </div>
        <Field label="Street address"><input className="input" required autoComplete="street-address" value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>
        <Field label="City / community"><input className="input" required autoComplete="address-level2" value={form.city} onChange={(e) => update("city", e.target.value)} /></Field>
      </Section>

      <Section title="3. About the Space" description="These quick ranges help NestHelper understand the size, layout, condition, and schedule before preparing a flat visit quote, recurring plan, or reviewed range.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Approx. square footage">
            <select className="input" required value={form.squareFootage} onChange={(e) => update("squareFootage", e.target.value)}>
              <option value="">Choose one</option>
              {squareFootageOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Bathrooms / restrooms">
            <select className="input" required value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)}>
              <option value="">Choose one</option>
              {bathroomOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Kitchens / breakrooms">
            <select className="input" required value={form.kitchens} onChange={(e) => update("kitchens", e.target.value)}>
              <option value="">Choose one</option>
              {kitchenOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Showers / changing areas">
            <select className="input" required value={form.showers} onChange={(e) => update("showers", e.target.value)}>
              <option value="">Choose one</option>
              {showerOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Current condition">
            <select className="input" required value={form.spaceCondition} onChange={(e) => update("spaceCondition", e.target.value)}>
              <option value="">Choose one</option>
              {conditionOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Traffic level">
            <select className="input" required value={form.trafficLevel} onChange={(e) => update("trafficLevel", e.target.value)}>
              <option value="">Choose one</option>
              {trafficOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Cleaning frequency">
            <select className="input" required value={form.frequency} onChange={(e) => update("frequency", e.target.value)}>
              <option value="">Choose one</option>
              {frequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}
            </select>
          </Field>
          <Field label="Preferred start date"><input type="date" className="input" value={form.preferredDate} onChange={(e) => update("preferredDate", e.target.value)} /></Field>
        </div>
        <Field label="Preferred days/times"><input className="input" required placeholder="Example: after 6pm weekdays, Saturday morning, before opening" value={form.preferredDaysTimes} onChange={(e) => update("preferredDaysTimes", e.target.value)} /></Field>
        <div className="rounded-2xl border border-nest-teal/15 bg-nest-mint/25 p-4 text-sm font-semibold leading-6 text-nest-ink/76">
          These details are meant to make pricing feel fair and predictable. NestHelper will quote the visit, recurring plan, or add-on before anything is scheduled.
        </div>
      </Section>

      {form.businessType && (
        <Section title="4. What Needs Attention" description="Choose the areas and priorities that matter most. This changes based on the type of space so you are not answering unrelated questions.">
          <div>
            <div className="label mb-3">Areas included</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {spaceDetailOptions.map((item) => (
                <CheckOption key={item} checked={form.spaceDetails.includes(item)} onChange={(checked) => toggleList("spaceDetails", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-3">Main cleaning priorities</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {cleaningPriorityOptions.map((item) => (
                <CheckOption key={item} checked={form.cleaningPriorities.includes(item)} onChange={(checked) => toggleList("cleaningPriorities", item, checked)}>{item}</CheckOption>
              ))}
            </div>
          </div>

          {isDaycareOrLearning && (
            <div className="rounded-2xl border border-nest-gold/15 bg-nest-mint/20 p-4 text-sm font-semibold leading-6 text-nest-ink/72">
              For daycare common areas and learning spaces, NestHelper can review non-toxic, low-odor, or fragrance-free product preferences where appropriate for the surface and scope. Commercial Reset is cleaning support only and is not childcare, medical care, or a licensed sanitation program.
            </div>
          )}
        </Section>
      )}

      {isShortTermRental && (
        <Section title="5. Short-term rental turnover details" description="Only answer these if this is an Airbnb-style, vacation rental, or host-managed guest turnover request.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bedrooms / unit type">
              <select className="input" value={form.rentalBedrooms} onChange={(e) => update("rentalBedrooms", e.target.value)}>
                <option value="">Choose one</option>
                {bedroomOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Beds to reset">
              <select className="input" value={form.rentalBeds} onChange={(e) => update("rentalBeds", e.target.value)}>
                <option value="">Choose one</option>
                {bedOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Turnover window"><input className="input" placeholder="Example: guests checkout 11am, next check-in 4pm" value={form.rentalCheckoutWindow} onChange={(e) => update("rentalCheckoutWindow", e.target.value)} /></Field>
            <Field label="Linen/towel handling">
              <select className="input" value={form.rentalLinenHandling} onChange={(e) => update("rentalLinenHandling", e.target.value)}>
                <option value="">Choose one</option>
                <option>Use clean linens stored onsite</option>
                <option>Strip beds only</option>
                <option>Laundry/linen help needed — quote separately</option>
                <option>Host handles linens</option>
                <option>Not sure yet</option>
              </select>
            </Field>
          </div>
          <Field label="Restock checklist items (optional)"><input className="input" placeholder="Example: toilet paper, paper towels, coffee pods, soap, trash bags" value={form.rentalRestockNeeds} onChange={(e) => update("rentalRestockNeeds", e.target.value)} /></Field>
          <Field label="Turnover notes (optional)"><textarea className="input min-h-24" placeholder="Parking, lockbox, host checklist, photo reporting request, common guest issues, or must-check areas." value={form.rentalTurnoverNotes} onChange={(e) => update("rentalTurnoverNotes", e.target.value)} /></Field>
          <div className="rounded-2xl border border-nest-gold/15 bg-nest-mint/20 p-4 text-sm font-semibold leading-6 text-nest-ink/72">
            Short-term rental turnover cleaning is cleaning support only. Guest messaging, repairs, supply purchasing, pest issues, biohazards, damage claims, and full property management are outside the standard scope unless separately reviewed.
          </div>
        </Section>
      )}

      <Section title={isShortTermRental ? "6. Service Preferences" : form.businessType ? "5. Service Preferences" : "4. Service Preferences"} description="Confirm supplies, access, flooring, and any add-ons that should be reviewed before quoting.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Supplies preference">
            <select className="input" value={form.supplies} onChange={(e) => update("supplies", e.target.value)}>
              <option>NestHelper brings standard supplies</option>
              <option>Non-toxic / low-odor options requested where appropriate</option>
              <option>Fragrance-free products requested where appropriate</option>
              <option>Discuss with me first</option>
              <option>Not sure yet</option>
            </select>
          </Field>
          <Field label="Access type">
            <select className="input" value={form.accessType} onChange={(e) => update("accessType", e.target.value)}>
              <option>Someone can let NestHelper in</option>
              <option>Lockbox / key available</option>
              <option>Alarm or code required</option>
              <option>After-hours entry needed</option>
              <option>Walkthrough needed first</option>
              <option>Not sure yet</option>
            </select>
          </Field>
        </div>
        <div>
          <div className="label mb-3">Flooring types</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {flooringOptions.map((item) => (
              <CheckOption key={item} checked={form.flooringTypes.includes(item)} onChange={(checked) => toggleList("flooringTypes", item, checked)}>{item}</CheckOption>
            ))}
          </div>
        </div>
        <div>
          <div className="label mb-3">Possible add-ons</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {addOnOptions.map((item) => (
              <CheckOption key={item} checked={form.addOnInterests.includes(item)} onChange={(checked) => toggleList("addOnInterests", item, checked)}>{item}</CheckOption>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-nest-gold/15 bg-nest-mint/20 p-4 text-sm font-semibold leading-6 text-nest-ink/72">
          Specialty add-ons such as carpet extraction, floor work, waxing, strip-and-wax, upholstery, or detailed glass work are reviewed before quoting and are not included by default.
        </div>
      </Section>

      <Section title={isShortTermRental ? "7. Notes and optional photos" : form.businessType ? "6. Notes and optional photos" : "5. Notes and optional photos"} description="Keep this short unless something needs extra context. Photos are helpful but not required.">
        <Field label="Access instructions or special notes (optional)"><textarea className="input min-h-28" placeholder="Keys, lockbox, alarm, parking, suite number, after-hours entry, who will be onsite, current condition, daycare/common-area notes, short-term rental turnover notes, add-ons, or anything sensitive." value={form.accessInstructions} onChange={(e) => update("accessInstructions", e.target.value)} /></Field>
        <Field label="Anything else NestHelper should know? (optional)"><textarea className="input min-h-24" placeholder="Tell us anything that did not fit above." value={form.specialNotes} onChange={(e) => update("specialNotes", e.target.value)} /></Field>
        <PhotoUploadField
          photos={form.photoUploads}
          onChange={(photos) => update("photoUploads", photos)}
          label="Upload walkthrough photos (optional)"
          description="Add up to 4 optional photos of the space, flooring, restrooms, kitchen/break area, showers/changing areas, priority areas, access points, rental turnover condition, or anything that helps us quote accurately."
        />
        <Field label="Photo links or walkthrough notes (optional)"><textarea className="input min-h-24" placeholder="Paste a link to additional photos or describe anything a walkthrough should cover." value={form.photoNotes} onChange={(e) => update("photoNotes", e.target.value)} /></Field>
      </Section>

      <div className="grid gap-4 rounded-[1.75rem] border border-nest-teal/15 bg-nest-mint/20 p-5">
        <h3 className="text-xl font-black text-nest-teal">Before you submit</h3>
        <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
          <input type="checkbox" required checked={form.consent} onChange={(e) => update("consent", e.target.checked)} className="mt-1 h-4 w-4" />
          <span>I understand this is a quote request, not a confirmed booking. Commercial Reset availability depends on address, scope, schedule, turnover timing if applicable, licensing/endorsement requirements, and service fit.</span>
        </label>
        <label className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-nest-ink/82 shadow-sm">
          <input type="checkbox" checked={form.textConsent} onChange={(e) => update("textConsent", e.target.checked)} className="mt-1 h-4 w-4" />
          <span>I agree NestHelper may text/email me about this quote request, walkthrough, scheduling, checkout, and service updates.</span>
        </label>
      </div>

      <button disabled={status === "loading"} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-4 text-lg font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift disabled:opacity-60">
        {status === "loading" ? "Submitting..." : "Submit Commercial Quote Request"}
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

function CheckOption({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className={`flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition ${checked ? "border-nest-gold/45 bg-nest-mint/35 text-nest-teal shadow-sm" : "border-nest-gold/10 bg-nest-cream text-nest-ink/78 hover:bg-nest-mint/25"}`}>
      <input type="checkbox" className="h-4 w-4 accent-nest-teal" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function CommercialQuoteMiniCard() {
  return (
    <div className="rounded-[1.75rem] border border-nest-gold/16 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nest-mint/45 text-nest-teal">
          <Building2 size={23} />
        </div>
        <div>
          <h3 className="text-xl font-black text-nest-teal">Commercial quote before checkout</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-nest-ink/68">
            For business spaces, NestHelper reviews the address, square footage range, bathrooms, kitchens, showers, frequency, access, product preferences, and photos before quoting or sending a payment link.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-black text-nest-teal">
              <CheckCircle2 size={16} /> No payment due when you request
            </div>
            <Link href="/commercial-reset/request" className="inline-flex w-fit items-center justify-center rounded-full bg-nest-teal px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-nest-teal2">
              Start quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
