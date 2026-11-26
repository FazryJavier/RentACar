import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CarEditor } from "@/components/admin/fleet/car-editor";
import { fail, mockApi, ok, staffFixture } from "../../../../../tests/unit/api-mock";
import { nav } from "../../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../../tests/unit/render-with-providers";
import { carFixture, photo, referenceRoutes } from "./fixtures";

vi.mock("next/navigation", async () =>
  (await import("../../../../../tests/unit/navigation-mock")).navigationModule(),
);

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => nav.reset("/admin/mobil/baru"));

const me = { "GET /admin/me": { status: 200, body: ok(staffFixture) } };

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  screen.getByRole("combobox", { name: label }).focus();
  await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("CarEditor — create", () => {
  it("validates on the client without sending", async () => {
    const calls = mockApi({ ...referenceRoutes, ...me });
    renderWithProviders(<CarEditor id={null} />);
    const user = userEvent.setup();

    const seats = await screen.findByLabelText(/^Kursi/);
    await user.clear(seats);
    await user.type(seats, "20");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Kursi 2–16")).toBeInTheDocument();
    expect(calls.some((call) => call.key === "POST /admin/cars")).toBe(false);
  });

  it("shows the Staf branch read-only and keeps Foto disabled", async () => {
    mockApi({ ...referenceRoutes, ...me });
    renderWithProviders(<CarEditor id={null} />);

    expect(await screen.findByText("Jakarta Selatan")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Cabang" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Foto" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Model 3D & Kondisi" })).toBeDisabled();
  });

  it("creates the car and switches to its edit URL", async () => {
    const calls = mockApi({
      ...referenceRoutes,
      ...me,
      "POST /admin/cars": { status: 201, body: ok(carFixture) },
    });
    renderWithProviders(<CarEditor id={null} />);
    const user = userEvent.setup();
    await screen.findByText("Jakarta Selatan");

    await choose(user, "Merek", "Toyota");
    await choose(user, "Kategori", "SUV");
    await user.type(screen.getByLabelText(/^Model/), "Fortuner");
    await user.type(screen.getByLabelText(/^Warna/), "Hitam");
    await user.type(screen.getByLabelText(/^Plat nomor/), "b 1234 xyz");
    await user.type(screen.getByLabelText(/^Fasilitas/), "AC{Enter}");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/admin/mobil/9"));
    expect(await screen.findByText("Mobil disimpan")).toBeInTheDocument();
    const body = calls.find((call) => call.key === "POST /admin/cars")?.body as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      brand_id: 1,
      category_id: 2,
      model_name: "Fortuner",
      plate_number: "b 1234 xyz",
      features: ["AC"],
    });
    expect(body).not.toHaveProperty("branch_id");
  });

  it("puts a duplicate plate error on the field", async () => {
    mockApi({
      ...referenceRoutes,
      ...me,
      "POST /admin/cars": {
        status: 422,
        body: fail(422, "Data tidak valid.", [
          {
            field: "plate_number",
            code: "not_unique",
            message: "Plat nomor sudah dipakai mobil lain",
          },
        ]),
      },
    });
    renderWithProviders(<CarEditor id={null} />);
    const user = userEvent.setup();
    await screen.findByText("Jakarta Selatan");

    await choose(user, "Merek", "Toyota");
    await choose(user, "Kategori", "SUV");
    await user.type(screen.getByLabelText(/^Model/), "Fortuner");
    await user.type(screen.getByLabelText(/^Warna/), "Hitam");
    await user.type(screen.getByLabelText(/^Plat nomor/), "B 1234 XYZ");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Plat nomor sudah dipakai mobil lain")).toBeInTheDocument();
  });
});

describe("CarEditor — edit", () => {
  beforeEach(() => nav.reset("/admin/mobil/9"));

  it("loads the car and offers reload after a version conflict", async () => {
    mockApi({
      ...referenceRoutes,
      ...me,
      "GET /admin/cars/9": [
        { status: 200, body: ok(carFixture) },
        { status: 200, body: ok({ ...carFixture, color: "Putih", version: 3 }) },
      ],
      "PATCH /admin/cars/9": {
        status: 409,
        body: fail(409, "Data sudah diubah admin lain. Muat ulang lalu coba lagi.", [
          { field: "version", code: "version_conflict", message: "x" },
        ]),
      },
    });
    renderWithProviders(<CarEditor id={9} />);
    const user = userEvent.setup();

    expect(
      await screen.findByRole("heading", { name: "Toyota Fortuner 2023", level: 2 }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Simpan" }));
    await user.click(await screen.findByRole("button", { name: "Muat ulang" }));

    await waitFor(() => expect(screen.getByLabelText(/^Warna/)).toHaveValue("Putih"));
  });

  it("asks for a reason and force-cancels blocking bookings", async () => {
    const calls = mockApi({
      ...referenceRoutes,
      ...me,
      "GET /admin/cars/9": { status: 200, body: ok(carFixture) },
      "PATCH /admin/cars/9": [
        {
          status: 409,
          body: fail(409, "Mobil masih punya 1 pemesanan aktif.", [
            {
              field: null,
              code: "car_has_active_bookings",
              message: "x",
              details: {
                bookings: [
                  {
                    code: "RAC-261201-ABCD",
                    status: "confirmed",
                    pickup_at: "2026-12-01T02:00:00Z",
                  },
                ],
              },
            },
          ]),
        },
        { status: 200, body: ok({ ...carFixture, status: "maintenance", version: 3 }) },
      ],
    });
    renderWithProviders(<CarEditor id={9} />);
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Toyota Fortuner 2023", level: 2 });
    await choose(user, "Status", "Perawatan");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    const dialog = await screen.findByRole("dialog", {
      name: "Status mobil memengaruhi pemesanan",
    });
    expect(within(dialog).getByText("RAC-261201-ABCD")).toBeInTheDocument();
    expect(within(dialog).getByText(/Sel, 1 Des 2026 · 09\.00 WIB/)).toBeInTheDocument();
    expect(within(dialog).getByText("Dikonfirmasi")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Tetap ubah" }));
    expect(
      await within(dialog).findByText("Tulis alasan pembatalan (5–300 karakter)"),
    ).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Alasan pembatalan/), "Mobil masuk bengkel");
    await user.click(within(dialog).getByRole("button", { name: "Tetap ubah" }));

    expect(await screen.findByText("Mobil disimpan")).toBeInTheDocument();
    const patches = calls.filter((call) => call.key === "PATCH /admin/cars/9");
    expect(patches[1]?.body).toMatchObject({
      status: "maintenance",
      version: 2,
      force_cancel_bookings: true,
      cancel_reason: "Mobil masuk bengkel",
    });
  });

  it("offers no force option while the car is rented", async () => {
    mockApi({
      ...referenceRoutes,
      ...me,
      "GET /admin/cars/9": { status: 200, body: ok(carFixture) },
      "PATCH /admin/cars/9": {
        status: 409,
        body: fail(409, "Mobil sedang disewa sehingga statusnya belum bisa diubah.", [
          {
            field: null,
            code: "car_has_active_bookings",
            message: "x",
            details: {
              bookings: [{ code: "RAC-1", status: "ongoing", pickup_at: "2026-11-26T02:00:00Z" }],
            },
          },
        ]),
      },
    });
    renderWithProviders(<CarEditor id={9} />);
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Toyota Fortuner 2023", level: 2 });
    await choose(user, "Status", "Nonaktif");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    const dialog = await screen.findByRole("dialog", { name: "Mobil sedang disewa" });
    expect(within(dialog).queryByRole("button", { name: "Tetap ubah" })).not.toBeInTheDocument();
  });

  it("replaces a processing photo once the server has processed it", async () => {
    mockApi({
      ...referenceRoutes,
      ...me,
      "GET /admin/cars/9": [
        { status: 200, body: ok({ ...carFixture, photos: [photo(1, 0, true)] }) },
        { status: 200, body: ok({ ...carFixture, photos: [photo(1, 0)] }) },
      ],
    });
    renderWithProviders(<CarEditor id={9} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("tab", { name: "Foto (1)" }));
    expect(screen.getByText("Memproses…")).toBeInTheDocument();

    expect(
      await screen.findByRole("img", { name: "Foto 1" }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it("shows a not-found state", async () => {
    mockApi({
      ...referenceRoutes,
      ...me,
      "GET /admin/cars/9": { status: 404, body: fail(404, "Tidak ditemukan.") },
    });
    renderWithProviders(<CarEditor id={9} />);

    expect(await screen.findByText("Mobil tidak ditemukan")).toBeInTheDocument();
  });
});
