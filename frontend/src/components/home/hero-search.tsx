"use client";

import { useRouter } from "next/navigation";
import { SearchForm, type SearchValue } from "@/components/fleet/search-form";
import { DEFAULT_PARAMS, toPageQuery } from "@/lib/fleet-params";
import type { PublicBranch } from "@/lib/public-api";

/** `/armada` link carrying the search (same URL keys as the fleet page). */
export function fleetSearchHref(value: SearchValue): string {
  const query = toPageQuery({
    ...DEFAULT_PARAMS,
    branch: value.branch,
    pickupAt: value.pickupAt,
    returnAt: value.returnAt,
  });
  return query ? `/armada?${query}` : "/armada";
}

/** Hero search: the fleet page's form; "Cari" opens `/armada` with the same parameters. */
export function HeroSearch({ branches }: { branches: PublicBranch[] }) {
  const router = useRouter();
  return (
    <SearchForm
      layout="hero"
      branches={branches}
      value={{ branch: null, pickupAt: null, returnAt: null }}
      onSubmit={(value) => router.push(fleetSearchHref(value))}
    />
  );
}
