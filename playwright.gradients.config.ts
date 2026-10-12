import { defineConfig, devices } from "@playwright/test";

// Build first with the isolated fixture launcher. No operator DB/auth profile.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: [["line"], ["json", { outputFile: process.env.STORE_GRADIENT_REPORT_PATH || "docs/store-gradients/verification/playwright.json" }]],
  use: { baseURL: "http://localhost:3101", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "node scripts/local-hoa-thoi.mjs --serve --port 3101",
    url: "http://localhost:3101",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
