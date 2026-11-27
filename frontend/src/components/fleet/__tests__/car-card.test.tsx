import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CarCard } from "@/components/fleet/car-card";
import { car, estimate } from "./fixtures";

describe("CarCard", () => {
  it.each(["default", "list", "compact", "mini"] as const)(
    "renders the %s variant as one link",
    (variant) => {
      render(<CarCard car={car} href="/armada/toyota-fortuner-2026" variant={variant} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/armada/toyota-fortuner-2026");
      expect(link).toHaveTextContent("Toyota Fortuner 2026");
      if (variant !== "mini") {
        expect(link).toHaveTextContent("Rp950.000");
      }
    },
  );

  it("shows specs, category, 3D chip and the image", () => {
    render(<CarCard car={car} href="/x" />);

    expect(screen.getByText("SUV")).toBeInTheDocument();
    expect(screen.getByText("3D")).toBeInTheDocument();
    expect(screen.getByText("Otomatis")).toBeInTheDocument();
    expect(screen.getByText("7 kursi")).toBeInTheDocument();
    expect(screen.getByText("Diesel")).toBeInTheDocument();
    const image = screen.getByRole("img", { name: "Toyota Fortuner 2026" });
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("srcset", car.thumbnail!.srcset);
  });

  it("shows the estimate only when dates were searched", () => {
    const { rerender } = render(<CarCard car={car} href="/x" />);
    expect(screen.queryByText(/Estimasi total/)).not.toBeInTheDocument();

    rerender(<CarCard car={{ ...car, estimate }} href="/x" />);
    expect(
      screen.getByText(/Estimasi total Rp2\.400\.000 · 2 hari, termasuk deposit/),
    ).toBeInTheDocument();
  });
});
