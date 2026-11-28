import type { Metadata } from "next";
import { Suspense } from "react";
import { HowToRentView } from "@/components/info/how-to-rent-view";
import { InfoSkeleton } from "@/components/info/info-skeleton";
import { getPublicSettings } from "@/lib/server/public-data";

export const metadata: Metadata = {
  title: "Cara Sewa — RentACar",
  description:
    "Langkah menyewa mobil di RentACar, syarat dokumen, ketentuan deposit, dan batas pemesanan.",
};

async function HowToRent() {
  return <HowToRentView settings={await getPublicSettings()} />;
}

export default function HowToRentPage() {
  return (
    <Suspense fallback={<InfoSkeleton />}>
      <HowToRent />
    </Suspense>
  );
}
