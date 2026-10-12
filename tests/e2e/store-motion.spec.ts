import { test, expect, type Page } from "./fixtures";
import { openCarouselHarness } from "./carousel-harness";
import { AUTOPLAY_WAIT_MS } from "@/features/storefront/carousel-autoplay";

async function add(page: Page, slug = "mau-test-nang") {
  await page.goto(`/san-pham/${slug}`);
  if (slug === "mau-test-diu-dang") await page.getByLabel("Cảm xúc muốn gửi", { exact: true }).fill("Biết ơn");
  await expect(page.locator('input[name="quantity"]')).toHaveValue("1");
  await page.getByRole("button", { name: "Thêm vào giỏ hoa" }).click();
  await expect(page.getByRole("status")).toContainText("Đã thêm vào giỏ hoa.");
}

test("decorative reveal keeps SSR copy visible without JavaScript", async ({ browser, baseURL, page }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: page.viewportSize()! });
  try {
    const noJS = await context.newPage();
    for (const route of ["/san-pham", "/ve-hoe", "/dich-vu/hoa-thoi"]) {
      await noJS.goto(route);
      const groups = noJS.locator("[data-store-text] > [data-text-layer]");
      expect(await groups.count()).toBeGreaterThan(0);
      for (const group of await groups.all()) {
        await expect(group).toHaveCSS("opacity", "1");
        await expect(group).toHaveCSS("transform", "none");
      }
      await expect(noJS.locator("h1")).toBeVisible();
      expect(await noJS.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  } finally { await context.close(); }
});

test("live reduced motion stops presentation effects while values and drafts persist", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/san-pham/mau-test-nang");
  const value = page.locator('.hoe-quantity span');
  const increase = page.getByRole("button", { name: "Tăng số lượng", exact: true });
  await increase.click();
  await expect(value).toHaveText("2");
  await expect(value).toHaveCSS("opacity", "1");
  await page.getByLabel("Màu sắc", { exact: true }).fill("Trắng và hồng");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => value.evaluate(node => node.getAnimations().length)).toBe(0);
  await increase.click();
  await expect(value).toHaveText("3");
  await expect(value).toHaveCSS("opacity", "1");
  await expect(value).toHaveCSS("transform", "none");
  await expect(increase).toHaveCSS("transition-duration", "0s, 0s, 0s");
  await expect(page.getByLabel("Màu sắc", { exact: true })).toHaveValue("Trắng và hồng");
  const hour = page.locator('[data-component="select-10"] [role="combobox"]').first();
  await hour.click();
  await page.getByRole("option", { name: "11", exact: true }).click();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("11:00");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.getByLabel("Màu sắc", { exact: true })).toHaveValue("Trắng và hồng");
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("11:00");
  await expect(page.locator('input[name="quantity"]')).toHaveValue("3");
});

test("weekly selection and rapid month navigation preserve state, focus and readable summary", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.setFixedTime(new Date("2026-10-11T10:00:00Z"));
  await page.goto("/dich-vu/hoa-thoi");
  await expect(page.locator('.ht-calendar-summary')).toHaveAttribute("data-sticky", /true|false/);
  await page.getByRole("button", { name: "Tăng số bó mỗi tuần", exact: true }).click();
  await page.getByRole("button", { name: "Tăng số combo", exact: true }).click();
  const dates = ["2026-10-12", "2026-10-13", "2026-10-19", "2026-10-20"];
  const day = (date: string) => page.locator(`.ht-calendar-day-button[aria-label*="${date}"]`);
  for (const date of dates.slice(0, 3)) await day(date).click();
  await expect(page.locator('.ht-calendar-total')).toContainText("Đã chọn 3/4 ngày");
  await day(dates[3]).click();
  await expect(day(dates[3])).toBeFocused();
  await expect(page.locator('.ht-progress-total')).toContainText("Đã chọn đủ 4 ngày nhận");
  await expect(page.locator('.ht-progress-total')).toHaveCSS("opacity", "1");
  await expect(page.locator('.ht-calendar-total')).toHaveCSS("opacity", "1");
  const next = page.getByRole("button", { name: "Tháng sau", exact: true });
  const previous = page.getByRole("button", { name: "Tháng trước", exact: true });
  await next.click({ clickCount: 2 });
  await previous.click({ clickCount: 2 });
  await expect(previous).toBeDisabled();
  await expect(next).toBeFocused();
  await expect(page.locator('[data-delivery-calendar]')).toHaveAttribute("data-visible-month", "2026-10");
  expect(JSON.parse(await page.locator('input[name="recurrence"]').inputValue()).deliveryDates).toEqual(dates);
  for (const selector of ['.ht-fields', '.ht-layout', '.ht-inquiry', '.ht-calendar-summary']) await expect(page.locator(selector)).toHaveCSS("transform", "none");
  await day(dates[3]).click();
  await expect(day(dates[3])).toBeFocused();
  await expect(page.locator('.ht-calendar-total')).toContainText("Đã chọn 3/4 ngày");
  await page.getByRole("radio", { name: "Gói Tháng", exact: true }).check();
  await page.getByRole("radio", { name: "Gói Tuần", exact: true }).check();
  expect(JSON.parse(await page.locator('input[name="recurrence"]').inputValue()).deliveryDates).toEqual(dates.slice(0, 3));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("cart edit and remove restore focus to a surviving control", async ({ page }) => {
  await add(page);
  await add(page, "mau-test-diu-dang");
  await page.goto("/gio-hang");
  const rows = page.locator('.cart-row');
  await expect(rows).toHaveCount(2);
  await rows.first().getByRole("button", { name: "Sửa cấu hình", exact: true }).click();
  await rows.first().getByRole("button", { name: "Lưu cấu hình", exact: true }).click();
  await expect(rows.first().getByRole("button", { name: "Sửa cấu hình", exact: true })).toBeFocused();
  await rows.first().getByRole("button", { name: "Tăng số lượng", exact: true }).click();
  await expect(rows.first().locator('.hoe-quantity span')).toHaveText("2");
  await rows.first().locator('.cart-row-controls .icon-button').click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('.cart-row-controls .icon-button')).toBeFocused();
  await rows.first().locator('.cart-row-controls .icon-button').click();
  await expect(page.locator('.empty a')).toBeFocused();
});

test("monthly and weekly cycles crossing month boundaries count each date once", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T10:00:00Z"));
  for (const scenario of [
    { period: "month", label: "Gói Tháng", increase: "Tăng số bó mỗi tháng", dates: ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"] },
    { period: "week", label: "Gói Tuần", increase: "Tăng số bó mỗi tuần", dates: ["2026-10-30", "2026-10-31", "2026-11-02", "2026-11-03"] },
  ]) {
    await page.goto("/dich-vu/hoa-thoi");
    await expect(page.locator('.ht-calendar-summary')).toHaveAttribute("data-sticky", /true|false/);
    await page.getByRole("radio", { name: scenario.label, exact: true }).check();
    await page.getByRole("button", { name: scenario.increase, exact: true }).click();
    await page.getByRole("button", { name: "Tăng số combo", exact: true }).click();
    for (const date of scenario.dates) {
      const day = page.locator(`.ht-calendar-day-button[aria-label*="${date}"]`);
      if (!await day.count()) await page.getByRole("button", { name: "Tháng sau", exact: true }).click();
      await day.click();
      await expect(day).toBeFocused();
    }
    await expect(page.locator('.ht-calendar-total')).toContainText("Đã chọn 4/4 ngày");
    await expect(page.locator('.ht-period-progress')).toHaveCount(2);
    const saved = JSON.parse(await page.locator('input[name="recurrence"]').inputValue());
    expect(saved.period).toBe(scenario.period);
    expect(saved.deliveryDates).toEqual(scenario.dates);
    expect(new Set(saved.deliveryDates).size).toBe(4);
  }
});

test("long FAQ answers stay readable and native disclosure reacts immediately", async ({ page }) => {
  await page.goto("/ve-hoe");
  const detail = page.locator('.faq details').first();
  const summary = detail.locator('summary');
  await detail.locator('p').evaluate(node => { node.textContent = Array(50).fill(node.textContent).join(" "); });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(detail).toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  await expect(detail.locator('p')).toHaveCSS("opacity", "1");
  await expect.poll(() => detail.evaluate(node => node.getBoundingClientRect().height >= node.querySelector('p')!.getBoundingClientRect().height)).toBe(true);
  await page.keyboard.press("Enter");
  await expect(detail).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
});

test("internal previews and internal fallbacks stay outside Store motion", async ({ page }) => {
  for (const route of ["/xem-thu/widgets", "/xem-thu/giao-dien", "/xem-thu/motion-missing"]) {
    await page.goto(route);
    await expect(page.locator('.hoe-store-scope')).toHaveCount(0);
    expect(await page.locator('body').evaluate(node => getComputedStyle(node).getPropertyValue('--store-motion-feedback').trim())).toBe("");
  }
});

test("carousel autoplay still pauses for focus and overlays without changing slide geometry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openCarouselHarness(page);
  const carousel = page.locator('.olf-featured-carousel');
  const selected = () => carousel.locator('[data-selected="true"]').getAttribute('aria-label');
  const initial = await selected();
  await expect.poll(selected, { timeout: 10000 }).not.toBe(initial);
  const focused = carousel.locator('[data-selected="true"] a');
  await focused.focus();
  const snapshot = await selected();
  const widths = await carousel.locator('.olf-carousel-slide').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
  await page.waitForTimeout(AUTOPLAY_WAIT_MS * 2 + 300);
  expect(await selected()).toBe(snapshot);
  await expect(focused).toBeFocused();
  expect(await carousel.locator('.olf-carousel-slide').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width))).toEqual(widths);
  await page.locator('#overlay').click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(AUTOPLAY_WAIT_MS * 2 + 300);
  expect(await selected()).toBe(snapshot);
  await page.locator('#overlay').click();
  await page.mouse.move(0, 0);
  await expect.poll(selected, { timeout: 10000 }).not.toBe(snapshot);
});

test("carousel fitting and empty states keep existing controls and reduced motion behavior", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openCarouselHarness(page);
  const carousel = page.locator('.olf-featured-carousel');
  const initial = await carousel.locator('[data-selected="true"]').getAttribute('aria-label');
  await page.locator('#outside').focus();
  await page.waitForTimeout(AUTOPLAY_WAIT_MS + 300);
  await expect(carousel.locator('[data-selected="true"]')).toHaveAttribute('aria-label', initial!);
  await page.locator('#count').click();
  await expect(carousel.locator('.olf-carousel-slide')).toHaveCount(1);
  await expect(carousel).toHaveAttribute('data-carousel-overflow', 'false');
  for (const button of await carousel.getByRole('button').all()) await expect(button).toBeDisabled();
  await page.locator('#count').click();
  await expect(carousel).toHaveCount(0);
  await expect(page.locator('#count')).toBeFocused();
});
