"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({
  className,
  align = "start",
  sideOffset = 8,
  ...props
}: ComponentPropsWithRef<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        {...props}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "border-border bg-surface z-(--z-dropdown) rounded-lg border p-4 shadow-lg",
          "motion-safe:data-[state=open]:animate-slide-in motion-reduce:data-[state=open]:animate-fade-in",
          className,
        )}
      />
    </PopoverPrimitive.Portal>
  );
}
