import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const root = "docs/store-motion/v1";
const baseURL = process.env.STORE_REVIEW_URL || "http://localhost:3100";
await mkdir(`${root}/responsive`, { recursive: true });
const routes = ["/", "/san-pham", "/san-pham/mau-test-diu-dang", "/san-pham/mau-test-hoa-thoi", "/san-pham/mau-test-nang", "/dich-vu/hoa-tam", "/dich-vu/hoa-thoi", "/dich-vu/hoa-y", "/gio-hang", "/dat-hoa", "/ve-hoe", "/blog", "/blog/chuyen-cua-hoe", "/chinh-sach/ban-hang", "/lien-he", "/motion-route-missing"];
const rows = [];
const browser = await chromium.launch();
try {
  for (const width of [360, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 }, reducedMotion: "reduce", ...(width < 768 ? { isMobile: true, hasTouch: true } : {}) });
    const page = await context.newPage();
    for (const route of routes) {
      const errors = [];
      const collect = error => errors.push(error.message);
      page.on("pageerror", collect);
      const response = await page.goto(route);
      await page.locator('h1').first().waitFor();
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        forms: Array.from(document.querySelectorAll('form')).map(node => ({ opacity: getComputedStyle(node).opacity, transform: getComputedStyle(node).transform })),
        content: Array.from(document.querySelectorAll('.ht-calendar-summary, .prose, .comments, .hoe-store-footer')).map(node => ({ opacity: getComputedStyle(node).opacity, transform: getComputedStyle(node).transform })),
      }));
      assert.equal(geometry.overflow, false, `${width} ${route} horizontal overflow`);
      for (const node of [...geometry.forms, ...geometry.content]) { assert.equal(node.opacity, "1"); assert.equal(node.transform, "none"); }
      assert.deepEqual(errors, [], `${width} ${route} page errors`);
      rows.push({ width, height: 900, route, status: response.status(), ...geometry, errors });
      page.off("pageerror", collect);
      if (route === "/san-pham") await page.locator('.service-grid').screenshot({ path: `${root}/responsive/${width}-catalogue-focus.png` });
      if (route === "/san-pham/mau-test-nang") {
        await page.getByRole('combobox', { name: 'Hình thức', exact: true }).focus();
        await page.screenshot({ path: `${root}/responsive/${width}-product-focus.png` });
      }
      if (route === "/dich-vu/hoa-thoi") {
        await page.locator('.ht-calendar-summary').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${root}/responsive/${width}-calendar-summary.png` });
      }
    }
    await context.close();
    console.log(`responsive ${width}: ${routes.length} routes checked`);
  }

  for (const [width, height, name] of [[1440, 580, "short"], [720, 450, "zoom-200-equivalent"]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    await page.goto(`${baseURL}/san-pham/mau-test-nang`);
    await page.locator('.picker-trigger').click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const box = await page.locator('.hoe-picker .modal-dialog').boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, `${name} picker exceeds viewport`);
    await page.screenshot({ path: `${root}/responsive/${name}-picker.png` });
    await page.keyboard.press('Escape');
    await page.goto(`${baseURL}/dich-vu/hoa-thoi`);
    await page.locator('.ht-calendar-summary[data-sticky]').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.locator('.ht-calendar-summary').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${root}/responsive/${name}-calendar.png` });
    rows.push({ width, height, route: "picker + Hoa Thời", emulation: name, passed: true });
    await page.close();
  }

  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await page.goto(`${baseURL}/dich-vu/hoa-thoi`);
    await page.locator('.ht-calendar-summary[data-sticky]').waitFor();
    for (let i = 0; i < 9; i++) await page.getByRole('button', { name: 'Tăng số combo', exact: true }).click();
    await page.locator('.ht-calendar-day-button:not([disabled])').first().click();
    await page.waitForFunction(() => document.querySelector('.ht-calendar-summary')?.dataset.sticky === "false");
    await page.locator('.ht-period-progress').last().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${root}/responsive/${width}-long-summary.png` });
    rows.push({ width, height: 900, route: "/dich-vu/hoa-thoi", scenario: "10 combo tall summary remains in normal flow", passed: true });
    await page.close();
  }

  const protectedBefore = JSON.parse(await readFile(`${root}/before/protected-sources.json`, "utf8"));
  for (const [file, expected] of Object.entries(protectedBefore)) assert.equal(createHash("sha256").update(await readFile(file)).digest("hex"), expected, `${file} changed`);
  const before = JSON.parse(await readFile(`${root}/before/manifest.json`, "utf8"));
  const after = JSON.parse(await readFile(`${root}/after/manifest.json`, "utf8"));
  const heroComparison = [];
  for (const old of before.results.filter(row => row.name === "home")) {
    const current = after.results.find(row => row.name === "home" && row.width === old.width && row.preference === old.preference);
    assert.ok(current, "missing Hero capture");
    // Scroll snapshots sample the same fixed positions after settling.
    const drift = Math.max(...old.hero.flatMap((snapshot, i) => snapshot.map((node, j) => Math.max(Math.abs(node.width - current.hero[i][j].width), Math.abs(node.height - current.hero[i][j].height)))));
    assert.ok(drift < 1, `${old.width} ${old.preference} Hero geometry drift ${drift}`);
    heroComparison.push({ width: old.width, preference: old.preference, maxGeometryDrift: drift, transformsIdentical: JSON.stringify(old.hero) === JSON.stringify(current.hero) });
  }
  await writeFile(`${root}/hero-comparison.json`, JSON.stringify(heroComparison, null, 2));
  await writeFile(`${root}/responsive.json`, JSON.stringify(rows, null, 2));
} finally { await browser.close(); }
console.log("Protected sources, Hero geometry and responsive reading surfaces verified.");
