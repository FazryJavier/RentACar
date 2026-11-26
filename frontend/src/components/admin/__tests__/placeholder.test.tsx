import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/admin/(panel)/[...section]/page";
import { mockApi, ok, staffFixture } from "../../../../tests/unit/api-mock";
import { nav } from "../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../tests/unit/render-with-providers";

vi.mock("next/navigation", async () => {
  const { navigationModule } = await import("../../../../tests/unit/navigation-mock");
  return {
    ...navigationModule(),
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
  };
});

describe("admin section placeholder", () => {
  it("renders 'Segera hadir' for a known module to a signed-in admin", async () => {
    nav.reset("/admin/mobil");
    mockApi({ "GET /admin/me": { status: 200, body: ok(staffFixture) } });
    renderWithProviders(await Page({ params: Promise.resolve({ section: ["mobil"] }) }));

    expect(await screen.findByRole("heading", { name: "Segera hadir" })).toBeInTheDocument();
    expect(screen.getByText(/Modul Mobil sedang dibangun/)).toBeInTheDocument();
  });

  it("is a 404 for unknown sections", async () => {
    await expect(Page({ params: Promise.resolve({ section: ["tidak-ada"] }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
