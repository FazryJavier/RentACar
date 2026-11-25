import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { RedirectIfSignedIn } from "@/components/auth/redirect-if-signed-in";
import { RegisterForm } from "@/components/auth/register-form";
import { TextLink } from "@/components/auth/text-link";

export const metadata: Metadata = { title: "Daftar — RentACar" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Daftar"
      description="Buat akun demo. Jangan memakai data pribadi sungguhan."
      footer={
        <p>
          Sudah punya akun? <TextLink href="/masuk">Masuk</TextLink>
        </p>
      }
    >
      <Suspense>
        <RedirectIfSignedIn>
          <RegisterForm />
        </RedirectIfSignedIn>
      </Suspense>
    </AuthCard>
  );
}
