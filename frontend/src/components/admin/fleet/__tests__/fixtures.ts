import type { Car, CarListItem, CarPhoto } from "@/lib/admin-api";

export const carListItem: CarListItem = {
  id: 9,
  slug: "toyota-fortuner-2023-hitam",
  model_name: "Fortuner",
  year: 2023,
  plate_number: "B 1234 XYZ",
  color: "Hitam",
  status: "active",
  daily_price: 950000,
  brand: { id: 1, name: "Toyota" },
  category: { id: 2, name: "SUV" },
  branch: { id: 3, name: "Jakarta Selatan" },
  thumbnail_url: "/storage/cars/9/a-480.webp",
  photos_count: 1,
  has_3d: true,
};

export function photo(id: number, sortOrder: number, processing = false): CarPhoto {
  return {
    id,
    sort_order: sortOrder,
    is_main: sortOrder === 0,
    alt_text: `Foto ${id}`,
    processing,
    urls: processing
      ? null
      : {
          "480": `/storage/cars/9/${id}-480.webp`,
          "960": `/storage/cars/9/${id}-960.webp`,
          "1440": `/storage/cars/9/${id}-1440.webp`,
        },
  };
}

export const carFixture: Car = {
  id: 9,
  slug: "toyota-fortuner-2023-hitam",
  brand: { id: 1, name: "Toyota" },
  category: { id: 2, name: "SUV" },
  branch: { id: 3, name: "Jakarta Selatan" },
  model_name: "Fortuner",
  year: 2023,
  plate_number: "B 1234 XYZ",
  color: "Hitam",
  transmission: "automatic",
  fuel_type: "diesel",
  seats: 7,
  luggage_capacity: 3,
  daily_price: 950000,
  deposit: 500000,
  status: "active",
  description: null,
  features: ["AC"],
  has_3d: false,
  model_3d: null,
  last_inspected_at: null,
  photos: [],
  version: 2,
  created_at: "2026-11-27T01:00:00Z",
  updated_at: "2026-11-27T01:00:00Z",
};

export const referenceRoutes = {
  "GET /admin/brands?per_page=100&sort=name": {
    status: 200,
    body: {
      code: 200,
      success: true,
      message: "OK",
      data: [{ id: 1, name: "Toyota" }],
      errors: null,
      meta: { page: 1, per_page: 100, total: 1, total_pages: 1 },
    },
  },
  "GET /admin/categories?per_page=100&sort=sort_order": {
    status: 200,
    body: {
      code: 200,
      success: true,
      message: "OK",
      data: [{ id: 2, name: "SUV" }],
      errors: null,
      meta: { page: 1, per_page: 100, total: 1, total_pages: 1 },
    },
  },
  "GET /admin/branches?per_page=100&sort=name": {
    status: 200,
    body: {
      code: 200,
      success: true,
      message: "OK",
      data: [{ id: 3, name: "Jakarta Selatan" }],
      errors: null,
      meta: { page: 1, per_page: 100, total: 1, total_pages: 1 },
    },
  },
};
