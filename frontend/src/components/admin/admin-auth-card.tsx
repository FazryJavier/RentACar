import type { ReactNode } from "react";

export function AdminAuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="bg-surface rounded-lg p-6 shadow-md md:p-8">
      <h1 className="text-h3 text-text">{title}</h1>
      {description ? <p className="text-body-sm text-text-muted mt-2">{description}</p> : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="text-body-sm text-text-muted mt-6">{footer}</div> : null}
    </section>
  );
}
