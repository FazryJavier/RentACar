import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ErrorContentProps = { icon: LucideIcon; title: string; message: string; actions: ReactNode };

/** Body of the 404 and 500 pages. */
export function ErrorContent({ icon: Icon, title, message, actions }: ErrorContentProps) {
  return (
    <section className="max-w-page mx-auto flex flex-col items-center px-4 py-20 text-center md:px-6 md:py-24">
      <span className="bg-accent-wash text-accent inline-flex size-20 items-center justify-center rounded-full">
        <Icon aria-hidden="true" strokeWidth={1.75} className="size-10" />
      </span>
      <h1 className="text-h1 text-text mt-6">{title}</h1>
      <p className="text-body-lg text-text-muted max-w-confirm mt-3">{message}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div>
    </section>
  );
}
