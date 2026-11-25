"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { safeNextPath } from "@/lib/auth";

/** Auth pages are for guests: a signed-in customer is sent on to `next` (or home). */
export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const { status } = useCurrentCustomer();

  useEffect(() => {
    if (status === "signed-in") {
      router.replace(next);
    }
  }, [status, next, router]);

  return <>{children}</>;
}
