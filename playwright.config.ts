import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  maxFailures: 1,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120000,
    // Public fixture tests must not inherit the operator's Neon/Clerk/Blob profile.
    env: {
      DATABASE_URL: "",
      DATABASE_URL_UNPOOLED: "",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      CLERK_SECRET_KEY: "",
      ADMIN_CLERK_USER_IDS: "",
      BLOB_READ_WRITE_TOKEN: "",
      DB_ENV: "test",
      RATE_LIMIT_SECRET: "local-fixture-tests-only",
    },
  },
});
