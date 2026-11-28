import type { PublicCarCard, PublicCarDetail } from "@/lib/public-api";

export type HeroCar =
  | { kind: "model"; car: PublicCarDetail; posterUrl: string | null }
  | { kind: "photo"; car: PublicCarCard; posterUrl: string }
  | { kind: "none" };

/**
 * Car for the home hero: the featured car if it has a 3D model, else the first popular car with
 * one, else the first popular car's photo, else nothing (decoration only).
 */
export async function pickHeroCar(
  featuredSlug: string,
  popular: PublicCarCard[] | null,
  loadDetail: (slug: string) => Promise<PublicCarDetail | null>,
): Promise<HeroCar> {
  const withModel = (car: PublicCarDetail | null): HeroCar | null =>
    car?.model_3d
      ? {
          kind: "model",
          car,
          posterUrl: car.model_3d.poster_url ?? car.photos[0]?.url ?? car.thumbnail?.url ?? null,
        }
      : null;

  const featured = withModel(await loadDetail(featuredSlug));
  if (featured) {
    return featured;
  }
  const candidate = popular?.find((car) => car.has_3d && car.slug !== featuredSlug);
  if (candidate) {
    const fallback = withModel(await loadDetail(candidate.slug));
    if (fallback) {
      return fallback;
    }
  }
  const photo = popular?.find((car) => car.thumbnail !== null);
  if (photo?.thumbnail) {
    return { kind: "photo", car: photo, posterUrl: photo.thumbnail.url };
  }
  return { kind: "none" };
}
