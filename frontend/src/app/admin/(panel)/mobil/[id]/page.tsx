import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { CarEditorRoute } from "@/components/admin/fleet/car-editor-route";

export const metadata: Metadata = { title: "Ubah mobil — Admin RentACar" };

export default function AdminCarPage() {
  return (
    <RequireAdmin>
      <Suspense>
        <CarEditorRoute />
      </Suspense>
    </RequireAdmin>
  );
}
