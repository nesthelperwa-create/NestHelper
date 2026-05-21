export type Policy = {
  slug: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

export const policies: Policy[] = [
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    intro: "These terms explain the basic rules for requesting and receiving NestHelper services.",
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
      }
    ]
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    intro: "We collect only the information needed to review requests, communicate, schedule service, process payments, and improve operations.",
    sections: [
      {
        heading: "Information collected",
        body: "Forms may collect name, email, phone, service address, service preferences, pets/access notes, and application information. Sensitive onboarding documents such as SSNs, ID photos, and full background-check documents should not be submitted through the website."
      },
      {
        heading: "How information is used",
        body: "Information is used to review requests, coordinate service, communicate with customers/applicants, process payment, improve quality, and meet legal or safety obligations."
      },
      {
        heading: "Service providers",
        body: "NestHelper may use providers such as Stripe, Firebase, email/text tools, payroll systems, and background-check providers to operate the business."
      }
    ]
  },
  {
    slug: "service-scope",
    title: "Service Scope",
    intro: "NestHelper focuses on parent-reset services, not childcare, deep cleaning, medical care, or emergency support.",
    sections: [
      {
        heading: "Included services",
        body: "Light home reset help, laundry support, simple organizing, errands, family logistics support, and approved household tasks within the selected package time."
      },
      {
        heading: "Excluded services",
        body: "No unsupervised childcare, bathing children, medical care, elder care, heavy lifting, hazardous cleaning, pest cleanup, hoarding/biohazards, illegal tasks, or emergency services."
      },
      {
        heading: "Supplies",
        body: "Customers should disclose whether NestHelper should use customer supplies, NestHelper supplies, or partner-provider supplies. Special detergents or supplies may carry an add-on fee."
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
    intro: "Laundry Rescue is priced by dry weight and handled with clear preferences and documentation.",
    sections: [
      {
        heading: "Dry weight billing",
        body: "Laundry is weighed dry at pickup or through a partner provider. The minimum deposit applies to the final total. Any remaining balance is sent through Stripe after weigh-in."
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
