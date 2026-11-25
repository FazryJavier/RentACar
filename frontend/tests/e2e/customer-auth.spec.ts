import { expect, test, type Page } from "@playwright/test";

// Needs the backend (`composer dev`) with a migrated database and `npm run dev`.
// Each run registers a fresh fictional customer (@example.test).

const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const email = `e2e-${stamp}@example.test`;
const password = `Demo${stamp}a`;
const newPassword = `Baru${stamp}b`;

async function logout(page: Page) {
  await page.getByRole("button", { name: /^Akun / }).click();
  await page.getByRole("menuitem", { name: "Keluar" }).click();
  await expect(page.getByRole("link", { name: "Masuk", exact: true })).toBeVisible();
}

async function login(page: Page, secret: string) {
  await page
    .getByRole("main")
    .getByLabel(/^Email/)
    .fill(email);
  await page
    .getByRole("main")
    .getByLabel(/^Kata sandi/)
    .fill(secret);
  await page.getByRole("button", { name: "Masuk" }).click();
}

test.describe.configure({ mode: "serial", timeout: 90_000 });

test("register, log out, log in, update profile and change password", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  // Protected page without a session → login with next.
  await page.goto("/profil");
  await expect(page).toHaveURL(/\/masuk\?next=%2Fprofil$/);

  // Register.
  await page.goto("/daftar");
  await page
    .getByRole("main")
    .getByLabel(/Nama lengkap/)
    .fill("Pelanggan Uji");
  await page
    .getByRole("main")
    .getByLabel(/^Email/)
    .fill(email);
  await page
    .getByRole("main")
    .getByLabel(/No\. HP/)
    .fill("0812 3456 7890");
  await page
    .getByRole("main")
    .getByLabel(/^Kata sandi/)
    .fill(password);
  await page
    .getByRole("main")
    .getByLabel(/Konfirmasi kata sandi/)
    .fill(password);
  await page.getByRole("button", { name: "Daftar" }).click();
  await expect(page.getByRole("button", { name: "Akun Pelanggan" })).toBeVisible();

  // Log out, then a wrong password, then log in returning to the profile.
  await logout(page);
  await page.goto("/masuk?next=/profil");
  await login(page, "salah12345x");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Email atau kata sandi salah.",
  );
  await login(page, password);
  await expect(page).toHaveURL(/\/profil$/);

  // Update profile.
  await page
    .getByRole("main")
    .getByLabel(/No\. HP/)
    .fill("+62 812 0000 1111");
  await page
    .getByRole("main")
    .getByLabel(/Nomor SIM/)
    .fill("ab1234567890");
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await expect(page.getByText("Profil disimpan", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByLabel(/No\. HP/)).toHaveValue("6281200001111");

  // Change password.
  await page.getByRole("tab", { name: "Ubah kata sandi" }).click();
  await page
    .getByRole("main")
    .getByLabel(/Kata sandi lama/)
    .fill(password);
  await page
    .getByRole("main")
    .getByLabel(/^Kata sandi baru/)
    .fill(newPassword);
  await page
    .getByRole("main")
    .getByLabel(/Konfirmasi kata sandi baru/)
    .fill(newPassword);
  await page.getByRole("button", { name: "Ubah kata sandi" }).click();
  await expect(page.getByText("Kata sandi diubah", { exact: true })).toBeVisible();

  // The old password no longer works; the new one does.
  await logout(page);
  await page.goto("/masuk");
  await login(page, password);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Email atau kata sandi salah.",
  );
  await login(page, newPassword);
  await expect(page.getByRole("button", { name: "Akun Pelanggan" })).toBeVisible();
});

test("forgot password always answers the same", async ({ page }) => {
  await page.goto("/lupa-kata-sandi");
  await page.getByRole("main").getByLabel(/Email/).fill(`tidak-ada-${stamp}@example.test`);
  await page.getByRole("button", { name: "Kirim tautan" }).click();

  await expect(
    page.getByText("Jika email terdaftar, tautan atur ulang telah dikirim."),
  ).toBeVisible();
});
