"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

type Item = number | "ellipsis-start" | "ellipsis-end";

/** Page numbers with ellipsis when there are more than 7 pages: 1 2 3 4 5 … 10, 1 … 4 5 6 … 10. */
export function paginationItems(page: number, totalPages: number): Item[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  }
  if (page >= totalPages - 3) {
    return [1, "ellipsis-start", ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)];
  }
  return [1, "ellipsis-start", page - 1, page, page + 1, "ellipsis-end", totalPages];
}

const itemBase =
  "text-body-sm inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-3 font-medium focus-visible:focus-ring";

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages < 1) {
    return null;
  }

  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <nav aria-label="Navigasi halaman" className={className}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <button
            type="button"
            aria-disabled={atStart || undefined}
            onClick={() => !atStart && onPageChange(page - 1)}
            className={cn(
              itemBase,
              "text-text hover:bg-surface-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
            )}
          >
            <ChevronLeft aria-hidden="true" strokeWidth={1.75} className="size-4" />
            <span className="max-sm:sr-only">Sebelumnya</span>
          </button>
        </li>
        {paginationItems(page, totalPages).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                type="button"
                aria-label={`Halaman ${item}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => item !== page && onPageChange(item)}
                className={cn(
                  itemBase,
                  "tabular",
                  item === page
                    ? "bg-navy-900 text-text-on-dark"
                    : "text-text hover:bg-surface-muted",
                )}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="text-text-subtle px-2">
              …
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-disabled={atEnd || undefined}
            onClick={() => !atEnd && onPageChange(page + 1)}
            className={cn(
              itemBase,
              "text-text hover:bg-surface-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
            )}
          >
            <span className="max-sm:sr-only">Berikutnya</span>
            <ChevronRight aria-hidden="true" strokeWidth={1.75} className="size-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
