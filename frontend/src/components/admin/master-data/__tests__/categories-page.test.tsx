import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CategoriesPage } from "@/components/admin/master-data/categories-page";
import { mockApi, ok, okPage } from "../../../../../tests/unit/api-mock";
import { nav } from "../../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../../tests/unit/render-with-providers";
import { categoryFixture } from "./fixtures";

vi.mock("next/navigation", async () =>
  (await import("../../../../../tests/unit/navigation-mock")).navigationModule(),
);

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => nav.reset("/admin/kategori"));

describe("CategoriesPage", () => {
  it("lists categories sorted by order by default", async () => {
    mockApi({ "GET /admin/categories": { status: 200, body: okPage([categoryFixture]) } });
    renderWithProviders(<CategoriesPage />);

    expect(await screen.findByText("SUV")).toBeInTheDocument();
    expect(screen.getByText("Mobil tinggi")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Urutan/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("rejects an order outside 0–999", async () => {
    mockApi({ "GET /admin/categories": { status: 200, body: okPage([]) } });
    renderWithProviders(<CategoriesPage />);
    const user = userEvent.setup();
    await screen.findByText("Belum ada kategori");

    await user.click(screen.getAllByRole("button", { name: "Tambah kategori" })[0]!);
    await user.type(await screen.findByLabelText(/Nama kategori/), "MPV");
    const order = screen.getByLabelText(/Urutan/);
    await user.clear(order);
    await user.type(order, "1000");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Urutan harus angka 0–999")).toBeInTheDocument();
  });

  it("sends an empty description as null and the version on edit", async () => {
    const calls = mockApi({
      "GET /admin/categories": { status: 200, body: okPage([categoryFixture]) },
      "PATCH /admin/categories/5": {
        status: 200,
        body: ok({ ...categoryFixture, description: null, version: 2 }),
      },
    });
    renderWithProviders(<CategoriesPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Aksi untuk SUV" }));
    await user.click(await screen.findByRole("menuitem", { name: "Ubah" }));
    await user.clear(await screen.findByLabelText(/Deskripsi/));
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Kategori disimpan")).toBeInTheDocument();
    await waitFor(() =>
      expect(calls.find((call) => call.key === "PATCH /admin/categories/5")?.body).toEqual({
        name: "SUV",
        description: null,
        sort_order: 1,
        version: 1,
      }),
    );
  });
});
