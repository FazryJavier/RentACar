import { afterEach, describe, expect, it, vi } from "vitest";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("./gallery", () => ({ Gallery: () => null }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  notFound.mockClear();
});

// The development case runs first: React's JSX runtime is cached by Node on first load, and loading
// it while NODE_ENV=production would leave the dev runtime without `jsxDEV` for later tests.
describe("/dev/ui", () => {
  it("renders the gallery in development and is not indexed", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { default: DevUiPage, metadata } = await import("./page");

    expect(DevUiPage()).toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it.each(["production", "test"])("responds 404 when NODE_ENV=%s", async (env) => {
    vi.stubEnv("NODE_ENV", env);
    const { default: DevUiPage } = await import("./page");

    expect(() => DevUiPage()).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });
});
