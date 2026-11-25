import { cn } from "@/lib/cn";

/** "Skip to content" link: hidden until focused (first Tab on every page). */
export function SkipLink() {
  return (
    <a
      href="#konten"
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-toast)",
        "focus:text-body-sm focus:bg-navy-900 focus:text-text-on-dark focus:focus-ring focus:rounded-md focus:px-4 focus:py-3 focus:font-semibold",
      )}
    >
      Lewati ke konten
    </a>
  );
}
