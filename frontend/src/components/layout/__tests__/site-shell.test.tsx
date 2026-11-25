import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteShell } from "@/components/layout/site-shell";
import { mockFetchJson, renderWithProviders } from "../../../../tests/unit/render-with-providers";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

beforeEach(() => {
  window.sessionStorage.clear();
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
});

describe("SiteShell", () => {
  it("renders skip link, banner, header, main and footer in order", () => {
    renderWithProviders(
      <SiteShell>
        <p>Isi halaman</p>
      </SiteShell>,
    );
    const order = [
      screen.getByRole("link", { name: "Lewati ke konten" }),
      screen.getByRole("region", { name: "Pemberitahuan demo" }),
      screen.getByRole("banner"),
      screen.getByRole("main"),
      screen.getByRole("contentinfo"),
    ];

    for (let i = 1; i < order.length; i += 1) {
      expect(
        order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    expect(screen.getByRole("main")).toHaveTextContent("Isi halaman");
  });

  it("focuses the skip link first and targets main#konten", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SiteShell>
        <p>Isi</p>
      </SiteShell>,
    );

    await user.tab();
    const skip = screen.getByRole("link", { name: "Lewati ke konten" });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute("href", "#konten");
    expect(screen.getByRole("main")).toHaveAttribute("id", "konten");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });
});
