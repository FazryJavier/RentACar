import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { branch, car } from "@/components/fleet/__tests__/fixtures";
import { AboutView } from "@/components/info/about-view";
import { BranchesView } from "@/components/info/branches-view";
import { FaqView } from "@/components/info/faq-view";
import { filterFaq } from "@/components/info/faq-search";
import { HowToRentView, rentalLimits } from "@/components/info/how-to-rent-view";
import { CreditsView, PrivacyView, TermsView, termsBody } from "@/components/info/legal-views";
import { Markdown, markdownHeadings, safeUrl } from "@/components/info/markdown";
import { FAQ_CATEGORIES, featuredFaq } from "@/content/faq";
import type { PublicSettings } from "@/lib/public-api";

vi.mock("next/dynamic", () => ({ default: () => () => <div data-testid="branch-map" /> }));

const settings: PublicSettings = {
  booking: {
    min_days: 1,
    max_days: 14,
    min_lead_minutes: 120,
    max_advance_days: 90,
    payment_window_minutes: 120,
  },
  gps: { retention_days: 60 },
  content: { terms_markdown: "# Judul\n\n## Pemesanan\n\nIsi." },
};

describe("safe Markdown", () => {
  it("never renders raw HTML, scripts, event handlers or unsafe links", () => {
    const { container } = render(
      <Markdown>
        {[
          "<script>alert(1)</script>",
          '<img src=x onerror="alert(1)">',
          "<iframe src=https://evil.test></iframe>",
          "[klik](javascript:alert(1))",
          "[data](data:text/html;base64,PHNjcmlwdD4=)",
          "[vb](vbscript:msgbox(1))",
          "![gambar](https://example.com/a.png)",
          "<a href=javascript:alert(2)>a</a>",
        ].join("\n\n")}
      </Markdown>,
    );

    expect(container.querySelector("script, iframe, img, style")).toBeNull();
    expect(container.innerHTML).not.toMatch(/onerror|javascript:|vbscript:|data:text/i);
    container.querySelectorAll("a").forEach((anchor) => {
      expect(anchor.getAttribute("href") ?? "").not.toMatch(/^(javascript|vbscript|data):/i);
    });
    expect(screen.getByText("klik").closest("a")).toBeNull();
  });

  it("renders headings, lists and safe external links", () => {
    render(
      <Markdown>{"## Aturan Umum\n\n- satu\n- dua\n\n[Contoh](https://example.com)"}</Markdown>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Aturan Umum" })).toHaveAttribute(
      "id",
      "aturan-umum",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    const link = screen.getByRole("link", { name: /Contoh/ });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("keeps relative, anchor, mailto and tel URLs and drops other schemes", () => {
    expect(safeUrl("/armada")).toBe("/armada");
    expect(safeUrl("#bagian")).toBe("#bagian");
    expect(safeUrl("mailto:a@b.test")).toBe("mailto:a@b.test");
    expect(safeUrl("tel:+6221")).toBe("tel:+6221");
    expect(safeUrl(" JavaScript:alert(1)")).toBe("");
    expect(safeUrl("ftp://x")).toBe("");
  });
});

describe("terms page", () => {
  it("drops the leading title, builds the table of contents and labels the text as demo", () => {
    render(<TermsView markdown={settings.content.terms_markdown} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByText("Judul")).not.toBeInTheDocument();
    expect(screen.getByText("Teks contoh — demo")).toBeInTheDocument();
    const toc = screen.getAllByRole("navigation", { name: "Daftar isi" })[0];
    expect(within(toc).getAllByRole("link", { name: "Pemesanan" })[0]).toHaveAttribute(
      "href",
      "#pemesanan",
    );
    expect(termsBody("# A\n\nB")).toBe("B");
    expect(markdownHeadings("## Satu\ntext\n## Dua")).toEqual([
      { id: "satu", title: "Satu" },
      { id: "dua", title: "Dua" },
    ]);
  });

  it("shows a message when the settings could not be loaded", () => {
    render(<TermsView markdown={null} />);
    expect(screen.getByText(/belum bisa dimuat/)).toBeInTheDocument();
  });
});

describe("privacy page", () => {
  it("states the GPS retention from settings, payment proofs and the demo label", () => {
    render(<PrivacyView retentionDays={60} />);

    expect(screen.getByTestId("gps-retention")).toHaveTextContent("60 hari");
    expect(screen.getByRole("heading", { name: "Bukti bayar" })).toBeInTheDocument();
    expect(screen.getByText(/hanya bisa dilihat oleh admin/)).toBeInTheDocument();
    expect(screen.getByText("Teks contoh — demo")).toBeInTheDocument();
  });

  it("falls back to 90 days", () => {
    render(<PrivacyView retentionDays={null} />);
    expect(screen.getByTestId("gps-retention")).toHaveTextContent("90 hari");
  });
});

describe("credits page", () => {
  it("lists every model with source, licence and illustration badge", () => {
    render(
      <CreditsView
        credits={[
          {
            car: { slug: "toyota-fortuner-2026", name: "Toyota Fortuner 2026" },
            source_name: "Contoh",
            source_url: "https://example.com/model",
            license: "CC-BY 4.0",
            is_illustrative: true,
          },
        ]}
      />,
    );

    const list = within(screen.getByTestId("model-credits"));
    expect(list.getByRole("link", { name: "Toyota Fortuner 2026" })).toHaveAttribute(
      "href",
      "/armada/toyota-fortuner-2026",
    );
    expect(list.getByRole("link", { name: /Contoh/ })).toHaveAttribute(
      "href",
      "https://example.com/model",
    );
    expect(list.getByText(/CC-BY 4.0/)).toBeInTheDocument();
    expect(list.getByText("Model ilustrasi")).toBeInTheDocument();
    expect(screen.getByText("OpenStreetMap", { selector: "strong" })).toBeInTheDocument();
  });

  it("keeps the static credits when the model list is unavailable", () => {
    render(<CreditsView credits={null} />);
    expect(screen.getByText("Daftar model 3D belum tersedia.")).toBeInTheDocument();
    expect(screen.getByText("Lucide", { selector: "strong" })).toBeInTheDocument();
  });
});

describe("FAQ", () => {
  it("filters as the visitor types and announces the count", async () => {
    render(<FaqView />);
    const user = userEvent.setup();
    const total = FAQ_CATEGORIES.reduce((sum, category) => sum + category.items.length, 0);
    expect(screen.getByRole("status")).toHaveTextContent(`${total} pertanyaan`);

    await user.type(screen.getByRole("searchbox", { name: "Cari pertanyaan" }), "deposit");

    expect(screen.getByRole("status")).toHaveTextContent("1 pertanyaan");
    expect(screen.getByRole("button", { name: "Apakah ada deposit?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "GPS & Privasi" })).not.toBeInTheDocument();
  });

  it("shows an empty state that resets the search", async () => {
    render(<FaqView />);
    const user = userEvent.setup();
    const search = screen.getByRole("searchbox", { name: "Cari pertanyaan" });

    await user.type(search, "xyzzy");
    await user.click(screen.getByRole("button", { name: "Hapus pencarian" }));

    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Pemesanan" })).toBeInTheDocument();
  });

  it("opens answers with the keyboard", async () => {
    render(<FaqView />);
    const user = userEvent.setup();
    const question = screen.getByRole("button", { name: "Apakah mobil dilacak dengan GPS?" });

    question.focus();
    await user.keyboard("{Enter}");
    expect(question).toHaveAttribute("aria-expanded", "true");
  });

  it("matches accent-insensitively and requires every word", () => {
    expect(filterFaq(FAQ_CATEGORIES, "DÉPOSIT dikembalikan")).toHaveLength(1);
    expect(filterFaq(FAQ_CATEGORIES, "deposit xyzzy")).toHaveLength(0);
    expect(featuredFaq()).toHaveLength(5);
  });
});

describe("branches page", () => {
  it("lists branch cards with fleet links, phone and a supplementary map", () => {
    render(<BranchesView branches={[branch]} />);

    expect(screen.getByRole("heading", { level: 1, name: "Cabang RentACar" })).toBeInTheDocument();
    const cards = within(screen.getByRole("list", { name: "Daftar cabang" }));
    expect(cards.getByRole("link", { name: /Lihat armada cabang ini/ })).toHaveAttribute(
      "href",
      "/armada?branch=jakarta-selatan",
    );
    expect(cards.getByRole("link", { name: "6221000000" })).toHaveAttribute(
      "href",
      "tel:6221000000",
    );
    expect(cards.getByText("07:00–21:00 WIB")).toBeInTheDocument();
    expect(cards.getByRole("button", { name: "Lihat di peta" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Peta cabang (pelengkap daftar di bawah)" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state without branches", () => {
    render(<BranchesView branches={[]} />);
    expect(screen.getByText("Belum ada cabang yang bisa ditampilkan")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});

describe("about page", () => {
  it("labels the story as demo and shows statistics from the API", () => {
    render(
      <AboutView
        photo={car.thumbnail}
        stats={{ cars: 12, branches: 3, categories: 4, completed_bookings: 48 }}
        branches={[branch]}
      />,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Cerita fiktif — demo")).toBeInTheDocument();
    const stats = within(screen.getByTestId("info-stats"));
    expect(stats.getByText("Mobil siap sewa").nextElementSibling).toHaveTextContent("12");
    expect(screen.getByRole("link", { name: /Lihat Armada/ })).toHaveAttribute("href", "/armada");
    expect(screen.getByText("Jakarta Selatan")).toBeInTheDocument();
  });

  it("hides statistics when they could not be loaded", () => {
    render(<AboutView photo={null} stats={null} branches={null} />);
    expect(screen.queryByTestId("info-stats")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nilai layanan" })).toBeInTheDocument();
  });
});

describe("how to rent page", () => {
  it("shows the rental limits from settings", () => {
    render(<HowToRentView settings={settings} />);
    expect(screen.getByTestId("rental-limits")).toHaveTextContent("Durasi sewa 1–14 hari");
    expect(rentalLimits(settings.booking)[0]).toBe(
      "Pemesanan paling cepat 2 jam sebelum waktu ambil.",
    );
  });

  it("hides the limits when settings are unavailable", () => {
    render(<HowToRentView settings={null} />);
    expect(screen.queryByTestId("rental-limits")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cari mobil sekarang/ })).toHaveAttribute(
      "href",
      "/armada",
    );
  });
});
