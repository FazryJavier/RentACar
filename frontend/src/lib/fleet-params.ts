/**
 * State of the fleet page as readable URL parameters (`/armada?branch=…&category=suv,mpv`),
 * and its mapping to the public API query (`filter[category]=suv,mpv`). Unknown or malformed
 * values are dropped.
 */

export const SORTS = ["popular", "price", "-price", "-newest"] as const;
export type FleetSort = (typeof SORTS)[number];
export const TRANSMISSIONS = ["automatic", "manual"] as const;
export const FUEL_TYPES = ["gasoline", "diesel", "hybrid", "electric"] as const;
export const SEAT_OPTIONS = [2, 4, 5, 7] as const;
export const PAGE_SIZES = [12, 24, 48] as const;
export const PRICE_MIN = 100_000;
export const PRICE_MAX = 3_000_000;
export const PRICE_STEP = 50_000;

export type FleetParams = {
  branch: string | null;
  pickupAt: string | null;
  returnAt: string | null;
  category: string[];
  brand: string[];
  fuelType: string[];
  transmission: (typeof TRANSMISSIONS)[number] | null;
  seatsMin: number | null;
  priceMin: number | null;
  priceMax: number | null;
  sort: FleetSort;
  page: number;
  perPage: (typeof PAGE_SIZES)[number];
  view: "grid" | "list";
};

export const DEFAULT_PARAMS: FleetParams = {
  branch: null,
  pickupAt: null,
  returnAt: null,
  category: [],
  brand: [],
  fuelType: [],
  transmission: null,
  seatsMin: null,
  priceMin: null,
  priceMax: null,
  sort: "popular",
  page: 1,
  perPage: 12,
  view: "grid",
};

const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?$/;

type ParamsSource = { get(name: string): string | null };

function slugList(value: string | null): string[] {
  if (!value) {
    return [];
  }
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => SLUG.test(item));
  return [...new Set(items)].slice(0, 20);
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function integer(value: string | null, min: number, max: number): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }
  const number = Number(value);
  return number >= min && number <= max ? number : null;
}

function dateTime(value: string | null): string | null {
  return value !== null && DATE_TIME.test(value) ? value : null;
}

export function parseFleetParams(source: ParamsSource): FleetParams {
  const priceMin = integer(source.get("price_min"), 0, 100_000_000);
  const priceMax = integer(source.get("price_max"), 0, 100_000_000);
  const perPage = integer(source.get("per_page"), 1, 48);
  const branch = source.get("branch");

  return {
    branch: branch !== null && SLUG.test(branch) ? branch : null,
    pickupAt: dateTime(source.get("pickup_at")),
    returnAt: dateTime(source.get("return_at")),
    category: slugList(source.get("category")),
    brand: slugList(source.get("brand")),
    fuelType: slugList(source.get("fuel_type")).filter((item) =>
      (FUEL_TYPES as readonly string[]).includes(item),
    ),
    transmission: oneOf(source.get("transmission"), TRANSMISSIONS),
    seatsMin: integer(source.get("seats_min"), 2, 16),
    priceMin,
    priceMax: priceMax !== null && priceMin !== null && priceMax < priceMin ? null : priceMax,
    sort: oneOf(source.get("sort"), SORTS) ?? "popular",
    page: integer(source.get("page"), 1, 10_000) ?? 1,
    perPage:
      perPage !== null && (PAGE_SIZES as readonly number[]).includes(perPage)
        ? (perPage as FleetParams["perPage"])
        : 12,
    view: source.get("view") === "list" ? "list" : "grid",
  };
}

/** Dates are only used together with a branch (the API requires all three). */
export function hasSearch(params: FleetParams): boolean {
  return params.branch !== null && params.pickupAt !== null && params.returnAt !== null;
}

/** URL query for the page: stable key order, defaults omitted. */
export function toPageQuery(params: FleetParams): string {
  const query = new URLSearchParams();
  const set = (key: string, value: string | number | null) => {
    if (value !== null && value !== "") {
      query.set(key, String(value));
    }
  };
  set("branch", params.branch);
  set("pickup_at", params.pickupAt);
  set("return_at", params.returnAt);
  set("category", params.category.join(","));
  set("brand", params.brand.join(","));
  set("fuel_type", params.fuelType.join(","));
  set("transmission", params.transmission);
  set("seats_min", params.seatsMin);
  set("price_min", params.priceMin);
  set("price_max", params.priceMax);
  set("sort", params.sort === "popular" ? null : params.sort);
  set("page", params.page === 1 ? null : params.page);
  set("per_page", params.perPage === 12 ? null : params.perPage);
  set("view", params.view === "grid" ? null : params.view);
  return query.toString();
}

/** Query for `GET /api/v1/public/cars`. The view is a UI choice and is not sent. */
export function toApiQuery(params: FleetParams): string {
  const query = new URLSearchParams();
  if (params.branch) {
    query.set("branch", params.branch);
  }
  if (hasSearch(params)) {
    query.set("pickup_at", params.pickupAt!);
    query.set("return_at", params.returnAt!);
  }
  const filters: [string, string | number | null][] = [
    ["category", params.category.join(",") || null],
    ["brand", params.brand.join(",") || null],
    ["fuel_type", params.fuelType.join(",") || null],
    ["transmission", params.transmission],
    ["seats_min", params.seatsMin],
    ["price_min", params.priceMin],
    ["price_max", params.priceMax],
  ];
  for (const [key, value] of filters) {
    if (value !== null) {
      query.set(`filter[${key}]`, String(value));
    }
  }
  query.set("sort", params.sort);
  query.set("page", String(params.page));
  query.set("per_page", String(params.perPage));
  return query.toString();
}

export type FilterKey = "category" | "brand" | "fuelType" | "transmission" | "seatsMin" | "price";

/** Number of active filters (the price range counts once). */
export function activeFilterCount(params: FleetParams): number {
  return (
    params.category.length +
    params.brand.length +
    params.fuelType.length +
    (params.transmission ? 1 : 0) +
    (params.seatsMin !== null ? 1 : 0) +
    (params.priceMin !== null || params.priceMax !== null ? 1 : 0)
  );
}

export function clearFilters(params: FleetParams): FleetParams {
  return {
    ...params,
    category: [],
    brand: [],
    fuelType: [],
    transmission: null,
    seatsMin: null,
    priceMin: null,
    priceMax: null,
    page: 1,
  };
}

/** Applies changes; any change other than the page itself returns to page 1. */
export function withChanges(params: FleetParams, changes: Partial<FleetParams>): FleetParams {
  const next = { ...params, ...changes };
  return "page" in changes ? next : { ...next, page: 1 };
}
