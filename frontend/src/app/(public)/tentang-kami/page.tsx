import type { Metadata } from "next";
import { Suspense } from "react";
import { AboutView } from "@/components/info/about-view";
import { InfoSkeleton } from "@/components/info/info-skeleton";
import { getBranches, getPopularCars, getStats } from "@/lib/server/public-data";

export const metadata: Metadata = {
  title: "Tentang Kami — RentACar",
  description:
    "Cerita, visi, dan nilai layanan RentACar, proyek demo penyewaan mobil dengan model 3D dan catatan kondisi.",
};

async function About() {
  const [popular, stats, branches] = await Promise.all([
    getPopularCars(),
    getStats(),
    getBranches(),
  ]);
  const photo = popular?.find((car) => car.thumbnail !== null)?.thumbnail ?? null;
  return <AboutView photo={photo} stats={stats} branches={branches} />;
}

export default function AboutPage() {
  return (
    <Suspense fallback={<InfoSkeleton />}>
      <About />
    </Suspense>
  );
}
