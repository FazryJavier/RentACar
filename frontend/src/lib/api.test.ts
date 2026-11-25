import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

function respond(status: number, body: string, contentType = "application/json") {
  const fetchMock = vi.fn(
    async () => new Response(body, { status, headers: { "Content-Type": contentType } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiGet", () => {
  it("returns data from a success envelope using same-origin credentials", async () => {
    const fetchMock = respond(
      200,
      JSON.stringify({
        code: 200,
        success: true,
        message: "OK",
        data: { id: 1 },
        errors: null,
        meta: null,
      }),
    );

    await expect(apiGet("/me")).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/me",
      expect.objectContaining({
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
    );
  });

  it("throws ApiError with the envelope message and errors", async () => {
    const errors = [
      { field: null, code: "unauthenticated", message: "Silakan masuk terlebih dahulu." },
    ];
    respond(
      401,
      JSON.stringify({
        code: 401,
        success: false,
        message: "Silakan masuk terlebih dahulu.",
        data: null,
        errors,
        meta: null,
      }),
    );

    const error = await apiGet("/me").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: "Silakan masuk terlebih dahulu.", errors });
  });

  it("throws a generic ApiError for non-JSON bodies", async () => {
    respond(502, "<html>Bad gateway</html>", "text/html");

    await expect(apiGet("/me")).rejects.toMatchObject({
      status: 502,
      message: "Terjadi kesalahan pada server.",
    });
  });

  it("throws for JSON that is not an envelope", async () => {
    respond(200, JSON.stringify({ hello: "world" }));

    await expect(apiGet("/me")).rejects.toBeInstanceOf(ApiError);
  });
});
