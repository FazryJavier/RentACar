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

export type AdminErrorKind =
  | { kind: "fields"; fields: Record<string, string> }
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
