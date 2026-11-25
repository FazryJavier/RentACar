import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAdmin } from "@/components/admin/require-admin";

export const metadata: Metadata = {
  title: "Admin panel — RentACar",
  robots: { index: false, follow: false },
};

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <RequireAdmin>
        <AdminShell>{children}</AdminShell>
      </RequireAdmin>
    </Suspense>
  );
}
