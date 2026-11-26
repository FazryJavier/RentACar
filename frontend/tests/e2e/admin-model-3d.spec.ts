import { expect, test, type Page } from "@playwright/test";
import { carGlb } from "./support/glb";

// Needs the backend and an admin account from the environment (never committed):
// E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD, plus brands/categories from the seed. Skipped without
// WebGL (some headless environments have none).
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

test("admin uploads a model, places and resolves a marker, and logs an inspection", async ({
  page,
}) => {
  const suffix = String(Date.now() % 10000).padStart(4, "0");
  const plate = `B ${suffix} TD`;
  await page.setViewportSize({ width: 1280, height: 1000 });
  await login(page, "/admin/mobil/baru");

  const webgl = await page.evaluate(() =>
    Boolean(document.createElement("canvas").getContext("webgl")),
  );
  test.skip(!webgl, "WebGL is not available in this browser.");

  await chooseFirst(page, "Merek");
  await chooseFirst(page, "Kategori");
  if (await page.getByRole("combobox", { name: "Cabang" }).isVisible()) {
    await chooseFirst(page, "Cabang");
  }
  await page.getByRole("textbox", { name: "Model", exact: true }).fill("E2E 3D");
  await page.getByLabel(/^Warna/).fill("Biru");
  await page.getByLabel(/^Plat nomor/).fill(plate);
  await page.getByLabel(/^Plat nomor/).press("Enter");
  await expect(page).toHaveURL(/\/admin\/mobil\/\d+$/, { timeout: 15_000 });

  await page.getByRole("tab", { name: "Model 3D & Kondisi" }).click();
  await page
    .getByLabel(/File model/)
    .setInputFiles({ name: "mobil.glb", mimeType: "model/gltf-binary", buffer: carGlb() });
  await page.getByLabel(/^Sumber model/).fill("RentACar E2E");
  await page.getByLabel(/^Lisensi/).fill("CC0-1.0");
  await page.getByRole("button", { name: "Unggah model" }).click();
  await expect(page.getByText("Model 3D diunggah", { exact: true })).toBeVisible();

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500); // let the model load and the camera frame it

  await page.getByRole("button", { name: "Tambah penanda" }).click();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByRole("button", { name: "Penanda baru" })).toBeVisible();

  const newMarker = page.getByRole("region", { name: "Penanda baru" });
  await newMarker.getByRole("combobox", { name: "Area" }).click();
  await page.getByRole("option", { name: "Kiri" }).click();
  await newMarker.getByRole("combobox", { name: "Tingkat" }).click();
  await page.getByRole("option", { name: "Ringan" }).click();
  await newMarker.getByRole("textbox", { name: "Deskripsi" }).fill("Baret halus uji E2E");
  await newMarker.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByText("Penanda disimpan", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Penanda 1: Kiri, ringan" })).toBeVisible();

  const marker = page.getByRole("region", { name: "Penanda 1" });
  await marker.getByLabel("Sudah diperbaiki").click();
  await marker.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("list", { name: "Daftar penanda" })).toBeHidden();

  await page.getByLabel(/^Kilometer/).fill("12345");
  await page.getByRole("button", { name: "Catat inspeksi" }).click();
  await expect(page.getByText(/12\.345 km/)).toBeVisible();

  // Clean up: delete the test car.
  await page.goto("/admin/mobil");
  await page.getByLabel("Cari model, plat, atau merek").fill(suffix);
  const row = page.getByRole("row").filter({ hasText: plate });
  await row.getByRole("button", { name: /^Aksi untuk / }).click();
  await page.getByRole("menuitem", { name: "Hapus" }).click();
  await page
    .getByRole("dialog", { name: "Hapus mobil ini?" })
    .getByRole("button", { name: "Hapus" })
    .click();
  await expect(page.getByText("Mobil dihapus", { exact: true })).toBeVisible();
});
