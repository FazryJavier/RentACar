import type { Metadata } from "next";
import { Suspense } from "react";
import { BranchesPage } from "@/components/admin/master-data/branches-page";

export const metadata: Metadata = { title: "Cabang — Admin RentACar" };

export default function AdminBranchesPage() {
  return (
    <Suspense>
      <BranchesPage />
    </Suspense>
  );
}
