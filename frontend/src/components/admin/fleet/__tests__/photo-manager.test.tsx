import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoManager } from "@/components/admin/fleet/photo-manager";
import { fail, mockApi, ok } from "../../../../../tests/unit/api-mock";
import { nav } from "../../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../../tests/unit/render-with-providers";
import { carFixture, photo } from "./fixtures";

vi.mock("next/navigation", async () =>
  (await import("../../../../../tests/unit/navigation-mock")).navigationModule(),
);

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => nav.reset("/admin/mobil/9"));

const image = (name: string) => new File(["x"], name, { type: "image/jpeg" });

describe("PhotoManager", () => {
  it("uploads files one by one and stops at five photos", async () => {
    const calls = mockApi({
      "POST /admin/cars/9/photos": { status: 201, body: ok(photo(10, 3, true)) },
    });
    const car = { ...carFixture, photos: [photo(1, 0), photo(2, 1), photo(3, 2)] };
    renderWithProviders(<PhotoManager car={car} />);
    const user = userEvent.setup();

    await user.upload(screen.getByTestId("file-dropzone-input"), [
      image("a.jpg"),
      image("b.jpg"),
      image("c.jpg"),
    ]);

    expect(await screen.findByText("c.jpg: Maksimal 5 foto")).toBeInTheDocument();
    await waitFor(() =>
      expect(calls.filter((call) => call.key === "POST /admin/cars/9/photos")).toHaveLength(2),
    );
    expect((calls[0]?.body as FormData).get("photo")).toBeInstanceOf(File);
  });

  it("shows a per-file server error", async () => {
    mockApi({
      "POST /admin/cars/9/photos": {
        status: 422,
        body: fail(422, "Data tidak valid.", [
          { field: "photo", code: "invalid_file_type", message: "Foto harus JPG, PNG, atau WebP" },
        ]),
      },
    });
    renderWithProviders(<PhotoManager car={carFixture} />);

    await userEvent.setup().upload(screen.getByTestId("file-dropzone-input"), image("rusak.jpg"));

    expect(
      await screen.findByText("rusak.jpg: Foto harus JPG, PNG, atau WebP"),
    ).toBeInTheDocument();
  });

  it("marks the main photo and processing photos", () => {
    renderWithProviders(
      <PhotoManager car={{ ...carFixture, photos: [photo(1, 0), photo(2, 1, true)] }} />,
    );

    const tiles = within(screen.getByRole("list", { name: "Foto mobil" })).getAllByRole("listitem");
    expect(within(tiles[0]!).getByText("Utama")).toBeInTheDocument();
    expect(within(tiles[1]!).getByText("Memproses…")).toBeInTheDocument();
  });

  it("reorders with the move buttons and announces it", async () => {
    const calls = mockApi({
      "PATCH /admin/cars/9/photos/order": { status: 200, body: ok([photo(2, 0), photo(1, 1)]) },
    });
    renderWithProviders(
      <PhotoManager car={{ ...carFixture, photos: [photo(1, 0), photo(2, 1)] }} />,
    );

    await userEvent.setup().click(screen.getByRole("button", { name: "Geser ke kiri: foto 2" }));

    await waitFor(() => expect(calls[0]?.body).toEqual({ photo_ids: [2, 1] }));
    expect(screen.getByText("Foto 2 dipindah ke posisi 1 (foto utama).")).toBeInTheDocument();
  });

  it("reorders by drag and drop", async () => {
    const calls = mockApi({
      "PATCH /admin/cars/9/photos/order": {
        status: 200,
        body: ok([photo(3, 0), photo(1, 1), photo(2, 2)]),
      },
    });
    renderWithProviders(
      <PhotoManager car={{ ...carFixture, photos: [photo(1, 0), photo(2, 1), photo(3, 2)] }} />,
    );
    const tiles = within(screen.getByRole("list", { name: "Foto mobil" })).getAllByRole("listitem");

    fireEvent.dragStart(tiles[2]!);
    fireEvent.dragOver(tiles[0]!);
    fireEvent.drop(tiles[0]!);

    await waitFor(() => expect(calls[0]?.body).toEqual({ photo_ids: [3, 1, 2] }));
  });

  it("deletes a photo after confirmation", async () => {
    const calls = mockApi({ "DELETE /admin/cars/9/photos/1": { status: 200, body: ok(null) } });
    renderWithProviders(<PhotoManager car={{ ...carFixture, photos: [photo(1, 0)] }} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Hapus foto 1" }));
    const dialog = await screen.findByRole("dialog", { name: "Hapus foto ini?" });
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));

    expect(await screen.findByText("Foto dihapus", { selector: "div" })).toBeInTheDocument();
    expect(calls.map((call) => call.key)).toContain("DELETE /admin/cars/9/photos/1");
  });

  it("disables the dropzone when the car already has five photos", () => {
    renderWithProviders(
      <PhotoManager
        car={{ ...carFixture, photos: [0, 1, 2, 3, 4].map((order) => photo(order + 1, order)) }}
      />,
    );

    expect(screen.getByTestId("file-dropzone-input")).toBeDisabled();
    expect(screen.getByText(/5\/5 foto/)).toBeInTheDocument();
  });
});
