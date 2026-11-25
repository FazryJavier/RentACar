"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./field";

export const controlVariants = cva(
  [
    "text-body text-text w-full rounded-sm border border-border-strong bg-surface px-3.5",
    "placeholder:text-text-subtle transition-colors duration-(--motion-fast) ease-standard",
    "focus-visible:border-accent focus-visible:focus-ring",
    "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted",
    "aria-invalid:border-danger",
  ],
  {
    variants: {
      size: { md: "h-12", sm: "text-body-sm h-10" },
    },
    defaultVariants: { size: "md" },
  },
);

export type InputProps = Omit<ComponentPropsWithRef<"input">, "size"> &
  VariantProps<typeof controlVariants>;

export function Input({ size, className, ...props }: InputProps) {
  const field = useFieldControl();

  return <input {...field} {...props} className={cn(controlVariants({ size }), className)} />;
}

export type TextareaProps = ComponentPropsWithRef<"textarea"> & { size?: "md" | "sm" };

export function Textarea({ size = "md", className, rows = 4, ...props }: TextareaProps) {
  const field = useFieldControl();

  return (
    <textarea
      {...field}
      rows={rows}
      {...props}
      className={cn(controlVariants({ size }), "h-auto py-3", className)}
    />
  );
}
