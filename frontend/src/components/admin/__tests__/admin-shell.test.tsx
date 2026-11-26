import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminShell, SIDEBAR_COLLAPSED_KEY } from "@/components/admin/admin-shell";
import { RequireAdmin } from "@/components/admin/require-admin";
import { AdminWelcome } from "@/components/admin/welcome";
import { CURRENT_ADMIN_KEY } from "@/hooks/useCurrentAdmin";
import {
  fail,
  mockApi,
  ok,
  staffFixture,
  superAdminFixture,
} from "../../../../tests/unit/api-mock";
import { nav } from "../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../tests/unit/render-with-providers";

vi.mock("next/navigation", async () =>
  (await import("../../../../tests/unit/navigation-mock")).navigationModule(),
);

beforeEach(() => {
  nav.reset("/admin/mobil/12");
  window.localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderShell(admin: unknown) {
  mockApi({
    "GET /admin/me": { status: 200, body: ok(admin) },
    "POST /admin/auth/logout": { status: 200, body: ok(null) },
  });
  return renderWithProviders(
    <AdminShell>
      <p>Isi</p>
    </AdminShell>,
  );
}

function sidebar() {
  return screen.getAllByRole("navigation", { name: "Menu admin" })[0]!;
}

describe("AdminShell", () => {
  it("renders its children before the session is known", async () => {
    renderShell(staffFixture);

    expect(screen.getByText("Isi")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Menu admin" })).not.toBeInTheDocument();
    await screen.findAllByRole("navigation", { name: "Menu admin" });
  });

  it("shows only the Staf menus and marks the active section", async () => {
    renderShell(staffFixture);

    await screen.findAllByRole("navigation", { name: "Menu admin" });
    const labels = within(sidebar())
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual([
      "Dashboard",
      "Pemesanan",
      "Pembayaran",
      "Mobil",
      "Merek",
      "Kategori",
      "Pelanggan",
    ]);
    expect(within(sidebar()).getByRole("link", { name: "Mobil" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(sidebar()).queryByRole("link", { name: "Cabang" })).not.toBeInTheDocument();
  });

  it("shows every menu to a Super Admin", async () => {
    renderShell(superAdminFixture);

    await screen.findAllByRole("navigation", { name: "Menu admin" });
    expect(within(sidebar()).getByRole("link", { name: "Log Audit" })).toHaveAttribute(
      "href",
      "/admin/log-audit",
    );
    expect(within(sidebar()).getAllByRole("link")).toHaveLength(10);
  });

  it("shows the branch and role in the topbar for Staf", async () => {
    renderShell(staffFixture);

    expect(await screen.findByText("Cabang: Jakarta Selatan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Akun Sari, Staf" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Mobil" })).toBeInTheDocument();
  });

  it("collapses the sidebar, keeps accessible names and remembers it", async () => {
    const user = userEvent.setup();
    renderShell(staffFixture);
    await screen.findAllByRole("navigation", { name: "Menu admin" });

    await user.click(screen.getByRole("button", { name: "Ciutkan sidebar" }));

    expect(screen.getByRole("button", { name: "Bentangkan sidebar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(sidebar()).getByRole("link", { name: "Mobil" })).toBeInTheDocument();
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("1");
  });

  it("still collapses when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    mockApi({ "GET /admin/me": { status: 200, body: ok(staffFixture) } });
    const user = userEvent.setup();
    renderWithProviders(
      <AdminShell>
        <p>Isi</p>
      </AdminShell>,
    );
    await screen.findAllByRole("navigation", { name: "Menu admin" });

    // The in-memory fallback may still hold an earlier test's value: assert that the toggle flips.
    const toggle = screen.getByRole("button", { name: /sidebar$/ });
    const before = toggle.getAttribute("aria-pressed");
    await user.click(toggle);

    expect(screen.getByRole("button", { name: /sidebar$/ }).getAttribute("aria-pressed")).not.toBe(
      before,
    );
  });

  it("opens the menu drawer, closes it with Escape and returns focus", async () => {
    const user = userEvent.setup();
    renderShell(staffFixture);
    const toggle = await screen.findByRole("button", { name: "Buka menu admin" });

    await user.click(toggle);
    const drawer = await screen.findByRole("dialog", { name: "Menu admin" });
    expect(within(drawer).getByRole("link", { name: "Pelanggan" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(toggle).toHaveFocus());
  });

  it("logs out from the account menu", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderShell(superAdminFixture);

    await user.click(await screen.findByRole("button", { name: "Akun Budi, Super Admin" }));
    await user.click(await screen.findByRole("menuitem", { name: "Keluar" }));

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/admin/masuk"));
    expect(queryClient.getQueryData(CURRENT_ADMIN_KEY)).toBeNull();
  });
});

describe("RequireAdmin", () => {
  it("follows a deliberate logout to the plain login page", async () => {
    const { markLogout } = await import("@/lib/logout-intent");
    nav.reset("/admin/mobil");
    mockApi({
      "GET /admin/me": { status: 401, body: fail(401, "Silakan masuk terlebih dahulu.") },
    });
    markLogout("/admin/masuk");
    renderWithProviders(
      <RequireAdmin>
        <p>Rahasia</p>
      </RequireAdmin>,
    );

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/admin/masuk"));
  });

  it("redirects to the admin login when /admin/me is 401", async () => {
    nav.reset("/admin/profil");
    mockApi({
      "GET /admin/me": { status: 401, body: fail(401, "Silakan masuk terlebih dahulu.") },
    });
    renderWithProviders(
      <RequireAdmin>
        <p>Rahasia</p>
      </RequireAdmin>,
    );

    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith("/admin/masuk?next=%2Fadmin%2Fprofil"),
    );
    expect(screen.queryByText("Rahasia")).not.toBeInTheDocument();
  });
});

describe("AdminWelcome", () => {
  it("greets Staf with role, branch and their quick links", async () => {
    mockApi({ "GET /admin/me": { status: 200, body: ok(staffFixture) } });
    renderWithProviders(<AdminWelcome />);

    expect(await screen.findByRole("heading", { name: "Halo, Sari" })).toBeInTheDocument();
    expect(screen.getByText("Staf · Cabang Jakarta Selatan")).toBeInTheDocument();
    const links = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(links).toEqual([
      "/admin/pemesanan",
      "/admin/pembayaran",
      "/admin/mobil",
      "/admin/merek",
      "/admin/kategori",
      "/admin/pelanggan",
    ]);
  });
});
