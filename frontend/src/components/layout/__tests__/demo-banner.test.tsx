import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_BANNER_KEY, DemoBanner } from "@/components/layout/demo-banner";

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DemoBanner", () => {
  it("shows the demo notice in a new session", () => {
    render(<DemoBanner />);

    expect(screen.getByText("Mode demo — transaksi tidak sungguhan")).toBeInTheDocument();
  });

  it("stays closed for the rest of the session after dismissal", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<DemoBanner />);

    await user.click(screen.getByRole("button", { name: "Tutup pemberitahuan demo" }));
    expect(screen.queryByText(/Mode demo/)).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(DEMO_BANNER_KEY)).toBe("1");

    // Simulates navigating to another page: a fresh mount reads the session flag.
    unmount();
    render(<DemoBanner />);
    expect(screen.queryByText(/Mode demo/)).not.toBeInTheDocument();
  });

  it("is hidden when the session flag is already set", () => {
    window.sessionStorage.setItem(DEMO_BANNER_KEY, "1");
    render(<DemoBanner />);

    expect(screen.queryByText(/Mode demo/)).not.toBeInTheDocument();
  });

  it("still renders and closes when storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    // Fresh module state: the in-memory fallback must not carry over from earlier tests.
    vi.resetModules();
    const { DemoBanner: FreshBanner } = await import("@/components/layout/demo-banner");
    const user = userEvent.setup();
    render(<FreshBanner />);

    expect(screen.getByText(/Mode demo/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tutup pemberitahuan demo" }));
    expect(screen.queryByText(/Mode demo/)).not.toBeInTheDocument();
  });
});
