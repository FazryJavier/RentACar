import { expect, test, type Locator, type Page } from "@playwright/test";

// Needs the backend with seed data. Credentials come from the environment and are never committed:
// E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (any admin) and, for the write flows,
// E2E_SUPER_ADMIN_EMAIL / E2E_SUPER_ADMIN_PASSWORD. Each part is skipped without its credentials.
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const superAdmin = {
  email: process.env.E2E_SUPER_ADMIN_EMAIL,
  password: process.env.E2E_SUPER_ADMIN_PASSWORD,
};

async function login(page: Page, account: { email?: string; password?: string }, path: string) {
  await page.goto(path);
  // The first visit may still be compiling in `next dev`; retry until the hydrated form submits.
  await expect(async () => {
    await page.getByLabel(/^Email/).fill(account.email!);
    await page.getByLabel(/^Kata sandi/).fill(account.password!);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`), { timeout: 5000 });
  }).toPass({ timeout: 30_000 });
}

/**
 * Submits a form sheet with Enter in its name field (keyboard path). In `next dev` the dev-tools
 * badge sits over the sheet's bottom-right "Simpan" button, so a pointer click can be blocked.
 */
async function save(sheet: Locator) {
  await sheet.getByLabel(/^Nama /).press("Enter");
}

test.describe("master data (any admin)", () => {
  test.skip(!admin.email || !admin.password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.");

  test("brand list keeps search and sort in the URL", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page, admin, "/admin/merek");

    await expect(page.getByRole("cell", { name: "Toyota", exact: true })).toBeVisible();
    await page.getByLabel("Cari merek").fill("toy");
    await expect(page).toHaveURL(/q=toy/);
    await expect(page.getByRole("cell", { name: "Toyota", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Honda", exact: true })).toBeHidden();

    await page.getByRole("button", { name: /^Nama/ }).click();
    await expect(page).toHaveURL(/sort=-name/);
    await expect(page.getByRole("columnheader", { name: /Nama/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );

    await page.reload();
    await expect(page.getByLabel("Cari merek")).toHaveValue("toy");
  });

  test("tables do not scroll the page at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await login(page, admin, "/admin/merek");
    await expect(page.getByRole("cell", { name: "Toyota", exact: true })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("staff see branches read-only", async ({ page }) => {
    await login(page, admin, "/admin/cabang");
    const role = await page.evaluate(async () => {
      const response = await fetch("/api/v1/admin/me", { headers: { Accept: "application/json" } });
      return ((await response.json()) as { data: { role: string } }).data.role;
    });
    test.skip(role !== "staff", "E2E_ADMIN is not a staff account.");

    await expect(page.getByRole("button", { name: "Tambah cabang" })).toBeHidden();
    await page
      .getByRole("button", { name: /^Aksi untuk / })
      .first()
      .click();
    await expect(page.getByRole("menuitem", { name: "Ubah" })).toBeHidden();
    await page.getByRole("menuitem", { name: "Lihat detail" }).click();
    await expect(
      page.getByText("Hanya Super Admin yang dapat mengubah data cabang."),
    ).toBeVisible();
  });
});

test.describe("master data (Super Admin)", () => {
  test.skip(
    !superAdmin.email || !superAdmin.password,
    "Set E2E_SUPER_ADMIN_EMAIL and E2E_SUPER_ADMIN_PASSWORD.",
  );

  test("creates, edits and deletes a category", async ({ page }) => {
    const name = `Uji E2E ${Date.now() % 100000}`;
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page, superAdmin, "/admin/kategori");

    await page.getByRole("button", { name: "Tambah kategori" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Tambah kategori" });
    await sheet.getByLabel(/Nama kategori/).fill(name);
    await sheet.getByLabel(/Urutan/).fill("900");
    await save(sheet);
    await expect(page.getByText("Kategori disimpan", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Aksi untuk ${name}` }).click();
    await page.getByRole("menuitem", { name: "Ubah" }).click();
    const edit = page.getByRole("dialog", { name: "Ubah kategori" });
    await edit.getByLabel(/Deskripsi/).fill("Dibuat oleh tes E2E");
    await save(edit);
    await expect(
      page.getByRole("cell", { name: "Dibuat oleh tes E2E", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: `Aksi untuk ${name}` }).click();
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    await page
      .getByRole("dialog", { name: "Hapus kategori ini?" })
      .getByRole("button", { name: "Hapus" })
      .click();
    await expect(page.getByText("Kategori dihapus", { exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name, exact: true })).toBeHidden();
  });

  test("a stale edit gets a version conflict", async ({ page, browser }) => {
    const name = `Konflik ${Date.now() % 100000}`;
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page, superAdmin, "/admin/kategori");
    await page.getByRole("button", { name: "Tambah kategori" }).first().click();
    await page
      .getByRole("dialog")
      .getByLabel(/Nama kategori/)
      .fill(name);
    await save(page.getByRole("dialog"));
    await expect(page.getByText("Kategori disimpan", { exact: true })).toBeVisible();

    // Open the edit form here, then change the same category from a second session.
    await page.getByRole("button", { name: `Aksi untuk ${name}` }).click();
    await page.getByRole("menuitem", { name: "Ubah" }).click();
    const other = await (await browser.newContext()).newPage();
    await login(other, superAdmin, "/admin/kategori");
    await other.getByRole("button", { name: `Aksi untuk ${name}` }).click();
    await other.getByRole("menuitem", { name: "Ubah" }).click();
    await other
      .getByRole("dialog")
      .getByLabel(/Deskripsi/)
      .fill("Sesi lain");
    await save(other.getByRole("dialog"));
    await expect(other.getByText("Kategori disimpan", { exact: true })).toBeVisible();

    const sheet = page.getByRole("dialog", { name: "Ubah kategori" });
    await sheet.getByLabel(/Deskripsi/).fill("Sesi ini");
    await save(sheet);
    await expect(sheet.getByText("Data sudah diubah admin lain.")).toBeVisible();
    await sheet.getByRole("button", { name: "Muat ulang" }).click();
    await expect(sheet.getByLabel(/Deskripsi/)).toHaveValue("Sesi lain");
    await save(sheet);
    await expect(page.getByText("Kategori disimpan", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Aksi untuk ${name}` }).click();
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus" }).click();
    await expect(page.getByText("Kategori dihapus", { exact: true })).toBeVisible();
  });
});
