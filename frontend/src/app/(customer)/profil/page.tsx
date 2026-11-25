import type { Metadata } from "next";
import { ProfilePage } from "@/components/auth/profile-page";

export const metadata: Metadata = { title: "Profil — RentACar" };

export default function Page() {
  return <ProfilePage />;
}
