import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/layout/header";
import { mockFetchJson, renderWithProviders } from "../../../../tests/unit/render-with-providers";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const guest = {
  code: 401,
  success: false,
  message: "Silakan masuk.",
  data: null,
  errors: [],
  meta: null,
};

beforeEach(() => {
  navigation.pathname = "/";
  vi.stubGlobal("fetch", mockFetchJson(401, guest));
  window.scrollY = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function scrollTo(y: number) {
  act(() => {
    window.scrollY = y;
    window.dispatchEvent(new Event("scroll"));
  });
}

function desktopNav() {
  return screen.getAllByRole("navigation", { name: "Menu utama" })[0]!;
}

describe("Header", () => {
  it("shows the logo, menu items, Sewa Sekarang and Masuk", async () => {
    renderWithProviders(<Header />);
    const nav = desktopNav();

    expect(screen.getByRole("link", { name: "RentACar — Beranda" })).toHaveAttribute("href", "/");
    for (const [label, href] of [
      ["Beranda", "/"],
      ["Armada", "/armada"],
      ["Tentang Kami", "/tentang-kami"],
      ["Cabang", "/cabang"],
      ["FAQ", "/faq"],
    ]) {
      expect(within(nav).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
    expect(screen.getByRole("link", { name: "Sewa Sekarang" })).toHaveAttribute("href", "/armada");
    expect(await screen.findByRole("link", { name: "Masuk" })).toHaveAttribute("href", "/masuk");
  });

  it("marks the section of a nested path as current", () => {
    navigation.pathname = "/armada/toyota-avanza";
    renderWithProviders(<Header />);
    const nav = desktopNav();

    expect(within(nav).getByRole("link", { name: "Armada" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Beranda" })).not.toHaveAttribute("aria-current");
    expect(
      within(nav)
        .getAllByRole("link")
        .filter((link) => link.hasAttribute("aria-current")),
    ).toHaveLength(1);
  });

  it("turns solid on the home page only after scrolling past 24px", () => {
    renderWithProviders(<Header />);
    const header = screen.getByRole("banner");

    expect(header).toHaveAttribute("data-solid", "false");
    scrollTo(24);
    expect(header).toHaveAttribute("data-solid", "false");
    scrollTo(25);
    expect(header).toHaveAttribute("data-solid", "true");
    expect(header.className).toContain("shadow-md");
  });

  it("is always solid on other pages", () => {
    navigation.pathname = "/faq";
    renderWithProviders(<Header />);

    expect(screen.getByRole("banner")).toHaveAttribute("data-solid", "true");
  });

  it("shows the signed-in customer's first name", async () => {
    const customer = { id: 7, name: "Budi Santoso", email: "budi@example.test" };
    vi.stubGlobal(
      "fetch",
      mockFetchJson(200, {
        code: 200,
        success: true,
        message: "OK",
        data: customer,
        errors: null,
        meta: null,
      }),
    );
    renderWithProviders(<Header />);

    const account = await screen.findByRole("link", { name: "Akun Budi" });
    expect(account).toHaveAttribute("href", "/profil");
    expect(screen.queryByRole("link", { name: "Masuk" })).not.toBeInTheDocument();
  });
});

describe("MobileMenu", () => {
  it("opens a modal menu, traps focus and closes with Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);
    const toggle = screen.getByRole("button", { name: "Buka menu" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    for (let i = 0; i < 12; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(toggle).toHaveFocus());
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the active item and closes when a link is used", async () => {
    const user = userEvent.setup();
    navigation.pathname = "/faq";
    renderWithProviders(<Header />);

    await user.click(screen.getByRole("button", { name: "Buka menu" }));
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    expect(within(dialog).getByRole("link", { name: "FAQ" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(within(dialog).getByRole("link", { name: "Cabang" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
