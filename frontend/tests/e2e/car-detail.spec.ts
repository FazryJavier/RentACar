import { expect, test, type Page } from "@playwright/test";

// Needs the backend with at least one active car (seed data). Skips itself when the catalog is empty.
test.beforeEach(async ({ request }) => {
  const response = await request.get("/api/v1/public/cars?per_page=12");
  const total = response.ok() ? ((await response.json()).meta?.total ?? 0) : 0;
  test.skip(total === 0, "No active cars in the catalog (run the seeders).");
});

async function openFirstCar(page: Page) {
  await page.goto("/armada");
  const card = page.locator("main a[href^='/armada/']").first();
  const name = (await card.locator("h3").textContent())!;
  await card.click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  return name;
}

/** Picks a range two to four days ahead with the keyboard in the given container. */
async function pickDates(page: Page, scope: ReturnType<Page["locator"]>) {
  await scope.getByRole("button", { name: /Waktu ambil & kembali/ }).click();
  const picker = page.getByRole("dialog", { name: "Pilih tanggal dan jam" });
  await expect(picker.locator('[role="gridcell"] button:focus')).toBeVisible();
  for (const key of ["ArrowRight", "ArrowRight", "Enter", "ArrowRight", "ArrowRight", "Enter"]) {
    await page.keyboard.press(key);
  }
  await picker.getByRole("button", { name: "Selesai" }).click();
}

test.describe("car detail page", () => {
  test("choosing dates shows the price breakdown and availability", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openFirstCar(page);
    const card = page.getByRole("complementary", { name: "Pesan mobil" });
    await expect(card.getByText("Pilih tanggal untuk melihat total harga.")).toBeVisible();

    await pickDates(page, card);

    await expect(card.getByText("Total")).toBeVisible();
    await expect(card.getByText(/^(Tersedia|Tidak tersedia)$/).first()).toBeVisible();
    await expect(page).toHaveURL(/pickup_at=.+&return_at=/);
  });

  test("without WebGL the gallery replaces the 3D viewer", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        return type.startsWith("webgl") ? null : original.call(this, type as "2d", ...(rest as []));
      } as typeof original;
    });
    await openFirstCar(page);

    await expect(page.getByText("Tampilan 3D tidak tersedia")).toBeVisible();
    await expect(page.getByRole("toolbar", { name: "Kontrol penampil 3D" })).toHaveCount(0);
  });

  test("on a 360 px screen the booking card opens from the bottom bar", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 });
    const name = await openFirstCar(page);
    await expect(page.getByRole("complementary", { name: "Pesan mobil" })).toBeHidden();

    await page.getByRole("button", { name: "Pilih tanggal" }).click();
    const sheet = page.getByRole("dialog", { name });
    await expect(sheet.getByRole("button", { name: /Waktu ambil & kembali/ })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("an unknown car shows the not-found page without indexing", async ({ page }) => {
    // With Cache Components the static shell is sent (200) before the car lookup, so the 404 UI
    // comes with a noindex tag rather than a 404 status (documented Next.js behaviour).
    await page.goto("/armada/mobil-yang-tidak-ada");
    await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await expect(page.getByRole("banner")).toHaveCount(1);
  });
});
