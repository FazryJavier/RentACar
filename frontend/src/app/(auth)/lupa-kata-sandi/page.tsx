import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotForm } from "@/components/auth/forgot-form";
import { TextLink } from "@/components/auth/text-link";

export const metadata: Metadata = { title: "Lupa kata sandi — RentACar" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Lupa kata sandi"
      description="Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi."
      footer={<TextLink href="/masuk">Kembali ke halaman masuk</TextLink>}
    >
      <ForgotForm />
    </AuthCard>
  );
}
