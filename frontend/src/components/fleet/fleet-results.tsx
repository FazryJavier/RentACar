"use client";

import { CalendarSearch } from "lucide-react";
import { FormAlert } from "@/components/auth/form-alert";
import { Button, EmptyState, Pagination } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PublicCarCard, PublicPage } from "@/lib/public-api";
import { CarCard, CarCardSkeleton } from "./car-card";

function gridClass(view: "grid" | "list") {
  return view === "grid"
    ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    : "flex flex-col gap-4";
}

/** Result list with loading, empty, error and pagination states. */
export function FleetResults({
  page,
  view,
  perPage,
  status,
  hrefFor,
  onPageChange,
  onRetry,
  onChangeDates,
  onClearFilters,
  filtersActive,
}: {
  page: PublicPage<PublicCarCard> | undefined;
  view: "grid" | "list";
  perPage: number;
  status: "loading" | "error" | "ready";
  hrefFor: (car: PublicCarCard) => string;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onChangeDates: () => void;
  onClearFilters: () => void;
  filtersActive: boolean;
}) {
  if (status === "error") {
    return (
      <div className="flex flex-col gap-3">
        <FormAlert alert={{ tone: "danger", message: "Daftar mobil gagal dimuat." }} />
        <div>
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  if (status === "loading" || !page) {
    return (
      <ul className={gridClass(view)} aria-label="Memuat daftar mobil">
        {Array.from({ length: Math.min(perPage, 6) }, (_, index) => (
          <li key={index}>
            <CarCardSkeleton variant={view === "grid" ? "default" : "list"} />
          </li>
        ))}
      </ul>
    );
  }

  if (page.data.length === 0) {
    return (
      <EmptyState
        icon={CalendarSearch}
        title="Tidak ada mobil tersedia"
        description="Coba ubah tanggal atau kurangi filter."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={onChangeDates}>
              Ubah tanggal
            </Button>
            {filtersActive ? <Button onClick={onClearFilters}>Hapus filter</Button> : null}
          </div>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ul className={cn(gridClass(view))}>
        {page.data.map((car) => (
          <li key={car.slug}>
            <CarCard car={car} href={hrefFor(car)} variant={view === "grid" ? "default" : "list"} />
          </li>
        ))}
      </ul>
      {page.meta.total_pages > 1 ? (
        <Pagination
          page={page.meta.page}
          totalPages={page.meta.total_pages}
          onPageChange={onPageChange}
          className="justify-center"
        />
      ) : null}
    </div>
  );
}
