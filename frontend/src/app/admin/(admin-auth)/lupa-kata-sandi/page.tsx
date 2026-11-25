import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/forgot-form";
import { TextLink } from "@/components/auth/text-link";
import { AdminAuthCard } from "@/components/admin/admin-auth-card";

export const metadata: Metadata = { title: "Lupa kata sandi admin — RentACar" };

export default function AdminForgotPasswordPage() {
  return (
    <AdminAuthCard
      title="Lupa kata sandi"
      description="Masukkan email akun admin Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi."
      footer={<TextLink href="/admin/masuk">Kembali ke halaman masuk</TextLink>}
    >
      <ForgotForm audience="admin" />
    </AdminAuthCard>
  );
}
