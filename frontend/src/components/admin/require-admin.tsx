"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { adminLoginUrl } from "@/lib/auth";
import { takeLogoutDestination } from "@/lib/logout-intent";

function AdminContentSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat admin panel" className="flex flex-col gap-4">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

function AdminGuard({ children }: { children: ReactNode }) {
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
    return <AdminContentSkeleton />;
  }

  return <>{children}</>;
}

/**
 * Renders a panel page only for a verified admin session; otherwise goes to the admin login.
 * Wrap each page's content with it (not the layout) so the layout always renders `{children}`.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AdminContentSkeleton />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
