"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

type NavItemProps = {
  href: string;
  label: string;
  active: boolean;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

/** Header navigation item; the active one gets `aria-current="page"` and the accent underline. */
export function NavItem({ href, label, active, variant, onNavigate }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "ease-standard focus-visible:focus-ring rounded-sm transition-colors duration-(--motion-fast)",
        variant === "desktop"
          ? "text-body-sm relative inline-flex h-11 items-center font-medium"
          : "text-h4 border-border flex h-14 items-center border-b px-1",
        active ? "text-text font-semibold" : "text-text-muted hover:text-text",
        variant === "desktop" && active
          ? "after:bg-accent after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:rounded-full"
          : null,
        variant === "mobile" && active ? "text-accent" : null,
      )}
    >
      {label}
    </Link>
  );
}
