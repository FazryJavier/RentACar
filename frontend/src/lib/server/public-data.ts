import { cacheLife } from "next/cache";
import { ApiError } from "@/lib/api";
import {
  fetchBranches,
  fetchCategories,
  fetchPublicCar,
  fetchPublicCars,
  fetchStats,
  fetchTestimonials,
  type PublicBranch,
  type PublicCarCard,
  type PublicCarDetail,
  type PublicCategory,
  type PublicStats,
  type PublicTestimonial,
} from "@/lib/public-api";

/*
 * Cached server loaders for public data that is the same for every visitor. Each copy is kept
 * for a few minutes and shared, so no visitor IP is forwarded. Loaders used by the home page
 * return null on failure so a single failing source only hides its own section.
 */

const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;
const server = () => ({
  server: { baseUrl: process.env.BACKEND_URL ?? "http://127.0.0.1:8000", clientIp: null },
});

async function orNull<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

/** Car detail by slug; null when it does not exist (other errors are thrown). */
export async function getPublicCar(slug: string): Promise<PublicCarDetail | null> {
  "use cache";
  cacheLife("minutes");
  if (!SLUG.test(slug)) {
    return null;
  }
  try {
    return await fetchPublicCar(slug, server());
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** Car detail for the home hero; null on any failure. */
export async function getHeroCarDetail(slug: string): Promise<PublicCarDetail | null> {
  return orNull(() => getPublicCar(slug));
}

export async function getPopularCars(): Promise<PublicCarCard[] | null> {
  "use cache";
  cacheLife("minutes");
  return orNull(async () => (await fetchPublicCars("sort=popular&per_page=12", server())).data);
}

export async function getBranches(): Promise<PublicBranch[] | null> {
  "use cache";
  cacheLife("minutes");
  return orNull(() => fetchBranches(server()));
}

export async function getCategories(): Promise<PublicCategory[] | null> {
  "use cache";
  cacheLife("minutes");
  return orNull(() => fetchCategories(server()));
}

export async function getTestimonials(): Promise<PublicTestimonial[] | null> {
  "use cache";
  cacheLife("minutes");
  return orNull(() => fetchTestimonials(server()));
}

export async function getStats(): Promise<PublicStats | null> {
  "use cache";
  cacheLife("minutes");
  return orNull(() => fetchStats(server()));
}
