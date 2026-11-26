import { expect, test, type Page } from "@playwright/test";

// Needs the backend with seed data (brands, categories) and an admin account from the environment
// (never committed): E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD. Photo processing needs a queue worker,
// so this spec only checks upload, order and delete, not the processed images.
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.");

async function login(page: Page, path: string) {
  await page.goto(path);
  await expect(async () => {
    await page.getByLabel(/^Email/).fill(email!);
    await page.getByLabel(/^Kata sandi/).fill(password!);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`), { timeout: 5000 });
  }).toPass({ timeout: 30_000 });
}

async function chooseFirst(page: Page, label: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option").first().click();
}

/** A real JPEG drawn in the page (no binary fixture in the repository). */
async function jpeg(page: Page, color: string): Promise<Buffer> {
  const base64 = await page.evaluate(async (fill) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 500;
    const context = canvas.getContext("2d")!;
    context.fillStyle = fill;
    context.fillRect(0, 0, 800, 500);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8),
    );
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return btoa(String.fromCharCode(...bytes));
  }, color);
  return Buffer.from(base64, "base64");
}

test("admin adds a car with photos, reorders and deletes them, then deletes the car", async ({
  page,
}) => {
  const suffix = String(Date.now() % 10000).padStart(4, "0");
  const plate = `B ${suffix} UJ`;
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, "/admin/mobil/baru");

  await chooseFirst(page, "Merek");
  await chooseFirst(page, "Kategori");
  if (await page.getByRole("combobox", { name: "Cabang" }).isVisible()) {
    await chooseFirst(page, "Cabang");
  }
  await page.getByRole("textbox", { name: "Model", exact: true }).fill("E2E Uji");
  await page.getByLabel(/^Warna/).fill("Merah");
  await page.getByLabel(/^Plat nomor/).fill(plate.toLowerCase());
  // In `next dev` the dev-tools badge can cover the bottom-right button: submit with Enter.
  await page.getByLabel(/^Plat nomor/).press("Enter");

  await expect(page).toHaveURL(/\/admin\/mobil\/\d+$/, { timeout: 15_000 });
  await expect(page.getByText(plate, { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: /^Foto/ }).click();
  await page.getByTestId("file-dropzone-input").setInputFiles([
    { name: "depan.jpg", mimeType: "image/jpeg", buffer: await jpeg(page, "#1b2838") },
    { name: "samping.jpg", mimeType: "image/jpeg", buffer: await jpeg(page, "#3a6db0") },
  ]);
  const tiles = page.getByRole("list", { name: "Foto mobil" }).getByRole("listitem");
  await expect(tiles).toHaveCount(2, { timeout: 15_000 });
  await expect(page.getByText("2/5 foto", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Geser ke kiri: foto 2" }).click();
  await expect(page.getByText("Foto 2 dipindah ke posisi 1 (foto utama).")).toBeAttached();

  await page.getByRole("button", { name: "Hapus foto 2" }).click();
  await page
    .getByRole("dialog", { name: "Hapus foto ini?" })
    .getByRole("button", { name: "Hapus" })
    .click();
  await expect(tiles).toHaveCount(1);

  await page.goto("/admin/mobil");
  await page.getByLabel("Cari model, plat, atau merek").fill(suffix);
  const row = page.getByRole("row").filter({ hasText: plate });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /^Aksi untuk / }).click();
  await page.getByRole("menuitem", { name: "Hapus" }).click();
  await page
    .getByRole("dialog", { name: "Hapus mobil ini?" })
    .getByRole("button", { name: "Hapus" })
    .click();
  await expect(page.getByText("Mobil dihapus", { exact: true })).toBeVisible();
  await expect(row).toBeHidden();
});
