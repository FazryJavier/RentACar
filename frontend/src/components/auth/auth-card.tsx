import type { ReactNode } from "react";

/** Centred auth form card with a decorative car illustration beside it from `lg`. */
export function AuthCard({
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
    <section className="max-w-page mx-auto grid items-center gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-2 xl:px-8">
      <div aria-hidden="true" className="hidden lg:block">
        <CarIllustration />
      </div>
      <div className="bg-surface max-w-confirm mx-auto w-full rounded-lg p-6 shadow-md md:p-8">
        <h1 className="text-h2 text-text">{title}</h1>
        {description ? <p className="text-body-sm text-text-muted mt-2">{description}</p> : null}
        <div className="mt-6">{children}</div>
        {footer ? <div className="text-body-sm text-text-muted mt-6">{footer}</div> : null}
      </div>
    </section>
  );
}

function CarIllustration() {
  return (
    <svg viewBox="0 0 480 320" className="text-navy-900 h-auto w-full" focusable="false">
      <ellipse cx="240" cy="268" rx="200" ry="18" className="fill-surface-muted" />
      <path
        d="M60 214c0-22 14-34 38-40l60-14 46-46c10-10 22-14 36-14h88c16 0 28 6 38 18l38 44 40 8c22 4 34 18 34 40v20H60Z"
        className="fill-navy-900"
      />
      <path
        d="M214 122h50v40h-92l34-34c2-4 6-6 8-6Zm70 0h30c10 0 18 4 24 12l22 28h-76Z"
        className="fill-accent-soft"
      />
      <circle cx="140" cy="236" r="30" className="fill-navy-800" />
      <circle cx="140" cy="236" r="13" className="fill-accent-soft" />
      <circle cx="360" cy="236" r="30" className="fill-navy-800" />
      <circle cx="360" cy="236" r="13" className="fill-accent-soft" />
      <rect x="402" y="188" width="18" height="8" rx="4" className="fill-accent" />
    </svg>
  );
}
