import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BranchesPage } from "@/components/admin/master-data/branches-page";
import { CURRENT_ADMIN_KEY } from "@/hooks/useCurrentAdmin";
import {
  mockApi,
  ok,
  okPage,
  staffFixture,
  superAdminFixture,
} from "../../../../../tests/unit/api-mock";
import { nav } from "../../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../../tests/unit/render-with-providers";
import { branchFixture } from "./fixtures";

vi.mock("next/navigation", async () =>
  (await import("../../../../../tests/unit/navigation-mock")).navigationModule(),
);

// Leaflet needs a real layout engine; the map is replaced by a button that "clicks" a point.
vi.mock("@/components/admin/master-data/branch-map", () => ({
  default: ({ onChange }: { onChange?: (value: { lat: number; lng: number }) => void }) => (
    <button type="button" onClick={() => onChange?.({ lat: -6.3123456, lng: 106.9 })}>
      Titik peta
    </button>
  ),
}));

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => nav.reset("/admin/cabang"));

function renderAs(admin: typeof superAdminFixture | typeof staffFixture) {
  const result = renderWithProviders(<BranchesPage />);
  result.queryClient.setQueryData(CURRENT_ADMIN_KEY, admin);
  return result;
}

describe("BranchesPage for Staf", () => {
  it("is read-only: no add, edit or delete, only a detail panel", async () => {
    mockApi({
      "GET /admin/me": { status: 200, body: ok(staffFixture) },
      "GET /admin/branches": { status: 200, body: okPage([branchFixture]) },
    });
    renderAs(staffFixture);
    const user = userEvent.setup();

    expect(await screen.findByText("Jakarta Selatan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tambah cabang" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aksi untuk Jakarta Selatan" }));
    expect(screen.queryByRole("menuitem", { name: "Ubah" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Hapus" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("menuitem", { name: "Lihat detail" }));

    const panel = await screen.findByRole("dialog", { name: "Jakarta Selatan" });
    expect(within(panel).getByText("07.00–21.00 WIB")).toBeInTheDocument();
    expect(within(panel).getByText("-6.260000, 106.800000")).toBeInTheDocument();
    expect(within(panel).queryByRole("textbox")).not.toBeInTheDocument();
  });
});

describe("BranchesPage for Super Admin", () => {
  it("filters by status and city through the URL", async () => {
    mockApi({
      "GET /admin/me": { status: 200, body: ok(superAdminFixture) },
      "GET /admin/branches": { status: 200, body: okPage([branchFixture]) },
    });
    renderAs(superAdminFixture);
    const user = userEvent.setup();
    await screen.findByText("Jakarta Selatan");

    await user.type(screen.getByLabelText("Kota"), "Bandung{Enter}");
    expect(nav.replace).toHaveBeenCalledWith("/admin/cabang?filter%5Bcity%5D=Bandung", {
      scroll: false,
    });
  });

  it("creates a branch with coordinates from the map", async () => {
    const calls = mockApi({
      "GET /admin/me": { status: 200, body: ok(superAdminFixture) },
      "GET /admin/branches": { status: 200, body: okPage([]) },
      "POST /admin/branches": { status: 201, body: ok(branchFixture) },
    });
    renderAs(superAdminFixture);
    const user = userEvent.setup();
    await screen.findByText("Belum ada cabang");

    await user.click(screen.getAllByRole("button", { name: "Tambah cabang" })[0]!);
    const sheet = await screen.findByRole("dialog", { name: "Tambah cabang" });
    await user.type(within(sheet).getByLabelText(/Nama cabang/), "Bekasi");
    await user.type(within(sheet).getByLabelText(/Alamat/), "Jl. Ahmad Yani 5");
    await user.type(within(sheet).getByLabelText(/Kota/), "Bekasi");
    await user.type(within(sheet).getByLabelText(/Telepon/), "+62 21 8880 001");
    await user.click(await within(sheet).findByRole("button", { name: "Titik peta" }));

    expect(within(sheet).getByLabelText(/Latitude/)).toHaveValue("-6.312346");
    expect(within(sheet).getByLabelText(/Longitude/)).toHaveValue("106.900000");
    await user.click(within(sheet).getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Cabang disimpan")).toBeInTheDocument();
    await waitFor(() =>
      expect(calls.find((call) => call.key === "POST /admin/branches")?.body).toEqual({
        name: "Bekasi",
        address: "Jl. Ahmad Yani 5",
        city: "Bekasi",
        phone: "+62 21 8880 001",
        opening_time: "07:00",
        closing_time: "21:00",
        latitude: -6.312346,
        longitude: 106.9,
        is_active: true,
      }),
    );
  });

  it("requires closing after opening and valid coordinates", async () => {
    mockApi({
      "GET /admin/me": { status: 200, body: ok(superAdminFixture) },
      "GET /admin/branches": { status: 200, body: okPage([branchFixture]) },
    });
    renderAs(superAdminFixture);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Aksi untuk Jakarta Selatan" }));
    await user.click(await screen.findByRole("menuitem", { name: "Ubah" }));
    const sheet = await screen.findByRole("dialog", { name: "Ubah cabang" });
    const closing = within(sheet).getByLabelText(/Jam tutup/);
    await user.clear(closing);
    await user.type(closing, "06:00");
    const latitude = within(sheet).getByLabelText(/Latitude/);
    await user.clear(latitude);
    await user.type(latitude, "95");
    await user.click(within(sheet).getByRole("button", { name: "Simpan" }));

    expect(await within(sheet).findByText("Jam tutup harus setelah jam buka")).toBeInTheDocument();
    expect(within(sheet).getByText("Latitude antara -90 dan 90")).toBeInTheDocument();
  });
});
