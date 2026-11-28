"use client";

import { CalendarSearch, CarFront, KeyRound, Wallet } from "lucide-react";
import { m, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { home } from "@/content/home";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Reveal, RevealItem } from "./reveal";
import { HomeSection, SectionHeading } from "./section-heading";

const ICONS = [CalendarSearch, CarFront, Wallet, KeyRound];

/** Four steps; on wide screens the connecting line fills as the section scrolls in. */
export function HowItWorks() {
  const list = useRef<HTMLOListElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 90%", "center 50%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <HomeSection labelledBy="steps-title">
      <Reveal>
        <SectionHeading id="steps-title" title={home.steps.title} />
        <div className="relative">
          <div
            aria-hidden="true"
            className="bg-border absolute top-8 right-12 left-12 hidden h-0.5 lg:block"
          >
            <m.div
              data-testid="steps-line"
              className="bg-accent h-full origin-left"
              style={{ scaleX: reducedMotion ? 1 : fill }}
            />
          </div>
          <ol ref={list} className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {home.steps.items.map((step, index) => {
              const Icon = ICONS[index] ?? CarFront;
              return (
                <RevealItem
                  key={step.title}
                  as="li"
                  className="flex flex-col items-start gap-3 lg:items-center lg:text-center"
                >
                  <span className="bg-surface text-accent relative inline-flex size-16 items-center justify-center rounded-full shadow-md">
                    <Icon aria-hidden="true" strokeWidth={1.75} className="size-8" />
                    <span className="bg-navy-900 text-caption text-text-on-dark absolute -top-1 -right-1 inline-flex size-6 items-center justify-center rounded-full font-bold">
                      {index + 1}
                    </span>
                  </span>
                  <h3 className="text-h4 text-text">{step.title}</h3>
                  <p className="text-body-sm text-text-muted">{step.text}</p>
                </RevealItem>
              );
            })}
          </ol>
        </div>
      </Reveal>
    </HomeSection>
  );
}
