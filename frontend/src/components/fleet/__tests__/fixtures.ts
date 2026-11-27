import type { PublicBranch, PublicCarCard } from "@/lib/public-api";

export const branch: PublicBranch = {
  slug: "jakarta-selatan",
  name: "Jakarta Selatan",
  address: "Jl. Contoh 1",
  city: "Jakarta",
  phone: "6221000000",
  opening_time: "07:00",
  closing_time: "21:00",
  latitude: "-6.2",
  longitude: "106.8",
};

export const references = {
  branches: [branch],
  categories: [
    { slug: "suv", name: "SUV", description: null },
    { slug: "mpv", name: "MPV", description: null },
  ],
  brands: [{ slug: "toyota", name: "Toyota", logo_url: null }],
};

export const car: PublicCarCard = {
  slug: "toyota-fortuner-2026",
  name: "Toyota Fortuner 2026",
  brand: { slug: "toyota", name: "Toyota" },
  category: { slug: "suv", name: "SUV" },
  branch: { slug: "jakarta-selatan", name: "Jakarta Selatan", city: "Jakarta" },
  transmission: "automatic",
  fuel_type: "diesel",
  seats: 7,
  daily_price: 950_000,
  thumbnail: {
    url: "/storage/cars/1/card.webp",
    srcset: "/storage/cars/1/card.webp 640w",
    alt: "Toyota Fortuner 2026",
  },
  has_3d: true,
  estimate: null,
};

export const estimate = {
  rental_days: 2,
  rental_subtotal: 1_900_000,
  deposit: 500_000,
  total_amount: 2_400_000,
};

export function page(
  data: PublicCarCard[],
  meta: Partial<{ page: number; total: number; total_pages: number }> = {},
) {
  return {
    code: 200,
    success: true,
    message: "OK",
    data,
    errors: null,
    meta: { page: 1, per_page: 12, total: data.length, total_pages: 1, ...meta },
  };
}
