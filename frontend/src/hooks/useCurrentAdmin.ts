"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { ApiError, apiGet } from "@/lib/api";

/** Shape of `AdminResource` from the API. */
export type CurrentAdmin = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "staff";
  branch: { id: number; name: string } | null;
  menu: string[];
  created_at: string;
};

export type CurrentAdminState =
  | { status: "loading"; admin: null }
  | { status: "guest"; admin: null }
  | { status: "signed-in"; admin: CurrentAdmin };

export const CURRENT_ADMIN_KEY = ["admin-me"] as const;

export const ROLE_LABEL: Record<CurrentAdmin["role"], string> = {
  super_admin: "Super Admin",
  staff: "Staf",
};

async function fetchCurrentAdmin({
  signal,
}: {
  signal: AbortSignal;
}): Promise<CurrentAdmin | null> {
  try {
    return await apiGet<CurrentAdmin>("/admin/me", { signal });
  } catch (error) {
    if (
      process.env.NODE_ENV === "development" &&
      !(error instanceof ApiError && error.status === 401)
    ) {
      console.warn("Admin session check failed; showing the login page.", error);
    }
    return null;
  }
}

/** The signed-in admin (from `GET /api/v1/admin/me`), or guest. */
export function useCurrentAdmin({ enabled = true }: { enabled?: boolean } = {}): CurrentAdminState {
  const query = useQuery({
    queryKey: CURRENT_ADMIN_KEY,
    queryFn: fetchCurrentAdmin,
    retry: false,
    staleTime: 5 * 60_000,
    enabled,
  });

  if (query.isPending) {
    return { status: "loading", admin: null };
  }

  return query.data ? { status: "signed-in", admin: query.data } : { status: "guest", admin: null };
}

export function useSetCurrentAdmin(): (admin: CurrentAdmin | null) => void {
  const queryClient = useQueryClient();
  return useCallback((admin) => queryClient.setQueryData(CURRENT_ADMIN_KEY, admin), [queryClient]);
}
