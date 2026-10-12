import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const revision = process.argv.includes('--v2.1') ? 'v2.1/' : '';
const directory = `docs/store-gradients/${revision}verification`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const baseURL = 'http://localhost:3101';
const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-hoe-test-identity': randomUUID() } });
const page = await context.newPage();
page.setDefaultNavigationTimeout(120000);
await page.clock.setFixedTime(new Date('2026-10-11T10:00:00Z'));
const report = { responsive: [], contrast: [], states: [], flow: [] };
if (process.argv.includes('--states-only')) report.responsive = JSON.parse(await readFile(`${directory}/report.json`, 'utf8')).responsive;
const luminance = channels => channels.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
async function contrast(name, background, foreground = background, threshold = 4.5, property = 'color') {
  const target = page.locator(background).first();
  const fg = await page.locator(foreground).first().evaluate((el, property) => getComputedStyle(el)[property], property);
  const rgba = await page.evaluate(color => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const painter = canvas.getContext('2d'); painter.fillStyle = color; painter.fillRect(0, 0, 1, 1);
    return [...painter.getImageData(0, 0, 1, 1).data];
  }, fg);
  assert.equal(rgba[3], 255, `${name}: foreground must be opaque (${fg})`);
  const rgb = rgba.slice(0, 3);
  await target.evaluate(el => el.setAttribute('data-contrast-target', 'true'));
  // Sample the actual browser raster of every role, with its alpha layers and
  // ancestor background intact. Hide copy temporarily, preserving its geometry.
  const png = await target.screenshot({ style: '[data-contrast-target] { color: transparent !important; text-shadow: none !important; } [data-contrast-target] * { visibility: hidden !important; } .olf-back-to-top, nextjs-portal, .skip-link { visibility: hidden !important; }', animations: 'disabled' });
  await writeFile(`${directory}/background-${name.replaceAll(' ', '-')}.png`, png);
  await target.evaluate(el => el.removeAttribute('data-contrast-target'));
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let minimum = Infinity, worst = [];
  const pad = Math.min(16, Math.floor(Math.min(info.width, info.height) / 4));
  for (let y = pad; y < info.height - pad; y += 2) for (let x = pad; x < info.width - pad; x += 2) {
    const offset = (y * info.width + x) * info.channels;
    const pixel = [...data.subarray(offset, offset + 3)];
    const value = ratio(luminance(rgb), luminance(pixel));
    if (value < minimum) { minimum = value; worst = pixel; }
  }
  const result = { name, foreground: fg, worstBackground: worst, minimum: +minimum.toFixed(3), threshold, pass: minimum >= threshold };
  report.contrast.push(result);
  console.log('contrast', name, result.minimum);
  assert.ok(result.pass, `${name}: ${minimum} < ${threshold}`);
}
async function shot(name, locator) {
  const target = locator ? page.locator(locator).first() : page;
  await target.screenshot({ path: `${directory}/${page.viewportSize().width}-${name}.png`, ...(locator ? {} : { fullPage: true }) });
}
try {
  const inventory = JSON.parse(await readFile(`docs/store-gradients/${revision}after/routes.json`, 'utf8')).filter(row => row.width === 390);
  for (const { name, route } of process.argv.includes('--states-only') ? [] : inventory) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      // Let ResizeObserver and layout-dependent calendar/carousel effects settle.
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      report.responsive.push({ name, route, width, overflow });
      assert.equal(overflow, false, `${route}: overflow at ${width}`);
    }
    console.log('responsive', name);
  }
  await page.goto('/');
  await contrast('header navigation', '.hoe-store-header', '.hoe-store-header .nav > a');
  await contrast('header icon', '.hoe-store-header', '.hoe-store-header .cart-link', 3);
  await contrast('footer helper', '.hoe-store-footer', '.hoe-store-footer .footer-brand p');
  await contrast('footer links', '.hoe-store-footer', '.hoe-store-footer .footer-links a');
  await contrast('ambient helper', '.olf-hero', '.olf-hero-description > p');
  await contrast('blush helper', '.olf-services', '.olf-services .olf-section-heading p');
  await contrast('warm helper', '.olf-story', '.olf-benefits-intro p');
  await contrast('card helper', '.olf-service-card', '.olf-service-card p');
  // The third grid item owns the berry role (article is nested in reveal nodes).
  await contrast('berry benefit copy', '.olf-benefit-grid > :nth-child(3) .olf-benefit-card', '.olf-benefit-grid > :nth-child(3) .olf-benefit-card p');
  await contrast('berry benefit icon', '.olf-benefit-grid > :nth-child(3) .olf-benefit-card', '.olf-benefit-grid > :nth-child(3) .olf-benefit-art', 3);
  await contrast('primary action', '.olf-hero .olf-button');
  await page.locator('.olf-hero .olf-button').hover();
  await page.waitForTimeout(200);
  await contrast('primary hover', '.olf-hero .olf-button');
  await page.goto('/san-pham/mau-test-diu-dang');
  await contrast('detail ambient helper', '.store-detail-section', '.detail-copy .editorial-price-note');
  await contrast('product form helper', '.detail-copy form', '.detail-copy form .form-note');
  await contrast('form adjacent boundary', '.detail-copy form', 'textarea[name=emotion]', 3, 'borderTopColor');
  await contrast('input boundary', 'textarea[name=emotion]', 'textarea[name=emotion]', 3, 'borderTopColor');
  await page.locator('textarea[name=emotion]').focus();
  await contrast('input focus', 'textarea[name=emotion]', 'textarea[name=emotion]', 3, 'outlineColor');
  await contrast('form adjacent focus', '.detail-copy form', 'textarea[name=emotion]', 3, 'outlineColor');
  await page.getByRole('button', { name: 'Thêm vào giỏ hoa', exact: true }).click();
  await expect(page.locator('.error[role=alert]')).toBeVisible();
  await contrast('invalid input boundary', 'textarea[name=emotion]', 'textarea[name=emotion]', 3, 'borderTopColor');
  await shot('product-error');
  await page.getByLabel('Cảm xúc muốn gửi', { exact: true }).fill('Review gradient local');
  // HEAD comments out QuantityField's input. Supply a local browser fixture only;
  // preserve that unrelated business bug in source and record the limitation.
  await page.locator('.detail-copy form').evaluate(form => {
    const quantity = document.createElement('input');
    quantity.type = 'hidden'; quantity.name = 'quantity'; quantity.value = '1';
    form.append(quantity);
  });
  report.flow.push({ name: 'fixture prerequisite', limitation: 'HEAD QuantityField omits quantity input; injected quantity=1 in browser only' });
  await page.getByRole('button', { name: 'Thêm vào giỏ hoa', exact: true }).click();
  await expect(page.getByText('Đã thêm vào giỏ hoa.', { exact: true })).toBeVisible();
  await page.goto('/gio-hang');
  await contrast('cart summary helper', '.cart-summary', '.cart-summary .form-note');
  await shot('cart-populated');
  await page.getByRole('button', { name: 'Sửa cấu hình', exact: true }).click();
  await shot('cart-edit');
  await page.getByRole('button', { name: 'Lưu cấu hình', exact: true }).click();
  await page.goto('/dat-hoa');
  await contrast('checkout heading helper', '.store-heading-section', '.page-heading p');
  await contrast('checkout form text', 'form.card', 'form.card label');
  await contrast('checkout form helper', 'form.card', 'form.card .form-note');
  await shot('checkout');
  await page.goto('/san-pham/mau-test-diu-dang');
  const dateTrigger = page.getByRole('button', { name: /Mở lịch:/ }).first();
  await dateTrigger.click();
  await page.getByRole('button', { name: 'Chọn hôm nay', exact: true }).click();
  await expect(page.locator('.hoe-day-selected .hoe-day-button')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await contrast('picker calendar text', '.hoe-picker .modal-content', '.hoe-picker .modal-title');
  await contrast('picker form helper', '.hoe-picker .modal-header', '.hoe-picker .eyebrow');
  await contrast('picker selected day', '.hoe-day-selected .hoe-day-button');
  await page.keyboard.press('Tab');
  await page.locator('.hoe-day-selected .hoe-day-button').focus();
  await expect(page.locator('.hoe-day-selected .hoe-day-button')).toHaveCSS('outline-color', 'rgb(255, 255, 255)');
  await contrast('picker day focus', '.hoe-day-selected .hoe-day-button', '.hoe-day-selected .hoe-day-button', 3, 'outlineColor');
  await shot('picker-date', '.hoe-picker .modal-dialog');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(dateTrigger).toBeFocused();
  await page.getByRole('button', { name: /Chọn giờ:/ }).first().click();
  await page.getByRole('listbox', { name: 'Giờ', exact: true }).getByRole('option', { name: '23', exact: true }).click();
  await page.getByRole('listbox', { name: 'Phút', exact: true }).getByRole('option', { name: '59', exact: true }).click();
  await expect(page.locator('.time-list button[aria-selected=true]').first()).toHaveCSS('color', 'rgb(255, 255, 255)');
  await contrast('picker selected time', '.time-list button[aria-selected=true]');
  await page.keyboard.press('Tab');
  await page.locator('.time-list button[aria-selected=true]').first().focus();
  await contrast('picker time focus', '.time-list button[aria-selected=true]', '.time-list button[aria-selected=true]', 3, 'outlineColor');
  await shot('picker-time', '.hoe-picker .modal-dialog');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await page.goto('/dat-hoa');
  for (const [name, value] of [['Họ tên người đặt', 'Khách review local'], ['Số điện thoại', '0901234567'], ['Tên người nhận', 'Người nhận mock'], ['Địa chỉ nhận hoa', 'Địa chỉ mock local']]) await page.getByLabel(name, { exact: true }).fill(value);
  const order = page.waitForResponse(response => response.url().endsWith('/api/orders') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Gửi yêu cầu đặt hoa', exact: true }).click();
  const response = await order;
  assert.equal(response.status(), 201);
  await expect(page.getByRole('status')).toContainText('Hòe đã nhận yêu cầu');
  report.flow.push({ name: 'product → cart/edit → checkout → mock receipt', status: response.status(), cartCleared: await page.evaluate(() => JSON.parse(localStorage.getItem('hoe.cart.v1')).items.length === 0) });
  await shot('receipt');
  await page.goto('/lien-he');
  await contrast('inquiry form text', 'form.card', 'form.card label');
  await page.getByLabel('Họ tên', { exact: true }).fill('Khách mock gradient');
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0901234567');
  await page.getByLabel('Nội dung yêu cầu', { exact: true }).fill('Kiểm tra inquiry local và trạng thái thử lại');
  let failInquiry = true;
  await page.route('**/api/inquiries', async route => {
    if (failInquiry) { failInquiry = false; await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Lỗi mock local, thử lại.' } }) }); }
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Gửi yêu cầu tư vấn', exact: true }).click();
  await expect(page.locator('.error[role=alert]')).toBeVisible();
  await shot('inquiry-error');
  const inquiry = page.waitForResponse(response => response.url().endsWith('/api/inquiries') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Gửi yêu cầu tư vấn', exact: true }).click();
  assert.equal((await inquiry).status(), 201);
  await expect(page.getByRole('status')).toContainText('Đây là yêu cầu tư vấn');
  await shot('inquiry-success');
  report.flow.push({ name: 'inquiry error → retry → mock receipt', status: 201 });
  await page.goto('/dich-vu/hoa-thoi');
  await contrast('schedule form helper', '.ht-inquiry', '.ht-inquiry .ht-helper');
  await contrast('calendar helper', '.ht-delivery-calendar', '.ht-delivery-calendar .ht-helper');
  await contrast('calendar icon', '.ht-delivery-calendar', '.ht-calendar-controls button', 3);
  await page.getByRole('button', { name: 'Tăng số bó mỗi tuần', exact: true }).click();
  await page.getByRole('button', { name: 'Tăng số combo', exact: true }).click();
  const day = iso => page.locator('[data-delivery-calendar]').getByRole('button', { name: new RegExp(` · ${iso}`) });
  for (const iso of ['2026-10-14', '2026-10-17', '2026-10-20']) await day(iso).click();
  await contrast('selected soft day', '.ht-calendar-selected .ht-calendar-day-button');
  await contrast('schedule summary helper', '.ht-summary', '.ht-summary .ht-helper');
  await contrast('selected soft package', '.ht-period-option.is-selected');
  await shot('calendar-three-of-four', '.ht-fields');
  await day('2026-10-23').click();
  await shot('calendar-complete', '.ht-fields');
  await day('2026-10-23').click();
  assert.equal(await day('2026-10-23').evaluate(el => getComputedStyle(el).backgroundImage), 'none');
  report.states.push({ name: 'soft selected → unselected clears image', pass: true });
  await page.setViewportSize({ width: 390, height: 900 });
  await shot('calendar-three-of-four', '.ht-fields');
  await contrast('mobile header icon', '.hoe-store-header', '.hoe-store-header .cart-link', 3);
  await contrast('mobile footer helper', '.hoe-store-footer', '.hoe-store-footer .footer-brand p');
  await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  await page.getByRole('button', { name: 'Các loại hoa', exact: true }).last().click();
  await shot('mobile-menu', '.hoe-store-menu');
  const menuItem = page.locator('.hoe-store-menu .hoe-store-submenu a').nth(1);
  await menuItem.hover();
  await contrast('submenu hover helper', '.hoe-store-menu .hoe-store-submenu a:nth-of-type(1):hover', '.hoe-store-menu .hoe-store-submenu a:hover small');
  await page.keyboard.press('Tab');
  await menuItem.focus();
  await page.mouse.move(386, 4);
  await contrast('submenu focus helper', '.hoe-store-menu .hoe-store-submenu a:focus-visible', '.hoe-store-menu .hoe-store-submenu a:focus-visible small');
  await contrast('submenu focus outline', '.hoe-store-menu .hoe-store-submenu a:focus-visible', '.hoe-store-menu .hoe-store-submenu a:focus-visible', 3, 'outlineColor');
  await page.keyboard.press('Escape');
  await page.goto('/san-pham/mau-test-diu-dang');
  await page.getByRole('button', { name: /Mở lịch:/ }).first().click();
  await page.getByRole('button', { name: 'Chọn hôm nay', exact: true }).click();
  await shot('picker-date', '.hoe-picker .modal-dialog');
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.getByRole('button', { name: /Chọn giờ:/ }).first().click();
  await page.getByRole('listbox', { name: 'Giờ', exact: true }).getByRole('option', { name: '23', exact: true }).click();
  await shot('picker-time', '.hoe-picker .modal-dialog');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Các loại hoa', exact: true }).click();
  await page.locator('.hoe-store-header .hoe-store-submenu a').nth(2).hover();
  await contrast('desktop submenu hover helper', '.hoe-store-header .hoe-store-submenu a:hover', '.hoe-store-header .hoe-store-submenu a:hover small');
  await contrast('desktop submenu icon', '.hoe-store-header .hoe-store-submenu a:hover', '.hoe-store-header .hoe-store-submenu a:hover svg', 3);
  await shot('submenu', '.hoe-store-submenu');
  await page.keyboard.press('Escape');
  await page.goto('/blog/chuyen-cua-hoe');
  await contrast('article heading', '.store-heading-section', '.article-title h1');
  await contrast('comment form text', '.comments form', '.comments form label');
  await shot('article-comment');
  await page.goto('/');
  await page.emulateMedia({ forcedColors: 'active' });
  await shot('forced-colors');
  await page.emulateMedia({ forcedColors: 'none' });
  await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      let rules; try { rules = [...sheet.cssRules]; } catch { continue; }
      for (let i = rules.length - 1; i >= 0; i--) {
        if (rules[i] instanceof CSSSupportsRule && rules[i].conditionText.includes('color-mix') && rules[i].cssText.includes('--store-gradient-ambient')) sheet.deleteRule(i);
      }
    }
  });
  await contrast('fallback blush helper', '.olf-services', '.olf-services .olf-section-heading p');
  await contrast('fallback action', '.olf-hero .olf-button');
  await shot('without-color-mix');
  report.states.push({ name: 'color-mix @supports removed: valid solid fallback roles', pass: true });
  const noJS = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const staticPage = await noJS.newPage();
  for (const route of ['/', '/dich-vu/hoa-thoi', '/khong-co-trang-nay']) {
    await staticPage.goto(route);
    await expect(staticPage.locator('h1')).toBeVisible();
    await staticPage.screenshot({ path: `${directory}/390-no-js-${route === '/' ? 'home' : route.includes('dich-vu') ? 'service' : '404'}.png`, fullPage: true });
    report.states.push({ name: `no-JS ${route}`, pass: true });
  }
  await noJS.close();
} finally {
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
