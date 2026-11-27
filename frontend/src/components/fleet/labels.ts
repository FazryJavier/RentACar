import type { FleetSort } from "@/lib/fleet-params";

export const TRANSMISSION_LABEL = { automatic: "Otomatis", manual: "Manual" } as const;
export const FUEL_LABEL = {
  gasoline: "Bensin",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Listrik",
} as const;

export const SORT_OPTIONS: { value: FleetSort; label: string }[] = [
  { value: "popular", label: "Terpopuler" },
  { value: "price", label: "Harga terendah" },
  { value: "-price", label: "Harga tertinggi" },
  { value: "-newest", label: "Terbaru" },
];
