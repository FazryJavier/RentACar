import { ArrowRight, Box, Car, Fuel, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { Badge, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";
import type { PublicCarCard } from "@/lib/public-api";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "./labels";

export type CarCardVariant = "default" | "list" | "compact" | "mini";

function CarImage({
  car,
  sizes,
  className,
}: {
  car: PublicCarCard;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-surface-muted relative overflow-hidden", className)}>
      {car.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element -- WebP variants with srcset from /storage
        <img
          src={car.thumbnail.url}
          srcSet={car.thumbnail.srcset}
          sizes={sizes}
          alt={car.thumbnail.alt}
          loading="lazy"
          decoding="async"
          className="ease-standard size-full object-contain transition-transform duration-(--motion-base) motion-safe:group-hover:scale-103"
        />
      ) : (
        <span className="text-text-subtle flex size-full items-center justify-center">
          <Car aria-hidden="true" strokeWidth={1.5} className="size-10" />
        </span>
      )}
    </div>
  );
}

function Specs({ car }: { car: PublicCarCard }) {
  return (
    <ul
      className="text-body-sm text-text-muted flex flex-wrap gap-x-4 gap-y-1"
      aria-label="Spesifikasi"
    >
      <li className="inline-flex items-center gap-1.5">
        <Settings2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
        {TRANSMISSION_LABEL[car.transmission]}
      </li>
      <li className="inline-flex items-center gap-1.5">
        <Users aria-hidden="true" strokeWidth={1.75} className="size-4" />
        {car.seats} kursi
      </li>
      <li className="inline-flex items-center gap-1.5">
        <Fuel aria-hidden="true" strokeWidth={1.75} className="size-4" />
        {FUEL_LABEL[car.fuel_type]}
      </li>
    </ul>
  );
}

function Price({ car }: { car: PublicCarCard }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p>
        <span className="text-price text-text">{formatRupiah(car.daily_price)}</span>{" "}
        <span className="text-body-sm text-text-muted">/ hari</span>
      </p>
      {car.estimate ? (
        <p className="text-caption text-text-muted">
          Estimasi total {formatRupiah(car.estimate.total_amount)} · {car.estimate.rental_days}{" "}
          hari, termasuk deposit
        </p>
      ) : null}
    </div>
  );
}

/**
 * Car card (Design System §6.5). The whole card is one link; the arrow is decorative.
 * Variants: `default` (grid), `list` (image left), `compact` (carousel), `mini` (compare bar).
 */
export function CarCard({
  car,
  href,
  variant = "default",
}: {
  car: PublicCarCard;
  href: string;
  variant?: CarCardVariant;
}) {
  const shell =
    "group bg-surface focus-visible:focus-ring ease-standard relative flex rounded-lg shadow-md transition duration-(--motion-base) motion-safe:hover:-translate-y-1 hover:shadow-accent";

  if (variant === "mini") {
    return (
      <Link href={href} className={cn(shell, "items-center gap-3 p-2")}>
        <CarImage car={car} sizes="80px" className="h-12 w-20 shrink-0 rounded-sm" />
        <span className="text-body-sm text-text truncate font-semibold">{car.name}</span>
      </Link>
    );
  }

  const list = variant === "list";

  return (
    <Link
      href={href}
      className={cn(shell, list ? "flex-col gap-4 p-4 sm:flex-row" : "flex-col gap-4 p-4")}
    >
      <div className={cn("relative", list ? "sm:w-72 sm:shrink-0" : null)}>
        <CarImage
          car={car}
          sizes={
            list
              ? "(min-width: 600px) 288px, 100vw"
              : "(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw"
          }
          className={cn("rounded-md", variant === "compact" ? "h-40" : "h-48")}
        />
        <Badge tone="category" className="absolute top-2 right-2">
          {car.category.name}
        </Badge>
        {car.has_3d ? (
          <span className="bg-surface/90 text-accent text-caption absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold">
            <Box aria-hidden="true" strokeWidth={1.75} className="size-4" />
            3D
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h3 className="text-h4 text-text">{car.name}</h3>
        <Specs car={car} />
        <div className="mt-auto flex items-end justify-between gap-3">
          <Price car={car} />
          <span
            aria-hidden="true"
            className="bg-navy-900 text-text-on-dark inline-flex size-10 shrink-0 items-center justify-center rounded-full"
          >
            <ArrowRight strokeWidth={1.75} className="size-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CarCardSkeleton({ variant = "default" }: { variant?: CarCardVariant }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-surface flex gap-4 rounded-lg p-4 shadow-md",
        variant === "list" ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <Skeleton className={cn("h-48 rounded-md", variant === "list" ? "sm:w-72" : "w-full")} />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  );
}
