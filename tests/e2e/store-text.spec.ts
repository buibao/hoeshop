import { test, expect, type Page } from "./fixtures";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function move(page: Page, top: number) {
  await page.evaluate(top => { document.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 })); scrollTo({ top, behavior: "instant" }); }, top);
}
async function position(page: Page, selector: string, viewportFraction: number) {
  // Wait for layout before measuring a streamed/container-query descendant;
  // a node existing in the DOM alone does not guarantee a usable rectangle.
  await expect(page.locator(selector)).toBeVisible().catch(async error => {
    const ancestors = await page.locator(selector).evaluate(node => {
      const result = [];
      for (let owner: Element | null = node; owner; owner = owner.parentElement) {
        const style = getComputedStyle(owner);
        result.push({ tag: owner.tagName, class: owner.className, rect: owner.getBoundingClientRect().toJSON(), display: style.display, visibility: style.visibility, contentVisibility: style.contentVisibility, height: style.height, attributes: owner.getAttributeNames().map(name => [name, owner!.getAttribute(name)]) });
      }
      return result;
    });
    await test.info().attach("unavailable-text-layout", { body: JSON.stringify(ancestors, null, 2), contentType: "application/json" });
    throw error;
  });
  await page.evaluate(() => document.fonts.ready);
  const y = await page.locator(selector).evaluate((node, fraction) => node.getBoundingClientRect().top + scrollY - innerHeight * fraction, viewportFraction);
  await move(page, y);
}
async function openHarness(page: Page) {
  const bundle = await build({ entryPoints: ["tests/e2e/store-text-harness.tsx"], bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", alias: { "@": path.resolve("src") } });
  const css = await readFile("src/styles/store-text-reveal.css", "utf8");
  await page.route("**/store-text-harness", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px}h2,p{margin:0 0 20px}#scroll-root{width:330px}${css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>` }));
  await page.goto("/store-text-harness");
  await page.locator("#root-heading").waitFor();
}

test("fresh heading has one finite entrance with the desktop/mobile preset and capped group delays", async ({ page }) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    const records: object[] = [];
    (window as unknown as { textAnimations: object[] }).textAnimations = records;
    Element.prototype.animate = function(frames, options) {
      const owner = this.closest("[data-store-text]");
      if (owner && Array.isArray(frames) && frames.length === 2) records.push({ id: owner.id, role: owner.getAttribute("data-store-text"), frames, options });
      return animate.call(this, frames, options);
    };
  });
  await page.goto("/dich-vu/hoa-thoi");
  const heading = page.locator(".page-heading h1");
  const id = await heading.getAttribute("id");
  const records = await page.evaluate(() => (window as unknown as { textAnimations: { id: string; role: string; frames: { transform: string; opacity: number }[]; options: { duration: number; delay: number; easing: string } }[] }).textAnimations);
  const entrance = records.filter(row => row.id === id);
  expect(entrance).toHaveLength(1);
  const mobile = page.viewportSize()!.width < 768;
  expect(entrance[0].frames[0]).toMatchObject({ opacity: 0, transform: `translateY(${mobile ? 40 : 56}px)` });
  expect(Object.keys(entrance[0].frames[0]).sort()).toEqual(["opacity", "transform"]);
  expect(entrance[0].options).toMatchObject({ duration: mobile ? 900 : 1000, delay: 90, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" });
  await expect(page.locator(".page-heading")).toHaveCSS("animation-name", "none");
  await expect(heading.locator("[data-text-layer]")).toHaveCSS("transform", "none");
  const groupIds = await page.locator(".page-heading [data-store-text]").evaluateAll(nodes => nodes.map(node => node.id));
  expect(records.filter(record => groupIds.includes(record.id)).map(record => record.options.delay)).toEqual([0, 90, 180]);
});

test("below-fold text waits for 85%, completes without scrolling, and stays visible outside the trigger band", async ({ page }) => {
  await page.goto("/dich-vu/hoa-thoi");
  const selector = ".ht-form-heading h2";
  const target = page.locator(selector), layer = target.locator("[data-text-layer]");
  await expect(target).toHaveAttribute("data-text-state", "ARMED_OFFSCREEN");
  expect(await layer.evaluate(node => node.getAnimations().length)).toBe(0);
  await position(page, selector, .9);
  await expect(target).toHaveAttribute("data-text-state", "ARMED_OFFSCREEN");
  await position(page, selector, .84);
  await expect(target).toHaveAttribute("data-text-state", "ENTERING");
  const keyframes = await layer.evaluate(node => (node.getAnimations()[0].effect as KeyframeEffect).getKeyframes());
  expect(keyframes[0].transform).toBe(`translateY(${page.viewportSize()!.width < 768 ? 32 : 48}px)`);
  expect(keyframes[0]).not.toHaveProperty("--store-text-y");
  await expect(target).toHaveAttribute("data-text-state", "VISIBLE");
  await expect(layer).toHaveCSS("opacity", "1");
  await expect(layer).toHaveCSS("transform", "none");
  await position(page, selector, .02);
  await expect(target).toHaveAttribute("data-text-state", "VISIBLE");
});

test("replay needs the extra 120px in both directions and edge jitter does not rearm", async ({ page }) => {
  await page.goto("/dich-vu/hoa-thoi");
  const selector = ".ht-form-heading h2", target = page.locator(selector);
  await position(page, selector, .5);
  await expect(target).toHaveAttribute("data-text-state", "VISIBLE");
  for (const outside of ["above", "below"]) {
    const y = await target.evaluate((node, direction) => direction === "above" ? node.getBoundingClientRect().bottom + scrollY + 125 : node.getBoundingClientRect().top + scrollY - innerHeight - 125, outside);
    await move(page, y);
    await expect(target).toHaveAttribute("data-text-state", "ARMED_OFFSCREEN");
    await position(page, selector, .5);
    await expect(target).toHaveAttribute("data-text-state", "ENTERING");
    await expect(target).toHaveAttribute("data-text-state", "VISIBLE");
    for (const fraction of [.02, .09, .02, .5]) await position(page, selector, fraction);
    await expect(target).toHaveAttribute("data-text-state", "VISIBLE");
  }
});

test("native wheel momentum does not cancel a time-based text entrance", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Wheel momentum belongs to desktop input.");
  await page.goto("/dich-vu/hoa-thoi");
  await position(page, ".ht-form-heading h2", .9);
  const target = page.locator(".ht-form-heading h2");
  await expect(target).toHaveAttribute("data-text-state", "ARMED_OFFSCREEN");
  await page.mouse.wheel(0, 220);
  await expect(target).toHaveAttribute("data-text-state", "ENTERING");
  await expect(target).toHaveAttribute("data-text-state", "VISIBLE");
});

test("small scroll reversals keep one continuous entrance without jumping backwards", async ({ page }) => {
  await openHarness(page);
  const samples = await page.locator("#scroll-root").evaluate(async root => {
    document.dispatchEvent(new WheelEvent("wheel"));
    root.scrollTop = 440;
    const target = document.getElementById("root-heading")!;
    const layer = target.querySelector<HTMLElement>("[data-text-layer]")!;
    while (target.dataset.textState !== "ENTERING") await new Promise(requestAnimationFrame);
    const animation = layer.getAnimations()[0];
    const values = [];
    for (const offset of [2, -2, 3, -3, 1, -1]) {
      root.scrollTop += offset;
      await new Promise(resolve => setTimeout(resolve, 65));
      const style = getComputedStyle(layer);
      values.push({ sameAnimation: layer.getAnimations()[0] === animation, opacity: Number(style.opacity), y: new DOMMatrixReadOnly(style.transform).m42 });
    }
    return values;
  });
  for (let i = 0; i < samples.length; i++) {
    expect(samples[i].sameAnimation).toBe(true);
    if (i) {
      expect(samples[i].opacity).toBeGreaterThanOrEqual(samples[i - 1].opacity);
      expect(samples[i].y).toBeLessThanOrEqual(samples[i - 1].y);
    }
  }
});

test("interaction settles static copy and leaves calendar feedback, prices and controls immediate", async ({ page }) => {
  await page.goto("/dich-vu/hoa-thoi");
  await position(page, ".ht-form-heading h2", .6);
  const target = page.locator(".ht-form-heading h2");
  await expect(target).toHaveAttribute("data-text-state", "ENTERING");
  await page.getByRole("button", { name: "Tăng số bó mỗi tuần", exact: true }).focus();
  await expect(target).toHaveAttribute("data-text-state", "BYPASS_VISIBLE");
  await expect(target.locator("[data-text-layer]")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Tăng số bó mỗi tuần", exact: true }).click();
  for (const selector of [".ht-calendar-total", ".ht-progress-total", ".ht-card-price", ".ht-package-button", ".ht-calendar-day-button"]) {
    expect(await page.locator(`${selector} [data-store-text]`).count()).toBe(0);
    await expect(page.locator(selector).first()).toHaveCSS("opacity", "1");
  }
  for (const selector of [".ht-fields", ".ht-layout", ".ht-inquiry", ".ht-calendar-summary"]) await expect(page.locator(selector)).toHaveCSS("transform", "none");
});

test("a touch starting a scroll does not snap text to visible, but touching controls still settles it", async ({ page }) => {
  await page.goto("/dich-vu/hoa-thoi");
  await position(page, ".ht-form-heading h2", .6);
  const target = page.locator(".ht-form-heading h2");
  await expect(target).toHaveAttribute("data-text-state", "ENTERING");
  const continued = await target.evaluate(node => {
    const layer = node.querySelector("[data-text-layer]")!;
    const animation = layer.getAnimations()[0];
    layer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    layer.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerType: "touch" }));
    return layer.getAnimations()[0] === animation && (node as HTMLElement).dataset.textState === "ENTERING";
  });
  expect(continued).toBe(true);
  await page.locator(".ht-package-controls button").first().dispatchEvent("pointerdown", { pointerType: "touch" });
  await expect(target).toHaveAttribute("data-text-state", "BYPASS_VISIBLE");
});

test("focused static anchors protect their animated copy even beyond the reset boundary", async ({ page }) => {
  await page.goto("/san-pham");
  const link = page.locator(".product-card h3 a").first();
  const copy = link.locator("[data-store-text]");
  await link.focus();
  await expect(copy).toHaveAttribute("data-text-state", "BYPASS_VISIBLE");
  const beyond = await copy.evaluate(node => node.getBoundingClientRect().top + scrollY - innerHeight - 125);
  await move(page, beyond);
  await expect(link).toBeFocused();
  await expect(copy).toHaveAttribute("data-text-state", "BYPASS_VISIBLE");
  await link.evaluate(node => (node as HTMLElement).blur());
  await expect(copy).toHaveAttribute("data-text-state", "ARMED_OFFSCREEN");
});

test("root observers use the clipped container, handle tall text, keep inline link hit areas fixed and clean up", async ({ page }) => {
  await openHarness(page);
  const heading = page.locator("#root-heading"), linked = page.locator("#linked-copy");
  await expect(heading).toHaveAttribute("data-text-state", "ARMED_OFFSCREEN");
  await page.locator("#scroll-root").evaluate(node => { document.dispatchEvent(new WheelEvent("wheel")); node.scrollTop = 440; });
  await expect(heading).toHaveAttribute("data-text-state", "ENTERING");
  await expect(linked).toHaveAttribute("data-text-state", "ENTERING");
  const during = await page.locator("#inline-link").boundingBox();
  await expect(linked).toHaveAttribute("data-text-state", "VISIBLE");
  const after = await page.locator("#inline-link").boundingBox();
  expect(Math.abs(during!.y - after!.y)).toBeLessThan(1);
  await page.locator("#scroll-root").evaluate(node => { document.dispatchEvent(new WheelEvent("wheel")); node.scrollTop = 600; });
  await expect(page.locator("#tall-copy")).toHaveAttribute("data-text-state", /ENTERING|VISIBLE/);
  expect(await page.locator("#exempt").getAttribute("data-store-text")).toBeNull();
  await page.locator("#rerender").click();
  await expect(heading).toHaveAttribute("data-text-state", /VISIBLE|BYPASS_VISIBLE/);
  await page.locator("#unmount").click();
  await page.locator("#diagnostics").click();
  await expect(page.locator("#diagnostics")).toHaveText("0");
});

test("live accessibility preferences settle animations and leave newly scrolled text visible", async ({ page }) => {
  await page.goto("/dich-vu/hoa-thoi");
  await position(page, ".ht-form-heading h2", .6);
  await expect(page.locator(".ht-form-heading h2")).toHaveAttribute("data-text-state", "ENTERING");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".ht-form-heading h2")).toHaveAttribute("data-text-state", "BYPASS_VISIBLE");
  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "active" });
  await expect(page.locator(".page-heading h1 [data-text-layer]")).toHaveCSS("transform", "none");
  await expect(page.locator(".ht-form-heading h2 [data-text-layer]")).toHaveCSS("opacity", "1");
});

test("late initialization and missing APIs keep SSR text visible without forcing an entrance", async ({ page }) => {
  await page.addInitScript(() => {
    const original = performance.getEntriesByType.bind(performance);
    performance.getEntriesByType = type => type === "paint" ? [{ name: "first-contentful-paint" } as PerformanceEntry] : original(type);
    Object.defineProperty(window, "IntersectionObserver", { value: undefined });
  });
  await page.goto("/dich-vu/hoa-thoi");
  for (const selector of [".page-heading h1", ".ht-form-heading h2"]) {
    await expect(page.locator(`${selector} [data-text-layer]`)).toHaveCSS("opacity", "1");
    await expect(page.locator(`${selector} [data-text-layer]`)).toHaveCSS("transform", "none");
  }
});

test("slow hydration adopts a completed parser entrance without hiding the heading again", async ({ page }) => {
  await page.addInitScript(() => {
    const samples: number[] = [];
    (window as unknown as { lateSamples: number[] }).lateSamples = samples;
    const sample = () => {
      const layer = document.querySelector(".page-heading h1 [data-text-layer]");
      if (layer && performance.now() > 1800) samples.push(Number(getComputedStyle(layer).opacity));
      if (performance.now() < 5000) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.route("**/_next/static/chunks/**", async route => { await new Promise(resolve => setTimeout(resolve, 2500)); await route.continue(); });
  await page.goto("/dich-vu/hoa-thoi");
  await expect(page.locator(".page-heading h1")).toHaveAttribute("data-text-state", /VISIBLE|BYPASS_VISIBLE/);
  const samples = await page.evaluate(() => (window as unknown as { lateSamples: number[] }).lateSamples);
  expect(samples.length).toBeGreaterThan(0);
  expect(samples.every(opacity => opacity === 1)).toBe(true);
});

test("late parser, observer errors and BFCache lifecycle choose visible fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = performance.getEntriesByType.bind(performance);
    performance.getEntriesByType = type => type === "paint" ? [{ name: "first-contentful-paint" } as PerformanceEntry] : original(type);
  });
  await page.goto("/dich-vu/hoa-thoi");
  await expect(page.locator(".page-heading h1")).toHaveAttribute("data-text-state", "BYPASS_VISIBLE");
  await position(page, ".ht-form-heading h2", .6);
  await expect(page.locator(".ht-form-heading h2")).toHaveAttribute("data-text-state", "ENTERING");
  const scroll = await page.evaluate(() => scrollY);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  await expect(page.locator(".ht-form-heading h2")).toHaveAttribute("data-text-state", "BYPASS_VISIBLE");
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await page.addInitScript(() => { Object.defineProperty(window, "IntersectionObserver", { value: class { constructor() { throw new Error("Unavailable observer"); } } }); });
  await page.reload();
  await expect(page.locator(".ht-form-heading h2 [data-text-layer]")).toHaveCSS("opacity", "1");
  await expect(page.locator(".ht-form-heading h2 [data-text-layer]")).toHaveCSS("transform", "none");
});

test("hash, find, native disclosure and restored history bypass delayed readability", async ({ page }) => {
  await page.goto("/dich-vu/hoa-thoi#tu-van");
  await expect(page.locator(".ht-form-heading h2 [data-text-layer]")).toHaveCSS("opacity", "1");
  await page.goto("/ve-hoe");
  await page.locator(".faq summary").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".faq details").first()).toHaveAttribute("open", "");
  await expect(page.locator(".faq p").first().locator("[data-text-layer]")).toHaveCSS("opacity", "1");
  await page.keyboard.press("Control+f");
  await expect.poll(() => page.locator("[data-text-layer]").evaluateAll(nodes => nodes.every(node => getComputedStyle(node).opacity === "1"))).toBe(true);
  await page.keyboard.press("Escape");
  const before = await page.evaluate(() => scrollY);
  await page.locator(".hoe-store-header .nav a[href='/blog']").first().evaluate(node => (node as HTMLElement).click());
  await expect(page).toHaveURL(/\/blog$/);
  await page.goBack();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
  await expect(page.locator(".faq h2 [data-text-layer], .faq p [data-text-layer]").first()).toHaveCSS("opacity", "1");
});

test("all Store route families opt in; protected sections and functional text do not", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/san-pham", "/san-pham/mau-test-diu-dang", "/san-pham/mau-test-hoa-thoi", "/san-pham/mau-test-nang", "/dich-vu/hoa-tam", "/dich-vu/hoa-thoi", "/dich-vu/hoa-y", "/gio-hang", "/dat-hoa", "/ve-hoe", "/blog", "/blog/chuyen-cua-hoe", "/chinh-sach/ban-hang", "/lien-he", "/khong-co-trang-nay"]) {
    await page.goto(route);
    await expect(page.locator("[data-store-text]").first(), route).toBeAttached();
    expect(await page.locator("[data-store-text]").count(), route).toBeGreaterThan(0);
    expect(await page.locator(".olf-hero [data-store-text], .olf-featured-carousel [data-store-text], .hoe-store-header [data-store-text], button [data-store-text], label [data-store-text], [role='status'] [data-store-text], .product-price [data-store-text]").count(), route).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
  }
  for (const route of ["/admin", "/dang-nhap", "/xem-thu/widgets", "/xem-thu/absent"]) {
    await page.goto(route);
    expect(await page.locator("[data-store-text]").count()).toBe(0);
  }
});

test("responsive layout, short viewport and zoom-equivalent layout keep static shells and usable controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Explicit widths cover both mobile and desktop layout.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const measurements: object[] = [];
  for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 900 }, { width: 1024, height: 900 }, { width: 1440, height: 900 }, { width: 390, height: 420 }, { width: 720, height: 450 }]) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/san-pham", "/dich-vu/hoa-thoi", "/san-pham/mau-test-hoa-thoi", "/blog/chuyen-cua-hoe", "/lien-he"]) {
      await page.goto(route);
      await expect(page.locator("[data-store-text]").first()).toBeAttached();
      const result = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, shellsStatic: [...document.querySelectorAll('.store-heading-section, .store-detail-section, form, .ht-layout, .ht-calendar-summary')].every(node => getComputedStyle(node).transform === "none"), textVisible: [...document.querySelectorAll('[data-text-layer]')].every(node => getComputedStyle(node).opacity === "1") }));
      expect(result.overflow, `${route} ${viewport.width}`).toBe(false);
      expect(result.shellsStatic).toBe(true);
      expect(result.textVisible).toBe(true);
      measurements.push({ route, viewport, ...result });
    }
  }
  await testInfo.attach("responsive-layout", { body: JSON.stringify(measurements, null, 2), contentType: "application/json" });
});
