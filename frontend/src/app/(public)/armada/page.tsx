import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { FleetPage } from "@/components/fleet/fleet-page";
import { FleetSkeleton } from "@/components/fleet/fleet-skeleton";
import { parseFleetParams, toApiQuery } from "@/lib/fleet-params";
import { fetchPublicCars, fetchReferences, publicKeys } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Armada — RentACar",
  description:
    "Cari mobil yang tersedia per cabang dan tanggal, lengkap dengan estimasi total harga.",
};

const backendUrl = () => process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

/** Branches, categories and brands do not depend on the visitor, so one cached copy is shared. */
async function cachedReferences() {
  "use cache";
  cacheLife("minutes");
  return fetchReferences({ server: { baseUrl: backendUrl(), clientIp: null } });
}

type SearchParams = Record<string, string | string[] | undefined>;

async function FleetServer({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const params = parseFleetParams({
    get: (name) => {
      const value = raw[name];
      return typeof value === "string" ? value : null;
    },
  });
  const apiQuery = toApiQuery(params);
  const requestHeaders = await headers();
  const clientIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");

  // Search results are per request (and TanStack Query stamps them with the current time).
  await connection();
  const queryClient = new QueryClient();
  // Failures are not dehydrated: the client refetches and shows the error or field messages.
  await Promise.all([
    cachedReferences()
      .then((references) => queryClient.setQueryData(publicKeys.references, references))
      .catch(() => undefined),
    queryClient.prefetchQuery({
      queryKey: publicKeys.cars(apiQuery),
      queryFn: () => fetchPublicCars(apiQuery, { server: { baseUrl: backendUrl(), clientIp } }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FleetPage />
    </HydrationBoundary>
  );
}

export default function ArmadaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<FleetSkeleton />}>
      <FleetServer searchParams={searchParams} />
    </Suspense>
  );
}
