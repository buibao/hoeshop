import { defineConfig, devices } from "@playwright/test";
if (
  !process.env.UAT_BASE_URL ||
  !process.env.UAT_ADMIN_STATE ||
  !process.env.UAT_NON_ADMIN_STATE
)
  throw new Error(
    "UAT requires a connected Preview, Google admin and non-admin browser states. See docs/phase-2/ADMIN_RUNBOOK.md.",
  );
export default defineConfig({
  testDir: "./tests/uat",
  workers: 1,
  fullyParallel: false,
  testMatch: "*.spec.ts",
  timeout: 60000,
  use: {
    baseURL: process.env.UAT_BASE_URL,
    storageState: process.env.UAT_ADMIN_STATE,
    trace: "retain-on-failure",
  },
  projects: [{ name: "preview-admin", use: { ...devices["Desktop Chrome"] } }],
});
