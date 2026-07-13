import type { InvalidEvent } from "react";

export function focusFirstInvalidField(event: InvalidEvent<HTMLFormElement>) {
  try {
    const form = event.currentTarget;
    const target = event.target as HTMLElement | null;
    if (!target || form.dataset.invalidScrollHandled === "true") return;

    form.dataset.invalidScrollHandled = "true";
    window.setTimeout(() => {
      delete form.dataset.invalidScrollHandled;
    }, 350);

    window.requestAnimationFrame(() => {
      try {
        const fieldShell = target.closest<HTMLElement>("[data-form-field], label, fieldset, section");
        const scrollTarget = fieldShell || target;

        scrollTarget.setAttribute("data-field-invalid", "true");
        target.setAttribute("aria-invalid", "true");
        scrollTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

        const userAgent = window.navigator?.userAgent || "";
        const isIosLike = /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Mac") && "ontouchend" in document);
        if (!isIosLike && typeof target.focus === "function") {
          target.focus({ preventScroll: true });
        }

        window.setTimeout(() => {
          scrollTarget.removeAttribute("data-field-invalid");
        }, 1800);
      } catch {
        // Invalid-field highlighting should never break the public request form.
      }
    });
  } catch {
    // Form validation helpers should never block the customer from using the form.
  }
}
