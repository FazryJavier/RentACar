"use client";

import { useQuery } from "@tanstack/react-query";
import { branchesApi, brandsApi, categoriesApi } from "@/lib/admin-api";

const ALL = { per_page: "100", sort: "name" };

/** Brand, category and (optionally) branch options for car filters and forms. */
export function useReferenceOptions({ branches }: { branches: boolean }) {
  const brandQuery = useQuery({
    queryKey: ["admin-brands", "options"],
    queryFn: ({ signal }) => brandsApi.list(ALL, signal),
    staleTime: 60_000,
  });
  const categoryQuery = useQuery({
    queryKey: ["admin-categories", "options"],
    queryFn: ({ signal }) => categoriesApi.list({ ...ALL, sort: "sort_order" }, signal),
    staleTime: 60_000,
  });
  const branchQuery = useQuery({
    queryKey: ["admin-branches", "options"],
    queryFn: ({ signal }) => branchesApi.list(ALL, signal),
    staleTime: 60_000,
    enabled: branches,
  });

  const toOptions = (items: { id: number; name: string }[] | undefined) =>
    (items ?? []).map((item) => ({ value: String(item.id), label: item.name }));

  return {
    brands: toOptions(brandQuery.data?.data),
    categories: toOptions(categoryQuery.data?.data),
    branches: toOptions(branchQuery.data?.data),
  };
}
