import { useId } from "react";
import { cn } from "@/lib/cn";

/** Organic accent blob at a section edge (decoration only: max 2 per screen, never behind text). */
export function DecorBlob({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 200 200"
      data-decoration="blob"
      className={cn("pointer-events-none absolute z-(--z-decoration)", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-soft)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M44.7,-58.6C57.1,-49.5,66.1,-35.5,70.4,-20.1C74.7,-4.7,74.3,12.1,67.4,25.4C60.5,38.7,47.1,48.5,32.6,56.4C18.1,64.3,2.5,70.3,-13.6,69.4C-29.7,68.5,-46.3,60.7,-57.6,48.1C-68.9,35.5,-74.9,18.1,-74.2,1.2C-73.5,-15.7,-66.1,-31.4,-54.4,-40.8C-42.7,-50.2,-26.7,-53.4,-11.9,-58.4C2.9,-63.4,16.5,-70.2,30.1,-68.9C43.7,-67.6,32.3,-67.7,44.7,-58.6Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}
