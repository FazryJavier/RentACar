"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";

const DRAG_THRESHOLD_PX = 5;

/**
 * Horizontal list with scroll snap per item: native swipe, mouse drag, ◂ ▸ buttons (one item per
 * press, disabled at the ends) and dots on phones. Never moves on its own.
 */
export function Carousel({
  label,
  children,
  itemClassName,
  controls = "top",
}: {
  label: string;
  children: ReactNode;
  /** Width of each item (how many are visible per breakpoint). */
  itemClassName: string;
  /** Where the ◂ ▸ buttons go; "none" hides them (dots only, on phones). */
  controls?: "top" | "none";
}) {
  const list = useRef<HTMLUListElement>(null);
  const items = Children.toArray(children);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(items.length <= 1);
  const [active, setActive] = useState(0);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const update = useCallback(() => {
    const element = list.current;
    if (!element) {
      return;
    }
    const max = element.scrollWidth - element.clientWidth;
    setAtStart(element.scrollLeft <= 1);
    setAtEnd(element.scrollLeft >= max - 1);
    const first = element.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth : element.clientWidth;
    setActive(step > 0 ? Math.round(element.scrollLeft / step) : 0);
  }, []);

  useEffect(() => {
    update();
    const element = list.current;
    element?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      element?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function scrollByItem(direction: 1 | -1) {
    const element = list.current;
    const first = element?.firstElementChild as HTMLElement | null;
    if (!element || !first) {
      return;
    }
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({ left: direction * (first.offsetWidth + gap), behavior: "smooth" });
  }

  function handlePointerDown(event: PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse" || !list.current) {
      return;
    }
    drag.current = { x: event.clientX, left: list.current.scrollLeft, moved: false };
  }

  function handlePointerMove(event: PointerEvent<HTMLUListElement>) {
    const state = drag.current;
    if (!state || !list.current) {
      return;
    }
    const dx = event.clientX - state.x;
    if (!state.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) {
      return;
    }
    state.moved = true;
    list.current.scrollLeft = state.left - dx;
  }

  function handleClickCapture(event: MouseEvent) {
    // A drag must not also open the card under the pointer.
    if (drag.current?.moved) {
      event.preventDefault();
      event.stopPropagation();
    }
    drag.current = null;
  }

  return (
    <div className="relative">
      {controls === "top" && items.length > 1 ? (
        <div className="mb-4 flex justify-end gap-2">
          <IconButton aria-label="Sebelumnya" disabled={atStart} onClick={() => scrollByItem(-1)}>
            <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
          </IconButton>
          <IconButton aria-label="Berikutnya" disabled={atEnd} onClick={() => scrollByItem(1)}>
            <ChevronRight aria-hidden="true" strokeWidth={1.75} />
          </IconButton>
        </div>
      ) : null}
      <ul
        ref={list}
        aria-label={label}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          if (drag.current && !drag.current.moved) {
            drag.current = null;
          }
        }}
        onPointerLeave={() => {
          if (drag.current && !drag.current.moved) {
            drag.current = null;
          }
        }}
        onClickCapture={handleClickCapture}
        className={cn(
          "focus-visible:focus-ring -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-4 md:-mx-6 md:scroll-px-6 md:gap-6 md:px-6 xl:-mx-8 xl:scroll-px-8 xl:px-8",
          "motion-safe:scroll-smooth",
        )}
      >
        {items.map((item, index) => (
          <li key={index} className={cn("shrink-0 snap-start", itemClassName)}>
            {item}
          </li>
        ))}
      </ul>
      {items.length > 1 ? (
        <div aria-hidden="true" className="mt-2 flex justify-center gap-2 sm:hidden">
          {items.map((_, index) => (
            <span
              key={index}
              data-active={index === active}
              className="bg-border data-[active=true]:bg-navy-900 size-2 rounded-full"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
