import { test, expect } from "./fixtures";

test("Home CTA, direct hash, refresh and history retain the anchor below the header", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const heading = page.locator("#featured-title");
  await page.locator(".olf-hero-description .olf-button").click();
  await expect(page).toHaveURL(/\/#nhung-doa-hoa$/);
  await expect(heading).toBeInViewport();
  const unobscured = async () => expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(100);
  await unobscured();
  await page.reload(); await expect(heading).toBeInViewport(); await unobscured();
  await page.goto("/san-pham");
  await page.goBack(); await expect(heading).toBeInViewport(); await unobscured();
  await page.goto("/#nhung-doa-hoa"); await expect(heading).toBeInViewport(); await unobscured();
});

test("finite carousel keeps first and last active products centered across responsive sizes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#nhung-doa-hoa");
    // Navigating to the same hash can reuse the document; start a fresh carousel.
    await page.reload();
    const carousel = page.locator(".olf-featured-carousel");
    await expect(carousel).toHaveAttribute("data-carousel-ready", "true");
    const count = await carousel.locator(".olf-carousel-slide").count();
    const position = carousel.locator(".olf-carousel-position");
    await expect(position).toHaveText(`1 / ${count}`);
    const center = async () => {
      const selected = await carousel.locator('[data-selected="true"]').boundingBox();
      const viewport = await carousel.locator(".olf-carousel-viewport").boundingBox();
      expect(Math.abs(selected!.x + selected!.width / 2 - viewport!.x - viewport!.width / 2)).toBeLessThan(2);
    };
    await center();
    await carousel.getByRole("button", { name: "Sản phẩm tiếp theo", exact: true }).focus();
    await page.keyboard.press("Enter"); await expect(position).toHaveText(`2 / ${count}`); await center();
    while (await carousel.getByRole("button", { name: "Sản phẩm tiếp theo", exact: true }).isEnabled()) {
      await carousel.getByRole("button", { name: "Sản phẩm tiếp theo", exact: true }).click();
    }
    await expect(position).toHaveText(`${count} / ${count}`); await center();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test("dragging a card does not navigate, a deliberate card click still works", async ({ page }) => {
  await page.goto("/#nhung-doa-hoa");
  const carousel = page.locator(".olf-featured-carousel");
  await expect(carousel).toHaveAttribute("data-carousel-ready", "true");
  const image = carousel.locator('[data-selected="true"] .product-image');
  await expect(image).toBeInViewport({ ratio: 0.5 });
  const box = await image.boundingBox();
  await page.mouse.move(box!.x + box!.width * .75, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .1, box!.y + box!.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page).toHaveURL(/\/#nhung-doa-hoa$/);
  const link = carousel.locator('[data-selected="true"] .product-link a');
  await link.scrollIntoViewIfNeeded();
  await expect(carousel.locator("xpath=..")).toHaveCSS("opacity", "1");
  await link.focus(); await expect(link).toBeFocused(); await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/san-pham\//);
});

test("touch swipe changes products while vertical touch still scrolls the page", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    await page.goto("/#nhung-doa-hoa");
    const carousel = page.locator(".olf-featured-carousel");
    await expect(carousel).toHaveAttribute("data-carousel-ready", "true");
    const session = await context.newCDPSession(page);
    // A native deep-link scroll can still be settling when Embla becomes ready.
    await expect(carousel.locator('[data-selected="true"] .product-image')).toBeInViewport({ ratio: 0.5 });
    const box = (await carousel.locator('[data-selected="true"] .product-image').boundingBox())!;
    const x = box.x + box.width * .8, y = box.y + 100;
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - i * 20, y }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(carousel.locator(".olf-carousel-position")).not.toHaveText("1 / 3");
    await expect(page).toHaveURL(/\/#nhung-doa-hoa$/);
    const start = await page.evaluate(() => scrollY);
    const current = (await carousel.locator('[data-selected="true"] .product-image').boundingBox())!;
    const verticalX = current.x + current.width / 2, verticalY = current.y + 160;
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: verticalX, y: verticalY }] });
    for (let i = 1; i <= 8; i++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: verticalX, y: verticalY - i * 15 }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(start + 30);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  } finally { await context.close(); }
});
