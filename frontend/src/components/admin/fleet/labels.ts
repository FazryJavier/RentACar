import type { BadgeTone } from "@/components/ui";
import type { CarStatus, FuelType, Transmission } from "@/lib/admin-api";

export const CAR_STATUS: Record<CarStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Aktif", tone: "success" },
  maintenance: { label: "Perawatan", tone: "warning" },
  inactive: { label: "Nonaktif", tone: "neutral" },
};

export const TRANSMISSION_LABEL: Record<Transmission, string> = {
  automatic: "Otomatis",
  manual: "Manual",
};

export const FUEL_LABEL: Record<FuelType, string> = {
  gasoline: "Bensin",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Listrik",
};

export function options<K extends string>(labels: Record<K, string | { label: string }>) {
  return (Object.entries(labels) as [K, string | { label: string }][]).map(([value, label]) => ({
    value,
    label: typeof label === "string" ? label : label.label,
  }));
}

/** "Toyota Fortuner 2023". */
export function carName(car: {
  brand: { name: string };
  model_name: string;
  year: number;
}): string {
  return `${car.brand.name} ${car.model_name} ${car.year}`;
}
