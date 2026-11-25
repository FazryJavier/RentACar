"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, apiGet } from "@/lib/api";

export type CurrentCustomer = { id: number; name: string; email: string };

export type CurrentCustomerState =
  | { status: "loading"; customer: null }
  | { status: "guest"; customer: null }
  | { status: "signed-in"; customer: CurrentCustomer };

export const CURRENT_CUSTOMER_KEY = ["me"] as const;

async function fetchCurrentCustomer({
  signal,
}: {
  signal: AbortSignal;
}): Promise<CurrentCustomer | null> {
  try {
    return await apiGet<CurrentCustomer>("/me", { signal });
  } catch (error) {
    // 401: not signed in. 404: the endpoint is not available yet. Anything else is treated as a
    // guest too: the header must never break because the session check failed.
    if (
      process.env.NODE_ENV === "development" &&
      !(error instanceof ApiError && [401, 404].includes(error.status))
    ) {
      console.warn("Session check failed; showing guest state.", error);
    }
    return null;
  }
}

/** The signed-in customer (from `GET /api/v1/me`), or guest. */
export function useCurrentCustomer(): CurrentCustomerState {
  const query = useQuery({
    queryKey: CURRENT_CUSTOMER_KEY,
    queryFn: fetchCurrentCustomer,
    retry: false,
    staleTime: 5 * 60_000,
  });

  if (query.isPending) {
    return { status: "loading", customer: null };
  }

  return query.data
    ? { status: "signed-in", customer: query.data }
    : { status: "guest", customer: null };
}
