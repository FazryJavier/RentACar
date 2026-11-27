import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchForm } from "@/components/fleet/search-form";
import { branch } from "./fixtures";

const empty = { branch: null, pickupAt: null, returnAt: null };

describe("SearchForm", () => {
  it("keeps the dates disabled until a branch is chosen", () => {
    render(<SearchForm branches={[branch]} value={empty} onSubmit={vi.fn()} />);

    const dates = screen.getByRole("button", { name: /Waktu ambil & kembali/ });
    expect(dates).toBeDisabled();
    expect(dates).toHaveTextContent("Pilih cabang dulu");
  });

  it("restores the search from its value and shows the branch hours", () => {
    render(
      <SearchForm
        branches={[branch]}
        value={{
          branch: "jakarta-selatan",
          pickupAt: "2026-12-01T09:00:00+07:00",
          returnAt: "2026-12-03T09:00:00+07:00",
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Cabang" })).toHaveTextContent(
      "Jakarta Selatan · Jakarta",
    );
    expect(screen.getByRole("button", { name: /Waktu ambil & kembali/ })).toHaveTextContent(
      "1 Des 2026",
    );
    expect(screen.getByText("Jam operasional 07:00–21:00 WIB")).toBeInTheDocument();
  });

  it("submits the chosen branch", async () => {
    const onSubmit = vi.fn();
    render(<SearchForm branches={[branch]} value={empty} onSubmit={onSubmit} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Cabang" }));
    await user.click(await screen.findByRole("option", { name: "Jakarta Selatan · Jakarta" }));
    expect(screen.getByRole("button", { name: /Waktu ambil & kembali/ })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Cari" }));

    expect(onSubmit).toHaveBeenCalledWith({
      branch: "jakarta-selatan",
      pickupAt: null,
      returnAt: null,
    });
  });

  it("shows server errors on the matching fields", () => {
    render(
      <SearchForm
        branches={[branch]}
        value={empty}
        errors={{ branch: "Cabang tidak valid.", return_at: "Durasi sewa maksimal 30 hari." }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Cabang" })).toHaveAccessibleDescription(
      /Cabang tidak valid/,
    );
    expect(screen.getByText("Durasi sewa maksimal 30 hari.")).toBeInTheDocument();
  });
});
