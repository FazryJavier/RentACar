import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/auth/reset-form";
import { AdminAuthCard } from "@/components/admin/admin-auth-card";

export const metadata: Metadata = { title: "Atur ulang kata sandi admin — RentACar" };

export default function AdminResetPasswordPage() {
  return (
    <AdminAuthCard
      title="Atur ulang kata sandi"
      description="Buat kata sandi baru untuk akun admin Anda."
    >
      <Suspense>
        <ResetForm audience="admin" />
      </Suspense>
    </AdminAuthCard>
  );
}
