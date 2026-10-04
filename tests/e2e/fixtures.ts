import { test as base } from "@playwright/test";
import { randomUUID } from "node:crypto";
export const test = base.extend<{ identityIsolation: void }>({
  identityIsolation: [
    async ({ context }, use) => {
      await context.setExtraHTTPHeaders({
        "x-hoe-test-identity": randomUUID(),
      });
      await use();
    },
    { auto: true },
  ],
});
export { expect, type Page } from "@playwright/test";
