import { expect, test } from "@playwright/test";

// The component gallery only exists while running `npm run dev`.
test.describe("/dev/ui component gallery", () => {
  test("dialog traps focus and returns it to the trigger", async ({ page }) => {
    await page.goto("/dev/ui");
    const trigger = page.getByRole("button", { name: "Hapus mobil" });

    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Hapus mobil ini?" });
    await expect(dialog).toBeVisible();

    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("focused controls show the focus ring", async ({ page }) => {
    await page.goto("/dev/ui");
    const button = page.getByRole("button", { name: "Sewa Sekarang" });

    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");

    await expect(button).toBeFocused();
    const shadow = await button.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain("rgb(58, 109, 176)");
  });

  test("reduced motion turns the dialog animation into a short fade", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dev/ui");
    await page.getByRole("button", { name: "Hapus mobil" }).click();

    const animation = await page.getByRole("dialog").evaluate((el) => ({
      name: getComputedStyle(el).animationName,
      duration: getComputedStyle(el).animationDuration,
    }));

    expect(animation.name).toBe("fade-in");
    expect(parseFloat(animation.duration)).toBeLessThanOrEqual(0.15);
  });

  test("radio group selects with arrow keys", async ({ page }) => {
    await page.goto("/dev/ui");
    await page.getByRole("radio", { name: "Ambil di cabang" }).focus();
    // Radix selects on the focus caused by a held arrow key; an instant press/release can finish
    // before focus moves, so hold the key like a person would.
    await page.keyboard.down("ArrowDown");
    await expect(page.getByRole("radio", { name: "Antar ke alamat" })).toBeFocused();
    await page.keyboard.up("ArrowDown");

    await expect(page.getByRole("radio", { name: "Antar ke alamat" })).toBeChecked();
  });

  for (const width of [360, 768, 1280]) {
    test(`has no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/dev/ui");

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
