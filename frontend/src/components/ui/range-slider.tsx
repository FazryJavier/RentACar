"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

export type RangeSliderProps = {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  /** Called when the user releases a thumb (e.g. to apply a filter once). */
  onValueCommit?: (value: [number, number]) => void;
  /** Accessible names of the two thumbs, e.g. ["Harga minimum", "Harga maksimum"]. */
  thumbLabels: [string, string];
  /** Spoken value of a thumb, e.g. "Rp300.000". */
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
};

/**
 * Two-thumb range slider (Radix): Arrow keys move one step, Page Up/Down ten steps,
 * Home/End to the ends; the thumbs cannot cross.
 */
export function RangeSlider({
  min,
  max,
  step,
  value,
  onValueChange,
  onValueCommit,
  thumbLabels,
  formatValue,
  disabled = false,
  className,
}: RangeSliderProps) {
  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      step={step}
      value={value}
      minStepsBetweenThumbs={1}
      disabled={disabled}
      onValueChange={(next) => onValueChange([next[0] ?? min, next[1] ?? max])}
      onValueCommit={(next) => onValueCommit?.([next[0] ?? min, next[1] ?? max])}
      className={cn(
        "relative flex h-11 w-full touch-none items-center select-none data-[disabled]:opacity-40",
        className,
      )}
    >
      <SliderPrimitive.Track className="bg-surface-muted relative h-1 grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-accent absolute h-full" />
      </SliderPrimitive.Track>
      {thumbLabels.map((label, index) => (
        <SliderPrimitive.Thumb
          key={label}
          aria-label={label}
          aria-valuetext={formatValue ? formatValue(value[index] ?? min) : undefined}
          className="border-accent bg-surface focus-visible:focus-ring block size-5 rounded-full border-2 shadow-sm"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
