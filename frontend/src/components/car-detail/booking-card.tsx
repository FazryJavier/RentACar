"use client";

import { CircleCheck, CircleX, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { Badge, Button, DateRangePicker, Field, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";
import type { PublicAvailability, PublicCarDetail } from "@/lib/public-api";
import { REASON_LABEL } from "./labels";
import type { Rental } from "./use-rental";

const MAX_ADVANCE_DAYS = 90;

function wibDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

/** Rental price rows exactly as returned by the server (no client arithmetic). */
export function PriceBreakdown({ price }: { price: PublicAvailability["price"] }) {
  return (
    <div className="flex flex-col gap-2">
      <dl className="text-body-sm flex flex-col gap-2">
        <div className="flex justify-between gap-4">
          <dt className="text-text-muted">
            {price.rental_days} hari × {formatRupiah(price.daily_price)}
          </dt>
          <dd className="text-text tabular">{formatRupiah(price.rental_subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-muted">Deposit</dt>
          <dd className="text-text tabular">{formatRupiah(price.deposit)}</dd>
        </div>
        <div className="border-border flex items-baseline justify-between gap-4 border-t pt-3">
          <dt className="text-text font-semibold">Total</dt>
          <dd className="text-price-lg text-text tabular">{formatRupiah(price.total_amount)}</dd>
        </div>
      </dl>
      <p className="text-caption text-text-subtle">
        Deposit dikembalikan setelah mobil kembali dalam kondisi baik (simulasi).
      </p>
    </div>
  );
}

/**
 * Dates, availability and price for this car at its branch. Used as the sticky desktop card and
 * inside the mobile bottom sheet (`compact` hides the title block shown in the sheet header).
 */
export function BookingCard({
  car,
  rental,
  compact = false,
}: {
  car: PublicCarDetail;
  rental: Rental;
  compact?: boolean;
}) {
  const [limits, setLimits] = useState<{ min: string; max: string } | null>(null);
  const { availability, branch } = rental;
  const data = availability.data;

  useEffect(() => {
    // "Today" is read after mount so server and client render the same markup.
    const today = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLimits({
      min: wibDateKey(today),
      max: wibDateKey(new Date(today.getTime() + MAX_ADVANCE_DAYS * 86_400_000)),
    });
  }, []);

  return (
    <div
      className={cn("flex flex-col gap-4", compact ? null : "bg-surface rounded-lg p-6 shadow-lg")}
    >
      {compact ? null : (
        <div className="flex flex-col gap-2">
          <Badge tone="category" className="self-start">
            {car.category.name}
          </Badge>
          <p className="text-h4 text-text">{car.name}</p>
          <p className="text-body-sm text-text-muted">
            <span className="text-price text-text tabular">{formatRupiah(car.daily_price)}</span> /
            hari
          </p>
        </div>
      )}

      <p className="text-body-sm text-text-muted flex items-start gap-2">
        <MapPin aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-4 shrink-0" />
        <span>
          Cabang <span className="text-text font-medium">{car.branch.name}</span> ·{" "}
          {car.branch.city}
          {branch ? ` · ${branch.opening_time}–${branch.closing_time} WIB` : ""}
        </span>
      </p>

      <Field label="Waktu ambil & kembali" error={rental.dateError}>
        <DateRangePicker
          key={`${branch?.slug ?? "none"}-${limits?.min ?? ""}`}
          openTime={branch?.opening_time ?? "07:00"}
          closeTime={branch?.closing_time ?? "21:00"}
          minDate={limits?.min}
          maxDate={limits?.max}
          defaultValue={{
            pickupAt: rental.rental?.pickupAt ?? null,
            returnAt: rental.rental?.returnAt ?? null,
          }}
          disabled={!branch}
          placeholder="Pilih tanggal ambil & kembali"
          onChange={rental.setDates}
        />
      </Field>

      <div
        aria-live="polite"
        aria-busy={availability.isFetching || undefined}
        className="flex flex-col gap-3"
      >
        {!rental.rental ? (
          <p className="text-body-sm text-text-muted">Pilih tanggal untuk melihat total harga.</p>
        ) : availability.isPending ? (
          <div className="flex flex-col gap-2" aria-label="Memeriksa ketersediaan">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ) : rental.failed ? (
          <FormAlert alert={{ tone: "danger", message: "Ketersediaan gagal diperiksa." }} />
        ) : data ? (
          <>
            <PriceBreakdown price={data.price} />
            {data.available ? (
              <p className="text-body-sm text-success flex items-center gap-2 font-semibold">
                <CircleCheck aria-hidden="true" strokeWidth={1.75} className="size-5" />
                Tersedia
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-body-sm text-danger flex items-center gap-2 font-semibold">
                  <CircleX aria-hidden="true" strokeWidth={1.75} className="size-5" />
                  Tidak tersedia
                </p>
                {data.reason ? (
                  <p className="text-caption text-text-muted">{REASON_LABEL[data.reason]}</p>
                ) : null}
              </div>
            )}
          </>
        ) : null}
      </div>

      {rental.failed ? (
        <Button variant="secondary" onClick={() => availability.refetch()}>
          Coba lagi
        </Button>
      ) : data?.available && rental.checkoutHref ? (
        <Button asChild size="lg">
          <Link href={rental.checkoutHref}>Pesan Sekarang</Link>
        </Button>
      ) : (
        <Button size="lg" disabled>
          {data && !data.available ? "Tidak tersedia" : "Pesan Sekarang"}
        </Button>
      )}
      {data && !data.available ? (
        <a
          href="#mobil-serupa"
          className="text-body-sm text-accent focus-visible:focus-ring self-center rounded-sm underline-offset-4 hover:underline"
        >
          Lihat mobil serupa yang tersedia
        </a>
      ) : null}
    </div>
  );
}
