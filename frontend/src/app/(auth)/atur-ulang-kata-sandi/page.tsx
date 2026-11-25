import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Atur ulang kata sandi — RentACar" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Atur ulang kata sandi" description="Buat kata sandi baru untuk akun Anda.">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthCard>
  );
}
