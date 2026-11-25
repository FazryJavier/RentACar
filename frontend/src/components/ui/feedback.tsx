import { Inbox, type LucideIcon } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Loading placeholder; shimmer is static under reduced motion. */
export function Skeleton({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn(
        "bg-surface-muted rounded-sm",
        "motion-safe:bg-shimmer motion-safe:animate-shimmer",
        className,
      )}
    />
  );
}

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  /** At most one action, e.g. a Button. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>
      <Icon aria-hidden="true" strokeWidth={1.75} className="text-accent-soft size-16" />
      <h2 className="text-h4 text-text">{title}</h2>
      {description ? (
        <p className="text-body-sm text-text-muted max-w-confirm">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
