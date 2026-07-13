"use client";

import { useEffect, useMemo, useState } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";

type AdminDoc = { id: string; [key: string]: any };
type CustomerCredit = { id: string; status?: string; amount?: number; remainingAmount?: number; creditCode?: string; customerEmail?: string; sourceReferredName?: string; [key: string]: any };

type FamilyLineItem = {
  id: string;
  preset: string;
  label: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  amount: string;
  note: string;
};

type FamilyBreakdownBuilderProps = {
  item: AdminDoc;
  availableCustomerCredits?: CustomerCredit[];
  formatMoney: (value: number) => string;
  onSaved: (updates: Record<string, unknown>) => void;
  onApplyCheckout: (payload: { amount: number; title: string; note: string }) => void;
  onApplyAdditionalPayment: (payload: { amount: number; reason: string; note: string }) => void;
};

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const FAMILY_PRESETS = [
  {
    id: "family-reset-standard",
    label: "Parent Reset Plan — $199",
    description: "Flat 3-hour Parent Reset Plan for selected family spaces, organizing, light cleaning, child-safe disinfecting, and approved simple in-home meal prep support.",
    unit: "flat",
    rate: "199",
    amount: "199",
  },
  {
    id: "family-reset-biweekly",
    label: "Parent Reset Plan repeat support — every 2 weeks",
    description: "Repeat 3-hour Parent Reset Plan support after the first completed standard visit. Intended for consistent selected-room scope and schedule.",
    unit: "visit",
    rate: "189",
    amount: "189",
  },
  {
    id: "family-reset-weekly",
    label: "Parent Reset Plan repeat support — weekly",
    description: "Weekly 3-hour Parent Reset Plan support after the first completed standard visit. Intended for consistent selected-room scope and schedule.",
    unit: "visit",
    rate: "179",
    amount: "179",
  },
  {
    id: "whole-home-reset-reviewed",
    label: "Whole Home Cleaning reviewed amount",
    description: "Draft whole-home cleaning estimate based on square footage, bedrooms/bathrooms, visit type, condition, pets, access, photos, and optional detail add-ons. Review before sending.",
    unit: "flat",
    rate: "329",
    amount: "329",
  },
  {
    id: "whole-home-reset-deep-clean",
    label: "Whole Home Cleaning first-time deep clean",
    description: "Higher-scope first-time deep clean or full-home reset reviewed amount after review.",
    unit: "flat",
    rate: "449",
    amount: "449",
  },
  {
    id: "specific-area-reset-reviewed",
    label: "Specific Area(s) Reset reviewed amount",
    description: "Reviewed amount for selected rooms or focused areas such as kitchen, bathroom(s), pantry, closet, playroom, laundry area, garage, fridge, oven, or a few rooms. Review before sending.",
    unit: "flat",
    rate: "249",
    amount: "249",
  },
  {
    id: "specific-area-reset-larger-scope",
    label: "Specific Area(s) Reset larger-scope reviewed amount",
    description: "Higher-scope area reset reviewed amount for larger spaces, heavier clutter, extra sorting, multiple zones, or longer approved time.",
    unit: "flat",
    rate: "449",
    amount: "449",
  },
  {
    id: "garage-reset-reviewed",
    label: "Garage / storage area reviewed amount",
    description: "Draft garage, storage, shed, or heavy-clutter estimate based on size, clutter level, sorting needs, access, photos, disposal prep, and safety notes. Review before sending.",
    unit: "flat",
    rate: "349",
    amount: "349",
  },
  {
    id: "move-out-cleaning-reviewed",
    label: "Move-In / Move-Out Cleaning reviewed amount",
    description: "Draft move-in / move-out cleaning estimate based on square footage, bedrooms/bathrooms, empty-home status, condition, photos, and priority areas. Review before sending.",
    unit: "flat",
    rate: "395",
    amount: "395",
  },
  {
    id: "move-out-cleaning-larger-scope",
    label: "Move-In / Move-Out larger-scope reviewed amount",
    description: "Higher-scope move-in / move-out cleaning reviewed amount for larger homes, extra kitchen/bathroom buildup, appliance/cabinet scope, or timing constraints after review.",
    unit: "flat",
    rate: "495",
    amount: "495",
  },
  {
    id: "move-out-inside-appliance",
    label: "Move-In / Move-Out inside appliance add-on",
    description: "Approved inside oven, refrigerator, or appliance cleaning add-on for move-in / move-out cleaning.",
    unit: "appliance",
    rate: "45",
    amount: "45",
  },
  {
    id: "move-prep-starting",
    label: "Move Prep before movers arrive — $199",
    description: "Move Prep starting package for light sorting, open-first boxes, simple labels, and short helper list. Includes up to 2 helper-hours.",
    unit: "flat",
    rate: "199",
    amount: "199",
  },
  {
    id: "move-prep-focused-room",
    label: "Focused room or area prep — $249",
    description: "Focused room or area prep for sorting, packing prep, organizing, or reset help in one room or area. Includes up to 2.5 helper-hours.",
    unit: "flat",
    rate: "249",
    amount: "249",
  },
  {
    id: "move-prep-unpack-reset",
    label: "After-move unpacking / home reset — from $299",
    description: "After-move unpacking or home reset support for open-first items, essentials, light unpacking, and getting key areas usable. Starts around 3 helper-hours.",
    unit: "flat",
    rate: "299",
    amount: "299",
  },
  {
    id: "move-prep-kitchen-setup",
    label: "After-move kitchen setup / kitchen reset — from $349",
    description: "After-move kitchen setup or kitchen reset for essentials, pantry/fridge basics, cabinet zones, and everyday-item flow. Starts around 3.5 helper-hours.",
    unit: "flat",
    rate: "349",
    amount: "349",
  },
  {
    id: "move-prep-smart-labels",
    label: "QR Smart Label setup — $99 up to 20 labels",
    description: "QR Smart Label setup for boxes, bins, shelves, closets, or storage areas. Includes setup for up to 20 labels.",
    unit: "flat",
    rate: "99",
    amount: "99",
  },
  {
    id: "move-prep-basic-supply-kit",
    label: "Basic packing supply kit — from $59",
    description: "Starter supplies for open-first boxes or one small area, such as a small set of boxes or bags, packing tape, marker, and simple labels. Final contents confirmed before checkout.",
    unit: "flat",
    rate: "59",
    amount: "59",
  },
  {
    id: "move-prep-larger-supply-kit",
    label: "Larger packing supply kit — reviewed before checkout",
    description: "For multiple rooms or bigger prep: more boxes, tape, packing paper or protection, labels, and marker. Quote after review so the customer only pays for what is needed.",
    unit: "flat",
    rate: "0",
    amount: "0",
  },
  {
    id: "move-prep-custom-review",
    label: "Move Prep custom review item",
    description: "Custom Move Prep, garage/storage/heavy clutter, larger QR setup, or separate review item. Enter the approved amount after review.",
    unit: "flat",
    rate: "0",
    amount: "0",
  },
  {
    id: "errand-helper-standard",
    label: "Errand Helper — $119",
    description: "Errand Helper base visit. Includes up to 2 hours and up to 15 driving miles. Extra distance, complex stops, reimbursements, or wait time can be added separately after review.",
    unit: "flat",
    rate: "119",
    amount: "119",
  },
  {
    id: "laundry-deposit-standard",
    label: "Laundry Rescue intro minimum — $59",
    description: "Laundry Rescue intro minimum. The $59 minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs. Additional weight, add-ons, bulky items, or approved changes are reviewed after dry weigh-in.",
    unit: "flat",
    rate: "59",
    amount: "59",
  },
  {
    id: "laundry-additional-weight",
    label: "Laundry additional weight — $2.25/lb",
    description: "Final-balance line for additional dry weight above the included 26.2 lbs, not for pounds already included in the $59 minimum.",
    unit: "lb",
    rate: "2.25",
    amount: "0",
  },
  {
    id: "detergent-addon",
    label: "Laundry detergent add-on",
    description: "Approved baby/sensitive or fragrance-free detergent add-on. Customer-provided detergent should be $0 and noted, not charged.",
    unit: "flat",
    rate: "5",
    amount: "5",
  },
  {
    id: "low-heat-addon",
    label: "Low heat dry add-on",
    description: "Approved low-heat dry preference.",
    unit: "flat",
    rate: "3",
    amount: "3",
  },
  {
    id: "hang-dry-addon",
    label: "Hang dry item add-on",
    description: "Hang-dry handling. Final amount depends on item count and drying instructions.",
    unit: "flat",
    rate: "5",
    amount: "5",
  },
  {
    id: "rush-return-addon",
    label: "Rush return add-on",
    description: "Rush return when approved and available.",
    unit: "flat",
    rate: "20",
    amount: "20",
  },
  {
    id: "approved-extra-helper-hour",
    label: "Approved extra helper-hour",
    description: "Approved extra helper time added after review. Use for Move Prep or other approved helper-hour work.",
    unit: "hour",
    rate: "65",
    amount: "65",
  },
  {
    id: "approved-extra-half-hour",
    label: "Approved extra 30 minutes",
    description: "Approved extra time added to the family service scope.",
    unit: "half-hour",
    rate: "35",
    amount: "35",
  },
  {
    id: "recurring-family-visit",
    label: "Recurring family reset visit",
    description: "Per-visit amount for recurring weekly or biweekly Parent Reset Plan support. Schedule is confirmed by NestHelper.",
    unit: "visit",
    rate: "189",
    amount: "189",
  },
  {
    id: "errand-extra-stop",
    label: "Approved extra errand stop",
    description: "Extra stop or route change approved before the errand begins.",
    unit: "stop",
    rate: "20",
    amount: "20",
  },
  {
    id: "errand-extra-mileage",
    label: "Approved extra mileage / distance",
    description: "Extra distance beyond the included errand mileage after review.",
    unit: "mile",
    rate: "2",
    amount: "0",
  },
  {
    id: "customer-credit",
    label: "Customer credit / adjustment",
    description: "Credit, discount, or courtesy adjustment entered below as a discount/credit amount.",
    unit: "flat",
    rate: "0",
    amount: "0",
  },
  {
    id: "custom-approved-line",
    label: "Custom approved line item",
    description: "Custom approved NestHelper family service charge.",
    unit: "flat",
    rate: "0",
    amount: "0",
  },
];

function cleanNumber(value: unknown) {
  const next = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(next) ? next : 0;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatServicePeriodLabel(start: string, end: string) {
  const cleanStart = getString(start);
  const cleanEnd = getString(end);
  if (cleanStart && cleanEnd) return `${cleanStart} to ${cleanEnd}`;
  if (cleanStart) return `Starts ${cleanStart}`;
  if (cleanEnd) return `Through ${cleanEnd}`;
  return "";
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getButtonClass(variant: ButtonVariant = "primary") {
  const base = "inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-black shadow-sm transition-all duration-150 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-55";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#075c58] text-white hover:-translate-y-0.5 hover:bg-[#064b48] focus:ring-[#075c58]/25 active:translate-y-0 active:scale-[0.99]",
    secondary: "border-2 border-[#075c58] bg-white text-[#075c58] hover:-translate-y-0.5 hover:bg-[#f4ecdc] focus:ring-[#075c58]/20 active:translate-y-0 active:scale-[0.99]",
    quiet: "border border-[#d8c18f] bg-white text-slate-700 hover:-translate-y-0.5 hover:border-[#075c58] hover:text-[#075c58] focus:ring-[#075c58]/15 active:translate-y-0 active:scale-[0.99]",
    danger: "border border-red-200 bg-white text-red-700 hover:-translate-y-0.5 hover:bg-red-50 focus:ring-red-700/15 active:translate-y-0 active:scale-[0.99]",
  };
  return `${base} ${variants[variant]}`;
}

function BuilderSpinner() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;
}

function getServiceLabel(item: AdminDoc) {
  const raw = String(item.service || item.selectedServiceTitle || item.packageType || "").toLowerCase();
  if (raw.includes("laundry")) return "Laundry Rescue";
  if (raw.includes("move-prep") || raw.includes("move prep") || raw.includes("home reset")) return "Move Prep & Home Reset";
  if (raw.includes("whole-home-reset") || raw.includes("whole home")) return "Whole Home Cleaning";
  if (raw.includes("specific-area-reset") || raw.includes("specific area") || raw.includes("area reset") || raw.includes("garage reset")) return "Specific Area(s) Reset";
  if (raw.includes("move-out") || raw.includes("move out") || raw.includes("move-in") || raw.includes("move in")) return "Move-In / Move-Out Cleaning";
  if (raw.includes("errand")) return "Errand Helper";
  if (raw.includes("family") || raw.includes("parent reset plan") || raw.includes("parent")) return "Parent Reset Plan";
  return getString(item.selectedServiceTitle) || "NestHelper family service";
}

function getMovePrepPresetId(item: AdminDoc) {
  const packageValue = String(item.movePrepPackage || item.packageType || item.selectedServiceTitle || item.service || "").toLowerCase();
  if (packageValue.includes("focused room") || packageValue.includes("focused area")) return "move-prep-focused-room";
  if (packageValue.includes("unpacking") || packageValue.includes("home reset") || packageValue.includes("move-in essentials")) return "move-prep-unpack-reset";
  if (packageValue.includes("kitchen")) return "move-prep-kitchen-setup";
  if (packageValue.includes("not sure") || packageValue.includes("custom quote") || packageValue.includes("heavy clutter") || packageValue.includes("garage") || packageValue.includes("storage") || packageValue.includes("shed")) return "move-prep-custom-review";
  return "move-prep-starting";
}

function getSuggestedPresetId(item: AdminDoc) {
  const raw = String(item.service || item.selectedServiceTitle || item.packageType || "").toLowerCase();
  if (raw.includes("laundry")) return "laundry-deposit-standard";
  if (raw.includes("move-prep") || raw.includes("move prep") || raw.includes("home reset")) return getMovePrepPresetId(item);
  if (raw.includes("garage reset") || raw.includes("arearesetarea: garage")) return "garage-reset-reviewed";
  if (raw.includes("whole-home-reset") || raw.includes("whole home")) return raw.includes("deep") ? "whole-home-reset-deep-clean" : "whole-home-reset-reviewed";
  if (raw.includes("specific-area-reset") || raw.includes("specific area") || raw.includes("area reset")) return "specific-area-reset-reviewed";
  if (raw.includes("move-out") || raw.includes("move out") || raw.includes("move-in") || raw.includes("move in")) return "move-out-cleaning-reviewed";
  if (raw.includes("errand")) return "errand-helper-standard";
  if (raw.includes("family") || raw.includes("parent reset plan") || raw.includes("parent")) return "family-reset-standard";
  return "family-reset-standard";
}

function getDefaultPaymentPlan(item: AdminDoc) {
  const raw = String(item.service || item.selectedServiceTitle || item.packageType || "").toLowerCase();
  if (raw.includes("laundry")) return "Laundry Rescue deposit";
  if (raw.includes("move-prep") || raw.includes("move prep") || raw.includes("home reset")) return "Move Prep & Home Reset reviewed amount";
  if (raw.includes("whole-home-reset") || raw.includes("whole home")) return "Whole Home Cleaning reviewed amount";
  if (raw.includes("specific-area-reset") || raw.includes("specific area") || raw.includes("area reset") || raw.includes("garage reset")) return "One-time specific area reset";
  if (raw.includes("move-out") || raw.includes("move out") || raw.includes("move-in") || raw.includes("move in")) return "One-time move-in / move-out cleaning";
  if (raw.includes("errand")) return "One-time errand helper";
  if (raw.includes("family") || raw.includes("parent reset plan") || raw.includes("parent")) return "Parent Reset Plan";
  return "One-time family service";
}

function getRecommendedRecurringPresetId(item: AdminDoc, cadence = "Every 2 weeks") {
  const weekly = cadence.toLowerCase().includes("weekly");
  return weekly ? "family-reset-weekly" : "family-reset-biweekly";
}

function getRecurringPresetAmount(presetId: string) {
  const preset = FAMILY_PRESETS.find((item) => item.id === presetId);
  return preset ? cleanNumber(preset.amount) : 0;
}

function getRecurringPlanLabel(cadence: string) {
  const clean = getString(cadence);
  if (!clean || clean === "Not recurring") return "Not recurring";
  return clean === "Weekly" ? "Recurring weekly family service" : "Recurring every 2 weeks";
}

function getNextVisitFromDate(dateValue: string, cadence: string) {
  const cleanDate = getString(dateValue);
  if (!cleanDate) return "";
  const date = new Date(`${cleanDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + (cadence === "Weekly" ? 7 : 14));
  return date.toISOString().slice(0, 10);
}

function hasIncomingFamilyReferral(item: AdminDoc) {
  return Boolean(item.incomingReferralCode || item.incomingReferralLinkId || item.referralCode || item.referralShareCode);
}

function getReferralCreditAmount(item: AdminDoc) {
  if (!hasIncomingFamilyReferral(item)) return 0;
  const savedAmount = cleanNumber(
    item.incomingReferralNewCustomerCreditAmount ||
      item.incomingReferralCreditAmount ||
      item.referralNewCustomerCreditAmount ||
      item.referralCreditAmount
  );
  if (savedAmount > 0) return savedAmount;
  const raw = String(item.service || item.selectedServiceTitle || item.packageType || "").toLowerCase();
  return raw.includes("laundry") ? 15 : 25;
}

function getReferralCreditLabel(item: AdminDoc, amount: number) {
  if (!amount) return "";
  const raw = String(item.service || item.selectedServiceTitle || item.packageType || "").toLowerCase();
  return raw.includes("laundry")
    ? `$${amount} Laundry Rescue referral credit`
    : `$${amount} family referral credit`;
}

function getAvailableCustomerCreditAmount(credits: CustomerCredit[] = []) {
  return credits.reduce((sum, credit) => {
    const amount = cleanNumber(credit.remainingAmount || credit.amount);
    const status = getString(credit.status).toLowerCase();
    return status === "available" && amount > 0 ? sum + amount : sum;
  }, 0);
}

function getAvailableCustomerCreditIds(credits: CustomerCredit[] = []) {
  return credits
    .filter((credit) => getString(credit.status).toLowerCase() === "available" && cleanNumber(credit.remainingAmount || credit.amount) > 0)
    .map((credit) => getString(credit.id || credit.creditCode))
    .filter(Boolean);
}

function getAvailableCustomerCreditLabel(amount: number) {
  return amount > 0 ? `$${amount} saved referral credit from this customer’s account` : "";
}

function getInitialDiscountCredit(item: AdminDoc, saved: Record<string, any>, availableCustomerCredits: CustomerCredit[] = []) {
  const savedDiscount = getString(saved.discountCredit);
  if (savedDiscount) return savedDiscount;
  const referralCredit = getReferralCreditAmount(item);
  const availableCustomerCredit = getAvailableCustomerCreditAmount(availableCustomerCredits);
  const suggestedCredit = referralCredit + availableCustomerCredit;
  return suggestedCredit > 0 ? String(suggestedCredit) : "0";
}

function buildDefaultCustomerNote(item: AdminDoc, availableCustomerCredits: CustomerCredit[] = []) {
  const referralCredit = getReferralCreditAmount(item);
  const availableCustomerCredit = getAvailableCustomerCreditAmount(availableCustomerCredits);
  const totalCredit = referralCredit + availableCustomerCredit;
  const referralText = totalCredit > 0
    ? ` A referral/customer credit of $${totalCredit} has been included in this payment summary.`
    : "";
  return String(item.service || "").includes("laundry")
    ? `Laundry intro minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs. A final balance invoice or payment link may be sent for additional weight, add-ons, bulky items, or approved changes.${referralText}`
    : `Any added time, errands, mileage, or scope changes are reviewed before a separate invoice or payment link is sent.${referralText}`;
}

function createLineFromPreset(presetId: string, overrides: Partial<FamilyLineItem> = {}): FamilyLineItem {
  const preset = FAMILY_PRESETS.find((item) => item.id === presetId) || FAMILY_PRESETS[0];
  return {
    id: makeId(),
    preset: preset.id,
    label: preset.label,
    description: preset.description,
    quantity: "1",
    unit: preset.unit,
    rate: preset.rate,
    amount: preset.amount,
    note: "",
    ...overrides,
  };
}

function createDefaultLinesFromRequest(item: AdminDoc): FamilyLineItem[] {
  const lines: FamilyLineItem[] = [createLineFromPreset(getSuggestedPresetId(item))];
  const service = String(item.service || item.selectedServiceTitle || item.packageType || "").toLowerCase();

  if (service.includes("laundry")) {
    const detergent = String(item.detergent || "").toLowerCase();
    const dryer = String(item.dryPreference || "").toLowerCase();
    const addOns = Array.isArray(item.laundryAddOns) ? item.laundryAddOns.map((value: unknown) => String(value)) : [];
    if (detergent.includes("baby") || detergent.includes("sensitive") || detergent.includes("fragrance-free")) {
      lines.push(createLineFromPreset("detergent-addon", { note: getString(item.detergent) }));
    }
    if (dryer.includes("low heat")) {
      lines.push(createLineFromPreset("low-heat-addon", { note: getString(item.dryPreference) }));
    }
    if (addOns.some((value) => value.toLowerCase().includes("hang dry"))) {
      lines.push(createLineFromPreset("hang-dry-addon", { note: "Customer selected hang-dry handling. Admin can adjust after review." }));
    }
    if (addOns.some((value) => value.toLowerCase().includes("rush"))) {
      lines.push(createLineFromPreset("rush-return-addon", { note: "Rush return only when approved and available. Admin can adjust the amount." }));
    }
    if (addOns.some((value) => value.toLowerCase().includes("bulky"))) {
      lines.push(createLineFromPreset("custom-approved-line", {
        label: "Bulky laundry item review",
        description: "Bulky items are reviewed and quoted separately before any additional charge.",
        amount: "0",
        rate: "0",
        note: "Customer selected bulky items quoted separately.",
      }));
    }
  }

  if (service.includes("move-prep") || service.includes("move prep") || service.includes("home reset")) {
    const selectedOptions = Array.isArray(item.movePrepOptions) ? item.movePrepOptions.map((value: unknown) => String(value)) : [];
    const hasLine = (presetId: string) => lines.some((line) => line.preset === presetId);
    const addMovePrepLine = (presetId: string, note: string) => {
      if (!hasLine(presetId)) lines.push(createLineFromPreset(presetId, { note }));
    };

    selectedOptions.forEach((option) => {
      const normalized = option.toLowerCase();
      if (normalized.includes("unpacking") || normalized.includes("home reset")) {
        addMovePrepLine("move-prep-unpack-reset", option);
      } else if (normalized.includes("kitchen")) {
        addMovePrepLine("move-prep-kitchen-setup", option);
      } else if (normalized.includes("qr smart") || normalized.includes("smart label")) {
        addMovePrepLine("move-prep-smart-labels", option);
      } else if (normalized.includes("basic packing supply")) {
        addMovePrepLine("move-prep-basic-supply-kit", option);
      } else if (normalized.includes("larger packing supply")) {
        addMovePrepLine("move-prep-larger-supply-kit", option);
      } else if (normalized.includes("garage") || normalized.includes("storage") || normalized.includes("shed") || normalized.includes("heavy clutter")) {
        addMovePrepLine("move-prep-custom-review", option);
      } else if (normalized.includes("move-out cleaning")) {
        lines.push(createLineFromPreset("custom-approved-line", {
          label: "Move-out cleaning quote review",
          description: "Customer asked for a separate move-out cleaning quote. Do not include unless reviewed and approved.",
          amount: "0",
          rate: "0",
          note: option,
        }));
      }
    });
  }

  if (service.includes("errand")) {
    const distance = String(item.errandDistance || "").toLowerCase();
    const stops = getString(item.errandStops);
    if (distance.includes("more than 15")) {
      lines.push(createLineFromPreset("errand-extra-mileage", { amount: "0", quantity: "0", note: "Customer selected more than 15 miles — quote before checkout." }));
    }
    if (stops.toLowerCase().includes("multiple")) {
      lines.push(createLineFromPreset("errand-extra-stop", { amount: "0", quantity: "0", note: "Review the stop count before charging extra stops." }));
    }
  }

  return lines;
}

function lineFromSaved(line: any): FamilyLineItem {
  return {
    id: getString(line.id) || makeId(),
    preset: getString(line.preset) || "custom-approved-line",
    label: getString(line.label) || "Custom approved line item",
    description: getString(line.description),
    quantity: getString(line.quantity) || "1",
    unit: getString(line.unit) || "flat",
    rate: getString(line.rate) || "0",
    amount: getString(line.amount) || "0",
    note: getString(line.note),
  };
}

function calculateLineAmount(line: FamilyLineItem) {
  const unit = line.unit.toLowerCase();
  if (unit === "flat") return Math.max(0, cleanNumber(line.amount));
  return Math.max(0, cleanNumber(line.quantity) * cleanNumber(line.rate));
}

function formatRate(rate: string) {
  const value = cleanNumber(rate);
  return Number.isFinite(value) ? `$${value.toFixed(value < 10 ? 2 : 0)}` : rate;
}

function formatQuantity(line: FamilyLineItem) {
  if (line.unit === "flat") return "Flat approved amount";
  const qty = cleanNumber(line.quantity);
  return `${qty || 0} ${line.unit}${qty === 1 ? "" : "s"} × ${formatRate(line.rate)}`;
}

function buildCustomerBreakdownText({
  quoteTitle,
  serviceLabel,
  paymentPlan,
  lineItems,
  subtotal,
  discountCredit,
  amountDueNow,
  laterAmount,
  customerNote,
  servicePeriodLabel,
  recurringTracking,
  formatMoney,
}: {
  quoteTitle: string;
  serviceLabel: string;
  paymentPlan: string;
  lineItems: FamilyLineItem[];
  subtotal: number;
  discountCredit: number;
  amountDueNow: number;
  laterAmount: number;
  customerNote: string;
  servicePeriodLabel: string;
  recurringTracking?: Record<string, any>;
  formatMoney: (value: number) => string;
}) {
  const itemLines = lineItems
    .filter((line) => calculateLineAmount(line) > 0 || line.label.trim())
    .map((line) => {
      const amount = calculateLineAmount(line);
      const details = [line.description, line.note ? `Note: ${line.note}` : ""].filter(Boolean).join(" ");
      return [
        `• ${line.label}`,
        `  Amount: ${formatMoney(amount)}`,
        `  Basis: ${formatQuantity(line)}`,
        details ? `  Details: ${details}` : "",
      ].filter(Boolean).join("\n");
    })
    .join("\n\n");

  const recurringLines = [
    recurringTracking?.status && recurringTracking.status !== "Not recurring"
      ? `Recurring plan: ${recurringTracking.cadence || "Recurring"} at ${formatMoney(cleanNumber(recurringTracking.rate))}/visit`
      : "",
    recurringTracking?.nextVisitDate ? `Next planned visit: ${recurringTracking.nextVisitDate}` : "",
  ].filter(Boolean);

  const amountLines = [
    `Subtotal: ${formatMoney(subtotal)}`,
    discountCredit > 0 ? `Discount / credit: -${formatMoney(discountCredit)}` : "",
    `Amount due now: ${formatMoney(amountDueNow)}`,
    laterAmount > 0 ? `Possible later/add-on amount: ${formatMoney(laterAmount)}` : "Possible later/add-on amount: None listed right now",
  ].filter(Boolean);

  return [
    quoteTitle || `${serviceLabel} payment summary`,
    "",
    "SERVICE DETAILS",
    `Service: ${serviceLabel}`,
    `Payment type: ${paymentPlan}`,
    servicePeriodLabel ? `Service period: ${servicePeriodLabel}` : "",
    ...recurringLines,
    "",
    "ITEMS INCLUDED",
    itemLines || "No line items listed yet.",
    "",
    "AMOUNT SUMMARY",
    ...amountLines,
    customerNote ? ["", "CUSTOMER NOTE", customerNote].join("\n") : "",
    "",
    "PLEASE NOTE",
    "This payment summary explains the amount being requested and keeps a record for NestHelper and the customer.",
    "Final timing, access, and service notes are confirmed before the visit.",
    "Added work, route changes, laundry final balance, or extra time may require a separate approved payment.",
  ]
    .filter((part) => part !== "")
    .join("\n");
}

function safeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export default function FamilyPaymentBreakdownBuilder({
  item,
  availableCustomerCredits = [],
  formatMoney,
  onSaved,
  onApplyCheckout,
  onApplyAdditionalPayment,
}: FamilyBreakdownBuilderProps) {
  const serviceLabel = getServiceLabel(item);
  const saved = (item.familyPaymentBreakdown || {}) as Record<string, any>;
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [quoteTitle, setQuoteTitle] = useState(getString(saved.quoteTitle) || `${serviceLabel} payment summary`);
  const [paymentPlan, setPaymentPlan] = useState(getString(saved.paymentPlan) || getDefaultPaymentPlan(item));
  const [servicePeriodStart, setServicePeriodStart] = useState(getString(saved.servicePeriodStart));
  const [servicePeriodEnd, setServicePeriodEnd] = useState(getString(saved.servicePeriodEnd));
  const [selectedPreset, setSelectedPreset] = useState(getSuggestedPresetId(item));
  const [lineItems, setLineItems] = useState<FamilyLineItem[]>(
    Array.isArray(saved.lineItems) && saved.lineItems.length ? saved.lineItems.map(lineFromSaved) : createDefaultLinesFromRequest(item)
  );
  const referralCreditAmount = getReferralCreditAmount(item);
  const referralCreditLabel = getReferralCreditLabel(item, referralCreditAmount);
  const availableCustomerCreditAmount = getAvailableCustomerCreditAmount(availableCustomerCredits);
  const availableCustomerCreditIds = getAvailableCustomerCreditIds(availableCustomerCredits);
  const availableCustomerCreditLabel = getAvailableCustomerCreditLabel(availableCustomerCreditAmount);
  const totalSuggestedCreditAmount = referralCreditAmount + availableCustomerCreditAmount;
  const totalSuggestedCreditLabel = [referralCreditLabel, availableCustomerCreditLabel].filter(Boolean).join(" + ");
  const [discountCredit, setDiscountCredit] = useState(getInitialDiscountCredit(item, saved, availableCustomerCredits));
  const [laterAmount, setLaterAmount] = useState(getString(saved.laterAmount) || "0");
  const [customerNote, setCustomerNote] = useState(getString(saved.customerNote) || buildDefaultCustomerNote(item, availableCustomerCredits));
  const [internalNotes, setInternalNotes] = useState(getString(saved.internalNotes));
  const [refundStatus, setRefundStatus] = useState(getString(item.familyRefundTracking?.refundStatus) || "No refund due");
  const [refundAmount, setRefundAmount] = useState(getString(item.familyRefundTracking?.refundAmount) || "0");
  const [refundReason, setRefundReason] = useState(getString(item.familyRefundTracking?.refundReason));
  const [customerNotified, setCustomerNotified] = useState(Boolean(item.familyRefundTracking?.customerNotified));
  const savedRecurring = (item.familyRecurringPlan || saved.recurringTracking || {}) as Record<string, any>;
  const [recurringStatus, setRecurringStatus] = useState(getString(savedRecurring.status) || "Not recurring");
  const [recurringCadence, setRecurringCadence] = useState(getString(savedRecurring.cadence) || "Every 2 weeks");
  const [recurringRate, setRecurringRate] = useState(getString(savedRecurring.rate) || String(getRecurringPresetAmount(getRecommendedRecurringPresetId(item, getString(savedRecurring.cadence) || "Every 2 weeks"))));
  const [nextVisitDate, setNextVisitDate] = useState(getString(savedRecurring.nextVisitDate));
  const [recurringCompletedVisits, setRecurringCompletedVisits] = useState(getString(savedRecurring.completedVisits) || "0");
  const [recurringMinimumVisits, setRecurringMinimumVisits] = useState(getString(savedRecurring.minimumVisits) || "2");
  const [recurringFirstVisitCompleted, setRecurringFirstVisitCompleted] = useState(Boolean(savedRecurring.firstVisitCompleted));
  const [recurringCardOnFile, setRecurringCardOnFile] = useState(Boolean(savedRecurring.cardOnFile));
  const [recurringAutoReady, setRecurringAutoReady] = useState(Boolean(savedRecurring.autoReady));
  const [recurringNotes, setRecurringNotes] = useState(getString(savedRecurring.notes));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const nextSaved = (item.familyPaymentBreakdown || {}) as Record<string, any>;
    const nextServiceLabel = getServiceLabel(item);
    setQuoteTitle(getString(nextSaved.quoteTitle) || `${nextServiceLabel} payment summary`);
    setPaymentPlan(getString(nextSaved.paymentPlan) || getDefaultPaymentPlan(item));
    setServicePeriodStart(getString(nextSaved.servicePeriodStart));
    setServicePeriodEnd(getString(nextSaved.servicePeriodEnd));
    setSelectedPreset(getSuggestedPresetId(item));
    setLineItems(Array.isArray(nextSaved.lineItems) && nextSaved.lineItems.length ? nextSaved.lineItems.map(lineFromSaved) : createDefaultLinesFromRequest(item));
    setDiscountCredit(getInitialDiscountCredit(item, nextSaved, availableCustomerCredits));
    setLaterAmount(getString(nextSaved.laterAmount) || "0");
    setCustomerNote(getString(nextSaved.customerNote) || buildDefaultCustomerNote(item, availableCustomerCredits));
    setInternalNotes(getString(nextSaved.internalNotes));
    setRefundStatus(getString(item.familyRefundTracking?.refundStatus) || "No refund due");
    setRefundAmount(getString(item.familyRefundTracking?.refundAmount) || "0");
    setRefundReason(getString(item.familyRefundTracking?.refundReason));
    setCustomerNotified(Boolean(item.familyRefundTracking?.customerNotified));
    const nextRecurring = (item.familyRecurringPlan || nextSaved.recurringTracking || {}) as Record<string, any>;
    const nextCadence = getString(nextRecurring.cadence) || "Every 2 weeks";
    setRecurringStatus(getString(nextRecurring.status) || "Not recurring");
    setRecurringCadence(nextCadence);
    setRecurringRate(getString(nextRecurring.rate) || String(getRecurringPresetAmount(getRecommendedRecurringPresetId(item, nextCadence))));
    setNextVisitDate(getString(nextRecurring.nextVisitDate));
    setRecurringCompletedVisits(getString(nextRecurring.completedVisits) || "0");
    setRecurringMinimumVisits(getString(nextRecurring.minimumVisits) || "2");
    setRecurringFirstVisitCompleted(Boolean(nextRecurring.firstVisitCompleted));
    setRecurringCardOnFile(Boolean(nextRecurring.cardOnFile));
    setRecurringAutoReady(Boolean(nextRecurring.autoReady));
    setRecurringNotes(getString(nextRecurring.notes));
    setMessage("");
    setError("");
    setDirty(false);
  }, [item.id, availableCustomerCredits.map((credit) => `${credit.id}:${credit.status}:${credit.remainingAmount || credit.amount}`).join("|")]);

  const subtotal = useMemo(() => lineItems.reduce((sum, line) => sum + calculateLineAmount(line), 0), [lineItems]);
  const discount = Math.max(0, cleanNumber(discountCredit));
  const amountDueNow = Math.max(0, subtotal - discount);
  const referralCreditApplied = totalSuggestedCreditAmount > 0 && discount >= totalSuggestedCreditAmount;
  const referralCreditNeedsAttention = totalSuggestedCreditAmount > 0 && discount < totalSuggestedCreditAmount;
  const possibleLaterAmount = Math.max(0, cleanNumber(laterAmount));
  const servicePeriodLabel = useMemo(() => formatServicePeriodLabel(servicePeriodStart, servicePeriodEnd), [servicePeriodStart, servicePeriodEnd]);
  const recurringRateValue = Math.max(0, cleanNumber(recurringRate));
  const recurringCompletedVisitCount = Math.max(0, Math.floor(cleanNumber(recurringCompletedVisits)));
  const recurringMinimumVisitCount = Math.max(1, Math.floor(cleanNumber(recurringMinimumVisits)) || 2);
  const recurringIsActive = recurringStatus === "Recurring active" || recurringStatus === "Approved recurring";
  const recurringReadyForNextInvoice = recurringIsActive && recurringFirstVisitCompleted && recurringRateValue > 0 && Boolean(nextVisitDate);
  const recurringNeedsSafeguard = recurringIsActive && (!recurringFirstVisitCompleted || recurringRateValue <= 0 || !nextVisitDate);
  const recurringTracking = {
    status: recurringStatus,
    cadence: recurringCadence,
    rate: Number(recurringRateValue.toFixed(2)),
    nextVisitDate,
    completedVisits: recurringCompletedVisitCount,
    minimumVisits: recurringMinimumVisitCount,
    firstVisitCompleted: recurringFirstVisitCompleted,
    cardOnFile: recurringCardOnFile,
    autoReady: recurringAutoReady,
    notes: recurringNotes,
    updatedAtLocal: new Date().toISOString(),
  };
  const customerBreakdownText = useMemo(
    () =>
      buildCustomerBreakdownText({
        quoteTitle,
        serviceLabel,
        paymentPlan,
        lineItems,
        subtotal,
        discountCredit: discount,
        amountDueNow,
        laterAmount: possibleLaterAmount,
        customerNote,
        servicePeriodLabel,
        recurringTracking,
        formatMoney,
      }),
    [quoteTitle, serviceLabel, paymentPlan, lineItems, subtotal, discount, amountDueNow, possibleLaterAmount, customerNote, servicePeriodLabel, recurringStatus, recurringCadence, recurringRateValue, nextVisitDate, recurringCompletedVisitCount, recurringMinimumVisitCount, recurringFirstVisitCompleted, recurringCardOnFile, recurringAutoReady, recurringNotes, formatMoney]
  );

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  function updateLine(id: string, updates: Partial<FamilyLineItem>) {
    markDirty();
    setLineItems((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;
        const next = { ...line, ...updates };
        if (updates.quantity !== undefined || updates.rate !== undefined || updates.unit !== undefined) {
          next.amount = next.unit === "flat" ? next.amount : String(calculateLineAmount(next));
        }
        return next;
      })
    );
  }

  function applyReferralCredit() {
    if (!totalSuggestedCreditAmount) return;
    markDirty();
    setDiscountCredit(String(Number(totalSuggestedCreditAmount.toFixed(2))));
    setInternalNotes((prev) => {
      const note = `${totalSuggestedCreditLabel || "Referral/customer credit"} applied before sending payment.`;
      return prev && prev.includes(note) ? prev : [prev, note].filter(Boolean).join("\n");
    });
    if (!customerNote.toLowerCase().includes("referral credit") && !customerNote.toLowerCase().includes("customer credit")) {
      setCustomerNote((prev) => `${prev}${prev.endsWith(" ") ? "" : " "}${totalSuggestedCreditLabel || "Referral/customer credit"} has been included in this payment summary.`);
    }
    setMessage(`${totalSuggestedCreditLabel || "Referral/customer credit"} applied. Save the family breakdown before creating the invoice or filling checkout.`);
  }

  function addLineFromPreset() {
    markDirty();
    setLineItems((prev) => [...prev, createLineFromPreset(selectedPreset)]);
  }

  function applyRecurringPlanToBuilder() {
    if (recurringStatus === "Not recurring") {
      setError("Activate the recurring plan before applying a future recurring rate.");
      return;
    }
    if (!recurringFirstVisitCompleted) {
      setError("Fail-safe: complete the first standard-price visit before using recurring pricing.");
      return;
    }
    const presetId = getRecommendedRecurringPresetId(item, recurringCadence);
    const preset = FAMILY_PRESETS.find((item) => item.id === presetId);
    const rate = recurringRateValue || getRecurringPresetAmount(presetId);
    if (!preset || rate <= 0) {
      setError("Set a recurring rate before applying the plan.");
      return;
    }
    markDirty();
    setPaymentPlan(getRecurringPlanLabel(recurringCadence));
    setQuoteTitle(`${serviceLabel} recurring reset visit`);
    setLineItems([createLineFromPreset(presetId, { amount: String(rate), rate: String(rate), note: "Recurring rate applied after first completed standard-price reset." })]);
    setDiscountCredit("0");
    setServicePeriodStart(nextVisitDate || servicePeriodStart);
    setCustomerNote("Recurring reset visit. Recurring pricing is reserved for consistent scope, schedule, service area, and helper availability. Schedule changes, added scope, or early cancellation may return future visits to standard pricing.");
    setMessage("Future recurring rate applied to this builder draft. Review, save, then create/send the next payment link or invoice.");
    setError("");
  }

  function fillNextRecurringCheckout() {
    if (!recurringReadyForNextInvoice) {
      setError("Recurring checkout blocked: mark first visit completed, choose an active recurring status, set the next visit date, and confirm the recurring rate.");
      return;
    }
    const note = `Recurring ${recurringCadence.toLowerCase()} reset visit${nextVisitDate ? ` planned for ${nextVisitDate}` : ""}. Recurring pricing applies after the first completed standard-price visit and depends on consistent scope, schedule, service area, and helper availability.`;
    onApplyCheckout({ amount: recurringRateValue, title: `${serviceLabel} recurring reset visit`, note });
    setMessage("Next recurring checkout amount filled. Review the payment card before sending.");
    setError("");
  }

  function advanceNextVisitDate() {
    const nextDate = getNextVisitFromDate(nextVisitDate || servicePeriodStart, recurringCadence);
    if (!nextDate) {
      setError("Add a next visit date first, then advance it.");
      return;
    }
    markDirty();
    setNextVisitDate(nextDate);
    setRecurringCompletedVisits(String(recurringCompletedVisitCount + 1));
    setMessage(`Next visit moved to ${nextDate}. Save the recurring plan to keep this update.`);
    setError("");
  }

  function resetToCustomerSelections() {
    if (!window.confirm("Replace current family payment lines with defaults from the customer request?")) return;
    markDirty();
    setLineItems(createDefaultLinesFromRequest(item));
    setQuoteTitle(`${getServiceLabel(item)} payment summary`);
    setPaymentPlan(getDefaultPaymentPlan(item));
    setServicePeriodStart("");
    setServicePeriodEnd("");
    setDiscountCredit(getInitialDiscountCredit(item, {}, availableCustomerCredits));
    setCustomerNote(buildDefaultCustomerNote(item, availableCustomerCredits));
  }

  function removeLine(id: string) {
    markDirty();
    setLineItems((prev) => prev.filter((line) => line.id !== id));
  }

  async function copyBreakdown() {
    await navigator.clipboard.writeText(customerBreakdownText);
    setMessage("Payment summary copied.");
  }

  function downloadBreakdown() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeHtml(quoteTitle)}</title><style>body{font-family:Arial,sans-serif;line-height:1.55;color:#233;padding:28px;}h1{color:#075c58;}pre{white-space:pre-wrap;font-family:Arial,sans-serif;border:1px solid #eadfc8;background:#fbf6ea;border-radius:16px;padding:18px;}</style></head><body><h1>${safeHtml(quoteTitle)}</h1><pre>${safeHtml(customerBreakdownText)}</pre></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nesthelper-payment-summary-${item.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function printBreakdown() {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      setError("Unable to open print preview. Use Download, then print the downloaded breakdown.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safeHtml(quoteTitle)}</title><style>body{font-family:Arial,sans-serif;line-height:1.55;color:#233;padding:28px;}h1{color:#075c58;}pre{white-space:pre-wrap;font-family:Arial,sans-serif;border:1px solid #eadfc8;background:#fbf6ea;border-radius:16px;padding:18px;}</style></head><body><h1>${safeHtml(quoteTitle)}</h1><pre>${safeHtml(customerBreakdownText)}</pre><script>window.onload=function(){window.focus();window.print();};</script></body></html>`);
    printWindow.document.close();
  }

  async function saveDraft() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/update-family-payment-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId: item.id,
          amountDueNow,
          additionalAmount: possibleLaterAmount,
          paymentPlan,
          quoteTitle,
          customerNote,
          internalNotes,
          servicePeriodStart,
          servicePeriodEnd,
          servicePeriodLabel,
          paymentBreakdown: {
            quoteTitle,
            serviceLabel,
            paymentPlan,
            servicePeriodStart,
            servicePeriodEnd,
            servicePeriodLabel,
            lineItems,
            subtotal: Number(subtotal.toFixed(2)),
            discountCredit: Number(discount.toFixed(2)),
            incomingReferralCreditAmount: Number(referralCreditAmount.toFixed(2)),
            appliedCustomerCreditIds: availableCustomerCreditIds,
            appliedCustomerCreditAmount: Number(availableCustomerCreditAmount.toFixed(2)),
            totalSuggestedCreditAmount: Number(totalSuggestedCreditAmount.toFixed(2)),
            amountDueNow: Number(amountDueNow.toFixed(2)),
            laterAmount: Number(possibleLaterAmount.toFixed(2)),
            customerNote,
            internalNotes,
            customerBreakdownText,
            recurringTracking,
          },
          recurringTracking,
          refundTracking: {
            refundStatus,
            refundAmount: Number(Math.max(0, cleanNumber(refundAmount)).toFixed(2)),
            refundReason,
            customerNotified,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to save family payment summary.");
      const updates = {
        familyPaymentBreakdown: {
          quoteTitle,
          serviceLabel,
          paymentPlan,
          servicePeriodStart,
          servicePeriodEnd,
          servicePeriodLabel,
          lineItems,
          subtotal: Number(subtotal.toFixed(2)),
          discountCredit: Number(discount.toFixed(2)),
          incomingReferralCreditAmount: Number(referralCreditAmount.toFixed(2)),
          appliedCustomerCreditIds: availableCustomerCreditIds,
          appliedCustomerCreditAmount: Number(availableCustomerCreditAmount.toFixed(2)),
          totalSuggestedCreditAmount: Number(totalSuggestedCreditAmount.toFixed(2)),
          amountDueNow: Number(amountDueNow.toFixed(2)),
          laterAmount: Number(possibleLaterAmount.toFixed(2)),
          customerNote,
          internalNotes,
          customerBreakdownText,
          recurringTracking,
        },
        familyPaymentStatus: "Breakdown saved",
        familyRecurringPlan: recurringTracking,
        familyInitialAmount: Number(amountDueNow.toFixed(2)),
        familyAdditionalAmount: Number(possibleLaterAmount.toFixed(2)),
        familyRefundTracking: {
          refundStatus,
          refundAmount: Number(Math.max(0, cleanNumber(refundAmount)).toFixed(2)),
          refundReason,
          customerNotified,
        },
      };
      onSaved(updates);
      setDirty(false);
      setMessage("Draft estimate saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save family payment summary.");
    } finally {
      setSaving(false);
    }
  }

  function attemptClose() {
    if (dirty && !window.confirm("You have unsaved family breakdown changes. Close without saving?")) return;
    setOpen(false);
  }

  return (
    <div className="mb-5 rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98a2f]">Family payment / invoice builder</p>
          <h4 className="mt-1 text-xl font-black text-[#075c58]">Simple breakdown for family requests</h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Use this to explain the amount to the customer, create a saved record for NestHelper, customize package/add-on lines, and support checkout or Stripe invoice payments if questions come up later.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#075c58] shadow-sm">
            Amount due now: {formatMoney(amountDueNow)}
            {referralCreditApplied && <span className="mt-1 block text-xs text-emerald-700">Referral/customer credit included: -{formatMoney(totalSuggestedCreditAmount)}</span>}{referralCreditNeedsAttention && <span className="mt-1 block text-xs text-amber-700">Referral/customer credit needs review: -{formatMoney(totalSuggestedCreditAmount)}</span>}
          </div>
          {recurringStatus !== "Not recurring" && (
            <div className={`rounded-2xl px-4 py-3 text-xs font-black shadow-sm ${recurringNeedsSafeguard ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              Recurring: {recurringStatus} • {recurringCadence} • {formatMoney(recurringRateValue)}/visit
              {nextVisitDate && <span className="block">Next: {nextVisitDate}</span>}
            </div>
          )}
          <button type="button" onClick={() => setOpen(true)} className={getButtonClass("primary")}>Open family builder</button>
        </div>
      </div>
      {totalSuggestedCreditAmount > 0 && (
        <div className={`mt-4 rounded-3xl border px-4 py-3 text-sm leading-6 ${referralCreditApplied ? "border-emerald-100 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          <p className="font-black">Referral/customer credit detected: -{formatMoney(totalSuggestedCreditAmount)}</p>
          <p className="mt-1 font-semibold">
            {availableCustomerCreditAmount > 0 ? `Available saved credit on this customer email: -${formatMoney(availableCustomerCreditAmount)}. ` : ""}
            {referralCreditApplied
              ? "This credit is already included in the builder total. Save the breakdown, then create the invoice or fill checkout from the builder amount."
              : "Open the builder and apply/save this credit before sending a payment link or invoice."}
          </p>
        </div>
      )}
      {message && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p>}
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[4.25rem] z-[120] overflow-y-auto overflow-x-hidden bg-slate-950/70 p-2 sm:top-[5.25rem] sm:p-6" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-8 w-full max-w-6xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl sm:rounded-[2rem]" role="dialog" aria-modal="true" aria-label="Family payment summary builder">
            <div className="sticky top-0 z-20 rounded-t-[1.5rem] border-b border-[#eadfc8] bg-white/95 p-3 backdrop-blur sm:rounded-t-[2rem] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b98a2f] sm:text-xs sm:tracking-[0.2em]">Draft Estimate Builder</p>
                  <h3 className="mt-1 min-w-0 break-words text-xl font-black leading-tight text-[#075c58] sm:text-2xl">{serviceLabel}</h3>
                  <p className="mt-2 hidden max-w-3xl text-sm leading-6 text-slate-700 sm:block">This builder creates an internal draft estimate from the customer’s selected service and current NestHelper pricing. Nothing is sent to the customer automatically. Review and edit every line before saving, sending checkout, or creating a Stripe invoice.</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={saveDraft} disabled={saving} className={getButtonClass("primary")}>{saving ? <><BuilderSpinner /> Saving...</> : "Save draft"}</button>
                  <button type="button" onClick={attemptClose} className={getButtonClass("quiet")}>Close</button>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600 sm:hidden">Internal only. Save before checkout or invoice.</p>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 p-3 sm:gap-5 sm:p-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="min-w-0 space-y-4 sm:space-y-5">
                <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-[#eadfc8] bg-white p-3 sm:p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Recurring safeguards</p>
                  <div className="mt-3 space-y-2 text-sm font-bold leading-6 text-slate-700">
                    <p>Status: <span className="text-[#075c58]">{recurringStatus}</span></p>
                    <p>Rate: <span className="text-[#075c58]">{recurringRateValue > 0 ? `${formatMoney(recurringRateValue)}/visit` : "Not set"}</span></p>
                    <p>Next visit: <span className="text-[#075c58]">{nextVisitDate || "Not set"}</span></p>
                    <p>First visit completed: <span className={recurringFirstVisitCompleted ? "text-emerald-700" : "text-amber-700"}>{recurringFirstVisitCompleted ? "Yes" : "No"}</span></p>
                    <p className="max-w-full overflow-hidden rounded-2xl bg-[#fbf6ea] p-3 text-xs leading-5 break-words">No automatic subscription is created. Admin still reviews before sending payment, but saved recurring details make the next invoice/check-out faster and safer.</p>
                  </div>
                </div>

                <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-3 sm:p-4">
                  <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Breakdown title
                      <input value={quoteTitle} onChange={(e) => { markDirty(); setQuoteTitle(e.target.value); }} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Payment type
                      <select value={paymentPlan} onChange={(e) => { markDirty(); setPaymentPlan(e.target.value); }} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                        <option>One-time family service</option>
                        <option>Recurring weekly family service</option>
                        <option>Recurring every 2 weeks</option>
                        <option>Laundry Rescue deposit</option>
                        <option>Laundry final balance</option>
                        <option>Custom approved family payment</option>
                        <option>Refund / credit record</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Service period start <span className="text-xs font-semibold text-slate-500">Optional, use for recurring</span>
                      <input type="date" value={servicePeriodStart} onChange={(e) => { markDirty(); setServicePeriodStart(e.target.value); }} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Service period end <span className="text-xs font-semibold text-slate-500">Shows on invoices/receipts</span>
                      <input type="date" value={servicePeriodEnd} onChange={(e) => { markDirty(); setServicePeriodEnd(e.target.value); }} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#075c58]/18 bg-[#f4fbf8] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Recurring plan tracking</p>
                      <h5 className="mt-1 text-base font-black text-[#075c58]">Track future recurring pricing without activating it automatically</h5>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                        This does not create a subscription or auto-bill the family. Recurring pricing is only a future draft until Leo/Gen activate it and apply the recurring rate.
                      </p>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 text-xs font-black ${recurringNeedsSafeguard ? "bg-amber-100 text-amber-900" : recurringReadyForNextInvoice ? "bg-emerald-100 text-emerald-900" : "bg-white text-slate-700"}`}>
                      {recurringNeedsSafeguard ? "Needs fail-safe review" : recurringReadyForNextInvoice ? "Ready for next recurring payment" : "Not activated yet"}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Recurring plan
                      <select value={recurringStatus} onChange={(e) => { markDirty(); setRecurringStatus(e.target.value); }} className="rounded-2xl border border-[#cfe4da] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                        <option value="Not recurring">Not activated yet</option>
                        <option>Approved recurring</option>
                        <option>Recurring active</option>
                        <option>Paused</option>
                        <option>Canceled</option>
                      </select>
                      <span className="text-xs font-semibold leading-5 text-slate-500">Leave this as “Not activated yet” until the family has approved ongoing service. Planned cadence and rate are notes only until you apply them.</span>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Planned cadence
                      <select value={recurringCadence} onChange={(e) => { markDirty(); setRecurringCadence(e.target.value); const presetId = getRecommendedRecurringPresetId(item, e.target.value); setRecurringRate(String(getRecurringPresetAmount(presetId))); }} className="rounded-2xl border border-[#cfe4da] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                        <option>Every 2 weeks</option>
                        <option>Weekly</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Future recurring rate / visit
                      <input value={recurringRate} onChange={(e) => { markDirty(); setRecurringRate(e.target.value); }} inputMode="decimal" className="rounded-2xl border border-[#cfe4da] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Next visit date
                      <input type="date" value={nextVisitDate} onChange={(e) => { markDirty(); setNextVisitDate(e.target.value); }} className="rounded-2xl border border-[#cfe4da] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Completed recurring visits
                      <input value={recurringCompletedVisits} onChange={(e) => { markDirty(); setRecurringCompletedVisits(e.target.value); }} inputMode="numeric" className="rounded-2xl border border-[#cfe4da] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Minimum recurring visits
                      <input value={recurringMinimumVisits} onChange={(e) => { markDirty(); setRecurringMinimumVisits(e.target.value); }} inputMode="numeric" className="rounded-2xl border border-[#cfe4da] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <label className="flex gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-slate-700">
                      <input type="checkbox" checked={recurringFirstVisitCompleted} onChange={(e) => { markDirty(); setRecurringFirstVisitCompleted(e.target.checked); }} className="mt-1 h-4 w-4 accent-[#075c58]" />
                      First standard-price visit completed
                    </label>
                    <label className="flex gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-slate-700">
                      <input type="checkbox" checked={recurringCardOnFile} onChange={(e) => { markDirty(); setRecurringCardOnFile(e.target.checked); }} className="mt-1 h-4 w-4 accent-[#075c58]" />
                      Card/payment method confirmed
                    </label>
                    <label className="flex gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-slate-700">
                      <input type="checkbox" checked={recurringAutoReady} onChange={(e) => { markDirty(); setRecurringAutoReady(e.target.checked); }} className="mt-1 h-4 w-4 accent-[#075c58]" />
                      Admin reviewed for faster future billing
                    </label>
                  </div>
                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                    Recurring notes
                    <input value={recurringNotes} onChange={(e) => { markDirty(); setRecurringNotes(e.target.value); }} placeholder="Example: Same checklist every other Friday, keep scope to kitchen/living/laundry folding." className="rounded-2xl border border-[#cfe4da] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                  {recurringCompletedVisitCount < recurringMinimumVisitCount && recurringStatus !== "Not recurring" && (
                    <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black leading-5 text-amber-900">
                      Policy reminder: recurring rates are intended for at least {recurringMinimumVisitCount} recurring visits after the first standard-price visit. If the plan cancels early, review whether future visits return to standard pricing.
                    </p>
                  )}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button type="button" onClick={applyRecurringPlanToBuilder} className={getButtonClass("secondary")}>Apply future recurring rate to draft</button>
                    <button type="button" onClick={fillNextRecurringCheckout} className={getButtonClass("primary")}>Fill next recurring checkout</button>
                    <button type="button" onClick={advanceNextVisitDate} className={getButtonClass("quiet")}>Advance next visit date</button>
                  </div>
                </div>

                {totalSuggestedCreditAmount > 0 && (
                  <div className={`rounded-3xl border p-4 ${referralCreditApplied ? "border-emerald-100 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Referral/customer credit</p>
                        <h5 className="mt-1 text-base font-black text-[#075c58]">Apply {formatMoney(totalSuggestedCreditAmount)} before payment</h5>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                          {referralCreditAmount > 0 ? `This request came through a referral link: -${formatMoney(referralCreditAmount)}. ` : ""}
                          {availableCustomerCreditAmount > 0 ? `This customer also has saved referral credit: -${formatMoney(availableCustomerCreditAmount)}. ` : ""}
                          Save the breakdown before sending the invoice or checkout link.
                        </p>
                      </div>
                      <button type="button" onClick={applyReferralCredit} className={getButtonClass(referralCreditApplied ? "secondary" : "primary")}>
                        {referralCreditApplied ? "Credit applied" : `Apply ${formatMoney(totalSuggestedCreditAmount)} credit`}
                      </button>
                    </div>
                    {availableCustomerCredits.length > 0 && (
                      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-700">
                        Credit record{availableCustomerCredits.length === 1 ? "" : "s"}: {availableCustomerCredits.map((credit) => getString(credit.creditCode || credit.id)).filter(Boolean).join(", ")}
                      </p>
                    )}
                    {referralCreditNeedsAttention && (
                      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-black leading-5 text-amber-900">
                        The discount box is lower than the available referral/customer credit. Click Apply credit, then Save draft estimate before sending payment.
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-3xl border border-[#eadfc8] bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <label className="grid flex-1 gap-2 text-sm font-bold text-slate-700">
                      Add line item
                      <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                        {FAMILY_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                      </select>
                    </label>
                    <button type="button" onClick={addLineFromPreset} className={getButtonClass("primary")}>Add line</button>
                    <button type="button" onClick={resetToCustomerSelections} className={getButtonClass("quiet")}>Reset from request</button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {lineItems.map((line, index) => {
                      const amount = calculateLineAmount(line);
                      return (
                        <div key={line.id} className="rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Line {index + 1}</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#075c58]">{formatMoney(amount)}</span>
                              <button type="button" onClick={() => removeLine(line.id)} className={getButtonClass("danger")}>Remove</button>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            <label className="grid gap-2 text-sm font-bold text-slate-700">
                              Customer-facing line title
                              <input value={line.label} onChange={(e) => updateLine(line.id, { label: e.target.value })} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                            </label>
                            <label className="grid gap-2 text-sm font-bold text-slate-700">
                              Description
                              <input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                            </label>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-4">
                            <label className="grid gap-2 text-sm font-bold text-slate-700">
                              Qty
                              <input value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: e.target.value })} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                            </label>
                            <label className="grid gap-2 text-sm font-bold text-slate-700">
                              Unit
                              <select value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value })} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-bold text-[#075c58] outline-none focus:border-[#075c58]">
                                <option>flat</option>
                                <option>hour</option>
                                <option>half-hour</option>
                                <option>visit</option>
                                <option>stop</option>
                                <option>mile</option>
                                <option>lb</option>
                              </select>
                            </label>
                            <label className="grid gap-2 text-sm font-bold text-slate-700">
                              Rate
                              <input value={line.rate} onChange={(e) => updateLine(line.id, { rate: e.target.value })} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                            </label>
                            <label className="grid gap-2 text-sm font-bold text-slate-700">
                              Flat amount
                              <input value={line.amount} onChange={(e) => updateLine(line.id, { amount: e.target.value })} inputMode="decimal" disabled={line.unit !== "flat"} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500 focus:border-[#075c58]" />
                            </label>
                          </div>
                          <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                            Optional line note
                            <input value={line.note} onChange={(e) => updateLine(line.id, { note: e.target.value })} placeholder="Example: customer requested fragrance-free detergent, extra stop reviewed, final laundry balance may be separate" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className={`grid gap-2 rounded-3xl border p-4 text-sm font-bold text-slate-700 ${referralCreditNeedsAttention ? "border-amber-300 bg-amber-50" : "border-[#eadfc8] bg-white"}`}>
                    Discount / credit
                    <input value={discountCredit} onChange={(e) => { markDirty(); setDiscountCredit(e.target.value); }} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                    {totalSuggestedCreditAmount > 0 && (
                      <span className={`text-xs font-black leading-5 ${referralCreditApplied ? "text-emerald-700" : "text-amber-800"}`}>
                        Referral/customer credit expected: -{formatMoney(totalSuggestedCreditAmount)}. {referralCreditApplied ? "Included." : "Apply before sending payment."}
                      </span>
                    )}
                  </label>
                  <label className="grid gap-2 rounded-3xl border border-[#eadfc8] bg-white p-4 text-sm font-bold text-slate-700">
                    Possible later/add-on amount
                    <input value={laterAmount} onChange={(e) => { markDirty(); setLaterAmount(e.target.value); }} inputMode="decimal" className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm outline-none focus:border-[#075c58]" />
                  </label>
                </div>

                <div className="rounded-3xl border border-[#eadfc8] bg-white p-4">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Customer note
                    <textarea value={customerNote} onChange={(e) => { markDirty(); setCustomerNote(e.target.value); }} rows={3} className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
                  </label>
                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                    Private admin notes
                    <textarea value={internalNotes} onChange={(e) => { markDirty(); setInternalNotes(e.target.value); }} rows={3} placeholder="Private notes for NestHelper only." className="rounded-2xl border border-[#eadfc8] bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none focus:border-[#075c58]" />
                  </label>
                </div>

                <div className="rounded-3xl border border-red-100 bg-red-50/60 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Refund / credit tracking</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Refund status
                      <select value={refundStatus} onChange={(e) => { markDirty(); setRefundStatus(e.target.value); }} className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-bold text-red-700 outline-none focus:border-red-400">
                        <option>No refund due</option>
                        <option>Refund review needed</option>
                        <option>Partial refund issued</option>
                        <option>Full refund issued</option>
                        <option>Credit toward next visit</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Refund / credit amount
                      <input value={refundAmount} onChange={(e) => { markDirty(); setRefundAmount(e.target.value); }} inputMode="decimal" className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm outline-none focus:border-red-400" />
                    </label>
                  </div>
                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                    Refund / credit reason
                    <input value={refundReason} onChange={(e) => { markDirty(); setRefundReason(e.target.value); }} className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm outline-none focus:border-red-400" />
                  </label>
                  <label className="mt-3 flex gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-slate-700">
                    <input type="checkbox" checked={customerNotified} onChange={(e) => { markDirty(); setCustomerNotified(e.target.checked); }} className="mt-1 h-4 w-4 accent-[#075c58]" />
                    Customer notified about refund / credit
                  </label>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-3xl border border-[#075c58]/20 bg-[#075c58] p-5 text-white shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f1c96b]">Draft total</p>
                  <div className="mt-3 space-y-2 text-sm font-bold">
                    <div className="flex justify-between gap-3"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
                    <div className="flex justify-between gap-3"><span>Discount / credit</span><span>-{formatMoney(discount)}</span></div>
                    <div className="border-t border-white/20 pt-3 text-lg flex justify-between gap-3"><span>Due now</span><span>{formatMoney(amountDueNow)}</span></div>
                    <div className="flex justify-between gap-3 text-white/80"><span>Later/add-on</span><span>{formatMoney(possibleLaterAmount)}</span></div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#eadfc8] bg-[#fbf6ea] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Customer-facing payment summary</p>
                  <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-5 text-[13px] leading-6 text-slate-700">{customerBreakdownText}</pre>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={copyBreakdown} className={getButtonClass("secondary")}>Copy</button>
                    <button type="button" onClick={downloadBreakdown} className={getButtonClass("quiet")}>Download</button>
                    <button type="button" onClick={printBreakdown} className={getButtonClass("quiet")}>Print</button>
                    <button type="button" onClick={() => onApplyCheckout({ amount: amountDueNow, title: quoteTitle, note: customerNote })} className={getButtonClass("primary")}>{totalSuggestedCreditAmount > 0 ? "Fill checkout with credit price" : "Fill checkout amount"}</button>
                    <button type="button" onClick={() => onApplyAdditionalPayment({ amount: possibleLaterAmount, reason: "Family approved add-on / balance", note: customerNote })} className={getButtonClass("quiet")}>Fill add-on amount</button>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#eadfc8] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98a2f]">Save before sending</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">Save the draft estimate before creating a family Stripe invoice or filling checkout. If this request has a referral, the saved customer payment summary is what keeps the referral credit from being missed.</p>
                  <button type="button" onClick={saveDraft} disabled={saving} className={`${getButtonClass("primary")} mt-3 w-full`}>{saving ? <><BuilderSpinner /> Saving...</> : "Save draft estimate"}</button>
                  {message && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p>}
                  {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
