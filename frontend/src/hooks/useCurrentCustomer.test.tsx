import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCurrentCustomer } from "./useCurrentCustomer";

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup(status: number, body: unknown) {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { fetchMock, ...renderHook(() => useCurrentCustomer(), { wrapper }) };
}

const failure = (code: number) => ({
  code,
  success: false,
  message: "x",
  data: null,
  errors: [],
  meta: null,
});

describe("useCurrentCustomer", () => {
  it("starts loading, then maps 401 to guest without retrying", async () => {
    const { result, fetchMock } = setup(401, failure(401));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current).toEqual({ status: "guest", customer: null }));
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("maps 404 (endpoint not available yet) to guest", async () => {
    const { result } = setup(404, failure(404));

    await waitFor(() => expect(result.current.status).toBe("guest"));
  });

  it("maps server errors to guest without throwing", async () => {
    const { result } = setup(500, failure(500));

    await waitFor(() => expect(result.current.status).toBe("guest"));
  });

  it("returns the signed-in customer", async () => {
    const customer = { id: 7, name: "Budi Santoso", email: "budi@example.test" };
    const { result } = setup(200, {
      code: 200,
      success: true,
      message: "OK",
      data: customer,
      errors: null,
      meta: null,
    });

    await waitFor(() => expect(result.current).toEqual({ status: "signed-in", customer }));
  });
});
