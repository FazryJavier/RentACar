import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { CarsPage } from "@/components/admin/fleet/cars-page";

export const metadata: Metadata = { title: "Mobil — Admin RentACar" };

export default function AdminCarsPage() {
  return (
    <RequireAdmin>
      <Suspense>
        <CarsPage />
      </Suspense>
    </RequireAdmin>
  );
}
