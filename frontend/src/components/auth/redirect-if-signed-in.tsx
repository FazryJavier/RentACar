"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { safeNextPath } from "@/lib/auth";
import { AUDIENCES, useAudienceSession, type Audience } from "./audience";

/** Auth pages are for guests: a signed-in account is sent on to `next` (or its home). */
export function RedirectIfSignedIn({
  children,
  audience = "customer",
}: {
  children: ReactNode;
  audience?: Audience;
}) {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"), AUDIENCES[audience].within);
  const { status } = useAudienceSession(audience);

  useEffect(() => {
    if (status === "signed-in") {
      router.replace(next);
    }
  }, [status, next, router]);

  return <>{children}</>;
}
