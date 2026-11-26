"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Ellipsis, Inbox, Plus, Search } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useEffect, useId, useState, type ReactNode } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { Button, EmptyState, Input, Pagination, Select, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Page } from "@/lib/api";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by TanStack
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Server sort key; the header becomes a sort button. */
    sortKey?: string;
    align?: "left" | "right";
    /** Sticky first column on small screens. */
    sticky?: boolean;
  }
}

export const SEARCH_DEBOUNCE_MS = 300;
const PER_PAGE_OPTIONS = ["10", "25", "50", "100"].map((value) => ({
  value,
  label: `${value} / halaman`,
}));

export type RowAction<T> = { label: string; onSelect: (row: T) => void; danger?: boolean };

export type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  /** From `useAdminList`. */
  list: {
    query: {
      data?: Page<T>;
      isPending: boolean;
      isError: boolean;
      refetch: () => unknown;
      isFetching: boolean;
    };
    page: number;
    perPage: number;
    sort: string;
    q: string;
    setParams: (changes: Record<string, string | number | null>) => void;
  };
  searchLabel: string;
  filters?: ReactNode;
  createLabel?: string;
  onCreate?: () => void;
  rowActions?: (row: T) => RowAction<T>[];
  rowName: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty: { title: string; description: string };
};

/** Server-paginated admin table: toolbar (search, filters, add), sortable headers, footer. */
export function DataTable<T>({
  columns,
  list,
  searchLabel,
  filters,
  createLabel = "Tambah",
  onCreate,
  rowActions,
  rowName,
  onRowClick,
  empty,
}: DataTableProps<T>) {
  const searchId = useId();
  const [search, setSearch] = useState(list.q);
  const trimmed = search.trim();
  const tooShort = trimmed.length === 1;

  // Debounced search; one-character terms are not sent (the API requires at least 2).
  useEffect(() => {
    if (trimmed === list.q || tooShort) {
      return;
    }
    const timer = window.setTimeout(() => list.setParams({ q: trimmed }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [trimmed, tooShort, list]);

  const data = list.query.data?.data ?? [];
  const meta = list.query.data?.meta;
  // TanStack Table is not compiler-safe; the React Compiler skips this component, which is intended.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const sortKey = list.sort.replace(/^-/, "");
  const descending = list.sort.startsWith("-");

  function toggleSort(key: string) {
    list.setParams({ sort: sortKey === key && !descending ? `-${key}` : key });
  }

  const showSkeleton = list.query.isPending;
  const showEmpty = !showSkeleton && !list.query.isError && data.length === 0;
  const from = meta && meta.total > 0 ? (meta.page - 1) * meta.per_page + 1 : 0;
  const to = meta ? Math.min(meta.page * meta.per_page, meta.total) : 0;
  const columnCount = columns.length + (rowActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor={searchId} className="text-body-sm text-text font-medium">
            {searchLabel}
          </label>
          <div className="md:max-w-confirm relative">
            <Search
              aria-hidden="true"
              strokeWidth={1.75}
              className="text-text-subtle pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
            />
            <Input
              id={searchId}
              size="sm"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-describedby={tooShort ? `${searchId}-hint` : undefined}
              className="pl-10"
            />
          </div>
          {tooShort ? (
            <p id={`${searchId}-hint`} className="text-caption text-text-subtle">
              Minimal 2 karakter
            </p>
          ) : null}
        </div>
        {filters ? <div className="flex flex-wrap items-end gap-3">{filters}</div> : null}
        {onCreate ? (
          <Button size="sm" onClick={onCreate} className="md:ml-auto">
            <Plus aria-hidden="true" strokeWidth={1.75} />
            {createLabel}
          </Button>
        ) : null}
      </div>

      {list.query.isError ? (
        <div className="flex flex-col gap-3">
          <FormAlert alert={{ tone: "danger", message: "Data gagal dimuat." }} />
          <div>
            <Button size="sm" variant="secondary" onClick={() => list.query.refetch()}>
              Coba lagi
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className="border-border bg-surface relative overflow-x-auto rounded-lg border"
        aria-busy={list.query.isFetching || undefined}
      >
        <table className="w-full border-collapse">
          <thead className="bg-surface-muted">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const sortable = meta?.sortKey;
                  const active = sortable && sortKey === sortable;
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        active
                          ? descending
                            ? "descending"
                            : "ascending"
                          : sortable
                            ? "none"
                            : undefined
                      }
                      className={cn(
                        "text-caption text-text-subtle h-11 px-4 text-left font-semibold whitespace-nowrap uppercase",
                        meta?.align === "right" ? "text-right" : null,
                        meta?.sticky ? "bg-surface-muted sticky left-0" : null,
                      )}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(sortable)}
                          className="hover:text-text focus-visible:focus-ring inline-flex items-center gap-1 rounded-sm uppercase"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {active ? (
                            descending ? (
                              <ArrowDown aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            ) : (
                              <ArrowUp aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            )
                          ) : (
                            <ArrowUpDown aria-hidden="true" strokeWidth={1.75} className="size-4" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
                {rowActions ? (
                  <th scope="col" className="w-14 px-4">
                    <span className="sr-only">Aksi</span>
                  </th>
                ) : null}
              </tr>
            ))}
          </thead>
          <tbody>
            {showSkeleton
              ? Array.from({ length: 5 }, (_, index) => (
                  <tr key={index} className="border-border border-t">
                    {Array.from({ length: columnCount }, (_, cell) => (
                      <td key={cell} className="h-13 px-4">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={cn(
                      "border-border hover:bg-accent-wash h-13 border-t",
                      onRowClick ? "cursor-pointer" : null,
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta;
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "text-body-sm text-text px-4",
                            meta?.align === "right" ? "tabular text-right" : null,
                            meta?.sticky ? "bg-surface sticky left-0" : null,
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                    {rowActions ? (
                      <td className="px-4 text-right" onClick={(event) => event.stopPropagation()}>
                        <RowActionsMenu
                          row={row.original}
                          name={rowName(row.original)}
                          actions={rowActions(row.original)}
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
          </tbody>
        </table>
        {showEmpty ? (
          <EmptyState
            icon={Inbox}
            title={empty.title}
            description={empty.description}
            action={
              onCreate ? (
                <Button size="sm" onClick={onCreate}>
                  {createLabel}
                </Button>
              ) : undefined
            }
          />
        ) : null}
      </div>

      {meta && meta.total > 0 ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-body-sm text-text-muted tabular">
            Menampilkan {from}–{to} dari {meta.total}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-40">
              <Select
                size="sm"
                aria-label="Data per halaman"
                options={PER_PAGE_OPTIONS}
                value={String(list.perPage)}
                onValueChange={(value) => list.setParams({ per_page: value })}
              />
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.total_pages}
              onPageChange={(page) => list.setParams({ page })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RowActionsMenu<T>({
  row,
  name,
  actions,
}: {
  row: T;
  name: string;
  actions: RowAction<T>[];
}) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Aksi untuk ${name}`}
        className="text-text-muted hover:bg-surface-muted focus-visible:focus-ring inline-flex size-9 items-center justify-center rounded-full"
      >
        <Ellipsis aria-hidden="true" strokeWidth={1.75} className="size-5" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="border-border bg-surface z-(--z-dropdown) min-w-40 rounded-md border p-1 shadow-md"
        >
          {actions.map((action) => (
            <DropdownMenu.Item
              key={action.label}
              onSelect={() => action.onSelect(row)}
              className={cn(
                "text-body-sm data-highlighted:bg-accent-wash flex h-10 cursor-pointer items-center rounded-sm px-3 outline-none",
                action.danger ? "text-danger" : "text-text",
              )}
            >
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
