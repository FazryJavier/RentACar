import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hotspotsOf } from "@/components/car-detail/car-viewer-section";
import { CarDetailPage } from "@/components/car-detail/car-detail-page";
import { fail, ok } from "../../../../tests/unit/api-mock";
import { nav } from "../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../tests/unit/render-with-providers";
import { branch, detail, price } from "./fixtures";

vi.mock("next/navigation", async () =>
  (await import("../../../../tests/unit/navigation-mock")).navigationModule(),
);

type Reply = { status: number; body: unknown };

/** Routes public API calls by path prefix; returns the URLs requested. */
function mockPublicApi(routes: { availability?: Reply; similar?: Reply } = {}) {
  const calls: string[] = [];
  const reply = ({ status, body }: Reply) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = decodeURIComponent(url.replace("/api/v1", ""));
      calls.push(path);
      if (path.includes("/availability?")) {
        return reply(
          routes.availability ?? {
            status: 200,
            body: ok({ available: true, price, price_token: "t", reason: null }),
          },
        );
      }
      if (path.includes("/similar")) {
        return reply(routes.similar ?? { status: 200, body: ok([]) });
      }
      const lists: Record<string, unknown> = {
        "/public/branches": [{ ...branch, slug: detail.branch.slug }],
        "/public/categories": [],
        "/public/brands": [],
      };
      return path in lists
        ? reply({ status: 200, body: ok(lists[path]) })
        : reply({ status: 404, body: fail(404, "x") });
    }),
  );
  return calls;
}

function setDesktop(desktop: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: desktop && query.includes("min-width: 1024px"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

const DATES = "pickup_at=2026-12-01T09:00:00%2B07:00&return_at=2026-12-03T09:00:00%2B07:00";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
beforeEach(() => nav.reset(`/armada/${detail.slug}`));

describe("CarDetailPage", () => {
  it("shows the car, its specs and the gallery fallback without WebGL", async () => {
    mockPublicApi();
    renderWithProviders(<CarDetailPage car={detail} />);

    expect(screen.getByRole("heading", { level: 1, name: detail.name })).toBeInTheDocument();
    expect(await screen.findByText("Tampilan 3D tidak tersedia")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Depan" })[0]).toBeInTheDocument();
    const specs = screen.getByRole("region", { name: "Spesifikasi" });
    expect(within(specs).getByText("2026")).toBeInTheDocument();
    expect(within(specs).getByText("3 koper")).toBeInTheDocument();
    expect(screen.getByText("AC")).toBeInTheDocument();
  });

  it("summarises the inspection and lists every active marker", () => {
    mockPublicApi();
    renderWithProviders(<CarDetailPage car={detail} />);

    const section = screen.getByRole("region", { name: "Kondisi mobil" });
    expect(within(section).getByText("1 ringan · 1 sedang")).toBeInTheDocument();
    expect(within(section).getByText("45.210 km")).toBeInTheDocument();
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent("tidak ditandai di model 3D");
  });

  it("draws only markers with a current position as hotspots", () => {
    expect(hotspotsOf(detail).map((hotspot) => hotspot.number)).toEqual([1]);
    expect(hotspotsOf(detail)[0].label).toBe("Penanda 1: Kanan, sedang");
  });

  it("opens marker details in a bottom sheet on phones", async () => {
    setDesktop(false);
    mockPublicApi();
    renderWithProviders(<CarDetailPage car={detail} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Catatan 1:/ }));
    const sheet = await screen.findByRole("dialog", { name: "1. Kanan" });
    expect(within(sheet).getByText("Penyok kecil di pintu kanan")).toBeInTheDocument();
    expect(within(sheet).getByText("Sedang")).toBeInTheDocument();
    expect(within(sheet).getByText("Inspeksi: 27 Nov 2026")).toBeInTheDocument();
    expect(within(sheet).getByRole("img", { name: "Foto kondisi 1 (1)" })).toBeInTheDocument();
  });

  it("opens a side panel on desktop and returns focus on Escape", async () => {
    setDesktop(true);
    mockPublicApi();
    renderWithProviders(<CarDetailPage car={detail} />);
    const user = userEvent.setup();

    const item = screen.getByRole("button", { name: /Catatan 2:/ });
    await user.click(item);
    const panel = await screen.findByRole("dialog", { name: "2. Belakang" });
    expect(within(panel).getByRole("heading", { name: "2. Belakang" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(item).toHaveFocus());
  });

  it("asks for dates before showing a price", async () => {
    setDesktop(true);
    mockPublicApi();
    renderWithProviders(<CarDetailPage car={detail} />);

    const card = screen.getByRole("complementary", { name: "Pesan mobil" });
    expect(within(card).getByText("Pilih tanggal untuk melihat total harga.")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Pesan Sekarang" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(await within(card).findByText(/07:00–21:00 WIB/)).toBeInTheDocument();
  });

  it("shows the price breakdown and links to checkout when available", async () => {
    nav.reset(`/armada/${detail.slug}`, DATES);
    const calls = mockPublicApi();
    renderWithProviders(<CarDetailPage car={detail} />);

    const card = screen.getByRole("complementary", { name: "Pesan mobil" });
    expect(await within(card).findByText("Tersedia")).toBeInTheDocument();
    expect(within(card).getByText("2 hari × Rp950.000")).toBeInTheDocument();
    expect(within(card).getByText("Rp1.900.000")).toBeInTheDocument();
    expect(within(card).getByText("Rp2.400.000")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Pesan Sekarang" })).toHaveAttribute(
      "href",
      `/checkout?car=${detail.slug}&${DATES.replaceAll(":", "%3A")}`,
    );
    expect(
      calls.some((url) =>
        url.includes(
          `availability?branch=${detail.branch.slug}&pickup_at=2026-12-01T09:00:00+07:00`,
        ),
      ),
    ).toBe(true);
  });

  it("explains when the car is booked and points to similar cars", async () => {
    nav.reset(`/armada/${detail.slug}`, DATES);
    mockPublicApi({
      availability: {
        status: 200,
        body: ok({ available: false, price, price_token: "t", reason: "booked" }),
      },
    });
    renderWithProviders(<CarDetailPage car={detail} />);

    const card = screen.getByRole("complementary", { name: "Pesan mobil" });
    expect(await within(card).findByText("Sudah dipesan pada tanggal ini")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Tidak tersedia" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      within(card).getByRole("link", { name: "Lihat mobil serupa yang tersedia" }),
    ).toHaveAttribute("href", "#mobil-serupa");
  });

  it("shows date validation errors on the field", async () => {
    nav.reset(`/armada/${detail.slug}`, DATES);
    mockPublicApi({
      availability: {
        status: 422,
        body: fail(422, "Data tidak valid.", [
          {
            field: "pickup_at",
            code: "too_soon",
            message: "Waktu ambil minimal 2 jam dari sekarang.",
          },
        ]),
      },
    });
    renderWithProviders(<CarDetailPage car={detail} />);

    const card = screen.getByRole("complementary", { name: "Pesan mobil" });
    expect(
      await within(card).findByText("Waktu ambil minimal 2 jam dari sekarang."),
    ).toBeInTheDocument();
  });

  it("offers the booking card in a bottom sheet from the mobile bar", async () => {
    mockPublicApi();
    renderWithProviders(<CarDetailPage car={detail} />);
    const user = userEvent.setup();

    expect(screen.getByText("Mulai dari")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pilih tanggal" }));
    const sheet = await screen.findByRole("dialog", { name: detail.name });
    expect(
      within(sheet).getByRole("button", { name: /Waktu ambil & kembali/ }),
    ).toBeInTheDocument();
  });

  it("lists similar cars with the chosen dates", async () => {
    nav.reset(`/armada/${detail.slug}`, DATES);
    mockPublicApi({
      similar: {
        status: 200,
        body: ok([{ ...detail, slug: "honda-hrv", name: "Honda HR-V", thumbnail: null }]),
      },
    });
    renderWithProviders(<CarDetailPage car={detail} />);

    const section = await screen.findByRole("region", { name: "Mobil serupa" });
    expect(
      within(section)
        .getByRole("link", { name: /Honda HR-V/ })
        .getAttribute("href"),
    ).toContain("/armada/honda-hrv?branch=");
  });
});
