import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CarDetailPage } from "@/components/car-detail/car-detail-page";
import { CarDetailSkeleton } from "@/components/car-detail/car-detail-skeleton";
import { ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { fetchPublicCar, type PublicCarDetail } from "@/lib/public-api";

const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;
const backendUrl = () => process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

/**
 * Public car data, the same for every visitor, so one cached copy per slug is shared for a few
 * minutes (availability and price are always fetched live on the client). Null when not found.
 */
async function getPublicCar(slug: string): Promise<PublicCarDetail | null> {
  "use cache";
  cacheLife("minutes");
  if (!SLUG.test(slug)) {
    return null;
  }
  try {
    return await fetchPublicCar(slug, { server: { baseUrl: backendUrl(), clientIp: null } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

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
