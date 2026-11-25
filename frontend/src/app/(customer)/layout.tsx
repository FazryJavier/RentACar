import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { RequireCustomer } from "@/components/auth/require-customer";
import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell>
      <Suspense>
        <RequireCustomer>{children}</RequireCustomer>
      </Suspense>
    </SiteShell>
  );
}
