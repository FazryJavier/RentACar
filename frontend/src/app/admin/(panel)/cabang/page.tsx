import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { BranchesPage } from "@/components/admin/master-data/branches-page";

export const metadata: Metadata = { title: "Cabang — Admin RentACar" };

export default function AdminBranchesPage() {
  return (
    <RequireAdmin>
      <Suspense>
        <BranchesPage />
      </Suspense>
    </RequireAdmin>
  );
}
