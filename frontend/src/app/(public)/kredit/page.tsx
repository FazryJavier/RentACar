import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoSkeleton } from "@/components/info/info-skeleton";
import { CreditsView } from "@/components/info/legal-views";
import { getCredits } from "@/lib/server/public-data";

export const metadata: Metadata = {
  title: "Kredit — RentACar",
  description: "Sumber dan lisensi model 3D, foto, ikon, huruf, dan peta yang dipakai RentACar.",
};

async function Credits() {
  return <CreditsView credits={await getCredits()} />;
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<InfoSkeleton />}>
      <Credits />
    </Suspense>
  );
}
