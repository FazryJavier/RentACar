import { expect, test } from "@playwright/test";

// Needs the backend with seed data (branches, categories and at least one active car); the
// data-dependent parts skip themselves when the catalog is empty.

test.describe("home page", () => {
  test("renders the hero with its single h1 and the search form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("nyaman");
    await expect(page.getByRole("link", { name: /Lihat Armada/ })).toHaveAttribute(
      "href",
      "/armada",
    );
    await expect(page.getByRole("search", { name: "Cari mobil" })).toBeVisible();
  });

  test("search goes to the fleet page with the same parameters", async ({ page, request }) => {
    const branches = await request.get("/api/v1/public/branches");
    const list = branches.ok() ? (await branches.json()).data : [];
    test.skip(list.length === 0, "No active branches (run the seeders).");

    await page.goto("/");
    const form = page.getByRole("search", { name: "Cari mobil" });
    await form.getByRole("combobox", { name: "Cabang" }).click();
    await page.getByRole("option").first().click();

    await form.getByRole("button", { name: /Waktu ambil & kembali/ }).click();
    const picker = page.getByRole("dialog", { name: "Pilih tanggal dan jam" });
    await expect(picker.locator('[role="gridcell"] button:focus')).toBeVisible();
    for (const key of ["ArrowRight", "ArrowRight", "Enter", "ArrowRight", "ArrowRight", "Enter"]) {
      await page.keyboard.press(key);
    }
    await picker.getByRole("button", { name: "Selesai" }).click();
    await form.getByRole("button", { name: "Cari" }).click();

    await expect(page).toHaveURL((url) => {
      const params = url.searchParams;
      return (
        url.pathname === "/armada" &&
        params.get("branch") === list[0].slug &&
        Boolean(params.get("pickup_at")) &&
        Boolean(params.get("return_at"))
      );
    });
  });

  test("a category chip opens the filtered fleet page", async ({ page, request }) => {
    const categories = await request.get("/api/v1/public/categories");
    const list = categories.ok() ? (await categories.json()).data : [];
    test.skip(list.length === 0, "No categories (run the seeders).");

    await page.goto("/");
    await page.getByRole("link", { name: list[0].name, exact: true }).click();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/armada" && url.search === `?category=${list[0].slug}`,
    );
  });

  test("has no horizontal scroll at 360 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
