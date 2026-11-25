"use client";

import { X } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

export type ChipProps = Omit<ComponentPropsWithRef<"button">, "onClick" | "aria-pressed"> & {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  /** When set, shows a × button that calls `onRemove`; `removeLabel` names it for screen readers. */
  onRemove?: () => void;
  removeLabel?: string;
};

/** Filter chip: a toggle button, selected = navy. */
export function Chip({
  pressed,
  onPressedChange,
  onRemove,
  removeLabel,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span className="inline-flex items-center">
      <button
        {...props}
        type="button"
        aria-pressed={pressed}
        onClick={() => onPressedChange(!pressed)}
        className={cn(
          "text-body-sm inline-flex h-9 items-center gap-1.5 rounded-full border px-4 font-medium",
          "ease-standard focus-visible:focus-ring transition-colors duration-(--motion-fast)",
          pressed
            ? "border-navy-900 bg-navy-900 text-text-on-dark"
            : "border-border bg-surface text-text hover:bg-surface-muted",
          onRemove ? "rounded-r-none pr-3" : null,
          className,
        )}
      >
        {children}
      </button>
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel ?? "Hapus filter"}
          onClick={onRemove}
          className={cn(
            "focus-visible:focus-ring inline-flex h-9 items-center rounded-r-full border border-l-0 pr-3 pl-2",
            pressed
              ? "border-navy-900 bg-navy-900 text-text-on-dark"
              : "border-border bg-surface text-text",
          )}
        >
          <X aria-hidden="true" strokeWidth={1.75} className="size-4" />
        </button>
      ) : null}
    </span>
  );
}
