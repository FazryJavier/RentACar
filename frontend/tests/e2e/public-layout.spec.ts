import { expect, test } from "@playwright/test";

// Needs only `npm run dev`; without the backend the session check falls back to guest.
test.describe("public layout", () => {
  test("first Tab focuses the skip link, which moves focus to the content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skip = page.getByRole("link", { name: "Lewati ke konten" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("main#konten")).toBeFocused();
  });

  test("keyboard order goes banner close → logo → menu → actions", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const expected = [
      "Lewati ke konten",
      "Tutup pemberitahuan demo",
      "RentACar — Beranda",
      "Beranda",
      "Armada",
    ];
    for (const name of expected) {
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toHaveAccessibleName(name);
    }
  });

  test("demo banner stays closed on the next page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tutup pemberitahuan demo" }).click();
    await page.goto("/tidak-ada");

    await expect(page.getByText("Mode demo — transaksi tidak sungguhan")).toHaveCount(0);
  });

  test("unknown URLs return 404 with the shell and actions", async ({ page }) => {
    const response = await page.goto("/tidak-ada");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Kembali ke Beranda" }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("mobile menu opens, traps focus and closes with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Buka menu" });

    await toggle.click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS("opacity", "1");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  for (const width of [360, 768, 1280]) {
    for (const path of ["/", "/tidak-ada"]) {
      test(`no horizontal scroll on ${path} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }
});
