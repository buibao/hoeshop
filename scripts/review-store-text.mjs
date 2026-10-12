import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const phase = process.argv.includes('--before') ? 'before' : 'after';
const baseURL = 'http://localhost:3101';
const directory = `docs/store-motion/v3/${phase}`;
await mkdir(`${directory}/raw`, { recursive: true });
const protectedFiles = [
  'src/features/storefront/LandingHeroMotion.tsx', 'src/features/storefront/landing-geometry.ts',
  'src/features/storefront/LandingMotion.tsx', 'src/features/storefront/FeaturedProductCarousel.tsx',
  'src/features/storefront/carousel-autoplay.ts', 'src/components/ui/MotionProvider.tsx',
  'src/components/ui/SmoothScroll.tsx', 'src/app/layout.tsx', 'src/fonts/store-fonts.ts',
];
const hashes = Object.fromEntries(await Promise.all(protectedFiles.map(async file => [file, createHash('sha256').update(await readFile(file)).digest('hex')])));
const report = { phase, baseURL, fixtures: 'local production build; CONTENT_MODE=test; DATA_ADAPTER=mock', hashes, scenes: [] };
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    const height = 900;
    const context = await browser.newContext({ baseURL, viewport: { width, height }, reducedMotion: 'no-preference', recordVideo: { dir: `${directory}/raw`, size: { width, height } } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const scene = { width, height, errors, hero: [], carousel: [], reveal: [] };
    await page.goto('/');
    await page.locator('[data-carousel-ready="true"]').waitFor();
    const heroEnd = await page.locator('.olf-hero').evaluate(n => n.getBoundingClientRect().bottom + scrollY - innerHeight * .85);
    for (const y of [0, heroEnd / 2, heroEnd, 0]) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y);
      await page.waitForTimeout(450);
      scene.hero.push(await page.locator('[data-hero-line], [data-landing-photo]').evaluateAll(nodes => nodes.map(n => ({ transform: getComputedStyle(n).transform, opacity: getComputedStyle(n).opacity, width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height }))));
    }
    await page.locator('.olf-featured-carousel').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    scene.carousel = await page.locator('.olf-carousel-slide').evaluateAll(nodes => nodes.map(n => ({ width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height })));
    await page.locator('.olf-carousel-slide a').first().focus();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${directory}/${width}-protected.png` });
    await page.goto('/dich-vu/hoa-thoi');
    await page.waitForTimeout(1300);
    for (const selector of ['.ht-recommendations', '.ht-form-heading', '.ht-calendar-heading', '.ht-contact-heading', '#mau-hoa', '.hoe-store-footer']) {
      const unit = page.locator(selector).first();
      if (phase === 'before') await unit.scrollIntoViewIfNeeded();
      else {
        const top = await unit.evaluate(n => (n.querySelector('[data-store-text]') || n).getBoundingClientRect().top + scrollY - innerHeight * .7);
        await page.evaluate(top => { document.dispatchEvent(new WheelEvent('wheel')); scrollTo({ top, behavior: 'instant' }); }, top);
      }
      await page.waitForTimeout(250);
      scene.reveal.push(await unit.evaluate(n => ({ selector: n.className || n.id, states: [...n.querySelectorAll('[data-store-text]')].map(t => ({ role: t.getAttribute('data-store-text'), state: t.getAttribute('data-text-state'), animations: [...t.querySelectorAll('[data-text-layer]')].flatMap(l => l.getAnimations().map(a => ({ timing: a.effect.getTiming(), frames: a.effect.getKeyframes() }))) })) })));
      await page.waitForTimeout(1300);
    }
    if (phase === 'after') {
      const heading = page.locator('.ht-form-heading');
      const top = await heading.evaluate(n => n.getBoundingClientRect().top + scrollY - innerHeight * .7);
      await page.evaluate(top => { document.dispatchEvent(new WheelEvent('wheel')); scrollTo({ top, behavior: 'instant' }); }, top);
      await page.waitForTimeout(1300);
      scene.jitter = [];
      const headingTop = await heading.locator('h2').evaluate(n => n.getBoundingClientRect().top + scrollY);
      for (const fraction of [.02, .09, .02, .5]) {
        await page.evaluate(({ top, fraction }) => { document.dispatchEvent(new WheelEvent('wheel')); scrollTo({ top: top - innerHeight * fraction, behavior: 'instant' }); }, { top: headingTop, fraction });
        await page.waitForTimeout(120);
        scene.jitter.push(await heading.locator('h2').getAttribute('data-text-state'));
      }
      await page.evaluate(() => { document.dispatchEvent(new WheelEvent('wheel')); scrollTo({ top: 0, behavior: 'instant' }); });
      await page.waitForTimeout(250);
      scene.replayPrepared = await heading.locator('h2').getAttribute('data-text-state');
      await page.evaluate(top => { document.dispatchEvent(new WheelEvent('wheel')); scrollTo({ top, behavior: 'instant' }); }, top);
      await page.waitForTimeout(350);
      scene.beforeFocus = await heading.locator('h2').getAttribute('data-text-state');
      await page.getByRole('button', { name: 'Tăng số bó mỗi tuần', exact: true }).focus();
      scene.afterFocus = await heading.locator('h2').getAttribute('data-text-state');
      await page.waitForTimeout(250);
      await page.getByRole('button', { name: 'Tăng số bó mỗi tuần', exact: true }).click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${directory}/${width}-service.png` });
    await context.close();
    await page.video().saveAs(`${directory}/${width}-load-scroll-protected.webm`);
    report.scenes.push(scene);
    console.log(`${phase}: ${width} recorded (${errors.length} browser errors)`);
  }
} finally { await browser.close(); }
await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
if (phase === 'after') {
  const before = JSON.parse(await readFile('docs/store-motion/v3/before/report.json', 'utf8'));
  const comparison = { protectedSourceUnchanged: Object.entries(hashes).every(([file, hash]) => before.hashes[file] === hash), viewports: report.scenes.map((scene, i) => ({ width: scene.width, heroIdentical: JSON.stringify(scene.hero) === JSON.stringify(before.scenes[i].hero), carouselGeometryIdentical: JSON.stringify(scene.carousel) === JSON.stringify(before.scenes[i].carousel) })) };
  await writeFile('docs/store-motion/v3/comparison.json', JSON.stringify(comparison, null, 2));
  console.log(JSON.stringify(comparison));
}
