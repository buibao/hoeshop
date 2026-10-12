import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const directory = 'docs/store-gradients/review-fixes';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const report = { layout: [], menu: [], states: [] };
try {
  for (const width of [1440, 390, 360, 768, 1024]) {
    const context = await browser.newContext({ baseURL: 'http://localhost:3101', viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-11T10:00:00Z'));
    const shot = async (name, selector) => {
      if (![1440, 390].includes(width)) return;
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => document.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }));
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      await (selector ? page.locator(selector).first() : page).screenshot({ path: `${directory}/${width}-${name}.png`, style: '.skip-link:not(:focus) { visibility: hidden; }', ...(selector ? {} : { fullPage: true }) });
    };
    for (const [name, route] of [['home', '/'], ['blog', '/blog'], ['service-y', '/dich-vu/hoa-y'], ['service-tam', '/dich-vu/hoa-tam'], ['service-thoi', '/dich-vu/hoa-thoi'], ['product-thoi', '/san-pham/mau-test-hoa-thoi']]) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      expect(overflow, `${route} at ${width}`).toBe(false);
      report.layout.push({ width, route, overflow });
      await shot(name);
      if (name === 'home') {
        await shot('faq', '.olf-faq');
        await page.locator('.olf-faq summary').first().click();
        await shot('faq-expanded', '.olf-faq');
        await shot('hero-photos', '.olf-hero');
        const photos = await page.locator('.olf-photo-frame').evaluateAll(frames => frames.map(frame => ({ background: getComputedStyle(frame).backgroundColor, shadow: getComputedStyle(frame).boxShadow, fit: getComputedStyle(frame.querySelector('img')).objectFit })));
        for (const photo of photos) { expect(photo.background).toBe('rgba(0, 0, 0, 0)'); expect(photo.shadow).toBe('none'); expect(photo.fit).toBe('contain'); }
        report.states.push({ width, name: 'uncropped transparent photo frames', photos });
      }
      if (name === 'service-y') {
        const space = await page.locator('.service-page-top').evaluate(el => ({ bottom: el.closest('.store-heading-section').getBoundingClientRect().bottom - el.getBoundingClientRect().bottom, copyPadding: getComputedStyle(el.querySelector('.page-heading')).paddingBottom }));
        expect(space.bottom).toBeGreaterThanOrEqual(32);
        report.states.push({ width, name: 'service heading breathing room', ...space });
        await shot('service-heading', '.store-heading-section');
      }
      if (name === 'service-thoi' || name === 'product-thoi') {
        const selector = name === 'service-thoi' ? '.ht-inquiry' : '.ht-product-form';
        const padding = await page.locator(selector).evaluate(el => ({ left: getComputedStyle(el).paddingLeft, right: getComputedStyle(el).paddingRight, top: getComputedStyle(el).paddingTop, image: getComputedStyle(el).backgroundImage }));
        expect(parseFloat(padding.left)).toBeGreaterThanOrEqual(16);
        expect(padding.image).toContain('gradient');
        report.states.push({ width, name: `${name} form padding`, ...padding });
        const day = page.locator('.ht-calendar-day-button:not([disabled])').first();
        await day.click();
        await expect(day).toHaveCSS('color', 'rgb(51, 44, 42)');
        await shot(`${name}-selected`, '.ht-fields');
        await day.click();
        expect(await day.evaluate(el => getComputedStyle(el).backgroundImage)).toBe('none');
        if (name === 'service-thoi' && [1440, 390].includes(width)) {
          if (width < 1024) await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
          const trigger = page.getByRole('button', { name: 'Các loại hoa', exact: true }).last();
          await trigger.click();
          const submenu = page.locator(width < 1024 ? '.hoe-store-menu .hoe-store-submenu' : '.hoe-store-header .hoe-store-submenu');
          const current = submenu.locator('a[aria-current="page"]');
          await trigger.focus();
          await page.mouse.move(width - 4, 4);
          const image = await current.evaluate(el => getComputedStyle(el).backgroundImage);
          expect(image).toContain('gradient');
          await shot('menu-active-after-blur', width < 1024 ? '.hoe-store-menu' : '.hoe-store-submenu');
          const hover = submenu.locator('li a').nth(1);
          await hover.hover();
          expect(await hover.evaluate(el => getComputedStyle(el).backgroundImage)).toBe(image);
          expect(await current.evaluate(el => getComputedStyle(el).backgroundImage)).toBe(image);
          expect(await current.evaluate(el => getComputedStyle(el).textDecorationLine)).toBe('none');
          await shot('menu-active-and-hover', width < 1024 ? '.hoe-store-menu' : '.hoe-store-submenu');
          report.menu.push({ width, currentRetainsHighlight: true, activeMatchesHover: true });
          await page.keyboard.press('Escape');
          if (width < 1024) await page.keyboard.press('Escape');
        }
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
}
console.log(`${report.layout.length} responsive checks; photo/padding/selection/active checks passed`);
