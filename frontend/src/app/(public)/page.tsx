import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroSection, HomeSections } from "@/components/home/home-page";
import { HeroSkeleton, SectionsSkeleton } from "@/components/home/home-skeleton";
import { pickHeroCar } from "@/components/home/pick-hero-car";
import { MotionProvider } from "@/components/home/reveal";
import { home } from "@/content/home";
import {
  getBranches,
  getCategories,
  getHeroCarDetail,
  getPopularCars,
  getStats,
  getTestimonials,
} from "@/lib/server/public-data";

export const metadata: Metadata = {
  title: "RentACar — Sewa mobil dengan model 3D dan catatan kondisi",
  description:
    "Proyek demo penyewaan mobil: cari mobil per cabang dan tanggal, lihat model 3D beserta catatan kondisinya, lalu pesan dalam beberapa menit.",
};

async function heroCar() {
  return pickHeroCar(home.featuredCarSlug, await getPopularCars(), getHeroCarDetail);
}

async function HomeHero() {
  const [hero, branches] = await Promise.all([heroCar(), getBranches()]);
  return <HeroSection hero={hero} branches={branches} />;
}

async function HomeRest() {
  const [hero, popular, categories, testimonials, stats] = await Promise.all([
    heroCar(),
    getPopularCars(),
    getCategories(),
    getTestimonials(),
    getStats(),
  ]);
  return (
    <HomeSections
      hero={hero}
      popular={popular}
      categories={categories}
      testimonials={testimonials}
      stats={stats}
    />
  );
}

export default function HomePage() {
  return (
    <MotionProvider>
      <Suspense fallback={<HeroSkeleton />}>
        <HomeHero />
      </Suspense>
      <Suspense fallback={<SectionsSkeleton />}>
        <HomeRest />
      </Suspense>
    </MotionProvider>
  );
}
