import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { BrandsPage } from "@/components/admin/master-data/brands-page";

export const metadata: Metadata = { title: "Merek — Admin RentACar" };

export default function AdminBrandsPage() {
  return (
    <RequireAdmin>
      <Suspense>
        <BrandsPage />
      </Suspense>
    </RequireAdmin>
  );
}
