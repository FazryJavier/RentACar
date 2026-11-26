import type { Metadata } from "next";
import { Suspense } from "react";
import { CarEditor } from "@/components/admin/fleet/car-editor";

export const metadata: Metadata = { title: "Tambah mobil — Admin RentACar" };

export default function AdminNewCarPage() {
  // The form reads the current WIB year, so it renders per request (inside Suspense).
  return (
    <Suspense>
      <CarEditor id={null} />
    </Suspense>
  );
}
