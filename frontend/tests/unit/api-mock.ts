import { vi } from "vitest";

export type MockResponse = { status: number; body?: unknown; headers?: Record<string, string> };

export const customerFixture = {
  id: 7,
  name: "Budi Santoso",
  email: "budi@example.test",
  phone: "6281234567890",
  address: "Jl. Contoh 1",
  license_number: "123456789012",
  created_at: "2026-11-25T00:00:00Z",
};

export function ok(data: unknown, message = "OK") {
  return { code: 200, success: true, message, data, errors: null, meta: null };
}

/** Collection envelope with pagination in `meta`. */
export function okPage(
  data: unknown[],
  meta: Partial<{ page: number; per_page: number; total: number; total_pages: number }> = {},
) {
  const total = meta.total ?? data.length;
  return {
    code: 200,
    success: true,
    message: "OK",
    data,
    errors: null,
    meta: {
      page: 1,
      per_page: 25,
      total,
      total_pages: Math.max(1, Math.ceil(total / 25)),
      ...meta,
    },
  };
}

export function fail(status: number, message: string, errors: unknown[] = []) {
  return { code: status, success: false, message, data: null, errors, meta: null };
}

/**
 * Routes `fetch` by "METHOD path" (path without `/api/v1`). The CSRF endpoint always succeeds.
 * Returns the list of calls for assertions.
 */
export function mockApi(routes: Record<string, MockResponse | MockResponse[]>) {
  const calls: { key: string; body: unknown }[] = [];
  const queues = new Map(
    Object.entries(routes).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : [value],
    ]),
  );

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      if (url === "/sanctum/csrf-cookie") {
        document.cookie = "XSRF-TOKEN=test; path=/";
        return new Response(null, { status: 204 });
      }
      const key = `${init.method ?? "GET"} ${url.replace("/api/v1", "")}`;
      calls.push({
        key,
        body: typeof init.body === "string" ? JSON.parse(init.body) : (init.body ?? undefined),
      });
      const queue = queues.get(key);
      const next = queue && queue.length > 1 ? queue.shift()! : queue?.[0];
      if (!next) {
        return new Response(JSON.stringify(fail(404, "not mocked")), { status: 404 });
      }
      return new Response(JSON.stringify(next.body ?? ok(null)), {
        status: next.status,
        headers: { "Content-Type": "application/json", ...next.headers },
      });
    }),
  );

  return calls;
}

export const superAdminFixture = {
  id: 1,
  name: "Budi Pemilik",
  email: "owner@example.test",
  role: "super_admin" as const,
  branch: null,
  menu: [
    "dashboard",
    "bookings",
    "payments",
    "cars",
    "brands",
    "categories",
    "branches",
    "customers",
    "admins",
    "audit_logs",
  ],
  created_at: "2026-11-26T00:00:00Z",
};

export const staffFixture = {
  id: 2,
  name: "Sari Staf",
  email: "sari@example.test",
  role: "staff" as const,
  branch: { id: 3, name: "Jakarta Selatan" },
  menu: ["dashboard", "bookings", "payments", "cars", "brands", "categories", "customers"],
  created_at: "2026-11-26T00:00:00Z",
};
