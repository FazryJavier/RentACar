"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { loginUrl } from "@/lib/auth";
import { takeLogoutDestination } from "@/lib/logout-intent";

/** Renders customer pages only for a verified session; otherwise goes to the login page. */
export function RequireCustomer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const { status } = useCurrentCustomer();

  useEffect(() => {
    if (status === "guest") {
      router.replace(
        takeLogoutDestination() ?? loginUrl(search ? `${pathname}?${search}` : pathname),
      );
    }
  }, [status, pathname, search, router]);

  if (status !== "signed-in") {
    return (
      <div
        aria-busy="true"
        aria-label="Memuat akun"
        className="max-w-page mx-auto flex flex-col gap-4 px-4 py-12 md:px-6 xl:px-8"
      >
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return <>{children}</>;
}
