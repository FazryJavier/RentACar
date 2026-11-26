import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrandsPage } from "@/components/admin/master-data/brands-page";
import { fail, mockApi, ok, okPage } from "../../../../../tests/unit/api-mock";
import { nav } from "../../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../../tests/unit/render-with-providers";
import { brandFixture } from "./fixtures";

vi.mock("next/navigation", async () =>
  (await import("../../../../../tests/unit/navigation-mock")).navigationModule(),
);

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => nav.reset("/admin/merek"));

describe("BrandsPage list", () => {
  it("shows skeleton rows, then the brands with the range text", async () => {
    mockApi({ "GET /admin/brands": { status: 200, body: okPage([brandFixture]) } });
    const { container } = renderWithProviders(<BrandsPage />);

    expect(container.querySelectorAll("tbody tr").length).toBe(5);
    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 1–1 dari 1")).toBeInTheDocument();
  });

  it("reads list state from the URL", async () => {
    nav.reset("/admin/merek", "page=2&sort=-name&q=to");
    const calls = mockApi({
      "GET /admin/brands?page=2&sort=-name&q=to": {
        status: 200,
        body: okPage([brandFixture], { page: 2, total: 26 }),
      },
    });
    renderWithProviders(<BrandsPage />);

    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    expect(calls[0]!.key).toBe("GET /admin/brands?page=2&sort=-name&q=to");
    expect(screen.getByRole("columnheader", { name: /Nama/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    expect(screen.getByLabelText("Cari merek")).toHaveValue("to");
  });

  it("toggles sort through the URL", async () => {
    mockApi({ "GET /admin/brands": { status: 200, body: okPage([brandFixture]) } });
    renderWithProviders(<BrandsPage />);
    await screen.findByText("Toyota");

    expect(screen.getByRole("columnheader", { name: /Nama/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByRole("columnheader", { name: /Diubah/ })).toHaveAttribute(
      "aria-sort",
      "none",
    );
    await userEvent.setup().click(screen.getByRole("button", { name: /Nama/ }));

    expect(nav.replace).toHaveBeenCalledWith("/admin/merek?sort=-name", { scroll: false });
  });

  it("debounces search, skips one-character terms and resets the page", async () => {
    nav.reset("/admin/merek", "page=3");
    mockApi({ "GET /admin/brands?page=3": { status: 200, body: okPage([brandFixture]) } });
    renderWithProviders(<BrandsPage />);
    await screen.findByText("Toyota");
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Cari merek"), "t");
    expect(screen.getByText("Minimal 2 karakter")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(nav.replace).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Cari merek"), "o");
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith("/admin/merek?q=to", { scroll: false }),
    );
    expect(nav.replace).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state", async () => {
    mockApi({ "GET /admin/brands": { status: 200, body: okPage([]) } });
    renderWithProviders(<BrandsPage />);

    expect(await screen.findByText("Belum ada merek")).toBeInTheDocument();
  });

  it("shows an error with a retry", async () => {
    const calls = mockApi({
      "GET /admin/brands": [
        { status: 500, body: fail(500, "Terjadi kesalahan pada server.") },
        { status: 200, body: okPage([brandFixture]) },
      ],
    });
    renderWithProviders(<BrandsPage />);

    await userEvent.setup().click(await screen.findByRole("button", { name: "Coba lagi" }));

    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    expect(calls).toHaveLength(2);
  });
});

describe("BrandsPage form", () => {
  it("creates a brand, shows a toast and refetches the list", async () => {
    const calls = mockApi({
      "GET /admin/brands": { status: 200, body: okPage([]) },
      "POST /admin/brands": { status: 201, body: ok(brandFixture) },
    });
    renderWithProviders(<BrandsPage />);
    const user = userEvent.setup();
    await screen.findByText("Belum ada merek");

    await user.click(screen.getAllByRole("button", { name: "Tambah merek" })[0]!);
    const sheet = await screen.findByRole("dialog", { name: "Tambah merek" });
    await user.type(within(sheet).getByLabelText(/Nama merek/), "Toyota");
    await user.click(within(sheet).getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Merek disimpan")).toBeInTheDocument();
    expect(calls.find((call) => call.key === "POST /admin/brands")?.body).toEqual({
      name: "Toyota",
    });
    await waitFor(() =>
      expect(calls.filter((call) => call.key === "GET /admin/brands")).toHaveLength(2),
    );
    expect(screen.queryByRole("dialog", { name: "Tambah merek" })).not.toBeInTheDocument();
  });

  it("validates the name on the client", async () => {
    mockApi({ "GET /admin/brands": { status: 200, body: okPage([]) } });
    renderWithProviders(<BrandsPage />);
    const user = userEvent.setup();
    await screen.findByText("Belum ada merek");

    await user.click(screen.getAllByRole("button", { name: "Tambah merek" })[0]!);
    await user.click(await screen.findByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Nama merek 2–60 karakter")).toBeInTheDocument();
  });

  it("puts a duplicate-name error on the field", async () => {
    mockApi({
      "GET /admin/brands": { status: 200, body: okPage([]) },
      "POST /admin/brands": {
        status: 422,
        body: fail(422, "Data tidak valid.", [
          { field: "name", code: "not_unique", message: "Nama merek sudah ada" },
        ]),
      },
    });
    renderWithProviders(<BrandsPage />);
    const user = userEvent.setup();
    await screen.findByText("Belum ada merek");

    await user.click(screen.getAllByRole("button", { name: "Tambah merek" })[0]!);
    await user.type(await screen.findByLabelText(/Nama merek/), "Toyota");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Nama merek sudah ada")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama merek/)).toHaveFocus();
  });

  it("sends the version on edit and offers a reload after a conflict", async () => {
    const calls = mockApi({
      "GET /admin/brands": { status: 200, body: okPage([brandFixture]) },
      "PATCH /admin/brands/4": {
        status: 409,
        body: fail(409, "Data sudah diubah admin lain. Muat ulang lalu coba lagi.", [
          { field: "version", code: "version_conflict", message: "x" },
        ]),
      },
      "GET /admin/brands/4": {
        status: 200,
        body: ok({ ...brandFixture, name: "Toyota Baru", version: 3 }),
      },
    });
    renderWithProviders(<BrandsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Aksi untuk Toyota" }));
    await user.click(await screen.findByRole("menuitem", { name: "Ubah" }));
    const name = await screen.findByLabelText(/Nama merek/);
    await user.clear(name);
    await user.type(name, "Toyota Indonesia");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Data sudah diubah admin lain.")).toBeInTheDocument();
    expect(calls.find((call) => call.key === "PATCH /admin/brands/4")?.body).toEqual({
      name: "Toyota Indonesia",
      version: 2,
    });

    await user.click(screen.getByRole("button", { name: "Muat ulang" }));
    await waitFor(() => expect(screen.getByLabelText(/Nama merek/)).toHaveValue("Toyota Baru"));
    expect(screen.queryByText("Data sudah diubah admin lain.")).not.toBeInTheDocument();
  });

  it("uploads a logo after saving the name", async () => {
    const calls = mockApi({
      "GET /admin/brands": { status: 200, body: okPage([]) },
      "POST /admin/brands": { status: 201, body: ok(brandFixture) },
      "POST /admin/brands/4/logo": {
        status: 200,
        body: ok({ ...brandFixture, logo_url: "/storage/brands/a.png" }),
      },
    });
    const { container } = renderWithProviders(<BrandsPage />);
    const user = userEvent.setup();
    await screen.findByText("Belum ada merek");

    await user.click(screen.getAllByRole("button", { name: "Tambah merek" })[0]!);
    await user.type(await screen.findByLabelText(/Nama merek/), "Toyota");
    const input = container.ownerDocument.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File(["png"], "logo.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Merek disimpan")).toBeInTheDocument();
    const upload = calls.find((call) => call.key === "POST /admin/brands/4/logo");
    expect(upload?.body).toBeInstanceOf(FormData);
    expect((upload?.body as FormData).get("logo")).toBeInstanceOf(File);
  });
});

describe("BrandsPage delete", () => {
  it("keeps the dialog open with the in-use message", async () => {
    mockApi({
      "GET /admin/brands": { status: 200, body: okPage([brandFixture]) },
      "DELETE /admin/brands/4": {
        status: 409,
        body: fail(409, "Merek masih dipakai 3 mobil.", [
          { field: null, code: "resource_in_use", message: "x", details: { usage: { cars: 3 } } },
        ]),
      },
    });
    renderWithProviders(<BrandsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Aksi untuk Toyota" }));
    await user.click(await screen.findByRole("menuitem", { name: "Hapus" }));
    const dialog = await screen.findByRole("dialog", { name: "Hapus merek ini?" });
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    expect(await within(dialog).findByText("Merek masih dipakai 3 mobil.")).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
  });

  it("deletes, closes the dialog and shows a toast", async () => {
    mockApi({
      "GET /admin/brands": { status: 200, body: okPage([brandFixture]) },
      "DELETE /admin/brands/4": { status: 200, body: ok(null) },
    });
    renderWithProviders(<BrandsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Aksi untuk Toyota" }));
    await user.click(await screen.findByRole("menuitem", { name: "Hapus" }));
    const dialog = await screen.findByRole("dialog", { name: "Hapus merek ini?" });
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    expect(await screen.findByText("Merek dihapus")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Hapus merek ini?" })).not.toBeInTheDocument(),
    );
  });

  it("sends an expired session to the admin login", async () => {
    mockApi({
      "GET /admin/brands": { status: 200, body: okPage([brandFixture]) },
      "DELETE /admin/brands/4": { status: 401, body: fail(401, "Silakan masuk.") },
    });
    renderWithProviders(<BrandsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Aksi untuk Toyota" }));
    await user.click(await screen.findByRole("menuitem", { name: "Hapus" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Hapus" }),
    );

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/admin/masuk"));
  });
});
