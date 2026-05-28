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
  helpers: process.env.NESTHELPER_HELPERS_EMAIL || "helpers@nesthelperwa.com",
  partners: process.env.NESTHELPER_PARTNERS_EMAIL || "partners@nesthelperwa.com",
  jobs: process.env.NESTHELPER_JOBS_EMAIL || "jobs@nesthelperwa.com",
  admin: process.env.NESTHELPER_ADMIN_EMAIL || "admin@nesthelperwa.com",
  contact: process.env.NESTHELPER_CONTACT_EMAIL || "contact@nesthelperwa.com",
} as const;

export type EmailAliasKey = keyof typeof emailAliases;
export type SubmissionCollection = "serviceRequests" | "helperApplications" | "partnerApplications" | "contactMessages";

const aliasDisplayNames: Record<EmailAliasKey, string> = {
  hello: "NestHelper",
  support: "NestHelper Support",
  help: "NestHelper Help",
  info: "NestHelper Info",
  booking: "NestHelper Booking",
  requests: "NestHelper Requests",
  billing: "NestHelper Billing",
  payments: "NestHelper Payments",
  laundry: "NestHelper Laundry",
  helpers: "NestHelper Helpers",
  partners: "NestHelper Partners",
  jobs: "NestHelper Jobs",
  admin: "NestHelper Admin",
  contact: "NestHelper Contact",
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getAliasKeyForEmail(email: string): EmailAliasKey | undefined {
  const normalized = normalizeEmail(email);
  return (Object.keys(emailAliases) as EmailAliasKey[]).find((key) => normalizeEmail(emailAliases[key]) === normalized);
}

function titleCaseWords(value: string) {
  return value
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getFallbackAliasDisplayName(email: string) {
  const localPart = email.split("@")[0]?.trim();
  return localPart ? `NestHelper ${titleCaseWords(localPart)}` : "NestHelper";
}

export function getAliasDisplayName(email: string) {
  const aliasKey = getAliasKeyForEmail(email);
  return aliasKey ? aliasDisplayNames[aliasKey] : getFallbackAliasDisplayName(email);
}

export function formatNestHelperSender(email: string) {
  const safeEmail = email.trim();
  const displayName = getAliasDisplayName(safeEmail).replaceAll('"', "'");
  return `${displayName} <${safeEmail}>`;
}

export function getContactTopicEmail(topic: unknown) {
  const normalized = clean(topic);

  if (normalized.includes("billing") || normalized.includes("payment") || normalized.includes("invoice") || normalized.includes("refund")) {
    return emailAliases.billing;
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
  if (collection === "serviceRequests") return emailAliases.requests;
  if (collection === "helperApplications") return emailAliases.helpers;
  if (collection === "partnerApplications") return emailAliases.partners;
  if (collection === "contactMessages") return getContactTopicEmail(payload.topic || payload.subject);
  return process.env.ADMIN_NOTIFICATION_EMAIL || emailAliases.hello;
}

export function getCustomerReplyEmail(collection: SubmissionCollection, payload: Record<string, unknown>) {
  if (collection === "serviceRequests") return emailAliases.booking;
  if (collection === "helperApplications") return emailAliases.helpers;
  if (collection === "partnerApplications") return emailAliases.partners;
  if (collection === "contactMessages") return getContactTopicEmail(payload.topic || payload.subject);
  return emailAliases.support;
}

export function getCustomerFacingSender(collection: SubmissionCollection, payload: Record<string, unknown>) {
  return formatNestHelperSender(getCustomerReplyEmail(collection, payload));
}

export function getAdminNotificationSender(collection: SubmissionCollection, payload: Record<string, unknown>) {
  return formatNestHelperSender(getSubmissionNotificationEmail(collection, payload));
}

export function getContactTopicLabel(topic: unknown) {
  const normalized = clean(topic);

  if (normalized.includes("billing") || normalized.includes("payment") || normalized.includes("invoice") || normalized.includes("refund")) {
    return "Billing";
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
  if (collection === "serviceRequests") return "Requests";
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
