import { expect, test } from "@playwright/test";

test.describe("smoke @critical", () => {
  test("home page loads with the placeholder", async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: /RentACar — dalam pengembangan/ }),
    ).toBeVisible();
  });

  test("API health is reachable through the same origin", async ({ request }) => {
    const response = await request.get("/api/v1/health");

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ code: 200, success: true, data: { status: "ok" } });
  });
});
