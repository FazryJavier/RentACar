import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "text-caption inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        accent: "bg-accent-tint text-accent-hover",
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning",
        danger: "bg-danger-bg text-danger",
        info: "bg-info-bg text-info",
        neutral: "bg-surface-muted text-text-muted",
        "accent-solid": "bg-accent text-text-on-dark",
        "success-outline": "border-success bg-surface text-success border",
        category: "bg-surface/90 text-text shadow-sm",
      },
      size: { sm: "h-6", md: "h-7" },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export type BadgeProps = ComponentPropsWithRef<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** 6px leading dot in the current text colour. */
    dot?: boolean;
  };

export function Badge({ tone, size, dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span {...props} className={cn(badgeVariants({ tone, size }), className)}>
      {dot ? (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  );
}

export const BOOKING_STATUSES = [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "ongoing",
  "completed",
  "cancelled",
  "expired",
  "rejected",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_BADGE: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  pending_payment: { label: "Menunggu pembayaran", tone: "warning" },
  pending_verification: { label: "Menunggu verifikasi", tone: "info" },
  confirmed: { label: "Dikonfirmasi", tone: "success" },
  ongoing: { label: "Berjalan", tone: "accent-solid" },
  completed: { label: "Selesai", tone: "success-outline" },
  cancelled: { label: "Dibatalkan", tone: "neutral" },
  expired: { label: "Kedaluwarsa", tone: "neutral" },
  rejected: { label: "Ditolak", tone: "danger" },
};

export type BookingStatusBadgeProps = Omit<BadgeProps, "tone" | "children"> & {
  status: BookingStatus;
};

/** Booking status badge; the label always carries the meaning, not only the colour. */
export function BookingStatusBadge({ status, ...props }: BookingStatusBadgeProps) {
  const { label, tone } = BOOKING_STATUS_BADGE[status];

  return (
    <Badge {...props} tone={tone} dot>
      {label}
    </Badge>
  );
}
