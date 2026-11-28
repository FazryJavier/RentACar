"use client";

import { Box } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/components/fleet/labels";
import { formatRupiah } from "@/lib/format";
import type { PublicCarDetail } from "@/lib/public-api";
import { BookingCard } from "./booking-card";
import { CarInfo } from "./car-info";
import { CarViewerSection } from "./car-viewer-section";
import { ConditionSection } from "./condition-section";
import { MobileBookingBar } from "./mobile-booking-bar";
import { ConditionSelectionProvider } from "./selection";
import { SimilarCars } from "./similar-cars";
import { useRental } from "./use-rental";

/** Client part of /armada/[slug]: viewer, conditions, info, booking and similar cars. */
export function CarDetailPage({ car }: { car: PublicCarDetail }) {
  const rental = useRental(car);

  return (
    <ConditionSelectionProvider>
      <div className="max-w-page mx-auto flex flex-col gap-10 px-4 pt-8 pb-28 md:px-6 lg:pb-16 xl:px-8">
        <div className="flex flex-col gap-3">
          <nav aria-label="Breadcrumb">
            <ol className="text-body-sm text-text-muted flex flex-wrap gap-2">
              <li>
                <Link
                  href="/armada"
                  className="hover:text-text focus-visible:focus-ring rounded-sm underline-offset-4 hover:underline"
                >
                  Armada
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/armada?category=${car.category.slug}`}
                  className="hover:text-text focus-visible:focus-ring rounded-sm underline-offset-4 hover:underline"
                >
                  {car.category.name}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-text">
                {car.name}
              </li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1 text-text">{car.name}</h1>
            <Badge tone="category">{car.category.name}</Badge>
            {car.model_3d ? (
              <Badge tone="neutral">
                <Box aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                3D
              </Badge>
            ) : null}
          </div>
          <p className="text-body text-text-muted">
            {TRANSMISSION_LABEL[car.transmission]} · {car.seats} kursi · {FUEL_LABEL[car.fuel_type]}{" "}
            ·{" "}
            <span className="text-text tabular font-semibold">{formatRupiah(car.daily_price)}</span>{" "}
            / hari
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-10 lg:col-span-2">
            <CarViewerSection car={car} />
            <ConditionSection car={car} />
            <CarInfo car={car} />
          </div>
          <aside aria-label="Pesan mobil" className="hidden lg:block">
            <div className="sticky top-24">
              <BookingCard car={car} rental={rental} />
            </div>
          </aside>
        </div>

        <SimilarCars slug={car.slug} rental={rental.rental} />
      </div>
      <MobileBookingBar car={car} rental={rental} />
    </ConditionSelectionProvider>
  );
}
