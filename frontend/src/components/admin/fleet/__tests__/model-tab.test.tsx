import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelTab } from "@/components/admin/fleet/model-tab/model-tab";
import type { CarCondition, CarModel3d } from "@/lib/admin-api";
import { fail, mockApi, ok, staffFixture } from "../../../../../tests/unit/api-mock";
import { nav } from "../../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../../tests/unit/render-with-providers";
import { carFixture } from "./fixtures";

vi.mock("next/navigation", async () =>
  (await import("../../../../../tests/unit/navigation-mock")).navigationModule(),
);

// WebGL is not available in jsdom: the viewer is replaced by buttons that simulate a click on
// the model, list the hotspots, and expose the camera API.
const viewerApi = {
  getCamera: () => ({
    position: [2.5, 1.2, 3] as [number, number, number],
    target: [0, 0.5, 0] as [number, number, number],
  }),
  capturePoster: vi.fn(async () => new Blob(["poster"], { type: "image/webp" })),
};
vi.mock("@/components/car-viewer", () => ({
  CarViewer: (props: {
    hotspots?: { id: number; label: string }[];
    placing?: boolean;
    onPlace?: (point: { position: number[]; normal: number[] }) => void;
    onSelect?: (id: number) => void;
    onReady?: (api: typeof viewerApi) => void;
  }) => {
    props.onReady?.(viewerApi);
    return (
      <div>
        <button
          type="button"
          disabled={!props.placing}
          onClick={() => props.onPlace?.({ position: [0.4, 0.8, -1.1], normal: [0, 0, -1] })}
        >
          Klik model
        </button>
        {(props.hotspots ?? []).map((hotspot) => (
          <button key={hotspot.id} type="button" onClick={() => props.onSelect?.(hotspot.id)}>
            {hotspot.label}
          </button>
        ))}
      </div>
    );
  },
}));

const model: CarModel3d = {
  url: "/storage/cars/9/models/a.glb",
  poster_url: null,
  camera: null,
  file_size: 4_404_019,
  source_name: "Studio Uji",
  source_url: null,
  license: "CC-BY-4.0",
  is_illustrative: false,
  model_version: 2,
  updated_at: null,
};

function marker(overrides: Partial<CarCondition> = {}): CarCondition {
  return {
    id: 1,
    number: 1,
    area: "left",
    severity: "minor",
    description: "Baret halus di pintu kiri",
    position: [0.1, 0.2, 0.3],
    normal: [0, 1, 0],
    model_version: 2,
    needs_reposition: false,
    inspected_on: "2026-11-20",
    is_resolved: false,
    resolved_at: null,
    photos: [],
    ...overrides,
  };
}

const base = {
  "GET /admin/me": { status: 200, body: ok(staffFixture) },
  "GET /admin/cars/9/inspections": { status: 200, body: ok([]) },
};

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  nav.reset("/admin/mobil/9");
  viewerApi.capturePoster.mockClear();
});

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  screen.getByRole("combobox", { name: label }).focus();
  await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("ModelTab with a model", () => {
  it("places a marker by clicking the model and saves it with the point", async () => {
    const calls = mockApi({
      ...base,
      "GET /admin/cars/9/conditions": [
        { status: 200, body: ok([]) },
        { status: 200, body: ok([marker()]) },
      ],
      "POST /admin/cars/9/conditions": { status: 201, body: ok(marker()) },
    });
    renderWithProviders(<ModelTab car={{ ...carFixture, model_3d: model }} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Tambah penanda" }));
    await user.click(screen.getByRole("button", { name: "Klik model" }));
    expect(screen.getByRole("button", { name: "Penanda baru" })).toBeInTheDocument();

    await choose(user, "Area", "Kiri");
    await choose(user, "Tingkat", "Ringan");
    await user.type(screen.getByLabelText(/^Deskripsi/), "Baret halus di pintu kiri");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Penanda disimpan")).toBeInTheDocument();
    const body = calls.find((call) => call.key === "POST /admin/cars/9/conditions")?.body as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      area: "left",
      severity: "minor",
      position: [0.4, 0.8, -1.1],
      normal: [0, 0, -1],
    });
    expect(body.inspected_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("asks for a point before saving", async () => {
    mockApi({ ...base, "GET /admin/cars/9/conditions": { status: 200, body: ok([]) } });
    renderWithProviders(<ModelTab car={{ ...carFixture, model_3d: model }} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Tambah penanda" }));
    await choose(user, "Area", "Atap");
    await choose(user, "Tingkat", "Berat");
    await user.type(screen.getByLabelText(/^Deskripsi/), "Penyok di atap");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Klik titik pada model")).toBeInTheDocument();
  });

  it("selects a hotspot, flags markers to reposition and moves them", async () => {
    const calls = mockApi({
      ...base,
      "GET /admin/cars/9/conditions": {
        status: 200,
        body: ok([
          marker(),
          marker({
            id: 2,
            number: 2,
            area: "rear",
            severity: "moderate",
            needs_reposition: true,
            model_version: 1,
          }),
        ]),
      },
      "PATCH /admin/cars/9/conditions/2": { status: 200, body: ok(marker({ id: 2, number: 2 })) },
    });
    renderWithProviders(<ModelTab car={{ ...carFixture, model_3d: model }} />);
    const user = userEvent.setup();

    // Only marker 1 is drawn in 3D; marker 2 needs repositioning and shows the badge in the list.
    expect(
      await screen.findByRole("button", { name: "Penanda 1: Kiri, ringan" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Penanda 2/ })).not.toBeInTheDocument();
    expect(screen.getByText("Perlu penyesuaian posisi")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ubah penanda 2" }));
    expect(
      screen.getByText("Model sudah diganti. Pindahkan titik penanda ini."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pindahkan titik" }));
    await user.click(screen.getByRole("button", { name: "Klik model" }));

    await waitFor(() =>
      expect(calls.find((call) => call.key === "PATCH /admin/cars/9/conditions/2")?.body).toEqual({
        position: [0.4, 0.8, -1.1],
        normal: [0, 0, -1],
      }),
    );
  });

  it("marks a marker as repaired and hides it until resolved ones are shown", async () => {
    const calls = mockApi({
      ...base,
      "GET /admin/cars/9/conditions": [
        { status: 200, body: ok([marker()]) },
        { status: 200, body: ok([marker({ is_resolved: true })]) },
      ],
      "PATCH /admin/cars/9/conditions/1": { status: 200, body: ok(marker({ is_resolved: true })) },
    });
    renderWithProviders(<ModelTab car={{ ...carFixture, model_3d: model }} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Penanda 1: Kiri, ringan" }));
    await user.click(screen.getByLabelText("Sudah diperbaiki"));
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(
        calls.find((call) => call.key === "PATCH /admin/cars/9/conditions/1")?.body,
      ).toMatchObject({ is_resolved: true }),
    );
    await waitFor(() =>
      expect(screen.queryByText("Belum ada penanda kondisi.")).toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText("Tampilkan yang sudah diperbaiki"));
    expect(
      within(screen.getByRole("list", { name: "Daftar penanda" })).getByText("Sudah diperbaiki"),
    ).toBeInTheDocument();
  });

  it("saves the camera and a poster", async () => {
    const calls = mockApi({
      ...base,
      "GET /admin/cars/9/conditions": { status: 200, body: ok([]) },
      "PATCH /admin/cars/9/model": { status: 200, body: ok(model) },
      "POST /admin/cars/9/model/poster": { status: 200, body: ok(model) },
    });
    renderWithProviders(<ModelTab car={{ ...carFixture, model_3d: model }} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Simpan sudut kamera" }));

    expect(await screen.findByText("Sudut kamera disimpan")).toBeInTheDocument();
    expect(calls.find((call) => call.key === "PATCH /admin/cars/9/model")?.body).toEqual({
      camera: { position: [2.5, 1.2, 3], target: [0, 0.5, 0] },
    });
    expect(calls.some((call) => call.key === "POST /admin/cars/9/model/poster")).toBe(true);
  });

  it("validates description and a future inspection date", async () => {
    mockApi({ ...base, "GET /admin/cars/9/conditions": { status: 200, body: ok([marker()]) } });
    renderWithProviders(<ModelTab car={{ ...carFixture, model_3d: model }} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Ubah penanda 1" }));
    const description = screen.getByLabelText(/^Deskripsi/);
    await user.clear(description);
    await user.type(description, "abcd");
    const date = screen.getByLabelText(/^Tanggal inspeksi/);
    await user.clear(date);
    await user.type(date, "2099-01-01");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Deskripsi 5–300 karakter")).toBeInTheDocument();
    expect(screen.getByText("Tanggal inspeksi tidak boleh di masa depan")).toBeInTheDocument();
  });
});

describe("ModelTab without a model", () => {
  it("adds an area-only marker without a point", async () => {
    const calls = mockApi({
      ...base,
      "GET /admin/cars/9/conditions": { status: 200, body: ok([]) },
      "POST /admin/cars/9/conditions": {
        status: 201,
        body: ok(marker({ position: null, normal: null, model_version: null })),
      },
    });
    renderWithProviders(<ModelTab car={carFixture} />);
    const user = userEvent.setup();

    expect(await screen.findByText(/Belum ada model 3D/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Klik model" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tambah penanda" }));
    await choose(user, "Area", "Interior");
    await choose(user, "Tingkat", "Sedang");
    await user.type(screen.getByLabelText(/^Deskripsi/), "Jok belakang sobek");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(
        calls.find((call) => call.key === "POST /admin/cars/9/conditions")?.body,
      ).not.toHaveProperty("position"),
    );
  });

  it("requires source and licence before uploading, and shows the server reason", async () => {
    const calls = mockApi({
      ...base,
      "GET /admin/cars/9/conditions": { status: 200, body: ok([]) },
      "POST /admin/cars/9/model": {
        status: 422,
        body: fail(422, "Data tidak valid.", [
          {
            field: "file",
            code: "invalid_file_type",
            message: "File model tidak boleh merujuk file eksternal",
          },
        ]),
      },
    });
    renderWithProviders(<ModelTab car={carFixture} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Unggah model" }));
    expect(screen.getByText("Pilih file model .glb")).toBeInTheDocument();
    expect(screen.getByText("Isi sumber model")).toBeInTheDocument();

    await user.upload(
      screen.getByLabelText(/File model/),
      new File(["glTF"], "mobil.glb", { type: "model/gltf-binary" }),
    );
    await user.type(screen.getByLabelText(/^Sumber model/), "Studio Uji");
    await user.type(screen.getByLabelText(/^Lisensi/), "CC-BY-4.0");
    await user.click(screen.getByRole("button", { name: "Unggah model" }));

    expect(
      await screen.findByText("File model tidak boleh merujuk file eksternal"),
    ).toBeInTheDocument();
    const form = calls.find((call) => call.key === "POST /admin/cars/9/model")?.body as FormData;
    expect(form.get("source_name")).toBe("Studio Uji");
    expect(form.get("is_illustrative")).toBe("0");
  });
});

describe("Inspection log", () => {
  it("records an inspection in WIB and lists inspections", async () => {
    const calls = mockApi({
      ...base,
      "GET /admin/cars/9/conditions": { status: 200, body: ok([]) },
      "GET /admin/cars/9/inspections": [
        { status: 200, body: ok([]) },
        {
          status: 200,
          body: ok([
            {
              id: 1,
              inspected_at: "2026-11-26T02:00:00Z",
              odometer_km: 45000,
              notes: "Ban diganti",
              admin: { id: 2, name: "Sari Staf" },
            },
          ]),
        },
      ],
      "POST /admin/cars/9/inspections": { status: 201, body: ok({ id: 1 }) },
    });
    renderWithProviders(<ModelTab car={carFixture} />);
    const user = userEvent.setup();

    const at = await screen.findByLabelText(/^Waktu inspeksi/);
    await waitFor(() => expect(at).not.toHaveValue(""));
    await user.clear(at);
    await user.type(at, "2026-11-26T09:00");
    await user.type(screen.getByLabelText(/^Kilometer/), "45000");
    await user.type(screen.getByLabelText(/^Catatan/), "Ban diganti");
    await user.click(screen.getByRole("button", { name: "Catat inspeksi" }));

    expect(await screen.findByText("Inspeksi dicatat")).toBeInTheDocument();
    expect(calls.find((call) => call.key === "POST /admin/cars/9/inspections")?.body).toEqual({
      inspected_at: "2026-11-26T09:00:00+07:00",
      odometer_km: 45000,
      notes: "Ban diganti",
    });
    expect(await screen.findByText(/45\.000 km/)).toBeInTheDocument();
  });

  it("rejects missing kilometres", async () => {
    mockApi({ ...base, "GET /admin/cars/9/conditions": { status: 200, body: ok([]) } });
    renderWithProviders(<ModelTab car={carFixture} />);

    await userEvent.setup().click(await screen.findByRole("button", { name: "Catat inspeksi" }));

    expect(await screen.findByText("Kilometer 0–2.000.000")).toBeInTheDocument();
  });
});
