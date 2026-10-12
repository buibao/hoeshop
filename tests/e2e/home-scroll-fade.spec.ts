import { test, expect, type Page } from "./fixtures";

async function jump(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
}

for (const width of [390, 768, 1024, 1440]) {
  test(`Home text entrance and back to top at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    const back = page.locator(".olf-back-to-top");
    await expect(back).toHaveAttribute("inert", "");
    const heading = page.locator(".olf-service-card h3").first();
    const top = await heading.evaluate(node => node.getBoundingClientRect().top + scrollY);
    await page.evaluate(y => { document.dispatchEvent(new WheelEvent("wheel")); scrollTo({ top: y, behavior: "instant" }); }, top - 900 * .7);
    await expect(heading).toHaveAttribute("data-text-state", "ENTERING");
    await expect(heading).toHaveAttribute("data-text-state", "VISIBLE");
    await expect(heading.locator("[data-text-layer]")).toHaveCSS("opacity", "1");
    await jump(page, top - 20);
    await expect(heading.locator("[data-text-layer]")).toHaveCSS("opacity", "1");
    const slot = page.locator(".olf-service-grid > [data-scroll-fade]").first();
    await expect(slot.locator("[data-scroll-fade-content]")).toHaveCSS("opacity", "1");
    await expect(slot.locator("[data-scroll-fade-content]")).not.toHaveAttribute("inert", "");
    await jump(page, 330); await expect(back).toHaveAttribute("data-visible", "true");
    await jump(page, 280); await expect(back).toHaveAttribute("data-visible", "true");
    await jump(page, 230); await expect(back).toHaveAttribute("data-visible", "false");
    await jump(page, 280); await expect(back).toHaveAttribute("data-visible", "false");
    await jump(page, 0);
    await page.locator(".olf-hero-description .olf-button").click();
    await expect(page).toHaveURL(/#nhung-doa-hoa$/);
    await expect(page.locator(".olf-featured-carousel [data-store-text]")).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`home-${width}-featured.png`) });
    await jump(page, await page.evaluate(() => document.documentElement.scrollHeight));
    const url = page.url(), history = await page.evaluate(() => window.history.length);
    await back.focus(); await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator("#home-title")).toBeFocused();
    expect(page.url()).toBe(url);
    expect(await page.evaluate(() => window.history.length)).toBe(history);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("reduced motion and no JavaScript keep all Home content visible", async ({ page, browser, baseURL }) => {
  await page.goto("/");
  await expect(page.locator('[data-carousel-ready="true"]')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await jump(page, 2000);
  for (const content of await page.locator("[data-scroll-fade-content]").all()) {
    await expect(content).toHaveCSS("opacity", "1");
    await expect(content).not.toHaveAttribute("inert", "");
  }
  const back = page.getByRole("button", { name: "Về đầu trang" });
  await back.focus();
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator("#home-title")).toBeFocused();
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const noJs = await context.newPage();
    await noJs.goto("/");
    for (const content of await noJs.locator("[data-scroll-fade-content]").all()) {
      await expect(content).toHaveCSS("opacity", "1");
      await expect(content).not.toHaveAttribute("inert", "");
    }
    await expect(noJs.locator(".olf-back-to-top")).toHaveAttribute("inert", "");
  } finally { await context.close(); }
});

test("back to top yields to user input, preserves focus, and is Home-only", async ({ page }) => {
  await page.goto("/#nhung-doa-hoa");
  const back = page.locator(".olf-back-to-top");
  await expect(back).toHaveAttribute("data-visible", "true");
  await jump(page, 3000);
  await back.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  await page.mouse.wheel(0, 300);
  // Allow the user's existing Lenis wheel momentum to settle before the next setup.
  await page.waitForTimeout(1300);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.locator("#home-title")).not.toBeFocused();
  await jump(page, 0);
  await expect(back).toHaveAttribute("data-visible", "true");
  await page.locator("#home-title").evaluate((node: HTMLElement) => node.focus({ preventScroll: true }));
  await expect(back).toHaveAttribute("data-visible", "false");
  await jump(page, 3000);
  await expect(back).toHaveAttribute("data-visible", "true");
  await back.dispatchEvent("click");
  await back.dispatchEvent("click");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(back).toHaveAttribute("data-visible", "false");
  await jump(page, 3000);
  await expect(back).toHaveAttribute("data-visible", "true");
  await expect(back).toBeVisible();
  await back.focus();
  await expect(back).toBeFocused();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  await page.evaluate(() => window.dispatchEvent(new Event("touchstart")));
  const interrupted = await page.evaluate(() => scrollY);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => scrollY)).toBe(interrupted);
  await expect(page.locator("#home-title")).not.toBeFocused();
  // Mobile offcanvas owns the overlay and scroll lock.
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "Mở menu", exact: true }).dispatchEvent("click");
  await expect(page.getByRole("dialog")).toBeVisible();
  const locked = await page.evaluate(() => scrollY);
  await back.dispatchEvent("click");
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => scrollY)).toBe(locked);
  const layers = await page.evaluate(() => ({
    button: Number(getComputedStyle(document.querySelector(".olf-back-to-top")!).zIndex),
    backdrop: Number(getComputedStyle(document.querySelector(".offcanvas-backdrop")!).zIndex),
  }));
  expect(layers.button).toBeLessThan(layers.backdrop);
  await page.goto("/san-pham");
  await expect(back).toHaveCount(0);
});

test("preview: scroll down, reverse, then return to the top", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator('[data-carousel-ready="true"]')).toHaveCount(1);
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, 1400);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, -1100);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, 4500);
  await page.waitForTimeout(1400);
  await page.getByRole("button", { name: "Về đầu trang" }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.waitForTimeout(500);
});
