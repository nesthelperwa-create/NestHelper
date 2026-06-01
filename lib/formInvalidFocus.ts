import type { InvalidEvent } from "react";

export function focusFirstInvalidField(event: InvalidEvent<HTMLFormElement>) {
  const form = event.currentTarget;
  const target = event.target as HTMLElement | null;
  if (!target || form.dataset.invalidScrollHandled === "true") return;

  form.dataset.invalidScrollHandled = "true";
  window.setTimeout(() => {
    delete form.dataset.invalidScrollHandled;
  }, 220);

  window.requestAnimationFrame(() => {
    const fieldShell = target.closest<HTMLElement>("[data-form-field], label, fieldset, section");
    const scrollTarget = fieldShell || target;

    scrollTarget.setAttribute("data-field-invalid", "true");
    target.setAttribute("aria-invalid", "true");
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    if (typeof target.focus === "function") {
      try {
        target.focus({ preventScroll: true });
      } catch {
        target.focus();
      }
    }

    window.setTimeout(() => {
      scrollTarget.removeAttribute("data-field-invalid");
    }, 1800);
  });
}
