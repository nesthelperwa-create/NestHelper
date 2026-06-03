export const REFERRAL_PROGRAM = {
  programName: "NestHelper Family Referral Program",
  codePrefix: "NH-",
  defaultNewCustomerCredit: 25,
  defaultReferrerCredit: 25,
  laundryCredit: 15,
  statuses: ["Pending review", "Qualified", "Credit issued", "Credit used", "Declined"],
};

export function normalizeReferralCode(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 32);
}

export function getReferralCreditAmount(serviceId: unknown) {
  return serviceId === "laundry-rescue" ? REFERRAL_PROGRAM.laundryCredit : REFERRAL_PROGRAM.defaultNewCustomerCredit;
}
