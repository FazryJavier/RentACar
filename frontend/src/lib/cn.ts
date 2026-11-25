import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "h1",
        "h2",
        "h3",
        "h4",
        "body-lg",
        "body",
        "body-sm",
        "caption",
        "price",
        "price-lg",
      ],
      radius: ["sm", "md", "lg", "xl", "full"],
      shadow: ["sm", "md", "lg", "accent"],
      ease: ["standard", "emphasized"],
    },
  },
});

/** Joins class names and resolves conflicting Tailwind utilities (last one wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
