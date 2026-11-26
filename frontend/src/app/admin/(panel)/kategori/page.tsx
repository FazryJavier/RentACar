import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { CategoriesPage } from "@/components/admin/master-data/categories-page";

export const metadata: Metadata = { title: "Kategori — Admin RentACar" };

export default function AdminCategoriesPage() {
  return (
    <RequireAdmin>
      <Suspense>
        <CategoriesPage />
      </Suspense>
    </RequireAdmin>
  );
}
