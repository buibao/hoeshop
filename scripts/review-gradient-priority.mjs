import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Expected before or after');
const directory = `docs/store-gradients/v2.1/${phase}/states`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const report = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ baseURL: 'http://localhost:3101', viewport: { width, height: 900 }, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-hoe-test-identity': randomUUID() } });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-11T10:00:00Z'));
    const shot = async (name, selector) => {
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => document.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }));
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      await (selector ? page.locator(selector).first() : page).screenshot({ path: `${directory}/${width}-${name}.png`, style: '.skip-link:not(:focus) { visibility: hidden; }', ...(selector ? {} : { fullPage: true }) });
    };
    await page.goto('/san-pham/mau-test-diu-dang');
    await page.getByRole('button', { name: 'Thêm vào giỏ hoa', exact: true }).click();
    await expect(page.locator('.error[role=alert]')).toBeVisible();
    await shot('product-error');
    await page.getByLabel('Cảm xúc muốn gửi', { exact: true }).fill('Review bề mặt gradient local');
    // Existing quantity input is commented out in HEAD. A browser-only fixture
    // enables visual review of cart/checkout without changing application logic.
    await page.locator('.detail-copy form').evaluate(form => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = 'quantity'; input.value = '1'; form.append(input);
    });
    await page.getByRole('button', { name: 'Thêm vào giỏ hoa', exact: true }).click();
    await expect(page.getByText('Đã thêm vào giỏ hoa.', { exact: true })).toBeVisible();
    await shot('product');
    await page.goto('/gio-hang');
    await shot('cart-populated');
    await page.getByRole('button', { name: 'Sửa cấu hình', exact: true }).click();
    await shot('cart-edit');
    await page.goto('/dat-hoa');
    await page.getByLabel('Họ tên người đặt', { exact: true }).focus();
    await shot('checkout');
    await page.goto('/dich-vu/hoa-thoi');
    await page.getByRole('button', { name: 'Tăng số bó mỗi tuần', exact: true }).click();
    await page.getByRole('button', { name: 'Tăng số combo', exact: true }).click();
    const day = iso => page.locator('[data-delivery-calendar]').getByRole('button', { name: new RegExp(` · ${iso}`) });
    for (const iso of ['2026-10-14', '2026-10-17', '2026-10-20']) await day(iso).click();
    await shot('calendar-three-of-four', '.ht-fields');
    await shot('service-configured');
    await day('2026-10-23').click();
    await shot('calendar-complete', '.ht-fields');
    if (width < 1024) await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
    const trigger = page.getByRole('button', { name: 'Các loại hoa', exact: true }).last();
    await trigger.click();
    const root = width < 1024 ? '.hoe-store-menu .hoe-store-submenu' : '.hoe-store-header .hoe-store-submenu';
    await page.mouse.move(width - 4, 4);
    await shot('submenu-current-default', root);
    const links = page.locator(`${root} li a`);
    for (let index = 0; index < 3; index++) {
      const link = links.nth(index);
      await trigger.focus();
      await link.hover();
      await shot(`submenu-${index}-hover`, root);
      await page.keyboard.press('Tab');
      await link.focus();
      await page.mouse.move(width - 4, 4);
      await shot(`submenu-${index}-focus`, root);
      report.push({ width, index, ...await link.evaluate(el => ({ focusVisible: el.matches(':focus-visible'), image: getComputedStyle(el).backgroundImage, decoration: getComputedStyle(el).textDecorationLine, titleDecoration: getComputedStyle(el.querySelector('strong')).textDecorationLine, descriptionDecoration: getComputedStyle(el.querySelector('small')).textDecorationLine })) });
    }
    await page.keyboard.press('Escape');
    if (width < 1024) await page.keyboard.press('Escape');
    await page.goto('/blog/chuyen-cua-hoe');
    await page.getByRole('button', { name: 'Gửi bình luận', exact: true }).click();
    await expect(page.locator('.comments .error[role=alert]')).toBeVisible();
    await page.getByLabel('Tên hiển thị', { exact: true }).focus();
    await shot('comment-error-focus');
    await context.close();
  }
} finally {
  await writeFile(`${directory}/report.json`, JSON.stringify({ fixture: 'local mock; quantity=1 injected into browser only; no API submission', menu: report }, null, 2));
  await browser.close();
}
