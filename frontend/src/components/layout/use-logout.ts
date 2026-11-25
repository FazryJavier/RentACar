"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useToast } from "@/components/ui";
import { useSetCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { apiPost } from "@/lib/api";

/** Ends the session on the server, clears the cached customer and returns home. */
export function useLogout(): () => Promise<void> {
  const router = useRouter();
  const toast = useToast();
  const setCustomer = useSetCurrentCustomer();

  return useCallback(async () => {
    try {
      await apiPost<null>("/auth/logout");
    } catch {
      // Already signed out on the server (401/419): the local state is cleared either way.
    }
    setCustomer(null);
    toast.show({ tone: "info", title: "Anda sudah keluar" });
    router.push("/");
  }, [router, setCustomer, toast]);
}
