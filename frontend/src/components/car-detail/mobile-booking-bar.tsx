"use client";

import { useState } from "react";
import { BottomSheetContent, Button, Dialog, DialogTrigger } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { PublicCarDetail } from "@/lib/public-api";
import { BookingCard } from "./booking-card";
import type { Rental } from "./use-rental";

/** Sticky bottom bar below 1024 px; opens the booking card in a bottom sheet. */
export function MobileBookingBar({ car, rental }: { car: PublicCarDetail; rental: Rental }) {
  const [open, setOpen] = useState(false);
  const price = rental.availability.data?.price;

  return (
    <div className="bg-surface fixed inset-x-0 bottom-0 z-(--z-sticky) flex h-18 items-center justify-between gap-4 px-4 shadow-lg lg:hidden">
      <div className="flex flex-col">
        <span className="text-caption text-text-subtle">
          {price ? `Total ${price.rental_days} hari` : "Mulai dari"}
        </span>
        <span className="text-price text-text tabular">
          {formatRupiah(price ? price.total_amount : car.daily_price)}
          {price ? null : <span className="text-body-sm text-text-muted font-normal"> / hari</span>}
        </span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>{rental.rental ? "Pesan Sekarang" : "Pilih tanggal"}</Button>
        </DialogTrigger>
        <BottomSheetContent
          title={car.name}
          description={`${formatRupiah(car.daily_price)} / hari`}
        >
          <BookingCard car={car} rental={rental} compact />
        </BottomSheetContent>
      </Dialog>
    </div>
  );
}
