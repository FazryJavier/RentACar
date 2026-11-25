import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { RedirectIfSignedIn } from "@/components/auth/redirect-if-signed-in";
import { TextLink } from "@/components/auth/text-link";
import { AdminAuthCard } from "@/components/admin/admin-auth-card";

export const metadata: Metadata = { title: "Masuk admin — RentACar" };

export default function AdminLoginPage() {
  return (
    <AdminAuthCard
      title="Masuk admin"
      description="Khusus Super Admin dan Staf cabang."
      footer={<TextLink href="/admin/lupa-kata-sandi">Lupa kata sandi?</TextLink>}
    >
      <Suspense>
        <RedirectIfSignedIn audience="admin">
          <LoginForm audience="admin" />
        </RedirectIfSignedIn>
      </Suspense>
    </AdminAuthCard>
  );
}
