import { expect, test } from "@playwright/test";

// Needs the backend (branches from the seeders for the branch test; it skips without them).

const PAGES = [
  { path: "/tentang-kami", heading: "Tentang RentACar" },
  { path: "/cabang", heading: "Cabang RentACar" },
  { path: "/cara-sewa", heading: "Cara Sewa" },
  { path: "/faq", heading: "Pertanyaan yang Sering Diajukan" },
  { path: "/syarat-ketentuan", heading: "Syarat & Ketentuan" },
  { path: "/kebijakan-privasi", heading: "Kebijakan Privasi" },
  { path: "/kredit", heading: "Kredit" },
];

test.describe("info pages", () => {
  for (const { path, heading } of PAGES) {
    test(`${path} renders one h1 without horizontal scroll at 360 px`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("FAQ search filters the questions", async ({ page }) => {
    await page.goto("/faq");
    await page.getByRole("searchbox", { name: "Cari pertanyaan" }).fill("deposit");
    await expect(page.getByRole("status").filter({ hasText: "pertanyaan" })).toHaveText(
      "1 pertanyaan",
    );
    await page.getByRole("button", { name: "Apakah ada deposit?" }).click();
    await expect(page.getByText(/dikembalikan setelah mobil kembali/)).toBeVisible();
  });

  test("a branch card links to its fleet and the map shows the attribution", async ({
    page,
    request,
  }) => {
    const response = await request.get("/api/v1/public/branches");
    const branches = response.ok() ? (await response.json()).data : [];
    test.skip(branches.length === 0, "No active branches (run the seeders).");

    await page.goto("/cabang");
    await expect(page.getByRole("link", { name: "OpenStreetMap" })).toBeVisible();
    await page
      .getByRole("link", { name: /Lihat armada cabang ini/ })
      .first()
      .click();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/armada" && url.searchParams.get("branch") === branches[0].slug,
    );
  });
});
