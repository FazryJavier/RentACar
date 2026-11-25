import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type SpinnerProps = { className?: string };

/** Decorative 16px spinner; the surrounding control carries the accessible state (`aria-busy`). */
export function Spinner({ className }: SpinnerProps) {
  return (
    <LoaderCircle
      aria-hidden="true"
      data-motion="essential"
      strokeWidth={1.75}
      className={cn(
        "size-4 shrink-0 motion-safe:animate-spin motion-reduce:animate-spin",
        className,
      )}
    />
  );
}
