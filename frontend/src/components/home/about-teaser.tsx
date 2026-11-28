"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { home } from "@/content/home";
import type { PublicImage, PublicStats } from "@/lib/public-api";
import { DecorBlob } from "./decor-blob";
import { CountUp, Reveal, RevealItem } from "./reveal";
import { HomeSection, SectionHeading } from "./section-heading";

const number = new Intl.NumberFormat("id-ID");
const formatNumber = (value: number) => number.format(value);

export function AboutTeaser({
  photo,
  stats,
}: {
  photo: PublicImage | null;
  stats: PublicStats | null;
}) {
  const copy = home.about;
  const items = stats
    ? [
        { label: copy.stats.cars, value: stats.cars },
        { label: copy.stats.branches, value: stats.branches },
        { label: copy.stats.completedBookings, value: stats.completed_bookings },
      ]
    : [];

  return (
    <HomeSection labelledBy="about-title">
      <DecorBlob className="-bottom-16 -left-24 hidden size-64 opacity-20 lg:block" />
      <Reveal className="relative z-(--z-content) grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <RevealItem>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- car photo from /storage with WebP srcset
            <img
              src={photo.url}
              srcSet={photo.srcset}
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt={photo.alt}
              loading="lazy"
              className="bg-surface-muted h-72 w-full rounded-xl object-cover sm:h-96"
            />
          ) : (
            <div
              aria-hidden="true"
              className="from-accent-wash to-surface-muted h-72 rounded-xl bg-linear-to-br sm:h-96"
            />
          )}
        </RevealItem>
        <RevealItem className="flex flex-col gap-6">
          <SectionHeading id="about-title" badge={copy.badge} title={copy.title} className="mb-0" />
          <p className="text-body-lg text-text-muted">{copy.text}</p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {copy.points.map((point) => (
              <li key={point} className="text-body text-text flex items-center gap-2 font-semibold">
                <Check aria-hidden="true" strokeWidth={1.75} className="text-accent size-5" />
                {point}
              </li>
            ))}
          </ul>
          {items.length > 0 ? (
            <dl className="grid grid-cols-3 gap-4" data-testid="home-stats">
              {items.map((item) => (
                <div key={item.label} className="bg-surface rounded-lg p-4 shadow-md">
                  <dt className="text-caption text-text-muted">{item.label}</dt>
                  <dd className="text-h2 text-text">
                    <CountUp value={item.value} format={formatNumber} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <Button asChild variant="secondary" size="md" arrow className="self-start">
            <Link href="/tentang-kami">Selengkapnya</Link>
          </Button>
        </RevealItem>
      </Reveal>
    </HomeSection>
  );
}
