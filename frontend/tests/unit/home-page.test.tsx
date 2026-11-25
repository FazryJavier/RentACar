import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/(public)/page";

describe("HomePage", () => {
  it("shows the in-development placeholder and the demo notice", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /RentACar — dalam pengembangan/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Semua transaksi adalah simulasi/)).toBeInTheDocument();
  });
});
