import Link from "next/link";
import { CarCard } from "@/components/fleet/car-card";
import { home } from "@/content/home";
import type { PublicCarCard } from "@/lib/public-api";
import { Carousel } from "./carousel";
import { Reveal } from "./reveal";
import { HomeSection, SectionHeading } from "./section-heading";

const MAX_CARS = 8;

export function PopularCars({ cars }: { cars: PublicCarCard[] }) {
  const copy = home.popular;
  return (
    <HomeSection labelledBy="popular-title">
      <Reveal>
        <SectionHeading
          id="popular-title"
          badge={copy.badge}
          title={copy.title}
          subtitle={copy.subtitle}
          action={
            <Link
              href="/armada"
              className="text-body text-accent hover:text-accent-hover focus-visible:focus-ring inline-flex min-h-11 items-center rounded-sm font-semibold"
            >
              Lihat semua armada
            </Link>
          }
        />
        <Carousel label="Armada populer" itemClassName="basis-5/6 sm:basis-5/11 lg:basis-1/3">
          {cars.slice(0, MAX_CARS).map((car) => (
            <CarCard key={car.slug} car={car} href={`/armada/${car.slug}`} variant="compact" />
          ))}
        </Carousel>
      </Reveal>
    </HomeSection>
  );
}
