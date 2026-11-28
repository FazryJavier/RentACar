import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Section badge + h2 + optional subtitle, 32 px above the content. */
export function SectionHeading({
  id,
  badge,
  title,
  subtitle,
  action,
  className,
}: {
  id: string;
  badge?: string;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-form flex flex-col gap-3">
        {badge ? (
          <Badge tone="accent" size="md" dot className="self-start">
            {badge}
          </Badge>
        ) : null}
        <h2 id={id} className="text-h2 text-text">
          {title}
        </h2>
        {subtitle ? <p className="text-body-lg text-text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Page-width section with the design system's vertical rhythm (64 → 96 px). */
export function HomeSection({
  labelledBy,
  className,
  children,
}: {
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn("max-w-page relative mx-auto px-4 py-16 md:px-6 lg:py-24 xl:px-8", className)}
    >
      {children}
    </section>
  );
}
