"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { ChangePasswordForm, ProfileForm } from "./profile-forms";

export function ProfilePage() {
  const { customer } = useCurrentCustomer();

  if (!customer) {
    return null;
  }

  return (
    <section className="max-w-page mx-auto px-4 py-12 md:px-6 xl:px-8">
      <h1 className="text-h1 text-text">Profil</h1>
      <p className="text-body text-text-muted mt-2">Kelola data diri dan kata sandi akun Anda.</p>
      <div className="bg-surface mt-8 rounded-lg p-6 shadow-md md:p-8">
        <Tabs defaultValue="data">
          <TabsList aria-label="Pengaturan akun">
            <TabsTrigger value="data">Data diri</TabsTrigger>
            <TabsTrigger value="password">Ubah kata sandi</TabsTrigger>
          </TabsList>
          <TabsContent value="data" className="pt-6">
            <ProfileForm customer={customer} />
          </TabsContent>
          <TabsContent value="password" className="pt-6">
            <ChangePasswordForm />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
