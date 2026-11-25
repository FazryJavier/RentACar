"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import { controlVariants } from "./input";
import { useFieldControl } from "./field";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "md" | "sm";
  name?: string;
  className?: string;
  "aria-label"?: string;
};

/** Single select (Radix): keyboard per WAI-ARIA listbox, Esc closes without changing the value. */
export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pilih",
  disabled,
  size = "md",
  name,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  const field = useFieldControl();

  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        {...field}
        aria-label={ariaLabel}
        className={cn(
          controlVariants({ size }),
          "data-placeholder:text-text-subtle flex items-center justify-between gap-2 text-left",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown aria-hidden="true" strokeWidth={1.75} className="text-text-muted size-5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-(--z-dropdown) max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width)",
            "border-border bg-surface overflow-hidden rounded-md border shadow-md",
            "motion-safe:data-[state=open]:animate-slide-in",
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  "text-body-sm text-text relative flex h-10 cursor-default items-center rounded-sm pr-3 pl-8 outline-none select-none",
                  "data-highlighted:bg-accent-wash data-disabled:text-text-subtle data-disabled:opacity-60",
                )}
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex">
                  <Check aria-hidden="true" strokeWidth={1.75} className="text-accent size-4" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
