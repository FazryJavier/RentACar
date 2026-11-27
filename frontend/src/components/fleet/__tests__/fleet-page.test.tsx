import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FleetPage } from "@/components/fleet/fleet-page";
import { fail, ok } from "../../../../tests/unit/api-mock";
import { nav } from "../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../tests/unit/render-with-providers";
import { car, estimate, page, references } from "./fixtures";

vi.mock("next/navigation", async () =>
  (await import("../../../../tests/unit/navigation-mock")).navigationModule(),
);

type Reply = { status: number; body: unknown };

/** Routes public API calls by path; `/public/cars` answers are taken in order (last one repeats). */
function mockPublicApi(cars: Reply[]) {
  const queue = [...cars];
  const carCalls: string[] = [];
  const reply = ({ status, body }: Reply) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace("/api/v1", "");
      if (path.startsWith("/public/cars?")) {
        carCalls.push(decodeURIComponent(path));
        return reply(queue.length > 1 ? queue.shift()! : queue[0]);
      }
      const lists: Record<string, unknown> = {
        "/public/branches": references.branches,
        "/public/categories": references.categories,
        "/public/brands": references.brands,
      };
      return path in lists
        ? reply({ status: 200, body: ok(lists[path]) })
        : reply({ status: 404, body: fail(404, "x") });
    }),
  );
  return carCalls;
}

const liveRegion = () => document.querySelector("p[aria-live='polite']");

const SEARCH =
  "branch=jakarta-selatan&pickup_at=2026-12-01T09:00:00%2B07:00&return_at=2026-12-03T09:00:00%2B07:00";

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => nav.reset("/armada"));

describe("FleetPage", () => {
  it("lists the catalog with a hint to pick dates", async () => {
    const calls = mockPublicApi([
      {
        status: 200,
        body: page([car, { ...car, slug: "b", name: "Honda HR-V", thumbnail: null }]),
      },
    ]);
    renderWithProviders(<FleetPage />);

    const link = await screen.findByRole("link", { name: /Toyota Fortuner 2026/ });
    expect(link).toHaveAttribute("href", "/armada/toyota-fortuner-2026");
    expect(liveRegion()).toHaveTextContent("2 mobil");
    expect(screen.getByText(/Pilih tanggal untuk cek ketersediaan/)).toBeInTheDocument();
    expect(calls[0]).toContain("sort=popular&page=1&per_page=12");
    expect(calls[0]).not.toContain("pickup_at");
  });

  it("searches availability from the URL and links cards with the dates", async () => {
    nav.reset("/armada", SEARCH);
    const calls = mockPublicApi([{ status: 200, body: page([{ ...car, estimate }]) }]);
    renderWithProviders(<FleetPage />);

    const link = await screen.findByRole("link", { name: /Toyota Fortuner 2026/ });
    expect(link.getAttribute("href")).toBe(
      `/armada/toyota-fortuner-2026?${SEARCH.replaceAll(":", "%3A")}`,
    );
    expect(within(link).getByText(/Estimasi total Rp2\.400\.000/)).toBeInTheDocument();
    expect(liveRegion()).toHaveTextContent("1 mobil tersedia");
    expect(screen.queryByText(/Pilih tanggal untuk cek ketersediaan/)).not.toBeInTheDocument();
    expect(calls[0]).toContain("branch=jakarta-selatan&pickup_at=2026-12-01T09:00:00+07:00");
  });

  it("shows API validation errors on the search fields", async () => {
    nav.reset("/armada", SEARCH);
    mockPublicApi([
      {
        status: 422,
        body: fail(422, "Data tidak valid.", [
          {
            field: "pickup_at",
            code: "too_soon",
            message: "Waktu ambil minimal 2 jam dari sekarang.",
          },
        ]),
      },
    ]);
    renderWithProviders(<FleetPage />);

    expect(await screen.findByText("Waktu ambil minimal 2 jam dari sekarang.")).toBeInTheDocument();
    expect(screen.getByText("Periksa cabang dan tanggal pencarian.")).toBeInTheDocument();
  });

  it("writes filters to the URL and resets the page", async () => {
    nav.reset("/armada", "page=3");
    mockPublicApi([{ status: 200, body: page([car]) }]);
    renderWithProviders(<FleetPage />);
    const user = userEvent.setup();

    const sidebar = await screen.findByRole("complementary", { name: "Filter" });
    await user.click(await within(sidebar).findByRole("checkbox", { name: "SUV" }));
    expect(nav.push).toHaveBeenLastCalledWith("/armada?category=suv", { scroll: false });

    await user.click(within(sidebar).getByRole("radio", { name: "Manual" }));
    expect(nav.push).toHaveBeenLastCalledWith("/armada?transmission=manual", { scroll: false });

    await user.click(within(sidebar).getByRole("button", { name: "7+" }));
    expect(nav.push).toHaveBeenLastCalledWith("/armada?seats_min=7", { scroll: false });
  });

  it("removes one filter chip or all of them", async () => {
    nav.reset("/armada", "category=suv,mpv&seats_min=5&sort=price");
    mockPublicApi([{ status: 200, body: page([car]) }]);
    renderWithProviders(<FleetPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Hapus filter MPV" }));
    expect(nav.push).toHaveBeenLastCalledWith("/armada?category=suv&seats_min=5&sort=price", {
      scroll: false,
    });

    await user.click(screen.getByRole("button", { name: "Hapus semua" }));
    expect(nav.push).toHaveBeenLastCalledWith("/armada?sort=price", { scroll: false });
  });

  it("changes the sort and the view", async () => {
    mockPublicApi([{ status: 200, body: page([car]) }]);
    renderWithProviders(<FleetPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("combobox", { name: "Urutkan" }));
    await user.click(await screen.findByRole("option", { name: "Harga terendah" }));
    expect(nav.push).toHaveBeenLastCalledWith("/armada?sort=price", { scroll: false });

    const list = screen.getByRole("button", { name: "Tampilan daftar" });
    expect(list).toHaveAttribute("aria-pressed", "false");
    await user.click(list);
    expect(nav.push).toHaveBeenLastCalledWith("/armada?view=list", { scroll: false });
  });

  it("offers ways out when nothing is available", async () => {
    nav.reset("/armada", `${SEARCH}&category=suv`);
    mockPublicApi([{ status: 200, body: page([]) }]);
    renderWithProviders(<FleetPage />);
    const user = userEvent.setup();

    expect(
      await screen.findByRole("heading", { name: "Tidak ada mobil tersedia" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ubah tanggal" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hapus filter" }));
    expect(nav.push).toHaveBeenLastCalledWith(`/armada?${SEARCH.replaceAll(":", "%3A")}`, {
      scroll: false,
    });
  });

  it("shows skeletons while loading and retries after an error", async () => {
    mockPublicApi([
      { status: 500, body: fail(500, "Terjadi kesalahan pada server.") },
      { status: 200, body: page([car]) },
    ]);
    renderWithProviders(<FleetPage />);
    const user = userEvent.setup();

    expect(screen.getByRole("list", { name: "Memuat daftar mobil" })).toBeInTheDocument();
    expect(await screen.findByText("Daftar mobil gagal dimuat.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(await screen.findByRole("link", { name: /Toyota Fortuner 2026/ })).toBeInTheDocument();
  });

  it("applies filters from the sheet only on Terapkan", async () => {
    nav.reset("/armada", "category=suv&seats_min=5");
    mockPublicApi([{ status: 200, body: page([car]) }]);
    renderWithProviders(<FleetPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Filter (2)" }));
    const sheet = await screen.findByRole("dialog", { name: "Filter" });
    await user.click(await within(sheet).findByRole("checkbox", { name: "MPV" }));
    expect(nav.push).not.toHaveBeenCalled();

    await user.click(within(sheet).getByRole("button", { name: "Terapkan" }));
    expect(nav.push).toHaveBeenLastCalledWith("/armada?category=suv%2Cmpv&seats_min=5", {
      scroll: false,
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
