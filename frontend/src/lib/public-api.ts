import { ApiError, type ApiFieldError, type PageMeta } from "@/lib/api";

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

export const publicKeys = {
  cars: (apiQuery: string) => ["public-cars", apiQuery] as const,
  references: ["public-references"] as const,
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
