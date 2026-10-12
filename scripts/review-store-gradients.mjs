import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// Run only against the isolated local fixture launcher, never Preview/production.
const phase = process.argv[2] || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Expected before or after');
const baseURL = 'http://localhost:3101';
const revision = process.argv[3];
if (revision && revision !== 'v2.1') throw new Error('Unknown revision');
const directory = `docs/store-gradients/${revision ? `${revision}/` : ''}${phase}`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const report = [];
const routes = [
  ['home', '/'], ['catalogue', '/san-pham'],
  ['product-tam', '/san-pham/mau-test-diu-dang'],
  ['product-thoi', '/san-pham/mau-test-hoa-thoi'],
  ['product-y', '/san-pham/mau-test-nang'],
  ['service-tam', '/dich-vu/hoa-tam'], ['service-thoi', '/dich-vu/hoa-thoi'],
  ['service-y', '/dich-vu/hoa-y'], ['cart-empty', '/gio-hang'],
  ['checkout-empty', '/dat-hoa'], ['about', '/ve-hoe'], ['blog', '/blog'],
  ['article', '/blog/chuyen-cua-hoe'], ['policy-unpublished', '/chinh-sach/ban-hang'],
  ['contact', '/lien-he'], ['404', '/khong-co-trang-nay'],
  ['product-404', '/san-pham/khong-co-mau'], ['admin', '/admin'],
  ['auth', '/dang-nhap'], ['preview', '/xem-thu/widgets'],
];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 }, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-hoe-test-identity': randomUUID() } });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(120000);
    await page.clock.setFixedTime(new Date('2026-10-11T10:00:00Z'));
    for (const [name, route] of routes) {
      const errors = [];
      const onError = error => errors.push(error.message);
      page.on('pageerror', onError);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('h1').first().waitFor();
      await page.evaluate(() => document.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }));
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0), undefined, { timeout: 30000 });
      if (phase === 'before' && !revision) {
        // Re-capture HEAD colours without changing source or interrupting the dev
        // server. This file is the last import in each of its owning CSS chunks.
        await page.evaluate(() => {
          for (const sheet of document.styleSheets) {
            let rules;
            try { rules = [...sheet.cssRules]; } catch { continue; }
            const start = rules.findIndex(rule => rule.cssText.includes('--store-gradient-ambient:'));
            if (start >= 0) for (let index = rules.length - 1; index >= start; index--) sheet.deleteRule(index);
          }
          // Root fallback's new wrapper has no counterpart in HEAD.
          const wrapper = document.querySelector('.hoe-store-scope:has(> .empty)');
          if (wrapper) wrapper.replaceWith(...wrapper.childNodes);
        });
      }
      await page.screenshot({ path: `${directory}/${width}-${name}.png`, fullPage: true });
      report.push({ width, name, route, status: response.status(), errors, ...await page.evaluate(() => {
        const geometry = {};
        for (const selector of ['h1', '.page-heading', '.article-title', '.detail-grid', '.detail-image', '.detail-copy', '.service-page-top', '.service-art', '.service-grid', '.product-grid', '.contact-layout', '.cart-layout', '.prose', '.ht-service-flow', '.ht-inquiry', '.hoe-store-footer']) {
          const element = document.querySelector(selector);
          if (element) { const box = element.getBoundingClientRect(); geometry[selector] = { x: box.x, y: box.y + scrollY, width: box.width, height: box.height }; }
        }
        return { overflow: document.documentElement.scrollWidth > innerWidth + 1, scope: !!document.querySelector('.hoe-store-scope'), body: getComputedStyle(document.body).backgroundColor, heading: getComputedStyle(document.querySelector('.store-heading-section, .store-detail-section, .page-heading, .article-title, .olf-hero, .detail-copy, .empty, h1')).backgroundImage, geometry };
      }) });
      page.off('pageerror', onError);
      console.log(`${phase} ${width} ${name}: ${response.status()}`);
    }
    await context.close();
  }
} finally {
  await writeFile(`${directory}/routes.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
