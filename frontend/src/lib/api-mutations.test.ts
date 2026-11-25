import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiPost, apiPut, fieldErrors } from "./api";

type Call = { url: string; init: RequestInit };

const ok = { code: 200, success: true, message: "OK", data: { id: 1 }, errors: null, meta: null };

function envelope(status: number, extra: Record<string, unknown> = {}) {
  return {
    code: status,
    success: false,
    message: "Gagal.",
    data: null,
    errors: [],
    meta: null,
    ...extra,
  };
}

/** fetch mock: `/sanctum/csrf-cookie` sets the XSRF cookie; API calls answer from `queue`. */
function mockServer(
  queue: Array<{ status: number; body: unknown; headers?: Record<string, string> }>,
) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url === "/sanctum/csrf-cookie") {
      document.cookie = `XSRF-TOKEN=${encodeURIComponent("tok=en/1")}; path=/`;
      return new Response(null, { status: 204 });
    }
    const next = queue.shift() ?? { status: 200, body: ok };
    return new Response(JSON.stringify(next.body), {
      status: next.status,
      headers: { "Content-Type": "application/json", ...next.headers },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

function clearXsrfCookie() {
  document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

beforeEach(clearXsrfCookie);
afterEach(() => {
  vi.unstubAllGlobals();
  clearXsrfCookie();
});

describe("apiPost / apiPut", () => {
  it("fetches the CSRF cookie first, then sends the token header with credentials", async () => {
    const calls = mockServer([{ status: 200, body: ok }]);

    await expect(apiPost("/auth/login", { email: "a@b.test" })).resolves.toEqual({ id: 1 });

    expect(calls.map((c) => c.url)).toEqual(["/sanctum/csrf-cookie", "/api/v1/auth/login"]);
    const headers = calls[1]!.init.headers as Record<string, string>;
    expect(headers["X-XSRF-TOKEN"]).toBe("tok=en/1");
    expect(calls[1]!.init).toMatchObject({
      method: "POST",
      credentials: "include",
      body: '{"email":"a@b.test"}',
    });
  });

  it("reuses an existing CSRF cookie", async () => {
    document.cookie = "XSRF-TOKEN=abc; path=/";
    const calls = mockServer([{ status: 200, body: ok }]);

    await apiPut("/me/password", {});

    expect(calls.map((c) => c.url)).toEqual(["/api/v1/me/password"]);
  });

  it("refreshes the token and retries exactly once on 419", async () => {
    document.cookie = "XSRF-TOKEN=old; path=/";
    const calls = mockServer([
      { status: 419, body: envelope(419) },
      { status: 419, body: envelope(419) },
    ]);

    const error = await apiPost("/auth/logout").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(419);
    expect(calls.map((c) => c.url)).toEqual([
      "/api/v1/auth/logout",
      "/sanctum/csrf-cookie",
      "/api/v1/auth/logout",
    ]);
  });

  it("exposes Retry-After on 429", async () => {
    document.cookie = "XSRF-TOKEN=abc; path=/";
    mockServer([{ status: 429, body: envelope(429), headers: { "Retry-After": "30" } }]);

    await expect(apiPost("/auth/login", {})).rejects.toMatchObject({ status: 429, retryAfter: 30 });
  });

  it("maps field errors", async () => {
    document.cookie = "XSRF-TOKEN=abc; path=/";
    mockServer([
      {
        status: 422,
        body: envelope(422, {
          errors: [
            { field: "email", code: "not_unique", message: "Email sudah terdaftar" },
            { field: "email", code: "invalid", message: "kedua" },
            { field: null, code: "x", message: "umum" },
          ],
        }),
      },
    ]);

    const error = await apiPost("/auth/register", {}).catch((e: unknown) => e);

    expect(fieldErrors(error)).toEqual({ email: "Email sudah terdaftar" });
    expect(fieldErrors(new Error("x"))).toEqual({});
  });
});
