"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { ApiError, fieldErrors } from "@/lib/api";
import {
  activeFilterCount,
  clearFilters,
  hasSearch,
  parseFleetParams,
  toApiQuery,
  toPageQuery,
  withChanges,
  type FleetParams,
} from "@/lib/fleet-params";
import {
  fetchPublicCars,
  fetchReferences,
  publicKeys,
  type FleetReferences,
  type PublicCarCard,
} from "@/lib/public-api";
import { ActiveFilterChips } from "./active-filter-chips";
import { EMPTY_FILTERS, FilterPanel, FilterResetButton, type FilterValue } from "./filter-panel";
import { FilterSheet } from "./filter-sheet";
import { FleetResults } from "./fleet-results";
import { SortSelect, ViewToggle } from "./results-controls";
import { SearchForm, type SearchErrors } from "./search-form";

const SEARCH_ID = "fleet-search";
const EMPTY_REFERENCES: FleetReferences = { branches: [], categories: [], brands: [] };

function filtersOf(params: FleetParams): FilterValue {
  const { category, brand, fuelType, transmission, seatsMin, priceMin, priceMax } = params;
  return { category, brand, fuelType, transmission, seatsMin, priceMin, priceMax };
}

/** Client part of /armada: the URL is the state; every change pushes a new history entry. */
export function FleetPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => parseFleetParams(searchParams), [searchParams]);
  const apiQuery = toApiQuery(params);
  const searching = hasSearch(params);

  const references = useQuery({
    queryKey: publicKeys.references,
    queryFn: ({ signal }) => fetchReferences({ signal }),
    staleTime: 60_000,
  });
  const cars = useQuery({
    queryKey: publicKeys.cars(apiQuery),
    queryFn: ({ signal }) => fetchPublicCars(apiQuery, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const refs = references.data ?? EMPTY_REFERENCES;
  const filters = filtersOf(params);
  const filterCount = activeFilterCount(params);
  const invalidSearch = cars.error instanceof ApiError && cars.error.status === 422;
  const searchErrors: SearchErrors = invalidSearch ? fieldErrors(cars.error) : {};

  function navigate(next: FleetParams) {
    const query = toPageQuery(next);
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }
  const change = (changes: Partial<FleetParams>) => navigate(withChanges(params, changes));

  function hrefFor(car: PublicCarCard) {
    if (!searching) {
      return `/armada/${car.slug}`;
    }
    const query = new URLSearchParams({
      branch: params.branch!,
      pickup_at: params.pickupAt!,
      return_at: params.returnAt!,
    });
    return `/armada/${car.slug}?${query.toString()}`;
  }

  function focusSearch() {
    const form = document.getElementById(SEARCH_ID);
    form?.scrollIntoView({ block: "center" });
    form?.querySelector<HTMLElement>("button")?.focus();
  }

  const total = cars.data?.meta.total ?? null;
  const countText = total === null ? "" : searching ? `${total} mobil tersedia` : `${total} mobil`;
  const status = cars.isError && !cars.data ? "error" : cars.isPending ? "loading" : "ready";

  return (
    <div className="max-w-page mx-auto flex flex-col gap-8 px-4 py-10 md:px-6 xl:px-8">
      <div className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb">
          <ol className="text-body-sm text-text-muted flex gap-2">
            <li>
              <Link
                href="/"
                className="hover:text-text focus-visible:focus-ring rounded-sm underline-offset-4 hover:underline"
              >
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text">
              Armada
            </li>
          </ol>
        </nav>
        <h1 className="text-h1 text-text">Armada Kami</h1>
      </div>

      <div id={SEARCH_ID}>
        <SearchForm
          key={`${params.branch}|${params.pickupAt}|${params.returnAt}|${refs.branches.length}`}
          branches={refs.branches}
          value={{ branch: params.branch, pickupAt: params.pickupAt, returnAt: params.returnAt }}
          errors={searchErrors}
          onSubmit={(value) =>
            change({ branch: value.branch, pickupAt: value.pickupAt, returnAt: value.returnAt })
          }
        />
      </div>

      <div className="flex gap-8">
        <aside aria-label="Filter" className="hidden w-72 shrink-0 flex-col gap-4 lg:flex">
          <div className="flex items-center justify-between">
            <h2 className="text-h4 text-text">Filter</h2>
            <FilterResetButton
              onReset={() => navigate(clearFilters(params))}
              disabled={filterCount === 0}
            />
          </div>
          <FilterPanel
            value={filters}
            categories={refs.categories}
            brands={refs.brands}
            onChange={change}
          />
        </aside>

        <section aria-label="Hasil pencarian" className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-body text-text tabular font-semibold" aria-hidden="true">
              {countText}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <FilterSheet
                value={filters}
                activeCount={filterCount}
                categories={refs.categories}
                brands={refs.brands}
                onApply={(value) => change(value)}
              />
              <SortSelect value={params.sort} onChange={(sort) => change({ sort })} />
              <ViewToggle value={params.view} onChange={(view) => change({ view })} />
            </div>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {cars.isFetching ? "" : countText}
          </p>

          <ActiveFilterChips
            value={filters}
            categories={refs.categories}
            brands={refs.brands}
            onChange={change}
            onClear={() => change(EMPTY_FILTERS)}
          />

          {!searching ? (
            <FormAlert
              alert={{
                tone: "info",
                message: "Pilih tanggal untuk cek ketersediaan dan total harga.",
              }}
            />
          ) : null}

          {invalidSearch ? (
            <FormAlert
              alert={{ tone: "warning", message: "Periksa cabang dan tanggal pencarian." }}
            />
          ) : (
            <FleetResults
              page={cars.data}
              view={params.view}
              perPage={params.perPage}
              status={status}
              hrefFor={hrefFor}
              onPageChange={(page) => {
                change({ page });
                window.scrollTo({ top: 0 });
              }}
              onRetry={() => cars.refetch()}
              onChangeDates={focusSearch}
              onClearFilters={() => change(EMPTY_FILTERS)}
              filtersActive={filterCount > 0}
            />
          )}
        </section>
      </div>
    </div>
  );
}
