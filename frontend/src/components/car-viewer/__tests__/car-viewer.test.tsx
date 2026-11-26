import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CarViewer, hasWebGL } from "@/components/car-viewer";

describe("CarViewer", () => {
  it("detects that jsdom has no WebGL", () => {
    expect(hasWebGL()).toBe(false);
  });

  it("shows the fallback without WebGL instead of loading three.js", async () => {
    render(<CarViewer url="/storage/cars/1/models/a.glb" fallback={<p>Galeri foto</p>} />);

    expect(await screen.findByText("Galeri foto")).toBeInTheDocument();
  });
});
