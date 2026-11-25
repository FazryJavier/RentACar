"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useToast } from "@/components/ui";
import { useSetCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { apiPost } from "@/lib/api";
import { markLogout } from "@/lib/logout-intent";

/** Ends the admin session on the server, clears the cached admin and opens the admin login. */
export function useAdminLogout(): () => Promise<void> {
  const router = useRouter();
  const toast = useToast();
  const setAdmin = useSetCurrentAdmin();

  return useCallback(async () => {
    try {
      await apiPost<null>("/admin/auth/logout");
    } catch {
      // Already signed out on the server: the local state is cleared either way.
    }
    markLogout("/admin/masuk");
    setAdmin(null);
    toast.show({ tone: "info", title: "Anda sudah keluar dari admin panel" });
    router.push("/admin/masuk");
  }, [router, setAdmin, toast]);
}
