"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import {
  Button,
  EmptyState,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import { carsApi, type Car } from "@/lib/admin-api";
import { CarForm } from "./car-form";
import { carName } from "./labels";
import { PhotoManager, carQueryKey } from "./photo-manager";

const POLL_MS = 2_000;
const POLL_LIMIT_MS = 60_000;

/** Create (`id` null) or edit a car, with the Data and Foto tabs. */
export function CarEditor({ id }: { id: number | null }) {
  const router = useRouter();
  const [tab, setTab] = useState("data");
  const pollSince = useRef<number | null>(null);
  const query = useQuery({
    queryKey: carQueryKey(id ?? 0),
    queryFn: ({ signal }) => carsApi.get(id!, signal),
    enabled: id !== null,
    retry: false,
    // While photos are being processed, poll until they are ready (up to a minute).
    refetchInterval: (current) => {
      if (!current.state.data?.photos.some((photo) => photo.processing)) {
        pollSince.current = null;
        return false;
      }
      pollSince.current ??= Date.now();
      return Date.now() - pollSince.current < POLL_LIMIT_MS ? POLL_MS : false;
    },
  });

  const back = (
    <Link
      href="/admin/mobil"
      className="text-body-sm text-text-muted hover:text-text focus-visible:focus-ring inline-flex items-center gap-1 self-start rounded-sm"
    >
      <ArrowLeft aria-hidden="true" strokeWidth={1.75} className="size-4" />
      Daftar mobil
    </Link>
  );

  if (id !== null && query.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        {back}
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (id !== null && query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="flex flex-col gap-4">
        {back}
        {missing ? (
          <div className="bg-surface rounded-lg shadow-sm">
            <EmptyState
              title="Mobil tidak ditemukan"
              description="Mobil ini sudah dihapus atau bukan dari cabang Anda."
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <FormAlert alert={{ tone: "danger", message: "Data mobil gagal dimuat." }} />
            <div>
              <Button size="sm" variant="secondary" onClick={() => void query.refetch()}>
                Coba lagi
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const car: Car | null = id !== null ? (query.data ?? null) : null;

  return (
    <div className="bg-surface flex flex-col gap-6 rounded-lg p-4 shadow-sm md:p-6">
      {back}
      <div className="flex flex-col gap-1">
        <h2 className="text-h3 text-text">{car ? carName(car) : "Tambah mobil"}</h2>
        {car ? <p className="text-body-sm text-text-muted">{car.plate_number}</p> : null}
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Bagian data mobil">
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="foto" disabled={car === null}>
            Foto{car ? ` (${car.photos.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="model" disabled>
            Model 3D & Kondisi
          </TabsTrigger>
        </TabsList>
        <TabsContent value="data" className="pt-6">
          <CarForm
            key={car?.id ?? "new"}
            car={car}
            onSaved={(saved) => {
              if (id === null) {
                router.replace(`/admin/mobil/${saved.id}`);
              }
            }}
          />
        </TabsContent>
        <TabsContent value="foto" className="pt-6">
          {car ? <PhotoManager car={car} /> : null}
        </TabsContent>
      </Tabs>
      {car === null ? (
        <p className="text-caption text-text-subtle">Simpan data mobil dulu untuk menambah foto.</p>
      ) : null}
    </div>
  );
}
