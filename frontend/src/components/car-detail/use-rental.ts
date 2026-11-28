"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ApiError, fieldErrors } from "@/lib/api";
import { parseFleetParams } from "@/lib/fleet-params";
import {
  fetchAvailability,
  fetchReferences,
  publicKeys,
  type PublicBranch,
  type PublicCarDetail,
  type RentalQuery,
} from "@/lib/public-api";

/**
 * Rental dates of the detail page, kept in the URL (`pickup_at`, `return_at`, `branch` = the car's
 * branch) with `replace`, plus the live availability and price for them.
 */
export function useRental(car: PublicCarDetail) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = useMemo(() => parseFleetParams(searchParams), [searchParams]);
  const pickupAt = parsed.pickupAt;
  const returnAt = parsed.returnAt;
  const rental: RentalQuery | null =
    pickupAt && returnAt ? { branch: car.branch.slug, pickupAt, returnAt } : null;

  const references = useQuery({
    queryKey: publicKeys.references,
    queryFn: ({ signal }) => fetchReferences({ signal }),
    staleTime: 60_000,
  });
  const branch: PublicBranch | null =
    references.data?.branches.find((item) => item.slug === car.branch.slug) ?? null;

  const availability = useQuery({
    queryKey: rental ? publicKeys.availability(car.slug, rental) : ["public-availability", "none"],
    queryFn: ({ signal }) => fetchAvailability(car.slug, rental!, { signal }),
    enabled: rental !== null,
    staleTime: 30_000,
  });

  const invalid = availability.error instanceof ApiError && availability.error.status === 422;
  const errors = invalid ? fieldErrors(availability.error) : {};

  function setDates(next: { pickupAt: string | null; returnAt: string | null }) {
    const both = next.pickupAt !== null && next.returnAt !== null;
    const none = next.pickupAt === null && next.returnAt === null;
    if (!both && !none) {
      return;
    }
    const query = new URLSearchParams();
    if (both) {
      query.set("branch", car.branch.slug);
      query.set("pickup_at", next.pickupAt!);
      query.set("return_at", next.returnAt!);
    }
    const value = query.toString();
    router.replace(value ? `${pathname}?${value}` : pathname, { scroll: false });
  }

  const checkoutHref = rental
    ? `/checkout?${new URLSearchParams({
        car: car.slug,
        pickup_at: rental.pickupAt,
        return_at: rental.returnAt,
      }).toString()}`
    : null;

  return {
    rental,
    branch,
    availability,
    dateError: errors.pickup_at ?? errors.return_at ?? errors.branch,
    failed: availability.isError && !invalid,
    setDates,
    checkoutHref,
  };
}

export type Rental = ReturnType<typeof useRental>;
