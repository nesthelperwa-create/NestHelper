"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Clock, Info, MapPin, Star } from "lucide-react";
import type { Service } from "@/lib/services";

const serviceStyles: Record<string, { eyebrow: string; accent: string; chip: string; price: string; ring: string }> = {
  "parent-reset-2hr": {
    eyebrow: "Home reset",
    accent: "from-emerald-500/12 via-nest-mint/30 to-white",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    price: "bg-emerald-50 text-emerald-900",
    ring: "ring-emerald-200/70",
  },
  "family-reset-3hr": {
    eyebrow: "Parent reset plan",
    accent: "from-blue-500/12 via-sky-100 to-white",
    chip: "bg-blue-50 text-blue-800 border-blue-200",
    price: "bg-blue-50 text-blue-900",
    ring: "ring-blue-200/70",
  },
  "helper-block-4hr": {
    eyebrow: "Bigger reset",
    accent: "from-violet-500/12 via-purple-100 to-white",
    chip: "bg-violet-50 text-violet-800 border-violet-200",
    price: "bg-violet-50 text-violet-900",
    ring: "ring-violet-200/70",
  },
  "whole-home-reset": {
    eyebrow: "Whole-home clean",
    accent: "from-emerald-500/12 via-nest-mint/30 to-white",
    chip: "bg-emerald-50 text-emerald-900 border-emerald-200",
    price: "bg-emerald-50 text-emerald-950",
    ring: "ring-emerald-200/70",
  },
  "specific-area-reset": {
    eyebrow: "Area reset",
    accent: "from-lime-500/12 via-emerald-100 to-white",
    chip: "bg-lime-50 text-lime-900 border-lime-200",
    price: "bg-lime-50 text-lime-950",
    ring: "ring-lime-200/70",
  },
  "move-out-cleaning": {
    eyebrow: "Move-in / out clean",
    accent: "from-cyan-500/12 via-teal-100 to-white",
    chip: "bg-cyan-50 text-cyan-900 border-cyan-200",
    price: "bg-cyan-50 text-cyan-950",
    ring: "ring-cyan-200/70",
  },
  "move-prep-home-reset": {
    eyebrow: "Move prep",
    accent: "from-amber-500/14 via-nest-cream to-white",
    chip: "bg-amber-50 text-amber-900 border-amber-200",
    price: "bg-amber-50 text-amber-950",
    ring: "ring-amber-200/70",
  },
  "errand-helper": {
    eyebrow: "Errand support",
    accent: "from-amber-500/14 via-orange-100 to-white",
    chip: "bg-amber-50 text-amber-900 border-amber-200",
    price: "bg-amber-50 text-amber-950",
    ring: "ring-amber-200/70",
  },
  "laundry-rescue": {
    eyebrow: "Laundry relief",
    accent: "from-rose-500/12 via-pink-100 to-white",
    chip: "bg-rose-50 text-rose-800 border-rose-200",
    price: "bg-rose-50 text-rose-900",
    ring: "ring-rose-200/70",
  },
};

type ServiceExtra = {
  bestFor: string;
  extraDetails: string[];
  goodToKnow: string[];
};

const serviceExtras: Record<string, ServiceExtra> = {
  "parent-reset-2hr": {
    bestFor: "A fast reset when the house is not dirty enough for a deep clean, but the daily pile-up is making the day feel heavier.",
    extraDetails: [
      "Best for one or two priority areas instead of the whole home",
      "Great after busy mornings, dinner chaos, playtime, or a rough week",
      "You can leave a short checklist so the helper focuses on what matters most",
    ],
    goodToKnow: ["Not childcare", "Light reset, not deep cleaning", "Reviewed before checkout"],
  },
  "family-reset-3hr": {
    bestFor: "Busy parents who need a 3-hour reset for family spaces like playrooms, kids rooms, living areas, pantry, entryway, laundry areas, or simple in-home meal prep support — with organizing, light cleaning, and child-safe disinfecting.",
    extraDetails: [
      "Designed for selected family spaces, not the entire home",
      "Great for toys, clutter, daily pile-ups, surfaces, shelves, accessible floors, and simple prep tasks",
      "Optional simple meal prep is done inside the customer’s home using the customer’s food, tools, containers, and instructions",
      "Includes child-safe disinfecting of high-touch areas when requested",
    ],
    goodToKnow: ["3-hour parent reset", "Simple meal prep only", "No childcare"],
  },
  "helper-block-4hr": {
    bestFor: "A bigger block for households that need real catch-up time, multi-area support, or a custom approved helper list.",
    extraDetails: [
      "Helpful before guests, after trips, during busy work weeks, or when routines fall behind",
      "Can combine light home reset tasks with folding, organizing, or approved pickup help",
      "Better for families who want fewer limits and more time to work through a checklist",
    ],
    goodToKnow: ["Custom scope reviewed", "Half-day helper block", "Best for bigger lists"],
  },
  "whole-home-reset": {
    bestFor: "Entire-home cleaning help, including first-time deep cleans, first-time deep clean + recurring maintenance, and weekly, bi-weekly, or monthly full-home support after review.",
    extraDetails: [
      "Best when the goal is cleaning the whole home, not just one room or selected areas",
      "Visit type, home size, bedroom/bath count, condition, pets, and access help us quote accurately",
      "Optional detail items like interior fridge, interior oven, baseboards, pet hair focus, or linen reset can be requested",
    ],
    goodToKnow: ["Entire home", "Quote first", "Recurring available"],
  },
  "specific-area-reset": {
    bestFor: "Selected rooms or focused areas only — like kitchen, bathroom(s), pantry, closet, playroom, laundry area, garage, fridge, oven, or a few rooms but not the entire home.",
    extraDetails: [
      "Kitchen requests can include fridge interior, oven interior, cabinets, dishes/sink, appliance exteriors, counters, or stovetop focus",
      "Bathroom requests can include shower/tub buildup, toilet/vanity/sink detail, mirrors, grout, or soap-scum focus",
      "Optional repeat area support can be requested every 2 weeks or monthly for selected rooms only",
    ],
    goodToKnow: ["Selected areas", "Repeat area support", "Quote first"],
  },
  "move-out-cleaning": {
    bestFor: "Empty or mostly empty homes that need a reviewed move-in, move-out, rental turnover, or listing-prep clean before keys are handed over.",
    extraDetails: [
      "Square footage, room count, photos, condition, and timing are reviewed before pricing",
      "Kitchen and bathrooms can be prioritized when they need the most attention",
      "Inside appliances, drawers, cabinets, hard-water buildup, and heavy grease are quoted before checkout",
    ],
    goodToKnow: ["Quote first", "Photos recommended", "Empty-home focused"],
  },
  "move-prep-home-reset": {
    bestFor: "Families who already have movers or a moving plan, but need help sorting, labeling, staging open-first essentials, resetting key rooms, or getting settled before and after the move.",
    extraDetails: [
      "Movers handle the heavy lifting. NestHelper helps with the home reset.",
      "Move Prep Add-On starts at $199 for up to 2 helper-hours; additional packages are reviewed by scope",
      "Open-first essentials boxes can be set up for kitchen, bathroom, kids, pets, work, or first-night needs",
      "Smart Labels can be placed on boxes, bins, shelves, closets, or storage areas",
      "Move-out cleaning can be requested, but it is quoted separately from move prep support",
    ],
    goodToKnow: ["No transportation", "Add-on service", "Move-out clean quoted separately"],
  },
  "errand-helper": {
    bestFor: "Local family logistics when the errands are simple, safe, and approved ahead of time, but you do not have the time to run them yourself.",
    extraDetails: [
      "Can help with groceries, returns, local pickups, drop-offs, and simple supply runs",
      "Extra stops, long routes, parking, and special handling are reviewed before checkout",
      "You can add instructions for receipts, substitutions, timing, and drop-off preferences",
    ],
    goodToKnow: ["No unsafe requests", "Mileage included", "Longer routes quoted"],
  },
  "laundry-rescue": {
    bestFor: "Laundry catch-up when the baskets are taking over and you want pickup, wash/fold coordination, and clean return delivery handled for you.",
    extraDetails: [
      "Laundry is dry-weighed at pickup so pricing is clear before final balance",
      "Clean clothes may be returned in reusable NestHelper bags or totes",
      "Add-ons can cover fragrance-free detergent, sensitive skin detergent, low heat, hang dry, or rush return when available",
    ],
    goodToKnow: ["Deposit credited", "Reusable bag return", "Bulky items quoted"],
  },
};

type CardOpenEvent = CustomEvent<{ id: string }>;

export function ServiceCard({ service, equalCollapsedHeight = false }: { service: Service; equalCollapsedHeight?: boolean }) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const returnScrollYRef = useRef<number | null>(null);
  const returnTimerRef = useRef<number | null>(null);
  const theme = serviceStyles[service.id] || serviceStyles["parent-reset-2hr"];
  const extra = serviceExtras[service.id];
  const detailsId = `service-details-${service.id}`;
  const featured = service.id === "whole-home-reset";
  const isLaundry = service.id === "laundry-rescue";
  const isQuoteBased = service.standardPrice.toLowerCase().includes("quoted");
  const equalClosed = equalCollapsedHeight && !open;
  const collapsedHeightClass = equalClosed ? "md:h-[720px]" : "";
  const closedTitleClass = equalClosed ? "line-clamp-2 h-[3.35rem]" : "";
  const closedDescriptionClass = equalClosed ? "line-clamp-3 h-[4.5rem]" : "";
  const pricePanelHeightClass = equalClosed ? "h-[12rem]" : "min-h-[9.35rem]";

  useEffect(() => {
    function handleOtherCard(event: Event) {
      const customEvent = event as CardOpenEvent;
      if (customEvent.detail?.id !== service.id) {
        setOpen(false);
      }
    }

    window.addEventListener("nesthelper-service-card-open", handleOtherCard);
    return () => {
      window.removeEventListener("nesthelper-service-card-open", handleOtherCard);
      if (returnTimerRef.current) window.clearTimeout(returnTimerRef.current);
    };
  }, [service.id]);

  function rememberReturnPosition() {
    if (typeof window === "undefined" || !cardRef.current) return;
    const headerOffset = window.innerWidth < 768 ? 88 : 110;
    const cardTop = cardRef.current.getBoundingClientRect().top + window.scrollY;
    returnScrollYRef.current = Math.max(0, cardTop - headerOffset);
  }

  function returnToCardStart() {
    if (typeof window === "undefined") return;
    const targetY = returnScrollYRef.current;
    if (targetY === null) return;

    if (returnTimerRef.current) window.clearTimeout(returnTimerRef.current);
    returnTimerRef.current = window.setTimeout(() => {
      window.scrollTo({ top: targetY, behavior: "smooth" });
      returnScrollYRef.current = null;
      returnTimerRef.current = null;
    }, 120);
  }

  function closeCardAndReturn() {
    setOpen(false);
    returnToCardStart();
  }

  function toggleCard() {
    setOpen((currentOpen) => {
      const nextOpen = !currentOpen;
      if (nextOpen) {
        rememberReturnPosition();
        window.dispatchEvent(new CustomEvent("nesthelper-service-card-open", { detail: { id: service.id } }));
      } else {
        returnToCardStart();
      }
      return nextOpen;
    });
  }

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, label, select, textarea")) return;
    toggleCard();
  }

  function getRequestHref() {
    if (service.id === "specific-area-reset") return "/request?service=specific-area-reset#request-form";
    if (service.id === "move-out-cleaning") return "/request?service=move-in-out-cleaning#request-form";
    if (service.id === "whole-home-reset") return "/request?service=whole-home-reset#request-form";
    return `/request?service=${service.id}#request-form`;
  }

  function toggleDetails(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (open) {
      closeCardAndReturn();
      return;
    }

    rememberReturnPosition();
    window.dispatchEvent(new CustomEvent("nesthelper-service-card-open", { detail: { id: service.id } }));
    setOpen(true);
  }

  return (
    <article
      ref={cardRef}
      onClick={handleCardClick}
      className={`group relative flex cursor-pointer flex-col self-start overflow-visible rounded-[2rem] border bg-white/95 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-lift ${
        open ? `border-nest-gold/35 ring-4 ${theme.ring}` : `${collapsedHeightClass} border-nest-gold/16`
      }`}
    >
      {featured && (
        <div className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-nest-teal px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-soft">
          <Star size={13} /> Most popular
        </div>
      )}

      <div className={`relative h-40 shrink-0 overflow-hidden bg-gradient-to-br sm:h-44 ${theme.accent}`}>
        <Image
          src={service.image}
          alt={service.title}
          fill
          className="object-contain p-5 opacity-100 transition duration-700 group-hover:scale-[1.03] sm:p-6"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/0" />
        <div className={`absolute left-4 top-4 max-w-[72%] rounded-full border px-3 py-1.5 text-[0.68rem] font-black uppercase leading-tight tracking-[0.12em] shadow-sm ${theme.chip}`}>
          {theme.eyebrow}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className={`text-2xl font-black leading-tight text-nest-teal ${closedTitleClass}`}>{service.title}</h3>
            <p className={`mt-2 text-sm font-semibold leading-6 text-nest-ink/68 ${closedDescriptionClass}`}>
              {service.description}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDetails}
            aria-expanded={open}
            aria-controls={detailsId}
            className={`focus-ring shrink-0 rounded-full border p-2.5 shadow-sm transition hover:-translate-y-0.5 ${
              open
                ? "border-nest-teal bg-nest-teal text-white"
                : "border-nest-gold/18 bg-nest-cream text-nest-teal hover:border-nest-gold/55 hover:bg-white"
            }`}
          >
            <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className={`mt-5 flex ${pricePanelHeightClass} shrink-0 overflow-hidden rounded-3xl border border-nest-gold/14 bg-gradient-to-br from-nest-cream via-white to-nest-mint/20 shadow-sm`}>
          <div className="grid w-full gap-0 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <div className="flex flex-col justify-center p-4 sm:p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-nest-ink/55">{isQuoteBased ? "Pricing" : "Starting at"}</div>
              <div className={`mt-1 break-words font-black leading-tight text-nest-teal ${isLaundry ? "text-[1.55rem] sm:text-[1.62rem]" : "text-2xl sm:text-3xl"}`}>
                {isLaundry ? (
                  <>
                    <span>$59 minimum</span>
                    <span className="block">+ $2.25/lb</span>
                  </>
                ) : (
                  service.standardPrice
                )}
              </div>
              <div className={`mt-2 font-bold text-nest-ink/60 ${isLaundry ? "text-[0.72rem] leading-4 sm:text-xs" : "text-sm"}`}>
                {isQuoteBased ? "Reviewed before checkout" : isLaundry ? "Intro launch pricing" : "Helper-based launch pricing"}
              </div>
            </div>
            <div className={`flex min-h-[3.5rem] min-w-0 items-center justify-center whitespace-normal break-words px-3 py-3 text-center text-[0.58rem] font-black uppercase leading-5 tracking-[0.075em] sm:text-[0.62rem] ${theme.price}`}>
              {service.priceNote}
            </div>
          </div>
        </div>

        <div
          id={detailsId}
          className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <div className="mt-4 grid gap-4">
              {extra?.bestFor && (
                <div className="rounded-3xl border border-nest-gold/12 bg-nest-mint/20 p-5">
                  <h4 className="flex items-center gap-2 font-black text-nest-teal">
                    <Info size={17} /> Best for
                  </h4>
                  <p className="mt-3 text-sm font-semibold leading-6 text-nest-ink/72">{extra.bestFor}</p>
                </div>
              )}

              <div className="rounded-3xl border border-nest-gold/12 bg-white p-5 shadow-sm">
                <h4 className="font-black text-nest-teal">What may fit in this visit</h4>
                <ul className="mt-3 grid gap-2.5 text-sm text-nest-ink/76">
                  {[...service.details, ...(extra?.extraDetails || [])].map((detail) => (
                    <li key={detail} className="flex gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-nest-mint/45 text-nest-teal">
                        <CheckCircle2 size={15} />
                      </span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-nest-gold/12 bg-nest-cream p-5">
                <h4 className="font-black text-nest-teal">Good to know</h4>
                <div className="mt-3 grid gap-2 text-sm font-bold text-nest-ink/72">
                  <div className="flex gap-2">
                    <Clock className="mt-0.5 shrink-0 text-nest-teal" size={17} />
                    <span>{service.serviceTime}</span>
                  </div>
                  {service.travelInfo && (
                    <div className="flex gap-2">
                      <MapPin className="mt-0.5 shrink-0 text-nest-teal" size={17} />
                      <span>{service.travelInfo}</span>
                    </div>
                  )}
                  {service.recurringRates?.length ? (
                    <div className="mt-3 rounded-2xl border border-nest-gold/16 bg-white p-3 text-xs leading-5 text-nest-ink/70">
                      <p className="font-black text-nest-teal">Recurring rates after first visit</p>
                      <div className="mt-2 grid gap-1">
                        {service.recurringRates.map((rate) => (
                          <span key={rate.cadence} className="flex justify-between gap-3 font-black">
                            <span>{rate.cadence}</span>
                            <span>{rate.price}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                {extra?.goodToKnow?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {extra.goodToKnow.map((item) => (
                      <span key={item} className="rounded-full border border-nest-gold/20 bg-white px-3 py-1.5 text-xs font-black text-nest-teal">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
                {service.note && (
                  <p className="mt-4 rounded-2xl bg-white/80 p-4 text-xs font-semibold leading-5 text-nest-ink/68">
                    {service.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto shrink-0 pt-5">
          <button
            type="button"
            onClick={toggleDetails}
            aria-expanded={open}
            aria-controls={detailsId}
            className={`focus-ring mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 font-black shadow-sm transition hover:-translate-y-0.5 ${
              open
                ? "border-nest-teal bg-nest-teal text-white"
                : "border-nest-teal/20 bg-white text-nest-teal hover:bg-nest-mint/25"
            }`}
          >
            {open ? "Hide details" : "View package details"}
            <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
          </button>

          <Link
            href={getRequestHref()}
            onClick={(event) => event.stopPropagation()}
            className="focus-ring group/link inline-flex w-full items-center justify-center gap-2 rounded-full bg-nest-teal px-5 py-3.5 font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-nest-teal2 hover:shadow-lift"
          >
            Request This
            <ArrowRight size={18} className="transition group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
