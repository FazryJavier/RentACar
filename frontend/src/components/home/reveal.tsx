"use client";

import { animate, domAnimation, LazyMotion, m, type Variants } from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { isBelowFold, useInViewOnce } from "@/hooks/useInViewOnce";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** `--motion-reveal` (600 ms) with `--ease-emphasized`; 80 ms between items. */
const REVEAL = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };
const STAGGER = 0.08;

const groupVariants: Variants = {
  hidden: { opacity: 0, y: 24, transition: { duration: 0 } },
  shown: { opacity: 1, y: 0, transition: { ...REVEAL, staggerChildren: STAGGER } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, transition: { duration: 0 } },
  shown: { opacity: 1, y: 0, transition: REVEAL },
};

/** Loads Motion's DOM animation features once for the page (smallest bundle). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

/**
 * Hidden-then-revealed only when it starts below the fold after hydration. Server HTML and
 * anything already on screen stay visible, and nothing moves under reduced motion.
 */
function useRevealState(ref: RefObject<HTMLElement | null>) {
  const reducedMotion = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const inView = useInViewOnce(ref);

  useEffect(() => {
    if (!reducedMotion && isBelowFold(ref.current)) {
      setArmed(true);
    }
  }, [reducedMotion, ref]);

  return armed && !inView && !reducedMotion ? "hidden" : "shown";
}

/** A section (or group) that fades in and rises 24 px once, staggering its `RevealItem`s. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRevealState(ref);
  return (
    <m.div
      ref={ref}
      initial={false}
      animate={state}
      variants={groupVariants}
      data-reveal={state}
      className={className}
    >
      {children}
    </m.div>
  );
}

/** A child of `Reveal` that animates in turn (`as="li"` inside lists). */
export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = as === "li" ? m.li : m.div;
  return (
    <Tag variants={itemVariants} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Number that counts up once over 1.2 s when first visible. The final value is always in the
 * DOM for assistive technology; the animated copy is decorative.
 */
export function CountUp({ value, format }: { value: number; format: (value: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInViewOnce(ref, 0.5);
  const armed = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (element && !reducedMotion && isBelowFold(element)) {
      armed.current = true;
      element.textContent = format(0);
    }
  }, [reducedMotion, format]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !inView || !armed.current) {
      return;
    }
    armed.current = false;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => {
        element.textContent = format(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [inView, value, format]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {format(value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
