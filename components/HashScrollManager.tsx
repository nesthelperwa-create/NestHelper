"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function scrollToHash(hash: string) {
  if (!hash || hash === "#") return false;
  const id = decodeURIComponent(hash.slice(1));
  const target = document.getElementById(id);
  if (!target) return false;

  window.requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  return true;
}

export function HashScrollManager() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!window.location.hash) return;

    const timeout = window.setTimeout(() => {
      scrollToHash(window.location.hash);
    }, 90);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  useEffect(() => {
    function handleHashClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const clickedElement = event.target instanceof Element ? event.target : null;
      const anchor = clickedElement?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let destinationUrl: URL;
      try {
        destinationUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (destinationUrl.origin !== window.location.origin) return;
      if (!destinationUrl.hash || destinationUrl.hash === "#") return;

      const currentPath = window.location.pathname + window.location.search;
      const destinationPath = destinationUrl.pathname + destinationUrl.search;

      event.preventDefault();

      if (destinationPath === currentPath) {
        // Always scroll, even when the URL already has the same hash.
        if (window.location.hash !== destinationUrl.hash) {
          window.history.pushState(null, "", destinationUrl.hash);
        } else {
          window.history.replaceState(null, "", destinationUrl.hash);
        }
        scrollToHash(destinationUrl.hash);
        return;
      }

      // For same-site links that go to a section on another page, let Next navigate
      // without its automatic scroll, then scroll after the new page renders.
      router.push(`${destinationPath}${destinationUrl.hash}`, { scroll: false });
    }

    document.addEventListener("click", handleHashClick, true);
    return () => document.removeEventListener("click", handleHashClick, true);
  }, [router]);

  return null;
}
