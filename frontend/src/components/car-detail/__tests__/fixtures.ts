import type { PublicCarDetail } from "@/lib/public-api";
import { branch, car } from "../../fleet/__tests__/fixtures";

export { branch };

export const detail: PublicCarDetail = {
  ...car,
  year: 2026,
  color: "Hitam",
  luggage_capacity: 3,
  description: "SUV tangguh untuk keluarga.",
  features: ["AC", "Audio"],
  deposit: 500_000,
  photos: [
    { url: "/storage/cars/1/a.webp", srcset: "/storage/cars/1/a.webp 960w", alt: "Depan" },
    { url: "/storage/cars/1/b.webp", srcset: "/storage/cars/1/b.webp 960w", alt: "Samping" },
  ],
  model_3d: {
    url: "/storage/models/1.glb",
    poster_url: "/storage/models/1.webp",
    camera: null,
    is_illustrative: true,
    credit: { source_name: "Contoh", source_url: null, license: "CC-BY 4.0" },
  },
  conditions: [
    {
      number: 1,
      area: "right",
      severity: "moderate",
      description: "Penyok kecil di pintu kanan",
      position: [1, 0.5, 0],
      normal: [1, 0, 0],
      needs_reposition: false,
      photos: [{ url: "/storage/conditions/1.webp" }],
      inspected_on: "2026-11-27",
    },
    {
      number: 2,
      area: "rear",
      severity: "minor",
      description: "Goresan halus di bumper",
      position: null,
      normal: null,
      needs_reposition: true,
      photos: [],
      inspected_on: "2026-11-20",
    },
  ],
  inspection_summary: {
    last_inspected_at: "2026-11-27T03:00:00Z",
    active_conditions: { minor: 1, moderate: 1, major: 0 },
    odometer_km: 45210,
  },
};

export const price = {
  daily_price: 950_000,
  rental_days: 2,
  rental_subtotal: 1_900_000,
  deposit: 500_000,
  total_amount: 2_400_000,
};
