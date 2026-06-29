"use client";

import { useEffect, useState } from "react";
import type { FormEvent, HTMLAttributes, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import { focusFirstInvalidField } from "@/lib/formInvalidFocus";
import { mergeCampaignAttribution } from "@/lib/campaignAttribution";

type Status = "idle" | "loading" | "success" | "error";
type ApplicationPath = "helper" | "partner";

const applicationOptions: Array<{
  key: ApplicationPath;
  eyebrow: string;
  title: string;
  text: string;
  bullets: string[];
  button: string;
}> = [
  {
    key: "helper",
    eyebrow: "Individual applicant",
    title: "I’m applying as a cleaner or helper",
    text: "For individuals who want cleaning, deep-cleaning, regular home-cleaning, move-in/move-out, laundry, organizing, errand, or parent-reset work.",
    bullets: ["Cleaning + helper application", "Gold Star Checked onboarding", "Part-time / flexible availability"],
    button: "Show cleaner/helper form",
  },
  {
    key: "partner",
    eyebrow: "Business or provider",
    title: "I’m a cleaning business or partner provider",
    text: "For cleaning companies, independent contractors, laundromats, organizers, errand providers, and local service businesses that want to partner with NestHelper.",
    bullets: ["Business/provider application", "Partner-vetted review", "Capacity, insurance, and service standards"],
    button: "Show partner form",
  },
];

const howFoundUsOptions = [
  "Google search",
  "Instagram",
  "Facebook",
  "Nextdoor",
  "Friend or family referral",
  "NestHelper customer referral",
  "Community group",
  "Job board / hiring post",
  "Flyer / QR code",
  "Other / not listed",
];

function shouldShowHowFoundUsDetails(value: string) {
  return ["Friend or family referral", "Nextdoor", "NestHelper customer referral", "Community group", "Job board / hiring post", "Flyer / QR code", "Other / not listed"].includes(value);
}

const helperAvailabilityOptions = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Saturday",
  "Sunday",
  "School-hour blocks",
  "Recurring weekly route availability",
  "Same-week / fill-in availability",
  "Occasional/on-call openings",
];

const helperRoleFocusOptions = [
  "Deep cleaner / detail cleaner",
  "Regular recurring home cleaner",
  "Move-in / move-out cleaner",
  "Whole-home cleaner",
  "Parent Reset / family home helper",
  "Laundry and organizing helper",
  "Errand helper",
  "Open to multiple roles",
  "Not sure yet",
];

const SERVICE_ERRANDS = "Errands / pickup and drop-off";
const SERVICE_DEEP_CLEANING = "Deep cleaning / detail cleaning";
const SERVICE_REGULAR_CLEANING = "Regular recurring home cleaning";
const SERVICE_MOVE_OUT_CLEANING = "Move-in / move-out cleaning";
const SERVICE_BATH_KITCHEN_DEEP_CLEAN = "Kitchen and bathroom deep cleans";

const helperServiceOptions = [
  SERVICE_DEEP_CLEANING,
  SERVICE_REGULAR_CLEANING,
  SERVICE_MOVE_OUT_CLEANING,
  "Whole-home cleaning",
  SERVICE_BATH_KITCHEN_DEEP_CLEAN,
  "Specific rooms / area resets",
  "Parent Reset / home reset support",
  "Parent Reset Plan / deeper family-space reset visits",
  "Dishes / kitchen reset",
  "Changing linens / bed reset",
  "Laundry folding and put-away",
  "Light organizing",
  SERVICE_ERRANDS,
  "Pet-friendly homes",
];

const WORKSTYLE_CHILDREN_FAMILY_HOMES = "Comfortable around children/family homes";
const WORKSTYLE_LAUNDRY_HEAVY = "Okay with laundry-heavy visits";
const WORKSTYLE_ERRAND_DRIVING = "Okay with errand driving";

const helperWorkStyleOptions = [
  "Strong fit for deep/detail cleaning",
  "Strong fit for regular recurring cleaning",
  "Strong fit for move-in/move-out empty-home cleaning",
  WORKSTYLE_CHILDREN_FAMILY_HOMES,
  "Comfortable with pets",
  WORKSTYLE_LAUNDRY_HEAVY,
  WORKSTYLE_ERRAND_DRIVING,
  "Mostly prefers cleaning/reset visits",
  "Mostly prefers organizing/laundry support",
];

const COMFORT_CHILDREN = "Comfortable around children";
const COMFORT_BATHROOMS = "Comfortable with bathrooms";
const COMFORT_LIFTING = "Comfortable lifting 20–30 lbs";
const COMFORT_DRIVING_ERRANDS = "Comfortable driving for errands";
const COMFORT_WORKING_WITH_FAMILY_HOME = "Comfortable working while family is home";
const EMPTY_HOME_ONLY_COMFORT = "Only empty homes / no family present during visit";

const helperComfortOptions = [
  "Comfortable with deep-cleaning buildup",
  "Comfortable with recurring family homes",
  "Comfortable with empty-home cleanings",
  COMFORT_CHILDREN,
  "Comfortable around pets",
  "Comfortable with laundry",
  "Comfortable with kitchens",
  COMFORT_BATHROOMS,
  "Comfortable using cleaning products/supplies",
  COMFORT_LIFTING,
  COMFORT_DRIVING_ERRANDS,
  COMFORT_WORKING_WITH_FAMILY_HOME,
  EMPTY_HOME_ONLY_COMFORT,
];

const NOT_WILLING_BATHROOMS = "No bathrooms";
const NOT_WILLING_HEAVY_LIFTING = "No heavy lifting";
const NOT_WILLING_DRIVING_ERRANDS = "No driving errands";

const helperNotWillingOptions = [
  NOT_WILLING_BATHROOMS,
  "No deep cleaning / heavy buildup",
  "No move-in/move-out cleanings",
  "No recurring house-cleaning routes",
  "No pet messes",
  "No biohazards",
  NOT_WILLING_HEAVY_LIFTING,
  NOT_WILLING_DRIVING_ERRANDS,
  "No homes with smoking",
  "No homes with aggressive pets",
  "Other / depends on the job",
];

const helperDocumentLabelOptions = [
  "Resume / work history",
  "Cleaning experience proof",
  "Before/after cleaning photos",
  "Reference letter",
  "Caregiving or family-support experience proof",
  "Food handler card",
  "CPR / First Aid",
  "Vehicle insurance",
  "Portfolio / work photos",
  "Other",
];

const partnerServiceOptions = [
  "Residential deep cleaning",
  "Regular recurring house cleaning",
  "Move-in / move-out cleaning",
  "Whole-home cleaning",
  "Kitchen and bathroom deep cleans",
  "Specific room / area resets",
  "Commercial/janitorial cleaning",
  "Short-term rental turnover",
  "Laundry wash/fold provider",
  "Errand / delivery support",
  "Home organizing",
  "Carpet / floor care",
  "Interior glass / specialty cleaning",
];

const partnerAreaOptions = [
  "Bothell / Kenmore",
  "Woodinville",
  "Kirkland / Redmond",
  "Bellevue / Eastside",
  "Seattle / nearby",
  "Other nearby area",
];

const partnerDocumentOptions = [
  "Business license / UBI",
  "Proof of insurance",
  "Bonding info if applicable",
  "References",
  "Photos or portfolio",
  "Online reviews / social proof",
];

const partnerDocumentLabelOptions = [
  "Business license",
  "Certificate of insurance",
  "Bonding certificate",
  "Service menu / rate sheet",
  "Team roster",
  "Background-check policy",
  "Reference letter",
  "Portfolio / work photos",
  "Other",
];

const helperDefaultState = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  roleFocus: "",
  howFoundUs: "",
  howFoundUsDetails: "",
  campaignSource: "",
  campaignMedium: "",
  campaignName: "",
  campaignContent: "",
  campaignTerm: "",
  campaignLandingPage: "",
  campaignReferrer: "",
  campaignCapturedAtIso: "",
  availability: [] as string[],
  weeklyCapacity: "",
  services: [] as string[],
  experienceLevel: "",
  experience: "",
  transportation: "",
  travelRadius: "",
  workStyle: [] as string[],
  comfortLevel: [] as string[],
  notWillingToDo: [] as string[],
  references: "",
  notes: "",
  backgroundConsent: false,
};

type HelperFormState = typeof helperDefaultState;

const partnerDefaultState = {
  businessName: "",
  ownerName: "",
  email: "",
  phone: "",
  serviceType: [] as string[],
  website: "",
  howFoundUs: "",
  howFoundUsDetails: "",
  campaignSource: "",
  campaignMedium: "",
  campaignName: "",
  campaignContent: "",
  campaignTerm: "",
  campaignLandingPage: "",
  campaignReferrer: "",
  campaignCapturedAtIso: "",
  businessStructure: "",
  serviceArea: [] as string[],
  serviceAreaDetails: "",
  licenseStatus: "",
  insuranceStatus: "",
  licenseInfo: "",
  insuranceInfo: "",
  capacity: "",
  availability: [] as string[],
  documentsAvailable: [] as string[],
  notes: "",
  consent: false,
};

type PartnerFormState = typeof partnerDefaultState;

type ApplicationDocumentDraft = {
  id: string;
  label: string;
  file: File | null;
};

type HelperMultiSelectField = "availability" | "services" | "workStyle" | "comfortLevel" | "notWillingToDo";

function toggleValue(values: string[], value: string, checked: boolean) {
  if (!checked) return values.filter((item) => item !== value);
  return Array.from(new Set([...values.filter((item) => item !== value), value]));
}

function removeValues(values: string[], valuesToRemove: string[]) {
  return values.filter((item) => !valuesToRemove.includes(item));
}

const MAX_APPLICATION_DOCUMENTS = 5;
const MAX_APPLICATION_DOCUMENT_BYTES = 3 * 1024 * 1024;
const MAX_APPLICATION_DOCUMENT_TOTAL_BYTES = 3_600_000;
const allowedApplicationDocumentExtensions = /\.(pdf|doc|docx|jpg|jpeg|png|webp|heic|heif)$/i;
const allowedApplicationDocumentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function formatDocumentSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 1024 * 1024 ? 1 : 2)} MB`;
}

function isAllowedApplicationDocument(file: File) {
  const type = (file.type || "").toLowerCase();
  return allowedApplicationDocumentTypes.has(type) || allowedApplicationDocumentExtensions.test(file.name);
}

function validateApplicationDocuments(documents: ApplicationDocumentDraft[]) {
  const selectedDocuments = documents.filter((document) => document.file);
  if (selectedDocuments.length > MAX_APPLICATION_DOCUMENTS) return `Please upload no more than ${MAX_APPLICATION_DOCUMENTS} optional documents.`;

  let totalBytes = 0;
  for (const document of selectedDocuments) {
    const file = document.file;
    if (!file) continue;
    if (!isAllowedApplicationDocument(file)) return `${file.name} is not an accepted file type. Use PDF, Word, JPG, PNG, WEBP, HEIC, or HEIF.`;
    if (file.size > MAX_APPLICATION_DOCUMENT_BYTES) return `${file.name} is too large. Each optional document must be under ${formatDocumentSize(MAX_APPLICATION_DOCUMENT_BYTES)}.`;
    totalBytes += file.size;
  }

  if (totalBytes > MAX_APPLICATION_DOCUMENT_TOTAL_BYTES) {
    return `The selected optional documents are ${formatDocumentSize(totalBytes)} total. Please keep document uploads under ${formatDocumentSize(MAX_APPLICATION_DOCUMENT_TOTAL_BYTES)} total, or submit the application without documents and NestHelper can request them later.`;
  }

  return "";
}

const emptyDocumentDraft = (): ApplicationDocumentDraft => ({
  id: Math.random().toString(36).slice(2),
  label: "",
  file: null,
});

function buildApplicationFormData(payload: Record<string, unknown>, documents: ApplicationDocumentDraft[]) {
  const selectedDocuments = documents.filter((document) => document.file);
  const payloadWithSummary = {
    ...payload,
    uploadedDocumentLabels: selectedDocuments.map((document) => document.label || "Other"),
    uploadedDocumentSummary: selectedDocuments.map((document) => `${document.label || "Other"}: ${document.file?.name || "uploaded file"}`).join("\n"),
  };

  const formData = new FormData();
  formData.append("payload", JSON.stringify(payloadWithSummary));
  selectedDocuments.forEach((document, index) => {
    if (!document.file) return;
    formData.append(`documentLabel_${index}`, document.label || "Other");
    formData.append(`documentFile_${index}`, document.file);
  });
  return formData;
}

export function ApplicationFormChooser() {
  const [selected, setSelected] = useState<ApplicationPath | null>(null);
  const selectedOption = applicationOptions.find((option) => option.key === selected);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/90 shadow-soft backdrop-blur">
        <div className="bg-gradient-to-br from-nest-cream via-white to-nest-mint/30 p-6 text-center sm:p-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-nest-gold">Choose your application path</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-nest-teal sm:text-4xl">Which best describes you?</h2>
            <p className="mt-3 text-nest-ink/70">
              Select one of the two cards below. The selected card will animate and the correct application will open underneath.
            </p>
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-nest-gold/25 bg-nest-cream px-4 py-2 text-sm font-black text-nest-teal shadow-sm">
              <span className="flex h-2.5 w-2.5 rounded-full bg-nest-gold motion-safe:animate-pulse" />
              Click or tap a card to continue
            </div>
          </div>
        </div>

        <div className="grid items-stretch gap-5 p-5 sm:p-6 lg:grid-cols-2 lg:p-8">
          {applicationOptions.map((option) => {
            const isSelected = selected === option.key;
            return (
              <motion.button
                key={option.key}
                type="button"
                layout
                whileHover={{ y: -6, scale: 1.01 }}
                whileTap={{ scale: 0.975 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                onClick={() => setSelected(option.key)}
                className={`group relative flex h-full min-h-[340px] cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border-2 p-5 text-left shadow-sm outline-none transition-colors duration-200 ease-out focus-visible:ring-4 focus-visible:ring-nest-gold/25 sm:p-6 ${
                  isSelected
                    ? "border-nest-gold bg-nest-cream ring-4 ring-nest-gold/15"
                    : "border-nest-gold/20 bg-white hover:border-nest-gold/70 hover:bg-nest-cream/45"
                }`}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <motion.div
                    layoutId="application-selected-glow"
                    className="pointer-events-none absolute inset-0 rounded-[1.65rem] bg-gradient-to-br from-nest-gold/18 via-white/20 to-nest-mint/35"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.22 }}
                  />
                )}

                <motion.div
                  animate={isSelected ? { rotate: 360, scale: 1.08 } : { rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 18 }}
                  className={`absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border text-lg font-black transition-colors ${
                    isSelected
                      ? "border-nest-gold bg-nest-gold text-white shadow-soft"
                      : "border-nest-gold/25 bg-white text-nest-teal group-hover:border-nest-gold group-hover:bg-nest-gold group-hover:text-white"
                  }`}
                >
                  {isSelected ? "✓" : "→"}
                </motion.div>

                <div className="relative z-10 flex flex-1 flex-col pr-8">
                  <span className="w-fit rounded-full bg-nest-mint/55 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-nest-teal">
                    {option.eyebrow}
                  </span>

                  <h3 className="mt-5 text-2xl font-black leading-tight text-nest-teal">{option.title}</h3>
                  <p className="mt-3 leading-7 text-nest-ink/72">{option.text}</p>

                  <ul className="mt-4 grid gap-2 text-sm font-semibold text-nest-ink/75">
                    {option.bullets.map((bullet, index) => (
                      <motion.li
                        key={bullet}
                        className="flex gap-2"
                        animate={isSelected ? { x: [0, 4, 0] } : { x: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.26 }}
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-nest-gold/15 text-xs font-black text-nest-gold">✓</span>
                        <span>{bullet}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <motion.div
                  layout
                  className={`relative z-10 mt-auto flex min-h-[56px] w-full items-center justify-center rounded-full px-5 py-4 text-center text-sm font-black shadow-soft transition-colors ${
                    isSelected
                      ? "bg-nest-gold text-white"
                      : "bg-nest-teal text-white group-hover:bg-nest-teal2 group-hover:tracking-wide"
                  }`}
                >
                  {isSelected ? "Selected — form shown below" : option.button}
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedOption ? (
          <motion.div
            key={selectedOption.key}
            className="mt-8"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="mb-4 flex flex-col gap-3 rounded-[1.5rem] border border-nest-gold/20 bg-nest-cream p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-nest-gold">Now showing</p>
                <p className="text-xl font-black text-nest-teal">{selectedOption.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-nest-teal/20 bg-white px-5 py-3 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold hover:text-nest-gold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nest-gold/20"
              >
                Change selection
              </button>
            </div>
            {selected === "helper" ? <HelperApplicationForm /> : <PartnerApplicationForm />}
          </motion.div>
        ) : (
          <motion.div
            key="empty-selection"
            className="mt-8 rounded-[1.5rem] border border-dashed border-nest-gold/45 bg-white/70 p-6 text-center text-sm font-semibold text-nest-ink/70"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            Select one of the two animated cards above to open the correct application form.
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function HelperApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<HelperFormState>(() => mergeCampaignAttribution(helperDefaultState));
  const [documents, setDocuments] = useState<ApplicationDocumentDraft[]>([emptyDocumentDraft()]);
  const showHowFoundUsDetails = shouldShowHowFoundUsDetails(form.howFoundUs);

  useEffect(() => {
    setForm((prev) => mergeCampaignAttribution(prev));
  }, []);

  const update = (name: keyof HelperFormState, value: unknown) => setForm((prev) => ({ ...prev, [name]: value }));
  const toggle = (name: HelperMultiSelectField, value: string, checked: boolean) => {
    setForm((prev) => {
      const next: HelperFormState = {
        ...prev,
        availability: [...prev.availability],
        services: [...prev.services],
        workStyle: [...prev.workStyle],
        comfortLevel: [...prev.comfortLevel],
        notWillingToDo: [...prev.notWillingToDo],
      };

      if (name === "comfortLevel") {
        if (checked && value === EMPTY_HOME_ONLY_COMFORT) {
          next.comfortLevel = [EMPTY_HOME_ONLY_COMFORT];
          next.workStyle = removeValues(next.workStyle, [WORKSTYLE_CHILDREN_FAMILY_HOMES]);
          return next;
        }

        next.comfortLevel = toggleValue(removeValues(next.comfortLevel, [EMPTY_HOME_ONLY_COMFORT]), value, checked);

        if (checked && value === COMFORT_BATHROOMS) next.notWillingToDo = removeValues(next.notWillingToDo, [NOT_WILLING_BATHROOMS]);
        if (checked && value === COMFORT_LIFTING) next.notWillingToDo = removeValues(next.notWillingToDo, [NOT_WILLING_HEAVY_LIFTING]);
        if (checked && value === COMFORT_DRIVING_ERRANDS) next.notWillingToDo = removeValues(next.notWillingToDo, [NOT_WILLING_DRIVING_ERRANDS]);

        return next;
      }

      if (name === "workStyle") {
        next.workStyle = toggleValue(next.workStyle, value, checked);

        if (checked && value === WORKSTYLE_CHILDREN_FAMILY_HOMES) next.comfortLevel = removeValues(next.comfortLevel, [EMPTY_HOME_ONLY_COMFORT]);
        if (checked && value === WORKSTYLE_ERRAND_DRIVING) next.notWillingToDo = removeValues(next.notWillingToDo, [NOT_WILLING_DRIVING_ERRANDS]);

        return next;
      }

      if (name === "services") {
        next.services = toggleValue(next.services, value, checked);

        if (checked && value === SERVICE_ERRANDS) next.notWillingToDo = removeValues(next.notWillingToDo, [NOT_WILLING_DRIVING_ERRANDS]);

        return next;
      }

      if (name === "notWillingToDo") {
        next.notWillingToDo = toggleValue(next.notWillingToDo, value, checked);

        if (checked && value === NOT_WILLING_BATHROOMS) next.comfortLevel = removeValues(next.comfortLevel, [COMFORT_BATHROOMS]);
        if (checked && value === NOT_WILLING_HEAVY_LIFTING) next.comfortLevel = removeValues(next.comfortLevel, [COMFORT_LIFTING]);
        if (checked && value === NOT_WILLING_DRIVING_ERRANDS) {
          next.services = removeValues(next.services, [SERVICE_ERRANDS]);
          next.workStyle = removeValues(next.workStyle, [WORKSTYLE_ERRAND_DRIVING]);
          next.comfortLevel = removeValues(next.comfortLevel, [COMFORT_DRIVING_ERRANDS]);
        }

        return next;
      }

      next.availability = toggleValue(next.availability, value, checked);
      return next;
    });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const documentError = validateApplicationDocuments(documents);
    if (documentError) {
      setStatus("error");
      setMessage(documentError);
      return;
    }

    try {
      const response = await fetch("/api/submit-helper-application", {
        method: "POST",
        body: buildApplicationFormData(form, documents),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Helper application failed");

      const warning = typeof result?.warning === "string" ? result.warning : "";
      setStatus("success");
      setMessage(warning || "Application received. We’ll review it and follow up about next steps. Sensitive ID/background-check steps happen through secure providers, not this form.");
      setForm(mergeCampaignAttribution(helperDefaultState));
      setDocuments([emptyDocumentDraft()]);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} onInvalidCapture={focusFirstInvalidField} className="grid gap-5 overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-5 shadow-soft backdrop-blur sm:p-8">
      <div className="rounded-[1.75rem] bg-gradient-to-br from-nest-cream via-white to-nest-mint/30 p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">Individual helper</p>
        <h2 className="mt-2 text-2xl font-black text-nest-teal">Part-Time Helper Application</h2>
        <p className="mt-2 text-nest-ink/70">For individuals interested in cleaning, deep-cleaning, regular home-cleaning, move-in/move-out cleaning, laundry, organizing, errands, or Parent Reset support. Most questions are simple choices; use the notes boxes only where details help.</p>
      </div>

      <Grid>
        <Input label="Full name" value={form.fullName} onChange={(v) => update("fullName", v)} required />
        <Input label="Phone" value={form.phone} onChange={(v) => update("phone", formatPhoneNumber(v))} required inputMode="tel" autoComplete="tel" placeholder="555-555-5555" />
        <Input label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
        <Input label="City" value={form.city} onChange={(v) => update("city", v)} required />
        <Select label="How did you hear about NestHelper?" value={form.howFoundUs} onChange={(v) => update("howFoundUs", v)} placeholder="Choose one">
          {howFoundUsOptions.map((option) => <option key={option}>{option}</option>)}
        </Select>
        {showHowFoundUsDetails && (
          <Input label="Referral/source details (optional)" value={form.howFoundUsDetails} onChange={(v) => update("howFoundUsDetails", v)} placeholder="Name, group, post, flyer location, or other details" />
        )}
      </Grid>

      <CheckboxGroup
        label="When are you usually available?"
        options={helperAvailabilityOptions}
        values={form.availability}
        onChange={(option, checked) => toggle("availability", option, checked)}
      />

      <Grid>
        <Select label="Primary work you’re applying for" value={form.roleFocus} onChange={(v) => update("roleFocus", v)} placeholder="Choose one" required>
          {helperRoleFocusOptions.map((option) => <option key={option}>{option}</option>)}
        </Select>
        <Select label="Weekly capacity" value={form.weeklyCapacity} onChange={(v) => update("weeklyCapacity", v)} placeholder="Choose one">
          <option>1 short shift per week</option>
          <option>2–3 shifts per week</option>
          <option>4+ shifts per week</option>
          <option>Occasional fill-in only</option>
          <option>Not sure yet</option>
        </Select>
        <Select label="Reliable transportation?" value={form.transportation} onChange={(v) => update("transportation", v)} placeholder="Choose one" required>
          <option>Yes — I have a reliable vehicle</option>
          <option>Yes — I can reliably get to visits without my own vehicle</option>
          <option>Sometimes — depends on location</option>
          <option>No / not right now</option>
        </Select>
        <Select label="Travel radius" value={form.travelRadius} onChange={(v) => update("travelRadius", v)} placeholder="Choose one">
          <option>Within 5 miles</option>
          <option>Within 10 miles</option>
          <option>Within 15 miles</option>
          <option>Within 25 miles</option>
          <option>Depends on the visit/pay</option>
        </Select>
        <Select label="Experience level" value={form.experienceLevel} onChange={(v) => update("experienceLevel", v)} placeholder="Choose one">
          <option>New but willing to learn NestHelper standards</option>
          <option>Some personal/family home-help experience</option>
          <option>Paid regular home-cleaning experience</option>
          <option>Paid deep-cleaning or move-out cleaning experience</option>
          <option>Professional cleaning/organizing experience</option>
          <option>Caregiving/family support background</option>
        </Select>
      </Grid>

      <CheckboxGroup
        label="Services you’re comfortable with"
        description="Choose every service you are generally open to. This helps us match deep cleaners, regular cleaners, move-out cleaners, and general helpers to the right work. It does not guarantee you will be assigned every selected service."
        options={helperServiceOptions}
        values={form.services}
        onChange={(option, checked) => toggle("services", option, checked)}
      />

      <CheckboxGroup
        label="Work-style fit"
        description="These are preferences, not hard limits. It is okay to select more than one. Use the not-willing section below for firm boundaries."
        options={helperWorkStyleOptions}
        values={form.workStyle}
        onChange={(option, checked) => toggle("workStyle", option, checked)}
      />

      <CheckboxGroup
        label="Comfort level"
        description="Choose either the comfort items that apply or the empty-homes-only option. Empty-homes-only is exclusive and disables the other comfort choices until it is unchecked."
        options={helperComfortOptions}
        values={form.comfortLevel}
        disabledOptions={form.comfortLevel.includes(EMPTY_HOME_ONLY_COMFORT) ? helperComfortOptions.filter((option) => option !== EMPTY_HOME_ONLY_COMFORT) : []}
        onChange={(option, checked) => toggle("comfortLevel", option, checked)}
      />

      <CheckboxGroup
        label="Not willing to do / needs approval first"
        description="Use this for hard no’s or items that need review before NestHelper assigns a visit. These choices override conflicting comfort/service choices above."
        options={helperNotWillingOptions}
        values={form.notWillingToDo}
        onChange={(option, checked) => toggle("notWillingToDo", option, checked)}
      />

      <Textarea label="Relevant experience details" value={form.experience} onChange={(v) => update("experience", v)} placeholder="Briefly share paid cleaning, deep-cleaning, recurring cleaning, move-in/move-out, laundry, organizing, errands, family support, or customer service experience." />
      <Textarea label="References" value={form.references} onChange={(v) => update("references", v)} placeholder="Names/contact info or 'available upon request'." />
      <Textarea label="Anything else?" value={form.notes} onChange={(v) => update("notes", v)} placeholder="Schedule limits, areas you prefer, cleaning supplies/equipment experience, languages, allergies/sensitivities, or anything NestHelper should know." />

      <ApplicationDocumentUploadSection
        documents={documents}
        setDocuments={setDocuments}
        labelOptions={helperDocumentLabelOptions}
        description="Optional only. Upload documents you already have; NestHelper can request the rest later through onboarding."
      />

      <label className="flex gap-3 rounded-2xl bg-nest-cream p-4 text-sm font-semibold">
        <input type="checkbox" required className="mt-1" checked={form.backgroundConsent} onChange={(e) => update("backgroundConsent", e.target.checked)} />
        I understand Gold Star Checked onboarding may include identity review, background screening, references, service standards, and role-specific checks. I will not submit SSN/ID photos through this website form.
      </label>
      <Submit status={status}>Submit Helper Application</Submit>
      {message && <Message status={status}>{message}</Message>}
    </form>
  );
}

export function PartnerApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<PartnerFormState>(() => mergeCampaignAttribution(partnerDefaultState));
  const [documents, setDocuments] = useState<ApplicationDocumentDraft[]>([emptyDocumentDraft()]);
  const showHowFoundUsDetails = shouldShowHowFoundUsDetails(form.howFoundUs);

  useEffect(() => {
    setForm((prev) => mergeCampaignAttribution(prev));
  }, []);

  const update = (name: keyof PartnerFormState, value: unknown) => setForm((prev) => ({ ...prev, [name]: value }));
  const toggle = (name: "serviceType" | "serviceArea" | "availability" | "documentsAvailable", value: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      [name]: checked ? [...prev[name], value] : prev[name].filter((item) => item !== value),
    }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const documentError = validateApplicationDocuments(documents);
    if (documentError) {
      setStatus("error");
      setMessage(documentError);
      return;
    }

    try {
      const response = await fetch("/api/submit-partner-application", {
        method: "POST",
        body: buildApplicationFormData(form, documents),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Partner application failed");

      const warning = typeof result?.warning === "string" ? result.warning : "";
      setStatus("success");
      setMessage(warning || "Partner application received. We’ll review service fit, standards, insurance/business information, and availability before next steps.");
      setForm(mergeCampaignAttribution(partnerDefaultState));
      setDocuments([emptyDocumentDraft()]);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} onInvalidCapture={focusFirstInvalidField} className="grid gap-5 overflow-hidden rounded-[2.5rem] border border-nest-gold/18 bg-white/90 p-5 shadow-soft backdrop-blur sm:p-8">
      <div className="rounded-[1.75rem] bg-gradient-to-br from-nest-cream via-white to-nest-mint/30 p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">Partner provider</p>
        <h2 className="mt-2 text-2xl font-black text-nest-teal">Independent Contractor / Partner Provider Application</h2>
        <p className="mt-2 text-nest-ink/70">For cleaning companies, independent cleaners/contractors, laundromats, errand providers, organizers, and local businesses interested in partnering with NestHelper.</p>
      </div>

      <Grid>
        <Input label="Business name" value={form.businessName} onChange={(v) => update("businessName", v)} required />
        <Input label="Owner/contact name" value={form.ownerName} onChange={(v) => update("ownerName", v)} required />
        <Input label="Phone" value={form.phone} onChange={(v) => update("phone", formatPhoneNumber(v))} required inputMode="tel" autoComplete="tel" placeholder="555-555-5555" />
        <Input label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
        <Select label="How did you hear about NestHelper?" value={form.howFoundUs} onChange={(v) => update("howFoundUs", v)} placeholder="Choose one">
          {howFoundUsOptions.map((option) => <option key={option}>{option}</option>)}
        </Select>
        {showHowFoundUsDetails && (
          <Input label="Referral/source details (optional)" value={form.howFoundUsDetails} onChange={(v) => update("howFoundUsDetails", v)} placeholder="Name, business, group, post, flyer location, or other details" />
        )}
      </Grid>

      <CheckboxGroup
        label="Service types"
        options={partnerServiceOptions}
        values={form.serviceType}
        onChange={(option, checked) => toggle("serviceType", option, checked)}
      />

      <Grid>
        <Input label="Website/social link" value={form.website} onChange={(v) => update("website", v)} placeholder="Website, Instagram, Facebook, Google profile, etc." />
        <Select label="Business structure" value={form.businessStructure} onChange={(v) => update("businessStructure", v)} placeholder="Choose one">
          <option>LLC</option>
          <option>Sole proprietor</option>
          <option>Corporation</option>
          <option>Partnership</option>
          <option>Independent contractor / individual provider</option>
          <option>Not sure yet</option>
        </Select>
        <Select label="Business license / UBI status" value={form.licenseStatus} onChange={(v) => update("licenseStatus", v)} placeholder="Choose one">
          <option>Active Washington business license / UBI</option>
          <option>Applied / pending</option>
          <option>Licensed in another state</option>
          <option>No license yet</option>
          <option>Not sure</option>
        </Select>
        <Select label="Insurance status" value={form.insuranceStatus} onChange={(v) => update("insuranceStatus", v)} placeholder="Choose one">
          <option>General liability insurance active</option>
          <option>Bonded and insured</option>
          <option>Insurance pending</option>
          <option>No insurance yet</option>
          <option>Not sure</option>
        </Select>
        <Select label="Capacity" value={form.capacity} onChange={(v) => update("capacity", v)} placeholder="Choose one">
          <option>1–2 jobs per week</option>
          <option>3–5 jobs per week</option>
          <option>6+ jobs per week</option>
          <option>Recurring route capacity</option>
          <option>Occasional overflow only</option>
          <option>Not sure yet</option>
        </Select>
      </Grid>

      <CheckboxGroup
        label="Service areas"
        options={partnerAreaOptions}
        values={form.serviceArea}
        onChange={(option, checked) => toggle("serviceArea", option, checked)}
      />
      <Textarea label="Service area details" value={form.serviceAreaDetails} onChange={(v) => update("serviceAreaDetails", v)} placeholder="Add exact cities, ZIP codes, travel limits, or areas you do not cover." />

      <CheckboxGroup
        label="Availability / schedule fit"
        options={helperAvailabilityOptions}
        values={form.availability}
        onChange={(option, checked) => toggle("availability", option, checked)}
      />

      <CheckboxGroup
        label="Documents or proof you can provide later"
        options={partnerDocumentOptions}
        values={form.documentsAvailable}
        onChange={(option, checked) => toggle("documentsAvailable", option, checked)}
      />

      <ApplicationDocumentUploadSection
        documents={documents}
        setDocuments={setDocuments}
        labelOptions={partnerDocumentLabelOptions}
        description="Optional only. Upload business documents you already have. Do not upload SSNs or private tax IDs here."
      />

      <Textarea label="Business license / UBI details" value={form.licenseInfo} onChange={(v) => update("licenseInfo", v)} placeholder="Basic info only. We’ll request documents securely later if needed." />
      <Textarea label="Insurance / bonding details" value={form.insuranceInfo} onChange={(v) => update("insuranceInfo", v)} placeholder="Carrier/type/status is enough here. Optional certificates can be uploaded above if you already have them." />
      <Textarea label="Anything else?" value={form.notes} onChange={(v) => update("notes", v)} placeholder="Experience, deep-cleaning or recurring route capacity, service standards, equipment, detergents/products, team size, special notes, or questions." />

      <label className="flex gap-3 rounded-2xl bg-nest-cream p-4 text-sm font-semibold">
        <input type="checkbox" required className="mt-1" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} />
        I understand this application does not guarantee partnership. NestHelper may review business records, insurance, service quality, reliability, and customer standards.
      </label>
      <Submit status={status}>Submit Partner Application</Submit>
      {message && <Message status={status}>{message}</Message>}
    </form>
  );
}

function ApplicationDocumentUploadSection({
  documents,
  setDocuments,
  labelOptions,
  description,
}: {
  documents: ApplicationDocumentDraft[];
  setDocuments: (updater: ApplicationDocumentDraft[] | ((prev: ApplicationDocumentDraft[]) => ApplicationDocumentDraft[])) => void;
  labelOptions: string[];
  description: string;
}) {
  const updateDocument = (id: string, patch: Partial<ApplicationDocumentDraft>) => {
    setDocuments((prev) => prev.map((document) => (document.id === id ? { ...document, ...patch } : document)));
  };

  const addDocument = () => setDocuments((prev) => (prev.length >= 5 ? prev : [...prev, emptyDocumentDraft()]));
  const removeDocument = (id: string) => setDocuments((prev) => (prev.length <= 1 ? [emptyDocumentDraft()] : prev.filter((document) => document.id !== id)));

  return (
    <div className="rounded-[1.75rem] border border-nest-gold/20 bg-nest-cream p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">Optional documents</p>
          <h3 className="mt-1 text-xl font-black text-nest-teal">Upload and label files you already have</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-nest-ink/70">
            {description} Accepted files: PDF, Word, JPG, PNG, WEBP, HEIC/HEIF. Max 5 files, 3 MB each, 3.6 MB total. Larger/sensitive documents can be requested later through secure onboarding.
          </p>
        </div>
        <button
          type="button"
          onClick={addDocument}
          disabled={documents.length >= 5}
          className="w-fit rounded-full border border-nest-teal/20 bg-white px-4 py-2 text-xs font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:border-nest-gold disabled:opacity-50"
        >
          Add another file
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {documents.map((document, index) => (
          <div key={document.id} className="grid gap-3 rounded-2xl border border-nest-gold/15 bg-white p-4 md:grid-cols-[minmax(0,240px)_1fr_auto] md:items-end">
            <Select label={`File ${index + 1} label`} value={document.label} onChange={(v) => updateDocument(document.id, { label: v })} placeholder="Choose label">
              {labelOptions.map((option) => <option key={option}>{option}</option>)}
            </Select>
            <label className="grid gap-2">
              <span className="label">File</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && !isAllowedApplicationDocument(file)) {
                    e.target.value = "";
                    window.alert("Please upload a PDF, Word, JPG, PNG, WEBP, HEIC, or HEIF file.");
                    updateDocument(document.id, { file: null });
                    return;
                  }
                  if (file && file.size > MAX_APPLICATION_DOCUMENT_BYTES) {
                    e.target.value = "";
                    window.alert(`Please keep each optional document under ${formatDocumentSize(MAX_APPLICATION_DOCUMENT_BYTES)}.`);
                    updateDocument(document.id, { file: null });
                    return;
                  }
                  updateDocument(document.id, { file });
                }}
                className="input file:mr-3 file:rounded-full file:border-0 file:bg-nest-teal file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
              />
              {document.file && <span className="text-xs font-semibold text-nest-ink/60">Selected: {document.file.name}</span>}
            </label>
            <button
              type="button"
              onClick={() => removeDocument(document.id)}
              className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700 transition hover:bg-red-100"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs font-semibold leading-5 text-nest-ink/65">
        Privacy note: do not upload Social Security numbers, full tax IDs, or sensitive identity/background-check documents unless NestHelper specifically requests them through a secure onboarding step.
      </p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false, placeholder = "", inputMode, autoComplete }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string; inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string }) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}{required && <span className="ml-1 text-red-600">*</span>}</span>
      <input type={type} required={required} value={value} placeholder={placeholder} inputMode={inputMode} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} className="input" />
    </label>
  );
}

function Select({ label, value, onChange, required = false, placeholder = "Choose one", children }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}{required && <span className="ml-1 text-red-600">*</span>}</span>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="input">
        <option value="">{placeholder}</option>
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="input min-h-28" />
    </label>
  );
}

function CheckboxGroup({
  label,
  description,
  options,
  values,
  disabledOptions = [],
  onChange,
}: {
  label: string;
  description?: string;
  options: string[];
  values: string[];
  disabledOptions?: string[];
  onChange: (option: string, checked: boolean) => void;
}) {
  return (
    <div>
      <div className="label mb-2">{label}</div>
      {description && <p className="mb-3 text-sm font-semibold text-nest-ink/65">{description}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option);
          const disabled = disabledOptions.includes(option);
          return (
            <label
              key={option}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition ${
                disabled
                  ? "cursor-not-allowed border-nest-gold/10 bg-slate-50 text-nest-ink/35"
                  : checked
                    ? "border-nest-gold/45 bg-nest-mint/35 text-nest-teal shadow-sm"
                    : "border-nest-gold/10 bg-nest-cream text-nest-ink/78 hover:bg-nest-mint/25"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-nest-teal disabled:cursor-not-allowed"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(option, e.target.checked)}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Submit({ status, children }: { status: Status; children: ReactNode }) {
  return (
    <button disabled={status === "loading"} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-nest-teal px-6 py-4 font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift disabled:opacity-60">
      {status === "loading" ? "Submitting..." : children}
      {status !== "loading" && <ArrowRight size={18} />}
    </button>
  );
}

function Message({ status, children }: { status: Status; children: ReactNode }) {
  return <p className={`rounded-2xl p-4 font-semibold ${status === "success" ? "bg-nest-mint/45 text-nest-teal" : "bg-red-50 text-red-700"}`}>{children}</p>;
}
