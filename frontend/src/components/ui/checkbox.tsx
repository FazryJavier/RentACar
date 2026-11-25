"use client";

import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive, RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useFieldControl, useFieldLabelId } from "./field";

const boxBase = [
  "inline-flex size-5 shrink-0 items-center justify-center border border-border-strong bg-surface",
  "transition-colors duration-(--motion-fast) ease-standard focus-visible:focus-ring",
  "disabled:cursor-not-allowed disabled:bg-surface-muted aria-invalid:border-danger",
  "data-[state=checked]:border-navy-900 data-[state=checked]:bg-navy-900 data-[state=checked]:text-text-on-dark",
];

export type CheckboxProps = {
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

/** 20px checkbox with its own label. */
export function Checkbox({
  label,
  onCheckedChange,
  invalid,
  describedBy,
  className,
  ...props
}: CheckboxProps) {
  const id = useId();

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <CheckboxPrimitive.Root
        {...props}
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onCheckedChange={(state) => onCheckedChange?.(state === true)}
        className={cn(boxBase, "mt-0.5 rounded-sm")}
      >
        <CheckboxPrimitive.Indicator>
          <Check aria-hidden="true" strokeWidth={2.5} className="size-3.5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label htmlFor={id} className="text-body-sm text-text">
        {label}
      </label>
    </div>
  );
}

export type RadioOption = { value: string; label: ReactNode; disabled?: boolean };

export type RadioGroupProps = {
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
  "aria-label"?: string;
};

/** Radio group (Radix): arrow keys move focus and select. Labelled by the surrounding Field. */
export function RadioGroup({
  options,
  orientation = "vertical",
  className,
  ...props
}: RadioGroupProps) {
  const field = useFieldControl();
  const labelId = useFieldLabelId();
  const baseId = useId();

  return (
    <RadioGroupPrimitive.Root
      {...props}
      orientation={orientation}
      aria-labelledby={props["aria-label"] ? undefined : labelId}
      aria-invalid={field["aria-invalid"]}
      aria-describedby={field["aria-describedby"]}
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className,
      )}
    >
      {options.map((option, index) => {
        const id = `${baseId}-${index}`;

        return (
          <div key={option.value} className="flex items-center gap-3">
            <RadioGroupPrimitive.Item
              id={id}
              value={option.value}
              disabled={option.disabled}
              className={cn(boxBase, "rounded-full")}
            >
              <RadioGroupPrimitive.Indicator className="bg-surface size-2 rounded-full" />
            </RadioGroupPrimitive.Item>
            <label htmlFor={id} className="text-body-sm text-text">
              {option.label}
            </label>
          </div>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
