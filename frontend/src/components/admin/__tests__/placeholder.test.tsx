import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/admin/(panel)/[...section]/page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("admin section placeholder", () => {
  it("renders 'Segera hadir' for a known module", async () => {
    render(await Page({ params: Promise.resolve({ section: ["mobil"] }) }));

    expect(screen.getByRole("heading", { name: "Segera hadir" })).toBeInTheDocument();
    expect(screen.getByText(/Modul Mobil sedang dibangun/)).toBeInTheDocument();
  });

  it("is a 404 for unknown sections", async () => {
    await expect(Page({ params: Promise.resolve({ section: ["tidak-ada"] }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
