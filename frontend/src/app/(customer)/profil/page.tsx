import type { Metadata } from "next";
import { RequireCustomer } from "@/components/auth/require-customer";
import { ProfilePage } from "@/components/auth/profile-page";

export const metadata: Metadata = { title: "Profil — RentACar" };

export default function Page() {
  return (
    <RequireCustomer>
      <ProfilePage />
    </RequireCustomer>
  );
}
