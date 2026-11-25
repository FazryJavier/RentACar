"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { ApiError, apiGet } from "@/lib/api";

/** Shape of `CustomerResource` from the API. */
export type CurrentCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  license_number: string | null;
  created_at: string;
};

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
    // 401 means "not signed in". Any other failure is also shown as guest: the header must
    // never break because the session check failed.
    if (
      process.env.NODE_ENV === "development" &&
      !(error instanceof ApiError && error.status === 401)
    ) {
      console.warn("Session check failed; showing guest state.", error);
    }
    return null;
  }
}

/** The signed-in customer (from `GET /api/v1/me`), or guest. */
export function useCurrentCustomer({
  enabled = true,
}: { enabled?: boolean } = {}): CurrentCustomerState {
  const query = useQuery({
    queryKey: CURRENT_CUSTOMER_KEY,
    queryFn: fetchCurrentCustomer,
    retry: false,
    staleTime: 5 * 60_000,
    enabled,
  });

  if (query.isPending) {
    return { status: "loading", customer: null };
  }

  return query.data
    ? { status: "signed-in", customer: query.data }
    : { status: "guest", customer: null };
}

/** Writes the session state after login, registration, profile updates or logout. */
export function setCurrentCustomer(
  queryClient: QueryClient,
  customer: CurrentCustomer | null,
): void {
  queryClient.setQueryData(CURRENT_CUSTOMER_KEY, customer);
}

export function useSetCurrentCustomer(): (customer: CurrentCustomer | null) => void {
  const queryClient = useQueryClient();
  return useCallback((customer) => setCurrentCustomer(queryClient, customer), [queryClient]);
}
