"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

const addOnOptions = [
  {
    key: "carpet-extraction",
    label: "Carpet extraction",
    range: "$0.40–$0.60/sq ft",
    minimum: "Often $249 minimum",
    bestFor: "Carpeted offices, waiting rooms, studios, small business lobbies, and common areas that need a deeper refresh than vacuuming.",
    notes: [
      "Quoted after reviewing square footage, stains, traffic level, drying time, access, and equipment needs.",
      "Spot treatment may be priced separately if there are concentrated stains or pet/odor concerns.",
      "Not included in basic routine Commercial Reset unless clearly added to the quote.",
    ],
  },
  {
    key: "spot-treatment",
    label: "Spot treatment",
    range: "$25–$75/area",
    minimum: "Quoted by area",
    bestFor: "Small carpet, upholstery, or floor spots that need targeted attention instead of a full extraction or full floor-care visit.",
    notes: [
      "Best reviewed with photos so the quote is clear before scheduling.",
      "Some stains, odors, dye transfer, or set-in damage may improve but cannot be guaranteed to fully disappear.",
      "Large or repeated spot areas may be quoted as carpet extraction or specialty cleaning instead.",
    ],
  },
  {
    key: "floor-scrub",
    label: "Floor scrub",
    range: "$0.35–$0.60/sq ft",
    minimum: "Minimum may apply",
    bestFor: "Hard-surface business floors that need more than normal sweeping and mopping, especially in higher-traffic areas.",
    notes: [
      "Quoted based on flooring type, soil level, square footage, access, and whether equipment or partner support is needed.",
      "This is separate from waxing or strip-and-wax work.",
      "Floor type matters, so customer photos are helpful before quoting.",
    ],
  },
  {
    key: "buff-shine",
    label: "Buff / shine",
    range: "$0.50–$0.90/sq ft",
    minimum: "Quoted after review",
    bestFor: "Approved floors that need a cleaner, more polished look without a full strip-and-wax service.",
    notes: [
      "Not all floors are a fit for buffing, so surface type and condition must be reviewed first.",
      "May require after-hours access so floors have time to dry and the space can be used safely afterward.",
      "Wax or finish products are not included unless they are added to the quote.",
    ],
  },
  {
    key: "wax-finish",
    label: "Wax / finish",
    range: "$0.75–$1.25/sq ft",
    minimum: "Often $299 minimum",
    bestFor: "Commercial floors that need an added finish layer after the surface is cleaned and approved for that service.",
    notes: [
      "Quoted after confirming floor type, current finish, prep needs, square footage, and timing.",
      "May require a separate walkthrough or photos before approval.",
      "This is specialty work and may be scheduled separately from routine cleaning.",
    ],
  },
  {
    key: "strip-wax",
    label: "Strip & wax",
    range: "$1.75–$2.50/sq ft",
    minimum: "Often $499 minimum",
    bestFor: "Approved commercial floors with old finish buildup that need a more involved reset before a new finish is applied.",
    notes: [
      "This is not part of basic Commercial Reset and may require partner support, special equipment, or a separate quote.",
      "Availability depends on floor type, condition, access, ventilation, drying time, and schedule.",
      "NestHelper may decline this work if it is outside current staffing, equipment, insurance, or safety scope.",
    ],
  },
  {
    key: "heavy-first-time-reset",
    label: "Heavy first-time reset",
    range: "$0.35–$0.55/sq ft",
    minimum: "Often $249 minimum",
    bestFor: "A catch-up clean before moving into a recurring routine plan, especially when the space needs more detail on the first visit.",
    notes: [
      "Quoted based on current condition, photos, bathrooms, floors, trash level, dust, product preferences, and time needed.",
      "Helps avoid underquoting the first visit and then keeping future recurring visits easier to maintain.",
      "Does not include biohazards, mold, pest cleanup, construction cleanup, or hazardous work.",
    ],
  },
  {
    key: "host-turnover-add-ons",
    label: "Host turnover add-ons",
    range: "Quoted by checklist",
    minimum: "From $129/turnover base",
    bestFor: "Host-managed short-term rental turnovers that need clear linen, towel, restock, and guest-ready checklist expectations.",
    notes: [
      "Can include linen/towel handling, restock checklist notes, limited photo notes, and guest-ready detail checks when approved.",
      "Limited time between guest check-out and check-in may affect price and availability.",
      "NestHelper does not handle guest messaging, platform communication, property management, repairs, pest treatment, or emergency response.",
    ],
  },
] as const;

type AddOnKey = (typeof addOnOptions)[number]["key"];

export function CommercialAddOnPricingSelector() {
  const [selectedKey, setSelectedKey] = useState<AddOnKey>("carpet-extraction");
  const selected = useMemo(() => addOnOptions.find((item) => item.key === selectedKey) ?? addOnOptions[0], [selectedKey]);

  return (
    <div className="rounded-[2.25rem] border border-nest-gold/18 bg-gradient-to-br from-white via-nest-cream to-nest-mint/25 p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <label htmlFor="commercial-add-on-select" className="text-sm font-black uppercase tracking-[0.18em] text-nest-teal/72">
            Choose an add-on type
          </label>
          <select
            id="commercial-add-on-select"
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value as AddOnKey)}
            className="mt-3 w-full rounded-2xl border border-nest-gold/20 bg-white px-4 py-3 text-base font-black text-nest-teal shadow-sm outline-none transition focus:border-nest-teal focus:ring-4 focus:ring-nest-mint/40"
          >
            {addOnOptions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="mt-4 hidden grid-cols-2 gap-2 sm:grid lg:grid-cols-1 xl:grid-cols-2">
            {addOnOptions.map((item) => {
              const active = item.key === selectedKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedKey(item.key)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                    active
                      ? "border-nest-teal bg-nest-teal text-white shadow-sm"
                      : "border-nest-gold/16 bg-white text-nest-teal hover:-translate-y-0.5 hover:border-nest-gold/32 hover:shadow-sm"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-nest-gold/16 bg-white/92 p-5 shadow-sm sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-nest-mint/35 px-4 py-2 text-sm font-black text-nest-teal">
            <Sparkles size={16} /> Planning range
          </div>
          <h4 className="mt-4 text-2xl font-black text-nest-teal sm:text-3xl">{selected.label}</h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-nest-cream p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-nest-teal/60">Rate range</p>
              <p className="mt-2 text-2xl font-black text-nest-teal">{selected.range}</p>
            </div>
            <div className="rounded-2xl bg-nest-mint/22 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-nest-teal/60">Minimum / note</p>
              <p className="mt-2 text-lg font-black text-nest-teal">{selected.minimum}</p>
            </div>
          </div>
          <p className="mt-4 font-medium leading-7 text-nest-ink/72">{selected.bestFor}</p>
          <div className="mt-5 grid gap-3">
            {selected.notes.map((note) => (
              <div key={note} className="flex gap-3 rounded-2xl border border-nest-gold/12 bg-white p-4 text-sm font-bold leading-6 text-nest-ink/70">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nest-mint/35 text-nest-teal">
                  <CheckCircle2 size={16} />
                </span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
