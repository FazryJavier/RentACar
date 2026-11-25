import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicError from "@/app/(public)/error";
import GlobalError from "@/app/global-error";
import NotFound, { metadata } from "@/app/not-found";
import { mockFetchJson, renderWithProviders } from "../../../../tests/unit/render-with-providers";

vi.mock("next/navigation", () => ({ usePathname: () => "/tidak-ada" }));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    mockFetchJson(401, {
      code: 401,
      success: false,
      message: "x",
      data: null,
      errors: [],
      meta: null,
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Not found page", () => {
  it("renders inside the site shell with both actions", () => {
    renderWithProviders(<NotFound />);
    const main = screen.getByRole("main");

    expect(
      within(main).getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
    ).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: "Kembali ke Beranda" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(main).getByRole("link", { name: /Lihat Armada/ })).toHaveAttribute(
      "href",
      "/armada",
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(main).toHaveAttribute("id", "konten");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("Error page", () => {
  it("shows a safe message and retries", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<PublicError error={new Error("SQLSTATE secret detail")} retry={retry} />);

    expect(screen.getByRole("heading", { name: "Terjadi kesalahan" })).toBeInTheDocument();
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kembali ke Beranda" })).toHaveAttribute("href", "/");

    await user.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("has a standalone root fallback without error details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    // global-error renders its own <html>/<body>; jsdom tolerates the nesting (React's nesting
    // warning is silenced above) and keeps event delegation working.
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<GlobalError error={new Error("layout exploded")} retry={retry} />);

    expect(screen.getByRole("heading", { name: "Terjadi kesalahan" })).toBeInTheDocument();
    expect(screen.queryByText(/layout exploded/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
