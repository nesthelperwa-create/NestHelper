export type CampaignAttribution = {
  campaignSource: string;
  campaignMedium: string;
  campaignName: string;
  campaignContent: string;
  campaignTerm: string;
  campaignLandingPage: string;
  campaignReferrer: string;
  campaignCapturedAtIso: string;
};

const STORAGE_KEY = "nesthelper_campaign_attribution";
const ATTRIBUTION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const sourceLabels: Array<[RegExp, string]> = [
  [/google|gbp|business_profile/i, "Google search"],
  [/instagram|ig/i, "Instagram"],
  [/facebook|fb/i, "Facebook"],
  [/nextdoor/i, "Nextdoor"],
  [/friend|referral|customer/i, "Friend or family referral"],
  [/flyer|qr|print/i, "Flyer / QR code"],
  [/church|daycare|preschool|community|group/i, "Local community group"],
  [/job|helper|hiring|recruit/i, "Job board / hiring post"],
  [/email|outreach/i, "Other / not listed"],
];

function clean(value: string | null | undefined, max = 140) {
  return (value || "").trim().replace(/[<>]/g, "").slice(0, max);
}

function getFirst(params: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = clean(params.get(key));
    if (value) return value;
  }
  return "";
}

function hasAnyParam(params: URLSearchParams, keys: string[]) {
  return keys.some((key) => Boolean(clean(params.get(key))));
}

function getGoogleAdsDetailText(params: URLSearchParams) {
  const details = [
    getFirst(params, ["gad_source"]) ? `gad_source=${getFirst(params, ["gad_source"])}` : "",
    getFirst(params, ["gad_campaignid"]) ? `campaign_id=${getFirst(params, ["gad_campaignid"])}` : "",
    getFirst(params, ["gad_adgroupid"]) ? `adgroup_id=${getFirst(params, ["gad_adgroupid"])}` : "",
    getFirst(params, ["gclid"]) ? `gclid=${getFirst(params, ["gclid"]).slice(0, 80)}` : "",
    getFirst(params, ["gbraid"]) ? `gbraid=${getFirst(params, ["gbraid"]).slice(0, 80)}` : "",
    getFirst(params, ["wbraid"]) ? `wbraid=${getFirst(params, ["wbraid"]).slice(0, 80)}` : "",
  ].filter(Boolean);
  return details.join("; ");
}

function clearStoredAttribution() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing. Tracking should never block forms.
  }
}

function isStoredAttributionFresh(attribution: Partial<CampaignAttribution>) {
  if (!attribution.campaignCapturedAtIso) return false;
  const captured = new Date(attribution.campaignCapturedAtIso).getTime();
  if (!Number.isFinite(captured)) return false;
  return Date.now() - captured <= ATTRIBUTION_MAX_AGE_MS;
}

function shouldClearCampaignAttribution(params: URLSearchParams) {
  const clearValue = [
    params.get("clear_campaign"),
    params.get("clearCampaign"),
    params.get("clear_utm"),
    params.get("admin_test"),
    params.get("test_request"),
  ].find((value) => value !== null);

  if (!clearValue) return false;
  return ["1", "true", "yes", "clear", "admin"].includes(clearValue.trim().toLowerCase());
}

function readStoredAttribution(): Partial<CampaignAttribution> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<CampaignAttribution>;
    if (!parsed || typeof parsed !== "object") return {};
    if (!isStoredAttributionFresh(parsed)) {
      clearStoredAttribution();
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveStoredAttribution(attribution: CampaignAttribution) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage can be unavailable in private browsing. Tracking should never block forms.
  }
}

export function getCampaignAttributionFromCurrentPage(): CampaignAttribution {
  if (typeof window === "undefined") {
    return {
      campaignSource: "",
      campaignMedium: "",
      campaignName: "",
      campaignContent: "",
      campaignTerm: "",
      campaignLandingPage: "",
      campaignReferrer: "",
      campaignCapturedAtIso: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  if (shouldClearCampaignAttribution(params)) {
    clearStoredAttribution();
    return {
      campaignSource: "",
      campaignMedium: "",
      campaignName: "",
      campaignContent: "",
      campaignTerm: "",
      campaignLandingPage: "",
      campaignReferrer: "",
      campaignCapturedAtIso: "",
    };
  }

  const googleAdsParamKeys = ["gclid", "gbraid", "wbraid", "gad_source", "gad_campaignid", "gad_adgroupid"];
  const hasGoogleAdsParams = hasAnyParam(params, googleAdsParamKeys);
  const source = getFirst(params, ["utm_source", "source", "src"]) || (hasGoogleAdsParams ? "google-ads" : "");
  const medium = getFirst(params, ["utm_medium", "medium"]) || (hasGoogleAdsParams ? "cpc" : "");
  const campaign = getFirst(params, ["utm_campaign", "campaign"]) || getFirst(params, ["gad_campaignid"]);
  const googleAdsDetailText = getGoogleAdsDetailText(params);
  const content = getFirst(params, ["utm_content", "content", "gad_adgroupid"]) || googleAdsDetailText;
  const term = getFirst(params, ["utm_term", "term"]);
  const hasUrlCampaign = Boolean(source || medium || campaign || content || term || hasGoogleAdsParams);

  if (hasUrlCampaign) {
    const next: CampaignAttribution = {
      campaignSource: source,
      campaignMedium: medium,
      campaignName: campaign,
      campaignContent: content,
      campaignTerm: term,
      campaignLandingPage: `${window.location.pathname}${window.location.search}`.slice(0, 500),
      campaignReferrer: clean(document.referrer, 500),
      campaignCapturedAtIso: new Date().toISOString(),
    };
    saveStoredAttribution(next);
    return next;
  }

  const stored = readStoredAttribution();
  if (!stored.campaignSource && !stored.campaignMedium && !stored.campaignName) {
    return {
      campaignSource: "",
      campaignMedium: "",
      campaignName: "",
      campaignContent: "",
      campaignTerm: "",
      campaignLandingPage: "",
      campaignReferrer: "",
      campaignCapturedAtIso: "",
    };
  }

  return {
    campaignSource: clean(stored.campaignSource),
    campaignMedium: clean(stored.campaignMedium),
    campaignName: clean(stored.campaignName),
    campaignContent: clean(stored.campaignContent),
    campaignTerm: clean(stored.campaignTerm),
    campaignLandingPage: clean(stored.campaignLandingPage, 500),
    campaignReferrer: clean(stored.campaignReferrer, 500),
    campaignCapturedAtIso: clean(stored.campaignCapturedAtIso, 80),
  };
}

export function getHowFoundUsFromCampaign(attribution: Partial<CampaignAttribution>) {
  const combined = [attribution.campaignSource, attribution.campaignMedium, attribution.campaignName].filter(Boolean).join(" ");
  for (const [pattern, label] of sourceLabels) {
    if (pattern.test(combined)) return label;
  }
  return "";
}

export function getCampaignDetailText(attribution: Partial<CampaignAttribution>) {
  const parts = [
    attribution.campaignSource ? `Source: ${attribution.campaignSource}` : "",
    attribution.campaignMedium ? `Medium: ${attribution.campaignMedium}` : "",
    attribution.campaignName ? `Campaign: ${attribution.campaignName}` : "",
    attribution.campaignContent ? `Content: ${attribution.campaignContent}` : "",
    attribution.campaignTerm ? `Term: ${attribution.campaignTerm}` : "",
    attribution.campaignLandingPage ? `Landing: ${attribution.campaignLandingPage}` : "",
  ].filter(Boolean);
  return parts.join("; ");
}

export function mergeCampaignAttribution<T extends { howFoundUs?: string; howFoundUsDetails?: string }>(form: T): T {
  try {
    const attribution = getCampaignAttributionFromCurrentPage();
    if (!attribution.campaignSource && !attribution.campaignMedium && !attribution.campaignName) return form;

    const inferredHowFoundUs = form.howFoundUs || getHowFoundUsFromCampaign(attribution);
    const details = getCampaignDetailText(attribution);
    const mergedDetails = form.howFoundUsDetails || details;

    return {
      ...form,
      ...attribution,
      howFoundUs: inferredHowFoundUs,
      howFoundUsDetails: mergedDetails,
    };
  } catch {
    return form;
  }
}
