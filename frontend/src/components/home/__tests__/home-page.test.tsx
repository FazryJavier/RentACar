import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { branch, car } from "@/components/fleet/__tests__/fixtures";
import { detail } from "@/components/car-detail/__tests__/fixtures";
import { Carousel } from "@/components/home/carousel";
import { fleetSearchHref, HeroSearch } from "@/components/home/hero-search";
import { HeroSection, HomeSections, type HomeData } from "@/components/home/home-page";
import { pickHeroCar } from "@/components/home/pick-hero-car";
import { MotionProvider, Reveal } from "@/components/home/reveal";
import type { PublicTestimonial } from "@/lib/public-api";
import { nav } from "../../../../tests/unit/navigation-mock";

vi.mock("next/navigation", async () =>
  (await import("../../../../tests/unit/navigation-mock")).navigationModule(),
);

const testimonial: PublicTestimonial = {
  name: "Rina Putri",
  city: "Bandung",
  quote: "Mobil bersih dan proses cepat.",
  rating: 4,
  avatar_url: null,
  is_demo: true,
};

const data: HomeData = {
  hero: { kind: "model", car: detail, posterUrl: "/storage/models/1.webp" },
  branches: [branch],
  popular: [car, { ...car, slug: "honda-brv-2026", name: "Honda BR-V 2026" }],
  categories: [
    { slug: "suv", name: "SUV", description: null },
    { slug: "city-car", name: "City Car", description: null },
  ],
  testimonials: [testimonial, { ...testimonial, name: "Budi", is_demo: false }],
  stats: { cars: 12, branches: 3, categories: 5, completed_bookings: 48 },
};

function renderHome(overrides: Partial<HomeData> = {}) {
  const props = { ...data, ...overrides };
  return render(
    <MotionProvider>
      <HeroSection hero={props.hero} branches={props.branches} />
      <HomeSections
        hero={props.hero}
        popular={props.popular}
        categories={props.categories}
        testimonials={props.testimonials}
        stats={props.stats}
      />
    </MotionProvider>,
  );
}

function reducedMotion(enabled: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: enabled && query.includes("reduce"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

beforeEach(() => nav.reset());
afterEach(() => vi.restoreAllMocks());

describe("home page", () => {
  it("renders one h1 and the sections in order", () => {
    renderHome();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Penyewaan mobil yang jujur soal harga dan kondisi",
      "Armada populer",
      "Cari berdasarkan kategori",
      "Hemat hingga 30% untuk sewa mingguan",
      "Cara sewa dalam 4 langkah",
      "Kata pelanggan",
      "Pertanyaan umum",
    ]);
  });

  it("shows the hero copy, CTAs, poster first and the advantages", () => {
    renderHome();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sewa mobil nyaman untuk setiap perjalanan",
    );
    expect(screen.getByRole("link", { name: /Lihat Armada/ })).toHaveAttribute("href", "/armada");
    expect(screen.getByRole("img", { name: "Model 3D Toyota Fortuner 2026" })).toBeInTheDocument();
    const poster = document.querySelector('img[fetchpriority="high"]');
    expect(poster).toHaveAttribute("src", "/storage/models/1.webp");
    expect(poster).not.toHaveAttribute("loading", "lazy");
    expect(screen.getByRole("list", { name: "Keunggulan" })).toHaveTextContent(
      /Layanan 24\/7.*Pesan Instan.*Harga Terbaik/,
    );
  });

  it("hides sections whose data is missing and keeps the rest", () => {
    renderHome({ popular: null, categories: [], testimonials: [], stats: null });

    expect(screen.queryByRole("heading", { name: "Armada populer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Kata pelanggan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /kategori/ })).not.toBeInTheDocument();
    expect(screen.queryByTestId("home-stats")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pertanyaan umum" })).toBeInTheDocument();
  });

  it("shows only text and search when there is no car at all", () => {
    renderHome({ hero: { kind: "none" }, popular: [] });

    expect(screen.queryByRole("img", { name: /Model 3D/ })).not.toBeInTheDocument();
    expect(screen.getByRole("search", { name: "Cari mobil" })).toBeInTheDocument();
  });

  it("takes statistics from the API", () => {
    renderHome();

    const stats = within(screen.getByTestId("home-stats"));
    expect(stats.getByText("Mobil siap sewa").nextElementSibling).toHaveTextContent("12");
    expect(stats.getByText("Cabang").nextElementSibling).toHaveTextContent("3");
    expect(stats.getByText("Penyewaan selesai").nextElementSibling).toHaveTextContent("48");
  });

  it("links category chips to the fleet filter and cards to their detail page", () => {
    renderHome();

    expect(screen.getByRole("link", { name: "SUV" })).toHaveAttribute(
      "href",
      "/armada?category=suv",
    );
    expect(screen.getByRole("link", { name: "City Car" })).toHaveAttribute(
      "href",
      "/armada?category=city-car",
    );
    const cards = within(screen.getByRole("list", { name: "Armada populer" }));
    expect(cards.getByRole("link", { name: /Honda BR-V 2026/ })).toHaveAttribute(
      "href",
      "/armada/honda-brv-2026",
    );
  });

  it("labels the promo and demo testimonials as demo content", () => {
    renderHome();

    expect(screen.getByText("Promo ilustrasi — demo")).toBeInTheDocument();
    expect(screen.getAllByText("Contoh testimoni — data demo")).toHaveLength(1);
    expect(screen.getAllByRole("img", { name: "Rating 4 dari 5" })).toHaveLength(2);
  });

  it("shows no demo label for real testimonials", () => {
    renderHome({ testimonials: [{ ...testimonial, is_demo: false }] });

    expect(screen.queryByText("Contoh testimoni — data demo")).not.toBeInTheDocument();
  });

  it("opens FAQ answers with the keyboard and links to the FAQ page", async () => {
    renderHome();
    const user = userEvent.setup();
    const question = screen.getByRole("button", { name: "Apakah ada deposit?" });

    question.focus();
    await user.keyboard("{Enter}");

    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Lihat semua FAQ" })).toHaveAttribute("href", "/faq");
  });

  it("opens the demo video dialog and returns focus on Escape", async () => {
    renderHome();
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Tonton Video" });

    await user.click(button);
    expect(await screen.findByRole("dialog", { name: "Video perkenalan" })).toHaveTextContent(
      "Konten demo",
    );
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("hides decorative blobs from assistive technology, at most two on the page", () => {
    renderHome();

    const blobs = document.querySelectorAll('[data-decoration="blob"]');
    expect(blobs.length).toBeGreaterThan(0);
    expect(blobs.length).toBeLessThanOrEqual(2);
    blobs.forEach((blob) => expect(blob).toHaveAttribute("aria-hidden", "true"));
  });
});

describe("hero search", () => {
  it("builds the fleet URL with the same parameters", () => {
    expect(
      fleetSearchHref({
        branch: "jakarta-selatan",
        pickupAt: "2026-12-03T09:00:00+07:00",
        returnAt: "2026-12-05T09:00:00+07:00",
      }),
    ).toBe(
      "/armada?branch=jakarta-selatan&pickup_at=2026-12-03T09%3A00%3A00%2B07%3A00&return_at=2026-12-05T09%3A00%3A00%2B07%3A00",
    );
    expect(fleetSearchHref({ branch: null, pickupAt: null, returnAt: null })).toBe("/armada");
  });

  it("goes to the branch catalog when only a branch is chosen", async () => {
    render(<HeroSearch branches={[branch]} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Cabang" }));
    await user.click(await screen.findByRole("option", { name: "Jakarta Selatan · Jakarta" }));
    await user.click(screen.getByRole("button", { name: "Cari" }));

    expect(nav.push).toHaveBeenCalledWith("/armada?branch=jakarta-selatan");
  });
});

describe("carousel", () => {
  it("scrolls one item per press, disables the ends and never moves on its own", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <Carousel label="Daftar" itemClassName="basis-1/3">
        <span>Satu</span>
        <span>Dua</span>
        <span>Tiga</span>
      </Carousel>,
    );
    const list = screen.getByRole("list", { name: "Daftar" });
    Object.defineProperty(list, "scrollWidth", { configurable: true, value: 900 });
    Object.defineProperty(list, "clientWidth", { configurable: true, value: 300 });
    Object.defineProperty(list.firstElementChild, "offsetWidth", {
      configurable: true,
      value: 300,
    });
    const scrollBy = vi.fn();
    list.scrollBy = scrollBy;
    act(() => {
      list.dispatchEvent(new Event("scroll"));
    });

    const previous = screen.getByRole("button", { name: "Sebelumnya" });
    const next = screen.getByRole("button", { name: "Berikutnya" });
    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(next).not.toHaveAttribute("aria-disabled");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(next);
    expect(scrollBy).toHaveBeenCalledWith({ left: 300, behavior: "smooth" });

    vi.advanceTimersByTime(10_000);
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(list.scrollLeft).toBe(0);
    vi.useRealTimers();
  });
});

describe("reveal", () => {
  function belowFold() {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 5000,
    } as DOMRect);
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
  }

  afterEach(() => vi.unstubAllGlobals());

  it("keeps content visible when it is already on screen", () => {
    reducedMotion(false);
    render(
      <MotionProvider>
        <Reveal>Isi</Reveal>
      </MotionProvider>,
    );
    expect(screen.getByText("Isi")).toHaveAttribute("data-reveal", "shown");
  });

  it("hides below-the-fold content until it scrolls into view", () => {
    reducedMotion(false);
    belowFold();
    render(
      <MotionProvider>
        <Reveal>Isi</Reveal>
      </MotionProvider>,
    );
    expect(screen.getByText("Isi")).toHaveAttribute("data-reveal", "hidden");
  });

  it("never hides or moves content under reduced motion", () => {
    reducedMotion(true);
    belowFold();
    render(
      <MotionProvider>
        <Reveal>Isi</Reveal>
      </MotionProvider>,
    );
    expect(screen.getByText("Isi")).toHaveAttribute("data-reveal", "shown");
  });

  it("shows final statistics without counting under reduced motion", () => {
    reducedMotion(true);
    belowFold();
    renderHome();
    const stats = within(screen.getByTestId("home-stats"));
    const value = stats.getByText("Mobil siap sewa").nextElementSibling;
    expect(value?.querySelector('[aria-hidden="true"]')).toHaveTextContent(/^12$/);
    expect(value?.querySelector(".sr-only")).toHaveTextContent(/^12$/);
  });
});

describe("pickHeroCar", () => {
  const card = { ...car, slug: "bmw-3d", has_3d: true };
  const loader = (cars: Record<string, typeof detail | null>) =>
    vi.fn(async (slug: string) => cars[slug] ?? null);

  it("uses the featured car when it has a model", async () => {
    const hero = await pickHeroCar("toyota", [card], loader({ toyota: detail }));
    expect(hero).toMatchObject({ kind: "model", car: detail, posterUrl: "/storage/models/1.webp" });
  });

  it("falls back to the first popular car with a model", async () => {
    const load = loader({ "bmw-3d": { ...detail, slug: "bmw-3d" } });
    const hero = await pickHeroCar("missing", [{ ...car, has_3d: false }, card], load);
    expect(hero).toMatchObject({ kind: "model", car: { slug: "bmw-3d" } });
  });

  it("falls back to a photo, then to nothing", async () => {
    const photoCar = { ...car, has_3d: false };
    expect(await pickHeroCar("missing", [photoCar], loader({}))).toMatchObject({
      kind: "photo",
      posterUrl: car.thumbnail?.url,
    });
    expect(await pickHeroCar("missing", [], loader({}))).toEqual({ kind: "none" });
    expect(await pickHeroCar("missing", null, loader({}))).toEqual({ kind: "none" });
  });
});
