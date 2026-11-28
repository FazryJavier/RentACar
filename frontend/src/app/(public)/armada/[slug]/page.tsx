import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CarDetailPage } from "@/components/car-detail/car-detail-page";
import { CarDetailSkeleton } from "@/components/car-detail/car-detail-skeleton";
import { formatRupiah } from "@/lib/format";
import { getPublicCar } from "@/lib/server/public-data";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const car = await getPublicCar((await params).slug);
  if (!car) {
    return { title: "Mobil tidak ditemukan — RentACar" };
  }
  const image = car.model_3d?.poster_url ?? car.photos[0]?.url;
  return {
    title: `${car.name} — RentACar`,
    description: `Sewa ${car.name} (${car.category.name}) mulai ${formatRupiah(car.daily_price)} per hari di cabang ${car.branch.name}. Lihat model 3D dan catatan kondisinya.`,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

async function CarDetail({ params }: { params: Params }) {
  const car = await getPublicCar((await params).slug);
  if (!car) {
    notFound();
  }
  return <CarDetailPage car={car} />;
}

export default function CarDetailRoute({ params }: { params: Params }) {
  return (
    <Suspense fallback={<CarDetailSkeleton />}>
      <CarDetail params={params} />
    </Suspense>
  );
}
