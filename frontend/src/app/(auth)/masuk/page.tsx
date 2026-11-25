import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { RedirectIfSignedIn } from "@/components/auth/redirect-if-signed-in";
import { TextLink } from "@/components/auth/text-link";

export const metadata: Metadata = { title: "Masuk — RentACar" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Masuk"
      description="Masuk untuk memesan mobil dan melihat pemesanan Anda."
      footer={
        <div className="flex flex-col gap-2">
          <TextLink href="/lupa-kata-sandi" className="self-start">
            Lupa kata sandi?
          </TextLink>
          <p>
            Belum punya akun? <TextLink href="/daftar">Daftar</TextLink>
          </p>
        </div>
      }
    >
      <Suspense>
        <RedirectIfSignedIn>
          <LoginForm />
        </RedirectIfSignedIn>
      </Suspense>
    </AuthCard>
  );
}
