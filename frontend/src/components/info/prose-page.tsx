import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

export type TocItem = { id: string; title: string };

/** Page header shared by the info pages: one h1, optional demo badge and lead text. */
export function InfoHeader({
  title,
  lead,
  demoLabel,
  children,
}: {
  title: string;
  lead?: string;
  demoLabel?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4">
      {demoLabel ? (
        <Badge tone="neutral" size="md" className="self-start">
          {demoLabel}
        </Badge>
      ) : null}
      <h1 className="text-h1 text-text">{title}</h1>
      {lead ? <p className="text-body-lg text-text-muted max-w-form">{lead}</p> : null}
      {children}
    </header>
  );
}

/** Page-width wrapper with the public layout's gutters and vertical rhythm. */
export function InfoContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-page mx-auto px-4 py-12 md:px-6 lg:py-16 xl:px-8", className)}>
      {children}
    </div>
  );
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length === 0) {
    return null;
  }
  const list = (
    <ol className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="text-body-sm text-text-muted hover:text-text focus-visible:focus-ring inline-flex min-h-11 items-center rounded-sm lg:min-h-0"
          >
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <nav aria-label="Daftar isi">
      <details className="bg-surface rounded-lg p-4 shadow-sm lg:hidden">
        <summary className="text-body text-text focus-visible:focus-ring min-h-11 cursor-pointer rounded-sm font-semibold">
          Daftar isi
        </summary>
        <div className="mt-2">{list}</div>
      </details>
      <div className="hidden lg:block">
        <p className="text-caption text-text-subtle mb-3 font-semibold uppercase">Daftar isi</p>
        {list}
      </div>
    </nav>
  );
}

/** Readable long-form text styled with tokens (paragraphs, lists, links). */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "text-body text-text-muted max-w-form",
        "[&_li]:mt-2 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_strong]:text-text [&_blockquote]:border-border [&_blockquote]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:pl-4",
      )}
    >
      {children}
    </div>
  );
}

export type ProseSection = { id: string; title: string; body: ReactNode };

/** Long text page: header, table of contents (sticky on desktop) and sections. */
export function ProsePage({
  title,
  lead,
  demoLabel,
  sections,
  toc,
  children,
}: {
  title: string;
  lead?: string;
  demoLabel?: string;
  sections?: ProseSection[];
  /** Table of contents when the body is not built from `sections` (e.g. Markdown). */
  toc?: TocItem[];
  children?: ReactNode;
}) {
  const items = toc ?? sections?.map(({ id, title: heading }) => ({ id, title: heading })) ?? [];
  return (
    <InfoContainer>
      <InfoHeader title={title} lead={lead} demoLabel={demoLabel} />
      <div className="mt-10 grid gap-8 lg:grid-cols-4 lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <TableOfContents items={items} />
        </div>
        <div className="lg:col-span-3">
          <Prose>
            {sections?.map((section) => (
              <section key={section.id} aria-labelledby={section.id}>
                <h2 id={section.id} className="text-h3 text-text mt-8 scroll-mt-24">
                  {section.title}
                </h2>
                {section.body}
              </section>
            ))}
            {children}
          </Prose>
        </div>
      </div>
    </InfoContainer>
  );
}
