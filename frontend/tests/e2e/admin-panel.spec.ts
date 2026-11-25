import { expect, test } from "@playwright/test";

// Needs the backend and an existing admin. Credentials come from the environment and are never
// committed: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD. Skipped when they are not set.
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.skip(
  !email || !password,
  "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run the admin panel E2E.",
);

test("admin logs in, uses the sidebar, collapses it and logs out", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/admin/profil");
  await expect(page).toHaveURL(/\/admin\/masuk\?next=%2Fadmin%2Fprofil$/);

  await page.getByLabel(/^Email/).fill(email!);
  await page.getByLabel(/^Kata sandi/).fill(password!);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/admin\/profil$/);

  const nav = page.getByRole("navigation", { name: "Menu admin" });
  await nav.getByRole("link", { name: "Mobil" }).click();
  await expect(page.getByRole("heading", { name: "Segera hadir" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Mobil" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: "Ciutkan sidebar" }).click();
  await expect(page.locator("aside")).toHaveCSS("width", "72px");
  await page.getByRole("button", { name: "Bentangkan sidebar" }).click();
  await expect(page.locator("aside")).toHaveCSS("width", "264px");

  // The dev server may re-render while it compiles other routes, closing the menu: retry.
  await expect(async () => {
    await page.getByRole("button", { name: /^Akun / }).click();
    await page.getByRole("menuitem", { name: "Keluar" }).click({ timeout: 3000 });
  }).toPass({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/admin\/masuk$/);
});

test("admin drawer works below 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/admin/masuk");
  await page.getByLabel(/^Email/).fill(email!);
  await page.getByLabel(/^Kata sandi/).fill(password!);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  const toggle = page.getByRole("button", { name: "Buka menu admin" });
  await toggle.click();
  await expect(page.getByRole("dialog", { name: "Menu admin" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(toggle).toBeFocused();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
