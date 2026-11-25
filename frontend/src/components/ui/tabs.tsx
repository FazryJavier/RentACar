"use client";

import { ChevronDown } from "lucide-react";
import { Accordion as AccordionPrimitive, Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentPropsWithRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List {...props} className={cn("border-border flex gap-6 border-b", className)} />
  );
}

/** Active tab: navy text weight 600 + 2px accent underline. */
export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      {...props}
      className={cn(
        "text-body-sm text-text-muted relative -mb-px h-11 border-b-2 border-transparent font-medium",
        "ease-standard hover:text-text focus-visible:focus-ring transition-colors duration-(--motion-fast)",
        "data-[state=active]:border-accent data-[state=active]:text-text data-[state=active]:font-semibold",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentPropsWithRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content {...props} className={cn("focus-visible:focus-ring pt-4", className)} />
  );
}

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: ComponentPropsWithRef<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item {...props} className={cn("border-border border-b", className)} />;
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentPropsWithRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        {...props}
        className={cn(
          "text-body text-text group flex min-h-14 flex-1 items-center justify-between gap-4 py-3 text-left font-semibold",
          "focus-visible:focus-ring",
          className,
        )}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.75}
          className="text-text-muted ease-standard size-5 shrink-0 transition-transform duration-(--motion-base) group-data-[state=open]:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentPropsWithRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content {...props} className="text-body-sm text-text-muted overflow-hidden">
      <div className={cn("pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
