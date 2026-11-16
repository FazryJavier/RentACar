import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against servers that are already running:
 *   backend:  `composer dev`  (http://127.0.0.1:8000)
 *   frontend: `npm run dev`   (http://localhost:3000)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
