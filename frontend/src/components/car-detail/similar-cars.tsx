"use client";

import { useQuery } from "@tanstack/react-query";
import { CarCard } from "@/components/fleet/car-card";
import { fetchSimilar, publicKeys, type PublicCarCard, type RentalQuery } from "@/lib/public-api";

function hrefFor(car: PublicCarCard, rental: RentalQuery | null): string {
  if (!rental) {
    return `/armada/${car.slug}`;
  }
  const query = new URLSearchParams({
    branch: rental.branch,
    pickup_at: rental.pickupAt,
    return_at: rental.returnAt,
  });
  return `/armada/${car.slug}?${query.toString()}`;
}

/** Cars in the same category with a close price; only available ones when dates are chosen. */
export function SimilarCars({ slug, rental }: { slug: string; rental: RentalQuery | null }) {
  const similar = useQuery({
    queryKey: publicKeys.similar(slug, rental),
    queryFn: ({ signal }) => fetchSimilar(slug, rental, { signal }),
    staleTime: 60_000,
  });

  if (!similar.data || similar.data.length === 0) {
    return null;
  }

  return (
    <section
      id="mobil-serupa"
      aria-labelledby="mobil-serupa-judul"
      className="flex scroll-mt-24 flex-col gap-4"
    >
      <h2 id="mobil-serupa-judul" className="text-h3 text-text">
        Mobil serupa
      </h2>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {similar.data.map((car) => (
          <li key={car.slug}>
            <CarCard car={car} href={hrefFor(car, rental)} variant="compact" />
          </li>
        ))}
      </ul>
    </section>
  );
}
