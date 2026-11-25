import { Car } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type LogoProps = { tone?: "default" | "on-dark"; className?: string };

/** Wordmark linking to the home page. */
export function Logo({ tone = "default", className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="RentACar — Beranda"
      className={cn(
        "text-h4 focus-visible:focus-ring inline-flex min-h-11 items-center gap-2 rounded-sm font-extrabold",
        tone === "on-dark" ? "text-text-on-dark" : "text-text",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-md",
          tone === "on-dark" ? "bg-accent-soft text-navy-900" : "bg-navy-900 text-text-on-dark",
        )}
      >
        <Car strokeWidth={1.75} className="size-5" />
      </span>
      <span>
        Rent<span className={tone === "on-dark" ? "text-accent-soft" : "text-accent"}>A</span>Car
      </span>
    </Link>
  );
}
