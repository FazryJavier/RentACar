import { ApiError, type ApiFieldError, type PageMeta } from "@/lib/api";
import type { ConditionAreaValue, ConditionSeverityValue } from "@/lib/condition-labels";

/** Public data shapes from `/api/v1/public/*` (see the backend README). */
export type PublicImage = { url: string; srcset: string; alt: string };
export type PublicEstimate = {
  rental_days: number;
  rental_subtotal: number;
  deposit: number;
  total_amount: number;
};

export type PublicCarCard = {
  slug: string;
  name: string;
  brand: { slug: string; name: string };
  category: { slug: string; name: string };
  branch: { slug: string; name: string; city: string };
  transmission: "automatic" | "manual";
  fuel_type: "gasoline" | "diesel" | "hybrid" | "electric";
  seats: number;
  daily_price: number;
  thumbnail: PublicImage | null;
  has_3d: boolean;
  estimate: PublicEstimate | null;
};

export type PublicBranch = {
  slug: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  opening_time: string;
  closing_time: string;
  latitude: string;
  longitude: string;
};
export type PublicCategory = { slug: string; name: string; description: string | null };
export type PublicBrand = { slug: string; name: string; logo_url: string | null };

export type PublicPage<T> = { data: T[]; meta: PageMeta };

export type PublicFetchOptions = {
  signal?: AbortSignal;
  /**
   * Server rendering only: the Laravel origin (BACKEND_URL) and the visitor's IP, forwarded so
   * the public rate limit applies per visitor instead of to the Next.js server.
   */
  server?: { baseUrl: string; clientIp: string | null };
};

type Envelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: ApiFieldError[] | null;
  meta: unknown;
};

async function request<T>(
  path: string,
  options: PublicFetchOptions = {},
): Promise<{ data: T; meta: unknown }> {
  const base = options.server ? `${options.server.baseUrl.replace(/\/+$/, "")}/api/v1` : "/api/v1";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.server?.clientIp) {
    headers["X-Forwarded-For"] = options.server.clientIp;
  }

  const response = await fetch(`${base}${path}`, {
    headers,
    signal: options.signal,
    cache: options.server ? "no-store" : undefined,
  });

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    body = null;
  }
  if (!response.ok || !body?.success) {
    throw new ApiError(
      response.status,
      body?.message ?? "Terjadi kesalahan pada server.",
      body?.errors ?? [],
    );
  }

  return { data: body.data, meta: body.meta };
}

export async function fetchPublicCars(
  apiQuery: string,
  options?: PublicFetchOptions,
): Promise<PublicPage<PublicCarCard>> {
  const { data, meta } = await request<PublicCarCard[]>(`/public/cars?${apiQuery}`, options);
  return { data, meta: meta as PageMeta };
}

export async function fetchBranches(options?: PublicFetchOptions): Promise<PublicBranch[]> {
  return (await request<PublicBranch[]>("/public/branches", options)).data;
}

export async function fetchCategories(options?: PublicFetchOptions): Promise<PublicCategory[]> {
  return (await request<PublicCategory[]>("/public/categories", options)).data;
}

export async function fetchBrands(options?: PublicFetchOptions): Promise<PublicBrand[]> {
  return (await request<PublicBrand[]>("/public/brands", options)).data;
}

export type PublicCondition = {
  number: number;
  area: ConditionAreaValue;
  severity: ConditionSeverityValue;
  description: string;
  /** Model-space point; null for area-only markers or markers waiting for repositioning. */
  position: [number, number, number] | null;
  normal: [number, number, number] | null;
  needs_reposition: boolean;
  photos: { url: string }[];
  /** Date only (`YYYY-MM-DD`). */
  inspected_on: string;
};

export type PublicModel3d = {
  url: string;
  poster_url: string | null;
  camera: { position: [number, number, number]; target: [number, number, number] } | null;
  is_illustrative: boolean;
  credit: { source_name: string; source_url: string | null; license: string };
};

export type PublicCarDetail = PublicCarCard & {
  year: number;
  color: string;
  luggage_capacity: number | null;
  description: string | null;
  features: string[];
  deposit: number;
  photos: PublicImage[];
  model_3d: PublicModel3d | null;
  conditions: PublicCondition[];
  inspection_summary: {
    last_inspected_at: string | null;
    active_conditions: { minor: number; moderate: number; major: number };
    odometer_km: number | null;
  };
};

export type PublicAvailability = {
  available: boolean;
  price: {
    daily_price: number;
    rental_days: number;
    rental_subtotal: number;
    deposit: number;
    total_amount: number;
  };
  price_token: string;
  reason: "booked" | "other_branch" | "unavailable" | null;
};

export type RentalQuery = { branch: string; pickupAt: string; returnAt: string };

function rentalQuery(rental: RentalQuery): string {
  return new URLSearchParams({
    branch: rental.branch,
    pickup_at: rental.pickupAt,
    return_at: rental.returnAt,
  }).toString();
}

export async function fetchPublicCar(
  slug: string,
  options?: PublicFetchOptions,
): Promise<PublicCarDetail> {
  return (await request<PublicCarDetail>(`/public/cars/${encodeURIComponent(slug)}`, options)).data;
}

export async function fetchAvailability(
  slug: string,
  rental: RentalQuery,
  options?: PublicFetchOptions,
): Promise<PublicAvailability> {
  const path = `/public/cars/${encodeURIComponent(slug)}/availability?${rentalQuery(rental)}`;
  return (await request<PublicAvailability>(path, options)).data;
}

export async function fetchSimilar(
  slug: string,
  rental: RentalQuery | null,
  options?: PublicFetchOptions,
): Promise<PublicCarCard[]> {
  const query = rental ? `?${rentalQuery(rental)}` : "";
  const path = `/public/cars/${encodeURIComponent(slug)}/similar${query}`;
  return (await request<PublicCarCard[]>(path, options)).data;
}

export const publicKeys = {
  cars: (apiQuery: string) => ["public-cars", apiQuery] as const,
  references: ["public-references"] as const,
  availability: (slug: string, rental: RentalQuery) =>
    ["public-availability", slug, rental.branch, rental.pickupAt, rental.returnAt] as const,
  similar: (slug: string, rental: RentalQuery | null) =>
    [
      "public-similar",
      slug,
      rental?.branch ?? null,
      rental?.pickupAt ?? null,
      rental?.returnAt ?? null,
    ] as const,
};

export type FleetReferences = {
  branches: PublicBranch[];
  categories: PublicCategory[];
  brands: PublicBrand[];
};

export async function fetchReferences(options?: PublicFetchOptions): Promise<FleetReferences> {
  const [branches, categories, brands] = await Promise.all([
    fetchBranches(options),
    fetchCategories(options),
    fetchBrands(options),
  ]);
  return { branches, categories, brands };
}

/** Published testimonial; `is_demo` items must carry a visible demo label. */
export type PublicTestimonial = {
  name: string;
  city: string | null;
  quote: string;
  rating: number;
  avatar_url: string | null;
  is_demo: boolean;
};

/** Counts computed by the backend from the current data. */
export type PublicStats = {
  cars: number;
  branches: number;
  categories: number;
  completed_bookings: number;
};

export async function fetchTestimonials(
  options?: PublicFetchOptions,
): Promise<PublicTestimonial[]> {
  return (await request<PublicTestimonial[]>("/public/testimonials", options)).data;
}

export async function fetchStats(options?: PublicFetchOptions): Promise<PublicStats> {
  return (await request<PublicStats>("/public/stats", options)).data;
}
