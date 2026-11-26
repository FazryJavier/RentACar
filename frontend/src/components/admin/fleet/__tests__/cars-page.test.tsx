import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CarsPage } from "@/components/admin/fleet/cars-page";
import { CURRENT_ADMIN_KEY } from "@/hooks/useCurrentAdmin";
import {
  fail,
  mockApi,
  ok,
  okPage,
  staffFixture,
  superAdminFixture,
} from "../../../../../tests/unit/api-mock";
import { nav } from "../../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../../tests/unit/render-with-providers";
import { carListItem, referenceRoutes } from "./fixtures";

vi.mock("next/navigation", async () =>
  (await import("../../../../../tests/unit/navigation-mock")).navigationModule(),
);

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => nav.reset("/admin/mobil"));

function renderAs(admin: typeof staffFixture | typeof superAdminFixture) {
  const result = renderWithProviders(<CarsPage />);
  result.queryClient.setQueryData(CURRENT_ADMIN_KEY, admin);
  return result;
}

describe("CarsPage", () => {
  it("shows the list columns", async () => {
    mockApi({
      ...referenceRoutes,
      "GET /admin/cars": { status: 200, body: okPage([carListItem]) },
    });
    renderAs(staffFixture);

    const row = (await screen.findByText("Toyota Fortuner 2023")).closest("tr")!;
    expect(within(row).getByText("B 1234 XYZ")).toBeInTheDocument();
    expect(within(row).getByText("SUV")).toBeInTheDocument();
    expect(within(row).getByText("Jakarta Selatan")).toBeInTheDocument();
    expect(within(row).getByText("Rp950.000")).toBeInTheDocument();
    expect(within(row).getByText("Aktif")).toBeInTheDocument();
    expect(within(row).getByLabelText("Punya model 3D")).toBeInTheDocument();
  });

  it("offers the branch filter to Super Admin only", async () => {
    mockApi({
      ...referenceRoutes,
      "GET /admin/cars": { status: 200, body: okPage([carListItem]) },
    });
    const { unmount } = renderAs(staffFixture);
    await screen.findByText("Toyota Fortuner 2023");
    expect(screen.queryByRole("combobox", { name: "Cabang" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status" })).toBeInTheDocument();
    unmount();

    mockApi({
      ...referenceRoutes,
      "GET /admin/me": { status: 200, body: ok(superAdminFixture) },
      "GET /admin/cars": { status: 200, body: okPage([carListItem]) },
    });
    renderAs(superAdminFixture);
    expect(await screen.findByRole("combobox", { name: "Cabang" })).toBeInTheDocument();
  });

  it("opens the create page", async () => {
    mockApi({ ...referenceRoutes, "GET /admin/cars": { status: 200, body: okPage([]) } });
    renderAs(staffFixture);
    await screen.findByText("Belum ada mobil");

    await userEvent.setup().click(screen.getAllByRole("button", { name: "Tambah mobil" })[0]!);

    expect(nav.push).toHaveBeenCalledWith("/admin/mobil/baru");
  });

  it("keeps the delete dialog open with the active-bookings message", async () => {
    mockApi({
      ...referenceRoutes,
      "GET /admin/cars": { status: 200, body: okPage([carListItem]) },
      "DELETE /admin/cars/9": {
        status: 409,
        body: fail(409, "Mobil masih punya 2 pemesanan aktif sehingga belum bisa dihapus.", [
          { field: null, code: "car_has_active_bookings", message: "x", details: { bookings: [] } },
        ]),
      },
    });
    renderAs(staffFixture);
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "Aksi untuk Toyota Fortuner 2023" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Hapus" }));
    const dialog = await screen.findByRole("dialog", { name: "Hapus mobil ini?" });
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    expect(
      await within(dialog).findByText(
        "Mobil masih punya 2 pemesanan aktif sehingga belum bisa dihapus.",
      ),
    ).toBeInTheDocument();
  });
});
