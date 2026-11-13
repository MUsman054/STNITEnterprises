"use client";

import { useEffect } from "react";

/**
 * Fades `.reveal` elements in once, the first time they scroll into view.
 *
 * Safe by default: without JavaScript, with reduced motion, or in print, the `.reveal`
 * class does nothing and content is simply visible. Hiding only starts once this
 * observer is running (it adds `reveal-ready` to <html>), and anything already on
 * screen at that moment is left alone so nothing flashes.
 */
export function RevealObserver() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const seen = new WeakSet<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );

    const scan = (initial: boolean) => {
      for (const element of document.querySelectorAll(".reveal:not(.is-visible)")) {
        if (seen.has(element)) continue;
        seen.add(element);
        if (initial && element.getBoundingClientRect().top < window.innerHeight) {
          element.classList.add("is-visible", "no-reveal-motion");
        } else {
          observer.observe(element);
        }
      }
    };

    scan(true);
    root.classList.add("reveal-ready");

    // Pick up elements added later (page navigation, sorting, search results).
    const mutations = new MutationObserver(() => scan(false));
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
