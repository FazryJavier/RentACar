"use client";

import { useCurrentAdmin, useSetCurrentAdmin, type CurrentAdmin } from "@/hooks/useCurrentAdmin";
import {
  useCurrentCustomer,
  useSetCurrentCustomer,
  type CurrentCustomer,
} from "@/hooks/useCurrentCustomer";

/** Who an auth form serves: website customers or admin panel accounts. */
export type Audience = "customer" | "admin";

export const AUDIENCES = {
  customer: {
    api: "/auth",
    home: "/",
    login: "/masuk",
    forgot: "/lupa-kata-sandi",
    within: undefined,
  },
  admin: {
    api: "/admin/auth",
    home: "/admin",
    login: "/admin/masuk",
    forgot: "/admin/lupa-kata-sandi",
    within: "/admin",
  },
} as const;

/** Session state + setter for the audience (customer `["me"]`, admin `["admin-me"]`). */
export function useAudienceSession(audience: Audience) {
  const customer = useCurrentCustomer({ enabled: audience === "customer" });
  const admin = useCurrentAdmin({ enabled: audience === "admin" });
  const setCustomer = useSetCurrentCustomer();
  const setAdmin = useSetCurrentAdmin();

  if (audience === "admin") {
    return {
      status: admin.status,
      set: (value: unknown) => setAdmin(value as CurrentAdmin | null),
    };
  }

  return {
    status: customer.status,
    set: (value: unknown) => setCustomer(value as CurrentCustomer | null),
  };
}

/** Only the session setter (no session query), for forms that store the signed-in account. */
export function useAudienceSetter(audience: Audience): (value: unknown) => void {
  const setCustomer = useSetCurrentCustomer();
  const setAdmin = useSetCurrentAdmin();

  return audience === "admin"
    ? (value) => setAdmin(value as CurrentAdmin | null)
    : (value) => setCustomer(value as CurrentCustomer | null);
}
