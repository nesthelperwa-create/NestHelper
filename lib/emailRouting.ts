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

type SubmissionCollection = "serviceRequests" | "helperApplications" | "partnerApplications" | "contactMessages";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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
