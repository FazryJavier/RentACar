import {
  ApiError,
  apiDelete,
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  apiUpload,
  type Page,
} from "@/lib/api";

export type Brand = {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  version: number;
  created_at: string;
  updated_at: string;
};

export type Branch = {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  opening_time: string;
  closing_time: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ListParams = Record<string, string>;

function query(params: ListParams): string {
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== ""));
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** Typed CRUD calls for one admin resource (`/admin/<resource>`). */
export function adminResource<T extends { id: number }, Body extends object>(resource: string) {
  return {
    list: (params: ListParams, signal?: AbortSignal): Promise<Page<T>> =>
      apiGetPage<T>(`/admin/${resource}${query(params)}`, { signal }),
    get: (id: number): Promise<T> => apiGet<T>(`/admin/${resource}/${id}`),
    create: (body: Body): Promise<T> => apiPost<T>(`/admin/${resource}`, body),
    update: (id: number, body: Partial<Body> & { version: number }): Promise<T> =>
      apiPatch<T>(`/admin/${resource}/${id}`, body),
    remove: (id: number): Promise<null> => apiDelete<null>(`/admin/${resource}/${id}`),
  };
}

export type BrandBody = { name: string };
export type CategoryBody = { name: string; description: string | null; sort_order: number };
export type BranchBody = Omit<
  Branch,
  "id" | "slug" | "version" | "created_at" | "updated_at" | "latitude" | "longitude"
> & {
  latitude: number;
  longitude: number;
};

export const brandsApi = {
  ...adminResource<Brand, BrandBody>("brands"),
  uploadLogo: (id: number, file: File): Promise<Brand> => {
    const form = new FormData();
    form.append("logo", file);
    return apiUpload<Brand>(`/admin/brands/${id}/logo`, form);
  },
  removeLogo: (id: number): Promise<Brand> => apiDelete<Brand>(`/admin/brands/${id}/logo`),
};
export const categoriesApi = adminResource<Category, CategoryBody>("categories");
export const branchesApi = adminResource<Branch, BranchBody>("branches");

export type CarStatus = "active" | "maintenance" | "inactive";
export type Transmission = "manual" | "automatic";
export type FuelType = "gasoline" | "diesel" | "hybrid" | "electric";

type Ref = { id: number; name: string };

export type CarListItem = {
  id: number;
  slug: string;
  model_name: string;
  year: number;
  plate_number: string;
  color: string;
  status: CarStatus;
  daily_price: number;
  brand: Ref;
  category: Ref;
  branch: Ref;
  thumbnail_url: string | null;
  photos_count: number;
  has_3d: boolean;
};

export type CarPhoto = {
  id: number;
  sort_order: number;
  is_main: boolean;
  alt_text: string;
  processing: boolean;
  /** WebP URLs by width once processed. */
  urls: Record<"480" | "960" | "1440", string> | null;
};

export type Car = {
  id: number;
  slug: string;
  brand: Ref;
  category: Ref;
  branch: Ref;
  model_name: string;
  year: number;
  plate_number: string;
  color: string;
  transmission: Transmission;
  fuel_type: FuelType;
  seats: number;
  luggage_capacity: number | null;
  daily_price: number;
  deposit: number;
  status: CarStatus;
  description: string | null;
  features: string[];
  has_3d: boolean;
  photos: CarPhoto[];
  version: number;
  created_at: string;
  updated_at: string;
};

export type CarBody = {
  brand_id: number;
  category_id: number;
  branch_id?: number;
  model_name: string;
  year: number;
  plate_number: string;
  color: string;
  transmission: Transmission;
  fuel_type: FuelType;
  seats: number;
  luggage_capacity: number | null;
  daily_price: number;
  deposit: number;
  status: CarStatus;
  description: string | null;
  features: string[];
};

export type CarUpdateBody = Partial<CarBody> & {
  version: number;
  force_cancel_bookings?: boolean;
  cancel_reason?: string;
};

export const carsApi = {
  list: (params: ListParams, signal?: AbortSignal): Promise<Page<CarListItem>> =>
    apiGetPage<CarListItem>(`/admin/cars${query(params)}`, { signal }),
  get: (id: number, signal?: AbortSignal): Promise<Car> =>
    apiGet<Car>(`/admin/cars/${id}`, { signal }),
  create: (body: CarBody): Promise<Car> => apiPost<Car>("/admin/cars", body),
  update: (id: number, body: CarUpdateBody): Promise<Car> =>
    apiPatch<Car>(`/admin/cars/${id}`, body),
  remove: (id: number): Promise<null> => apiDelete<null>(`/admin/cars/${id}`),
};

export const carPhotosApi = {
  upload: (carId: number, file: File): Promise<CarPhoto> => {
    const form = new FormData();
    form.append("photo", file);
    return apiUpload<CarPhoto>(`/admin/cars/${carId}/photos`, form);
  },
  reorder: (carId: number, photoIds: number[]): Promise<CarPhoto[]> =>
    apiPatch<CarPhoto[]>(`/admin/cars/${carId}/photos/order`, { photo_ids: photoIds }),
  remove: (carId: number, photoId: number): Promise<null> =>
    apiDelete<null>(`/admin/cars/${carId}/photos/${photoId}`),
};

/** A booking that blocks a car change (409 `car_has_active_bookings`). */
export type BlockingBooking = { code: string; status: string; pickup_at: string };

export type AdminErrorKind =
  | { kind: "fields"; fields: Record<string, string> }
  | { kind: "active-bookings"; message: string; bookings: BlockingBooking[] }
  | { kind: "conflict"; message: string }
  | { kind: "in-use"; message: string }
  | { kind: "forbidden"; message: string }
  | { kind: "unauthenticated"; message: string }
  | { kind: "other"; message: string };

export const FORBIDDEN_MESSAGE = "Anda tidak memiliki akses untuk tindakan ini.";
export const CONFLICT_MESSAGE = "Data sudah diubah admin lain.";

/** Classifies an admin API failure for forms and dialogs. */
export function mapAdminError(error: unknown): AdminErrorKind {
  if (!(error instanceof ApiError)) {
    return { kind: "other", message: "Tidak dapat terhubung ke server. Coba lagi." };
  }

  const code = error.errors[0]?.code;
  if (error.status === 409 && code === "version_conflict") {
    return { kind: "conflict", message: CONFLICT_MESSAGE };
  }
  if (error.status === 409 && code === "car_has_active_bookings") {
    const details = error.errors[0]?.details as { bookings?: BlockingBooking[] } | undefined;
    return { kind: "active-bookings", message: error.message, bookings: details?.bookings ?? [] };
  }
  if (error.status === 409 && code === "resource_in_use") {
    return { kind: "in-use", message: error.message };
  }
  if (error.status === 403) {
    return { kind: "forbidden", message: FORBIDDEN_MESSAGE };
  }
  if (error.status === 401) {
    return { kind: "unauthenticated", message: error.message };
  }

  const fields: Record<string, string> = {};
  for (const item of error.errors) {
    if (item.field && !(item.field in fields)) {
      fields[item.field] = item.message;
    }
  }
  if (error.status === 422 && Object.keys(fields).length > 0) {
    return { kind: "fields", fields };
  }

  return { kind: "other", message: error.message };
}
