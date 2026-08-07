export type Policy = {
  slug: string;
  title: string;
  intro: string;
  lastUpdated?: string;
  sections: { heading: string; body: string }[];
};

export const policies: Policy[] = [
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    intro: "These terms explain the basic rules for requesting and receiving NestHelper services.",
    lastUpdated: "August 7, 2026",
    sections: [
      {
        heading: "Request-first service",
        body: "Submitting a request does not guarantee acceptance or scheduling. NestHelper reviews service area, availability, scope, safety, pets, access, and payment before confirming a visit."
      },
      {
        heading: "Payment",
        body: "Approved requests are paid securely through Stripe. Prices shown on the website are before applicable taxes and fees unless stated otherwise. Washington sales tax is calculated in checkout or invoicing when applicable."
      },
      {
        heading: "No childcare or medical services",
        body: "NestHelper provides household support and parent reset services. We do not provide licensed childcare, unsupervised babysitting, medical care, elder care, emergency services, legal advice, or financial advice."
      },
      {
        heading: "Right to refuse service",
        body: "NestHelper may decline, stop, or reschedule service due to unsafe conditions, incorrect scope, harassment, aggressive pets, illegal activity, biohazards, or unavailable staffing."
      },
      {
        heading: "Smart Labels and online features",
        body: "NestHelper Smart Labels are QR-based organization and optional Lost & Found tools. A free account and internet connection may be required to activate and manage labels. Smart Labels do not provide GPS tracking, theft prevention, emergency monitoring, or a guarantee that a lost item will be found or returned. Customers are responsible for the information they save and for choosing which optional Lost & Found details are made public."
      },
      {
        heading: "Smart Label accounts and ownership",
        body: "Customers must provide accurate account information and keep account credentials and activation codes private. NestHelper may require reasonable ownership verification before correcting or transferring access to a Smart Label account or claimed label. Creating a Smart Labels account or using Smart Label features is also subject to the Privacy Policy and Smart Label Policy."
      }
    ]
  },
  {
    slug: "referral-program-policy",
    title: "Referral Program Policy",
    intro: "This policy explains how NestHelper family-to-family referral links, one-time use codes, and referral credits work.",
    sections: [
      {
        heading: "Family-to-family only",
        body: "The referral program is for eligible NestHelper family services only, including Parent Reset Plan, Whole Home Cleaning, Errand Helper, and Laundry Rescue when NestHelper approves the request. Specific Area(s) Reset, Garage Reset, Move-In / Move-Out Cleaning, Commercial Reset, partner services, helper applications, and business quote requests are excluded unless NestHelper approves an exception in writing."
      },
      {
        heading: "Eligible services",
        body: "Eligible services generally include Parent Reset Plan, Errand Helper, and Laundry Rescue requests that are reviewed by NestHelper, approved, paid when required, scheduled, and completed. A submitted request, quote, checkout link, deposit, canceled visit, refunded visit, or incomplete visit does not qualify by itself."
      },
      {
        heading: "One-time referral links",
        body: "Each generated referral share link is intended for one referred family request only. Once a referral link is claimed by a referred family request, the same link cannot be redeemed by another customer. NestHelper may generate additional one-time referral links for the same original family at its discretion, and each link is tracked separately."
      },
      {
        heading: "Separate referral records",
        body: "NestHelper tracks each original referring family share link and code separately from the referred family’s incoming referral code. This helps NestHelper review each referral, prevent duplicate use, and keep reward status clear in the admin dashboard."
      },
      {
        heading: "Reward or credit timing",
        body: "The original referring family becomes eligible for a reward or credit only after the referred family completes an eligible family service. NestHelper may email the reward or credit information automatically after completion is recorded."
      },
      {
        heading: "Credits are not cash",
        body: "Referral rewards or credits are not cash, are not payable as cash, and are not transferable unless NestHelper approves it in writing. Credits may be applied to a future eligible family service according to NestHelper’s current offer and availability."
      },
      {
        heading: "Misuse and review",
        body: "NestHelper may deny, reverse, or cancel a referral reward for self-referrals, duplicate accounts, fake or incomplete requests, chargebacks, refunded services, misuse, fraud, unsafe conduct, or activity outside the spirit of the family referral program."
      }
    ]
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    intro: "We collect and use information needed to review requests, provide NestHelper services and Smart Label features, communicate, process payments, protect the platform, and improve operations.",
    lastUpdated: "August 7, 2026",
    sections: [
      {
        heading: "Information collected",
        body: "Forms may collect name, email, phone, service address, service preferences, pets/access notes, photos, messages, and application information. Smart Label accounts may store label names, storage locations, contents, notes, photos, collections, activation and ownership records, and account email information. For Smart Label orders, NestHelper may also retain buyer email, Etsy order identifiers, shipment or tracking information, label-pack records, activation status, and internal fulfillment notes needed to fulfill and support the order. Sensitive onboarding documents such as SSNs, ID photos, and full background-check documents should not be submitted through ordinary website forms or Smart Label notes."
      },
      {
        heading: "Smart Label privacy",
        body: "For claimed customer Smart Labels in Storage Mode, saved label names, contents, notes, photos, and private storage locations are not returned on the public Smart Label scan page and are available only to the authenticated owner and authorized NestHelper administrators. Lost & Found Mode may display the public item name and public message chosen by the owner. A finder may submit contact information, a message, and optional location information when the owner has enabled those features. Finder information is shared with the authenticated label owner for recovery purposes and is not intended for public display."
      },
      {
        heading: "Account authentication",
        body: "NestHelper uses Firebase Authentication for Smart Label account sign-in. Authentication credentials are handled through the authentication service rather than stored as ordinary Smart Label content fields."
      },
      {
        heading: "How information is used",
        body: "Information is used to review requests, coordinate service, communicate with customers, applicants and finders, process payments, operate Smart Label activation and search, prevent fraud or abuse, improve quality and reliability, investigate incidents, and meet legal or safety obligations."
      },
      {
        heading: "Analytics, diagnostics, and service providers",
        body: "NestHelper uses service providers that may process limited information on our behalf, including Stripe for payments, Firebase for authentication and data storage, Resend or related email infrastructure for transactional messages, Google Analytics for website measurement, Sentry for error and performance diagnostics, and other hosting, payroll, background-check, communications, or operational providers. Website measurement may use cookies or similar browser/device identifiers. NestHelper configures these tools to limit unnecessary personal information where practical."
      },
      {
        heading: "Location information",
        body: "NestHelper does not use Smart Labels as GPS trackers and does not automatically collect continuous location from a label. In Lost & Found Mode, when the owner has enabled the option, a finder may voluntarily type a location or allow a supported browser to share approximate or precise latitude/longitude coordinates. That information is used to help the owner recover the item and is shared with the authenticated owner."
      },
      {
        heading: "Launch Rewards verification and fraud prevention",
        body: "Launch Rewards may collect verified phone and email information, ZIP code, reward history, server timestamps, and limited device or network security signals. This information is used to confirm eligibility, enforce spin and household limits, prevent duplicate or automated entries, investigate suspected misuse, contact potential winners, and attach rewards to eligible service requests. Marketing consent is optional and is not required to enter."
      },
      {
        heading: "Retention and account requests",
        body: "NestHelper keeps information for as long as reasonably needed to provide the requested service or feature, maintain business and transaction records, resolve disputes, prevent misuse, and meet legal obligations. Customers may contact NestHelper to request access assistance, correction, ownership help, or deletion of account or Smart Label information where applicable. Requests may require identity verification, and NestHelper may retain transaction, fulfillment, fraud-prevention, security, dispute, or legal records when reasonably necessary or required."
      }
    ]
  },
  {
    slug: "smart-label-policy",
    title: "Smart Label Policy",
    intro: "This policy explains activation, privacy, Storage Mode, Lost & Found Mode, finder messages, and the limits of NestHelper Smart Labels.",
    lastUpdated: "August 7, 2026",
    sections: [
      {
        heading: "24-label activation packs",
        body: "Each retail pack includes 24 unique printed QR labels and an activation code for 24 label claims. Buying multiple packs adds additional activation capacity to the same eligible account after each activation code is redeemed. Activation codes should be kept private and may be refused or disabled if NestHelper reasonably believes they were copied, resold without authorization, or used fraudulently."
      },
      {
        heading: "Order and activation records",
        body: "NestHelper may retain the buyer email, Etsy order identifier, shipment or tracking details, label-pack information, activation status, and related fulfillment records needed to deliver, activate, support, and protect Smart Label purchases. Activation codes are security credentials and should not be posted publicly or shared with people who are not authorized to use the pack."
      },
      {
        heading: "Claiming and ownership",
        body: "Scanning a valid unclaimed label does not by itself claim it. A label is connected to an account only after an authenticated customer with available activation capacity confirms Add Label. Once claimed, private label details are available only to the authenticated owner and authorized NestHelper administrators. Customer self-transfer or unclaiming is not currently supported; ownership corrections may require NestHelper assistance."
      },
      {
        heading: "Storage Mode",
        body: "Storage Mode is intended for private organization. For claimed customer Smart Labels, saved label names, locations, contents, notes, photos, and search information are not displayed on the public scan page. Customers should not store passwords, financial information, security codes, medical records, government identifiers, or other highly sensitive information in Smart Label fields."
      },
      {
        heading: "Lost & Found Mode",
        body: "Lost & Found Mode allows the owner to choose a public item name and public message and may allow a finder to send a private contact message. The owner may also allow a finder to voluntarily share typed location information or browser-provided coordinates. Private storage contents, notes, private photos, home storage locations, and the owner's account email are not returned to the finder through the public scan page."
      },
      {
        heading: "Finder messages and safety",
        body: "Finder contact is provided as a communication aid. NestHelper does not verify every finder, mediate every return, or guarantee the accuracy of finder-provided information. Owners and finders should use reasonable judgment when arranging a return, avoid sharing unnecessary sensitive information, and use a safe public exchange location when appropriate."
      },
      {
        heading: "No GPS or recovery guarantee",
        body: "Smart Labels are passive QR labels. They do not contain GPS, cellular service, Bluetooth tracking, automatic location reporting, theft prevention, emergency monitoring, or law-enforcement tracking. Lost & Found recovery depends on a person finding the item, noticing and scanning the label, having internet access, and choosing to contact the owner."
      },
      {
        heading: "Availability and changes",
        body: "NestHelper may update Smart Label features, security protections, interfaces, or limits as the system evolves. We will make reasonable efforts to preserve existing printed NestHelper QR URLs and customer-owned label data, but internet services can experience outages or maintenance and uninterrupted availability is not guaranteed."
      }
    ]
  },
  {
    slug: "service-scope",
    title: "Service Scope",
    intro: "NestHelper focuses on parent-reset services, simple household support, and reviewed cleaning/reset work — not childcare, private-chef service, medical care, or emergency support.",
    sections: [
      {
        heading: "Included services",
        body: "Light home reset help, specific area resets, laundry support, simple organizing, errands, family logistics support, optional simple in-home meal prep support, Move Prep & Home Reset support, and approved household tasks within the selected package time or approved quote."
      },
      {
        heading: "Simple in-home meal prep boundaries",
        body: "When approved as part of a Parent Reset Plan, meal prep support is limited to simple prep inside the customer’s home using the customer’s food, kitchen, tools, containers, and instructions. Examples include washing or chopping produce, portioning snacks, prepping simple ingredients, or organizing prepared items."
      },
      {
        heading: "Move Prep & Home Reset boundaries",
        body: "Movers handle the heavy lifting. NestHelper helps with the home reset. NestHelper does not transport household goods or operate as a moving company. We provide in-home move prep, organizing, labeling, cleaning, unpacking, and reset support. Move-out cleaning is quoted separately, and garage, storage areas, sheds, heavy clutter, unsafe lifting, disposal, or hauling needs require review before acceptance."
      },
      {
        heading: "Excluded services",
        body: "No unsupervised childcare, bathing children, medical care, elder care, private-chef service, catering, full meal cooking, off-site food prep, nutrition or diet planning, medical dietary decisions, food purchased/prepared by NestHelper, unsafe heavy lifting, hazardous cleaning, chemical or paint disposal, pest cleanup, hoarding/biohazards, mold remediation, illegal tasks, or emergency services."
      },
      {
        heading: "Supplies",
        body: "NestHelper generally brings supplies for approved services. Customers should share product preferences, sensitivities, allergies, surfaces that need special care, and any supplies that should not be used. Special detergents or specialty supplies may carry an add-on fee."
      }
    ]
  },
  {
    slug: "cancellation-policy",
    title: "Cancellation & Rescheduling Policy",
    intro: "Clear cancellation rules protect customer time and helper schedules.",
    sections: [
      {
        heading: "24+ hours",
        body: "Cancellations or reschedules made more than 24 hours before service are generally free, subject to availability."
      },
      {
        heading: "Late cancellation",
        body: "Cancellations within 24 hours may result in deposit retention or a cancellation fee. Same-day cancellations or lockouts may result in a higher fee."
      },
      {
        heading: "Lockout/access issues",
        body: "If a helper arrives and cannot access the home, laundry, parking, or approved work area, the minimum fee or deposit may be retained."
      }
    ]
  },
  {
    slug: "refund-reset-promise",
    title: "Refund / Reset Promise",
    intro: "We want families to feel cared for while keeping the guarantee fair and controlled.",
    sections: [
      {
        heading: "NestHelper Reset Promise",
        body: "If something within the agreed service scope was missed, contact us within 24 hours. We will review the issue and may offer a correction, credit, partial refund, or other resolution when appropriate."
      },
      {
        heading: "Limits",
        body: "The promise does not cover tasks outside the agreed scope, pre-existing damage, unavailable access, undisclosed hazards, normal wear, or issues reported late without supporting details."
      }
    ]
  },
  {
    slug: "laundry-policy",
    title: "Laundry Policy",
    intro: "Laundry Rescue is priced by final dry weight and handled with clear preferences and documentation.",
    sections: [
      {
        heading: "Dry weight billing",
        body: "Laundry is priced by final dry weight after washing, drying, and folding, whether handled by NestHelper or a partner provider. The minimum deposit applies to the final total. Any remaining balance is sent through Stripe after the final dry weight is confirmed."
      },
      {
        heading: "Add-ons",
        body: "Baby & Sensitive Skin Detergent, fragrance-free detergent, low heat, hang dry, rush return, and bulky-item handling may have additional fees."
      },
      {
        heading: "Reusable return bags and totes",
        body: "Clean laundry may be returned in NestHelper reusable laundry bags or totes. Reusable bags and totes remain NestHelper property unless otherwise stated. Customers should empty and return them at the next Laundry Rescue pickup, scheduled drop-off, or another approved return method."
      },
      {
        heading: "Missing or damaged return bags",
        body: "If a reusable NestHelper laundry bag or tote is not returned within 14 days after delivery, is intentionally kept, or is returned damaged beyond normal use, NestHelper may add a reasonable replacement fee to the customer invoice. We will communicate any fee before charging when practical."
      },
      {
        heading: "Customer laundry bags",
        body: "Customers may provide their own laundry bags or hampers. NestHelper is not responsible for normal wear to customer-provided bags, hampers, or containers used for pickup or return."
      },
      {
        heading: "Laundry limitations",
        body: "NestHelper follows selected laundry preferences but cannot guarantee prevention of all allergies, skin reactions, shrinkage, color bleeding, pre-existing stains, lost items left in pockets, or fabric damage."
      }
    ]
  },
  {
    slug: "safety-policy",
    title: "Safety & Right to Refuse Service Policy",
    intro: "Safety comes before every job.",
    sections: [
      {
        heading: "Unsafe conditions",
        body: "NestHelper may decline or stop service for harassment, aggressive pets, weapons, illegal activity, biohazards, pests, unsafe access, smoke exposure, undisclosed hazards, or tasks outside the agreed scope."
      },
      {
        heading: "Customer duties",
        body: "Customers must secure pets, provide safe access, disclose hazards, remove valuables from laundry pockets, and communicate special instructions before service."
      }
    ]
  },
  {
    slug: "damage-incident-policy",
    title: "Damage / Incident Policy",
    intro: "Clear reporting helps us investigate and resolve issues quickly.",
    sections: [
      {
        heading: "Reporting",
        body: "Any damage, missing item, or incident should be reported within 24 hours of service completion with photos, details, and the affected item or area."
      },
      {
        heading: "Review",
        body: "NestHelper will review the report, service notes, photos, scope, and helper/partner feedback before determining a resolution."
      }
    ]
  },
  {
    slug: "pet-policy",
    title: "Pet Policy",
    intro: "We love family homes, but pets need to be disclosed and safely managed.",
    sections: [
      {
        heading: "Disclosure",
        body: "Customers must disclose all pets before service. Aggressive, anxious, or escaping pets must be secured away from the work area."
      },
      {
        heading: "Helper safety",
        body: "Helpers may refuse service or stop work if a pet creates unsafe conditions."
      }
    ]
  },

  {
    slug: "commercial-reset-policy",
    title: "Commercial Reset Policy",
    intro: "Commercial Reset is a separate service lane for routine cleaning support in small business and community spaces.",
    sections: [
      {
        heading: "Commercial-only scope",
        body: "Commercial Reset is intended for small offices, studios, churches, salons, barbershops, professional offices, daycare common areas, learning-space common areas, and similar local business spaces. It is separate from Parent Reset household services."
      },
      {
        heading: "Routine janitorial support",
        body: "Commercial Reset may include routine trash removal, restroom cleaning, breakroom or kitchenette reset, surface wipe-downs, vacuuming, sweeping, mopping, dusting, and high-touch area cleaning within the approved scope."
      },
      {
        heading: "Daycare and learning spaces",
        body: "Daycare, school, and learning-space requests are reviewed as common-area cleaning requests unless a written scope says otherwise. NestHelper does not provide childcare, supervision, medical care, or regulated sanitation services."
      },
      {
        heading: "Supplies and product preferences",
        body: "NestHelper generally brings cleaning supplies and reviews product preferences before service. Non-toxic, low-odor, fragrance-free, or sensitive-use preferences may be requested where appropriate for the surface and cleaning scope."
      },
      {
        heading: "Excluded commercial work",
        body: "Commercial Reset does not include mold remediation, biohazard cleanup, pest cleanup, construction cleanup, hazardous materials, hood/duct cleaning, repairs, regulated medical cleaning, or specialty floor/carpet work unless separately reviewed and quoted."
      },
      {
        heading: "Access, security, and readiness",
        body: "Businesses must provide safe access, parking or loading information, alarm/access instructions when needed, and disclose hazards, restricted rooms, sensitive equipment, pets, cameras, or security rules before service."
      }
    ]
  },
  {
    slug: "commercial-pricing-add-ons",
    title: "Commercial Pricing & Add-On Policy",
    intro: "Commercial Reset pricing is quote-based so small businesses can compare clear planning ranges without worrying about an open-ended hourly clock.",
    sections: [
      {
        heading: "Quote-first pricing",
        body: "Commercial prices shown on the website are planning ranges only. Final pricing depends on square footage, bathrooms, flooring, foot traffic, current condition, product preferences, access, schedule, photos, walkthrough notes, and requested frequency. Before service is scheduled, NestHelper provides a clear visit price, recurring plan, or add-on quote for approval."
      },
      {
        heading: "Minimums",
        body: "Small recurring commercial spaces may start around $149 per visit, and one-time commercial resets may start around $225. Minimums protect travel time, setup, supplies, insurance, administration, and helper scheduling while still giving the customer a clear quoted price before work begins."
      },
      {
        heading: "Square-foot planning ranges",
        body: "Routine commercial cleaning may be estimated by square foot and frequency, then converted into a clear per-visit or monthly recurring quote. More frequent visits may lower the per-visit square-foot range because the space stays easier to maintain. These ranges are guidance, not guaranteed pricing."
      },
      {
        heading: "Add-ons quoted separately",
        body: "Carpet extraction, spot treatment, floor scrub, buffing, waxing, strip-and-wax, upholstery, heavy first-time resets, and specialty surfaces are not included in basic Commercial Reset pricing unless specifically quoted."
      },
      {
        heading: "Scope changes",
        body: "If the actual space, condition, access, or requested tasks are materially different from the submitted request, NestHelper may revise the quote before continuing, pause service, reschedule, or decline work that falls outside scope. This protects the customer from surprise open-ended billing and protects NestHelper from work outside the approved quote."
      },
      {
        heading: "Local endorsement review",
        body: "Commercial availability may depend on address, city limits, local licensing or endorsement requirements, schedule, insurance fit, and operational capacity. Some city-limit jobs may require a city endorsement before service begins."
      }
    ]
  },
  {
    slug: "short-term-rental-turnover-policy",
    title: "Short-Term Rental Turnover Policy",
    intro: "Short-term rental turnover support is reviewed as a host-managed commercial cleaning request with clear boundaries before service is scheduled.",
    sections: [
      {
        heading: "Host-managed service",
        body: "Short-term rental turnover support is for hosts or property contacts who manage the guest relationship, booking platform, house rules, supplies, and property decisions. NestHelper may provide approved cleaning and reset support between stays, but does not act as the host, property manager, or guest support contact."
      },
      {
        heading: "Turnover cleaning scope",
        body: "Approved turnover work may include kitchen and bathroom reset cleaning, trash removal, surface wipe-downs, floor care within basic scope, bed or linen changeover when quoted, towel placement, restock checklist notes, and guest-ready details listed in the approved quote."
      },
      {
        heading: "Timing and access",
        body: "Hosts must provide accurate checkout/check-in windows, parking details, entry instructions, alarm or lockbox information, supply locations, laundry expectations, and any areas that should not be entered. Limited time between guest check-out and check-in is reviewed before acceptance and may affect pricing or availability."
      },
      {
        heading: "Photos and documentation",
        body: "Optional photos may be used for quoting, priority areas, before-service context, and after-service notes when included in the approved scope. Photo notes are not a substitute for property management, inspection services, damage claims handling, or guest dispute resolution."
      },
      {
        heading: "Laundry, linens, and restocking",
        body: "Linen handling, towel changeover, laundry transport, onsite laundry, supply restocking, and consumable inventory checks must be requested and quoted separately when needed. NestHelper is not responsible for missing host supplies that were not stocked, labeled, or disclosed before service."
      },
      {
        heading: "Excluded rental work",
        body: "Short-term rental turnover service does not include repairs, maintenance, pest treatment, biohazard cleanup, mold remediation, construction cleanup, guest messaging, refunds, platform communication, property management, emergency response, or work outside the approved cleaning scope unless separately reviewed and confirmed."
      }
    ]
  },
  {
    slug: "non-discrimination-policy",
    title: "Non-Discrimination Policy",
    intro: "NestHelper is built to serve families and review helpers fairly.",
    sections: [
      {
        heading: "Commitment",
        body: "NestHelper does not discriminate against customers, helpers, or partners based on protected characteristics under applicable law."
      },
      {
        heading: "Standards",
        body: "Service decisions are based on availability, service area, safety, scope, conduct, qualifications, and business needs."
      }
    ]
  },
  {
    slug: "partner-provider-policy",
    title: "Partner Provider Policy",
    intro: "Some services may be completed by NestHelper checked helpers or vetted local partner providers.",
    sections: [
      {
        heading: "Partner-vetted providers",
        body: "NestHelper may coordinate with laundromats, cleaners, errand providers, or other businesses. Partner providers are reviewed for service fit, reliability, communication, insurance/business information where applicable, and customer standards."
      },
      {
        heading: "Coordination",
        body: "NestHelper coordinates the request, sets expectations, and follows up after service so families are not left guessing."
      }
    ]
  }
];

export function getPolicy(slug: string) {
  return policies.find((policy) => policy.slug === slug);
}
