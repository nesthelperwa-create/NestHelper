export const emailAliases = {
  hello: process.env.NESTHELPER_HELLO_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@nesthelperwa.com",
  support: process.env.NESTHELPER_SUPPORT_EMAIL || "support@nesthelperwa.com",
  help: process.env.NESTHELPER_HELP_EMAIL || "help@nesthelperwa.com",
  info: process.env.NESTHELPER_INFO_EMAIL || "info@nesthelperwa.com",
  booking: process.env.NESTHELPER_BOOKING_EMAIL || "booking@nesthelperwa.com",
  requests: process.env.NESTHELPER_REQUESTS_EMAIL || "requests@nesthelperwa.com",
  billing: process.env.NESTHELPER_BILLING_EMAIL || "billing@nesthelperwa.com",
  payments: process.env.NESTHELPER_PAYMENTS_EMAIL || "payments@nesthelperwa.com",
  laundry: process.env.NESTHELPER_LAUNDRY_EMAIL || "laundry@nesthelperwa.com",
  commercial: process.env.NESTHELPER_COMMERCIAL_EMAIL || "commercial@nesthelperwa.com",
  helpers: process.env.NESTHELPER_HELPERS_EMAIL || "helpers@nesthelperwa.com",
  partners: process.env.NESTHELPER_PARTNERS_EMAIL || "partners@nesthelperwa.com",
  jobs: process.env.NESTHELPER_JOBS_EMAIL || "jobs@nesthelperwa.com",
  admin: process.env.NESTHELPER_ADMIN_EMAIL || "admin@nesthelperwa.com",
  contact: process.env.NESTHELPER_CONTACT_EMAIL || "contact@nesthelperwa.com",
} as const;

type SubmissionCollection = "serviceRequests" | "helperApplications" | "partnerApplications" | "contactMessages";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getPublicReplyEmail() {
  return emailAliases.hello;
}


function isCommercialService(payload: Record<string, unknown>) {
  const combined = [
    payload.service,
    payload.selectedServiceTitle,
    payload.serviceTitle,
    payload.selectedPackage,
    payload.packageType,
    payload.requestType,
  ]
    .map(clean)
    .join(" ");

  return combined.includes("commercial");
}

function isLaundryService(payload: Record<string, unknown>) {
  const combined = [
    payload.service,
    payload.selectedServiceTitle,
    payload.serviceTitle,
    payload.selectedPackage,
  ]
    .map(clean)
    .join(" ");

  return combined.includes("laundry");
}

export function getContactTopicEmail(topic: unknown) {
  const normalized = clean(topic);

  if (normalized.includes("billing") || normalized.includes("payment") || normalized.includes("invoice") || normalized.includes("refund")) {
    return emailAliases.billing;
  }

  if (normalized.includes("commercial") || normalized.includes("business") || normalized.includes("office") || normalized.includes("janitorial")) {
    return emailAliases.commercial;
  }

  if (normalized.includes("laundry")) {
    return emailAliases.laundry;
  }

  if (normalized.includes("helper") || normalized.includes("job")) {
    return emailAliases.helpers;
  }

  if (normalized.includes("partner") || normalized.includes("provider") || normalized.includes("contractor")) {
    return emailAliases.partners;
  }

  if (normalized.includes("existing") || normalized.includes("issue") || normalized.includes("support")) {
    return emailAliases.support;
  }

  if (normalized.includes("request") || normalized.includes("booking") || normalized.includes("schedule")) {
    return emailAliases.booking;
  }

  return emailAliases.hello;
}

export function getSubmissionNotificationEmail(collection: SubmissionCollection, payload: Record<string, unknown>) {
  // Keep aliases for internal sorting/routing into the hello@ mailbox.
  if (collection === "serviceRequests") {
    if (isCommercialService(payload)) return emailAliases.commercial;
    if (isLaundryService(payload)) return emailAliases.laundry;
    return emailAliases.booking;
  }
  if (collection === "helperApplications") return emailAliases.helpers;
  if (collection === "partnerApplications") return emailAliases.partners;
  if (collection === "contactMessages") return getContactTopicEmail(payload.topic || payload.subject);
  return process.env.ADMIN_NOTIFICATION_EMAIL || emailAliases.hello;
}

export function getCustomerReplyEmail(collection: SubmissionCollection, payload: Record<string, unknown>) {
  if (collection === "serviceRequests") {
    if (isCommercialService(payload)) return emailAliases.commercial;
    if (isLaundryService(payload)) return emailAliases.laundry;
    return emailAliases.booking;
  }
  if (collection === "helperApplications") return emailAliases.helpers;
  if (collection === "partnerApplications") return emailAliases.partners;
  if (collection === "contactMessages") return getContactTopicEmail(payload.topic || payload.subject);
  return getPublicReplyEmail();
}


export function getContactTopicLabel(topic: unknown) {
  const normalized = clean(topic);

  if (normalized.includes("billing") || normalized.includes("payment") || normalized.includes("invoice") || normalized.includes("refund")) {
    return "Billing";
  }

  if (normalized.includes("commercial") || normalized.includes("business") || normalized.includes("office") || normalized.includes("janitorial")) {
    return "Commercial";
  }

  if (normalized.includes("laundry")) {
    return "Laundry";
  }

  if (normalized.includes("helper") || normalized.includes("job")) {
    return "Helpers";
  }

  if (normalized.includes("partner") || normalized.includes("provider") || normalized.includes("contractor")) {
    return "Partners";
  }

  if (normalized.includes("existing") || normalized.includes("issue") || normalized.includes("support")) {
    return "Support";
  }

  if (normalized.includes("request") || normalized.includes("booking") || normalized.includes("schedule")) {
    return "Booking";
  }

  return "General";
}

export function getSubmissionRouteLabel(collection: SubmissionCollection, payload: Record<string, unknown>) {
  if (collection === "serviceRequests") {
    if (isLaundryService(payload)) return "Laundry";
    if (isCommercialService(payload)) return "Commercial";
    return "Booking";
  }
  if (collection === "helperApplications") return "Helpers";
  if (collection === "partnerApplications") return "Partners";
  if (collection === "contactMessages") return `Contact: ${getContactTopicLabel(payload.topic || payload.subject)}`;
  return "Admin";
}

function getAliasShortName(email: string) {
  const localPart = email.split("@")[0]?.trim();
  return localPart ? `${localPart}@` : email;
}

export function getSubmissionSubjectPrefix(collection: SubmissionCollection, payload: Record<string, unknown>) {
  const routeLabel = getSubmissionRouteLabel(collection, payload);
  const routedTo = getSubmissionNotificationEmail(collection, payload);
  return `[NestHelper ${routeLabel} → ${getAliasShortName(routedTo)}]`;
}


function splitNotificationEmails(value: string | undefined) {
  return String(value || "")
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.includes("@"));
}

function uniqueEmails(emails: string[]) {
  const seen = new Set<string>();
  return emails.filter((email) => {
    const normalized = email.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function getPrimaryAdminNotificationRecipients() {
  // Send website admin notifications only to the NestHelper mailbox.
  // This prevents accidental replies from nesthelperwa@gmail.com while the subject/body
  // still label the website route, such as Billing, Laundry, Helpers, or Partners.
  return uniqueEmails([emailAliases.hello]);
}
