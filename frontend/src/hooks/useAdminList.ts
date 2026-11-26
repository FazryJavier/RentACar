"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Page } from "@/lib/api";
import type { ListParams } from "@/lib/admin-api";

/** Keys kept in the URL for admin lists; anything else in the query string is left alone. */
const LIST_KEYS = ["page", "per_page", "sort", "q"];

function isListKey(key: string): boolean {
  return LIST_KEYS.includes(key) || key.startsWith("filter[");
}

export type AdminListState = {
  params: ListParams;
  page: number;
  perPage: number;
  sort: string;
  q: string;
  filters: Record<string, string>;
};

/** Parameters that reset the page to 1 when they change. */
const RESETS_PAGE = (key: string) => key === "q" || key === "per_page" || key.startsWith("filter[");

/**
 * Server-side list state kept in the URL (page, per_page, sort, q, filter[...]) and the
 * TanStack Query that loads it. Updating search, filters or page size resets the page to 1.
 */
export function useAdminList<T>(
  key: string,
  fetcher: (params: ListParams, signal: AbortSignal) => Promise<Page<T>>,
  defaults: { sort?: string; perPage?: number } = {},
) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const searchText = search.toString();

  const state = useMemo<AdminListState>(() => {
    const current = new URLSearchParams(searchText);
    const params: ListParams = {};
    const filters: Record<string, string> = {};
    current.forEach((value, name) => {
      if (isListKey(name) && value !== "") {
        params[name] = value;
        const match = /^filter\[(.+)\]$/.exec(name);
        if (match?.[1]) {
          filters[match[1]] = value;
        }
      }
    });

    return {
      params,
      page: Number(params.page ?? 1) || 1,
      perPage: Number(params.per_page ?? defaults.perPage ?? 25) || 25,
      sort: params.sort ?? defaults.sort ?? "",
      q: params.q ?? "",
      filters,
    };
  }, [searchText, defaults.perPage, defaults.sort]);

  const query = useQuery({
    queryKey: [key, state.params],
    queryFn: ({ signal }) => fetcher(state.params, signal),
    placeholderData: keepPreviousData,
  });

  const setParams = useCallback(
    (changes: Record<string, string | number | null>) => {
      const next = new URLSearchParams(searchText);
      let resetPage = false;
      for (const [name, value] of Object.entries(changes)) {
        if (value === null || value === "") {
          next.delete(name);
        } else {
          next.set(name, String(value));
        }
        resetPage ||= RESETS_PAGE(name);
      }
      if (resetPage) {
        next.delete("page");
      }
      const text = next.toString();
      router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
    },
    [pathname, router, searchText],
  );

  return { ...state, query, setParams };
}
