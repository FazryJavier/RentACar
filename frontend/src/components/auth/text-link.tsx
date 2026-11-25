import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Inline text link in the accent-hover colour (meets AA on light surfaces). */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        "text-accent-hover focus-visible:focus-ring rounded-sm font-semibold underline-offset-4 hover:underline",
        className,
      )}
    />
  );
}
