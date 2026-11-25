"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { adminLoginUrl } from "@/lib/auth";
import { takeLogoutDestination } from "@/lib/logout-intent";

/** Renders panel pages only for a verified admin session; otherwise goes to the admin login. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const { status } = useCurrentAdmin();

  useEffect(() => {
    if (status === "guest") {
      router.replace(
        takeLogoutDestination() ?? adminLoginUrl(search ? `${pathname}?${search}` : pathname),
      );
    }
  }, [status, pathname, search, router]);

  if (status !== "signed-in") {
    return (
      <div aria-busy="true" aria-label="Memuat admin panel" className="flex min-h-dvh">
        <div className="bg-navy-900 hidden w-66 lg:block" />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
