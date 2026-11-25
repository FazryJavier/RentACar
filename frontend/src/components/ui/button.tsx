import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentPropsWithRef, MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  [
    "group inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
    "transition-colors duration-(--motion-fast) ease-standard focus-visible:focus-ring",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
    "[&_svg]:size-5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-navy-900 text-text-on-dark hover:bg-navy-800 aria-disabled:hover:bg-navy-900",
        accent: "bg-accent text-text-on-dark hover:bg-accent-hover aria-disabled:hover:bg-accent",
        secondary:
          "control-border border-navy-900 bg-surface text-text hover:bg-surface-muted aria-disabled:hover:bg-surface",
        ghost: "bg-transparent text-text hover:bg-surface-muted aria-disabled:hover:bg-transparent",
        light: "bg-surface text-text hover:bg-surface-muted aria-disabled:hover:bg-surface",
        danger: "bg-danger text-text-on-dark",
      },
      size: {
        sm: "text-body-sm h-9 px-5 font-semibold",
        md: "text-body h-12 px-6 font-semibold",
        lg: "text-body h-14 px-7 font-semibold",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = Omit<ComponentPropsWithRef<"button">, "disabled"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child element (e.g. a Next.js `Link`) with button styles. */
    asChild?: boolean;
    loading?: boolean;
    disabled?: boolean;
    /** Trailing arrow that shifts 2px on hover (primary CTA). */
    arrow?: boolean;
  };

/**
 * Base button. Disabled and loading buttons stay focusable (`aria-disabled`)
 * so screen-reader users can discover them, but never fire `onClick`.
 */
export function Button({
  asChild = false,
  loading = false,
  disabled = false,
  variant,
  size,
  fullWidth,
  arrow = false,
  className,
  children,
  onClick,
  type,
  ...props
}: ButtonProps) {
  const inactive = disabled || loading;
  const Component = asChild ? Slot.Root : "button";

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (inactive) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  }

  return (
    <Component
      {...props}
      type={asChild ? undefined : (type ?? "button")}
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <Spinner /> : null}
          {children}
          {arrow ? (
            <ArrowRight
              aria-hidden="true"
              strokeWidth={1.75}
              className="ease-standard transition-transform duration-(--motion-fast) group-hover:translate-x-0.5 group-aria-disabled:translate-x-0"
            />
          ) : null}
        </>
      )}
    </Component>
  );
}
