"use client";

import { CountUp } from "@/components/home/reveal";
import type { PublicStats } from "@/lib/public-api";

const number = new Intl.NumberFormat("id-ID");
const formatNumber = (value: number) => number.format(value);

/** Live statistics (cars, branches, completed rentals) from `/public/stats`. */
export function StatsList({
  stats,
  labels,
}: {
  stats: PublicStats;
  labels: { cars: string; branches: string; completedBookings: string };
}) {
  const items = [
    { label: labels.cars, value: stats.cars },
    { label: labels.branches, value: stats.branches },
    { label: labels.completedBookings, value: stats.completed_bookings },
  ];
  return (
    <dl className="grid grid-cols-3 gap-4" data-testid="info-stats">
      {items.map((item) => (
        <div key={item.label} className="bg-surface rounded-lg p-4 shadow-md">
          <dt className="text-caption text-text-muted">{item.label}</dt>
          <dd className="text-h2 text-text">
            <CountUp value={item.value} format={formatNumber} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
