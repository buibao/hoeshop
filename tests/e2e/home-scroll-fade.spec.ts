import { test, expect, type Page } from "./fixtures";

async function jump(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
}

for (const width of [390, 768, 1024, 1440]) {
  test(`Home scroll fade and back to top at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const back = page.locator(".olf-back-to-top");
    await expect(page.locator('[data-carousel-ready="true"]')).toHaveCount(1);
    await expect(back).toHaveAttribute("inert", "");
    await expect(back).toHaveAttribute("tabindex", "-1");
    const slot = page.locator(".olf-service-grid > [data-scroll-fade]").first();
    const content = slot.locator("[data-scroll-fade-content]");
    const geometry = await slot.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top + scrollY, height: rect.height, viewport: innerHeight,
        band: Math.min(rect.height * 0.45, innerHeight * 0.18) };
    });
    const { top, height, viewport, band } = geometry;
    // Repeated passes, including reversals inside each fade band.
    const samples = [
      [top - viewport - 2, 0], [top - viewport + band * 0.25, 0.25],
      [top - viewport + band * 0.75, 0.75], [top - viewport + band * 0.5, 0.5],
      [top - viewport + band + 4, 1], [top + height - band - 4, 1],
      [top + height - band * 0.5, 0.5], [top + height + 2, 0],
      [top + height - band * 0.25, 0.25], [top + height - band * 0.75, 0.75],
      [top + height - band * 0.5, 0.5], [top - viewport + band + 4, 1],
      [top - viewport + band * 0.5, 0.5], [top - viewport - 2, 0],
      [top - viewport + band * 0.5, 0.5], [top - viewport + band + 4, 1],
    ];
    for (const [position, opacity] of samples) {
      await jump(page, position);
      await expect.poll(() => content.evaluate((node) => Number(getComputedStyle(node).opacity)))
        .toBeCloseTo(opacity, 1);
      await expect(content).toHaveCSS("transform", "none");
    }
    await expect(content).toHaveCSS("opacity", "1");
    await page.waitForTimeout(200);
    await expect(content).toHaveCSS("opacity", "1");
    // Focus protects a group even after it has scrolled out of view.
    const link = slot.locator("a");
    await link.focus();
    await jump(page, top + height + 10);
    await expect(content).toHaveCSS("opacity", "1");
    await expect(link).toBeFocused();
    await link.evaluate((node: HTMLElement) => node.blur());
    await expect(content).toHaveCSS("opacity", "0");
    await expect(content).toHaveAttribute("inert", "");

    // Resize/font/content geometry updates while stationary, including a tall block.
    await slot.locator("article").evaluate((node: HTMLElement) => { node.style.minHeight = "1500px"; });
    await jump(page, top + 300);
    await expect(content).toHaveCSS("opacity", "1");
    await page.setViewportSize({ width, height: 700 });
    await expect(content).toHaveCSS("opacity", "1");
    await slot.locator("article").evaluate((node: HTMLElement) => { node.style.minHeight = ""; });
    await page.setViewportSize({ width, height: 900 });

    await jump(page, 330);
    await expect(back).toHaveAttribute("data-visible", "true");
    await jump(page, 280);
    await expect(back).toHaveAttribute("data-visible", "true");
    await jump(page, 230);
    await expect(back).toHaveAttribute("data-visible", "false");
    await jump(page, 280);
    await expect(back).toHaveAttribute("data-visible", "false");

    // Anchor updates the current fade state immediately; Embla still advances one item.
    await jump(page, 0);
    await page.locator(".olf-hero-description .olf-button").click();
    await expect(page).toHaveURL(/#nhung-doa-hoa$/);
    await expect(page.locator(".olf-featured > [data-scroll-fade]").first().locator("[data-scroll-fade-content]"))
      .toHaveCSS("opacity", "1");
    const position = page.locator(".olf-carousel-position");
    await page.getByRole("button", { name: "Sản phẩm tiếp theo" }).click();
    await expect(position).toHaveText("2 / 3");
    await page.getByRole("button", { name: "Sản phẩm trước" }).click();
    await expect(position).toHaveText("1 / 3");
    await page.screenshot({ path: testInfo.outputPath(`home-${width}-featured.png`) });

    await jump(page, await page.evaluate(() => document.documentElement.scrollHeight));
    await expect(back).toHaveCSS("opacity", "1");
    const url = page.url();
    const history = await page.evaluate(() => window.history.length);
    await back.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator("#home-title")).toBeFocused();
    await expect(back).toHaveAttribute("data-visible", "false");
    expect(page.url()).toBe(url);
    expect(await page.evaluate(() => window.history.length)).toBe(history);
    await expect(page.locator(".olf-hero-description .olf-button")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${width}-top.png`) });
    expect(errors).toEqual([]);
  });
}

test("wheel scrolling fades visible card copy and reverses without hiding the reading area", async ({ page, isMobile }) => {
  test.skip(isMobile, "Wheel regression targets desktop input; mobile viewport cases cover native scroll.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator('[data-carousel-ready="true"]')).toHaveCount(1);
  const slot = page.locator(".olf-service-grid > [data-scroll-fade]").first();
  const content = slot.locator("[data-scroll-fade-content]");
  const heading = slot.locator("h3");
  const entrance = await heading.evaluate((node) => node.getBoundingClientRect().top + scrollY - innerHeight + 18);
  await jump(page, entrance - 200);
  await expect(content).toHaveCSS("opacity", "0");
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(Math.round(entrance));
  await expect(heading).toBeInViewport();
  const enteringOpacity = await content.evaluate((node) => Number(getComputedStyle(node).opacity));
  // The old short band reached 1 before any of this title was visible.
  expect(enteringOpacity).toBeGreaterThan(0.2);
  expect(enteringOpacity).toBeLessThan(0.95);
  await page.mouse.wheel(0, -40);
  await expect.poll(() => content.evaluate((node) => Number(getComputedStyle(node).opacity)))
    .toBeLessThan(enteringOpacity - 0.1);
  await page.mouse.wheel(0, 300);
  await expect(content).toHaveCSS("opacity", "1");
  await expect(heading).toBeInViewport();
});

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
