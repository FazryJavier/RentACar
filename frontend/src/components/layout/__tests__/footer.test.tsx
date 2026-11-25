import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/layout/footer";
import { NEWSLETTER_ERROR, NEWSLETTER_TOAST } from "@/components/layout/newsletter-form";
import { renderWithProviders } from "../../../../tests/unit/render-with-providers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Footer", () => {
  it("links to the help pages and labels the site as a demo", () => {
    renderWithProviders(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const hrefs = within(footer)
      .getAllByRole("link", { hidden: true })
      .map((link) => link.getAttribute("href"));

    for (const href of [
      "/faq",
      "/syarat-ketentuan",
      "/kebijakan-privasi",
      "/kredit",
      "/armada",
      "/cara-sewa",
    ]) {
      expect(hrefs).toContain(href);
    }
    expect(within(footer).getByText(/Proyek demo/, { selector: "p" })).toHaveTextContent(
      "© 2026 RentACar — Proyek demo",
    );
  });

  it("has no links to external sites", () => {
    renderWithProviders(<Footer />);
    const links = within(screen.getByRole("contentinfo")).getAllByRole("link", { hidden: true });

    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^\//);
    }
  });

  it("rejects an invalid email without showing a toast", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Footer />);
    const input = screen.getByLabelText("Email");

    await user.type(input, "budi@");
    await user.click(screen.getByRole("button", { name: "Berlangganan" }));

    expect(screen.getByText(NEWSLETTER_ERROR)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveFocus();
    expect(screen.queryByText(NEWSLETTER_TOAST)).not.toBeInTheDocument();
  });

  it("rejects an empty email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Footer />);

    await user.click(screen.getByRole("button", { name: "Berlangganan" }));

    expect(screen.getByText(NEWSLETTER_ERROR)).toBeInTheDocument();
  });

  it("shows the simulation toast for a valid email without any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<Footer />);
    const input = screen.getByLabelText("Email");

    await user.type(input, "budi@example.test");
    await user.click(screen.getByRole("button", { name: "Berlangganan" }));

    expect(await screen.findByText(NEWSLETTER_TOAST)).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
