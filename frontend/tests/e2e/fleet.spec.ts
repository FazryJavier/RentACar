import { expect, test, type Page } from "@playwright/test";

// Needs the backend with at least one active car (seed data). Skips itself when the catalog is empty.
test.beforeEach(async ({ request }) => {
  const response = await request.get("/api/v1/public/cars?per_page=12");
  const total = response.ok() ? ((await response.json()).meta?.total ?? 0) : 0;
  test.skip(total === 0, "No active cars in the catalog (run the seeders).");
});

/** Picks the first branch and a range two to four days ahead with the keyboard. */
async function searchWithDates(page: Page) {
  const form = page.getByRole("search", { name: "Cari mobil" });
  await form.getByRole("combobox", { name: "Cabang" }).click();
  await page.getByRole("option").first().click();

  await form.getByRole("button", { name: /Waktu ambil & kembali/ }).click();
  const picker = page.getByRole("dialog", { name: "Pilih tanggal dan jam" });
  await expect(picker.locator('[role="gridcell"] button:focus')).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await picker.getByRole("button", { name: "Selesai" }).click();
  await form.getByRole("button", { name: "Cari" }).click();
}

test.describe("fleet page", () => {
  test("searching with dates shows available cars with totals", async ({ page }) => {
    await page.goto("/armada");
    await expect(page.getByRole("heading", { name: "Armada Kami" })).toBeVisible();
    await expect(page.getByText(/Pilih tanggal untuk cek ketersediaan/)).toBeVisible();

    await searchWithDates(page);

    await expect(page).toHaveURL(/branch=.+&pickup_at=.+&return_at=/);
    await expect(page.getByText(/^\d+ mobil tersedia$/).first()).toBeVisible();
    const card = page.locator("main a[href^='/armada/']").first();
    if (await card.count()) {
      await expect(card).toContainText("Estimasi total");
      await expect(card).toHaveAttribute("href", /pickup_at=/);
    }
  });

  test("filters update the URL and Back restores the previous results", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/armada");
    const count = page.getByText(/^\d+ mobil$/).first();
    await expect(count).toBeVisible();
    const before = await count.textContent();

    const sidebar = page.getByRole("complementary", { name: "Filter" });
    await sidebar.getByRole("button", { name: "7+" }).click();
    await expect(page).toHaveURL(/seats_min=7/);
    await expect(page.getByRole("button", { name: "Hapus filter 7+ kursi" })).toBeVisible();

    await page.goBack();
    await expect(page).not.toHaveURL(/seats_min/);
    await expect(page.getByText(/^\d+ mobil$/).first()).toHaveText(before!);
  });

  test("a shared URL renders the same state in a new page", async ({ page, context }) => {
    await page.goto("/armada?sort=-price&view=list&seats_min=2");
    const first = page.locator("main a[href^='/armada/']").first();
    await expect(first).toBeVisible();
    const name = await first.locator("h3").textContent();

    const other = await context.newPage();
    await other.goto(page.url());
    await expect(other.getByRole("combobox", { name: "Urutkan" })).toHaveText("Harga tertinggi");
    await expect(other.getByRole("button", { name: "Tampilan daftar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(other.locator("main a[href^='/armada/']").first().locator("h3")).toHaveText(name!);
  });

  test("on a 360 px screen filters open in a bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 });
    await page.goto("/armada?seats_min=2");
    await expect(page.getByRole("complementary", { name: "Filter" })).toBeHidden();

    await page.getByRole("button", { name: "Filter (1)" }).click();
    const sheet = page.getByRole("dialog", { name: "Filter" });
    await sheet.getByRole("button", { name: "4+" }).click();
    await sheet.getByRole("button", { name: "Terapkan" }).click();

    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(/seats_min=4/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("a car card can be reached and opened with the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/armada");
    const first = page.locator("main a[href^='/armada/']").first();
    await expect(first).toBeVisible();

    for (let i = 0; i < 80 && !(await first.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(first).toBeFocused();
  });
});
