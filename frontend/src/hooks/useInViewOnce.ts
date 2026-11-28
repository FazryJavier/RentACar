"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True once the element has been at least `amount` visible. Without IntersectionObserver
 * (old browsers, tests) it is true right away, so content is never held back.
 */
export function useInViewOnce(ref: RefObject<Element | null>, amount = 0.2): boolean {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || seen) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: amount },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, amount, seen]);

  return seen;
}

/** True when the element starts below the visible viewport (checked once after mount). */
export function isBelowFold(element: Element | null): boolean {
  if (!element || typeof window === "undefined") {
    return false;
  }
  return element.getBoundingClientRect().top > window.innerHeight;
}
