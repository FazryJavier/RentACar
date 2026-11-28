import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ViewerApi } from "@/components/car-viewer";
import { ViewerControls } from "@/components/car-viewer/viewer-controls";

function api(): ViewerApi {
  return {
    getCamera: vi.fn(),
    capturePoster: vi.fn(),
    setView: vi.fn(),
    reset: vi.fn(),
    zoom: vi.fn(),
    rotate: vi.fn(),
    focusHotspot: vi.fn(),
  };
}

describe("ViewerControls", () => {
  it("moves the camera with presets, zoom and reset", async () => {
    const viewer = api();
    const ref = { current: viewer };
    render(<ViewerControls api={ref} container={createRef()} disabled={false} />);
    const user = userEvent.setup();

    expect(screen.getByRole("toolbar", { name: "Kontrol penampil 3D" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Belakang" }));
    expect(viewer.setView).toHaveBeenCalledWith("back");
    await user.click(screen.getByRole("button", { name: "Interior" }));
    expect(viewer.setView).toHaveBeenCalledWith("interior");
    await user.click(screen.getByRole("button", { name: "Perbesar" }));
    expect(viewer.zoom).toHaveBeenCalledWith(0.8);
    await user.click(screen.getByRole("button", { name: "Atur ulang tampilan" }));
    expect(viewer.reset).toHaveBeenCalled();
  });

  it("disables navigation until the model is loaded and hides fullscreen when unsupported", () => {
    render(<ViewerControls api={{ current: api() }} container={createRef()} disabled />);

    expect(screen.getByRole("button", { name: "Depan" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Layar penuh" })).not.toBeInTheDocument();
  });
});
