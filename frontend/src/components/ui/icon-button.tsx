import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef, MouseEvent } from "react";
import { cn } from "@/lib/cn";

const iconButtonVariants = cva(
  [
    "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
    "transition-colors duration-(--motion-fast) ease-standard focus-visible:focus-ring",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-40 [&_svg]:size-5",
  ],
  {
    variants: {
      variant: {
        outline: "border-border-strong bg-surface text-text border hover:bg-surface-muted",
        solid: "bg-navy-900 text-text-on-dark hover:bg-navy-800",
        ghost: "bg-transparent text-text hover:bg-surface-muted",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export type IconButtonProps = Omit<ComponentPropsWithRef<"button">, "aria-label" | "disabled"> &
  VariantProps<typeof iconButtonVariants> & {
    /** Required: the button has no visible text. */
    "aria-label": string;
    disabled?: boolean;
  };

/** Round 40px icon button: carousel arrows, card arrow, close. */
export function IconButton({
  variant,
  className,
  disabled = false,
  onClick,
  type,
  ...props
}: IconButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...props}
      type={type ?? "button"}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      className={cn(iconButtonVariants({ variant }), className)}
    />
  );
}
