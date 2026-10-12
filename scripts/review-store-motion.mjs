import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const phase = process.argv.includes("--before") ? "before" : "after";
const only = process.argv.find(value => value.startsWith("--only="))?.slice(7);
const baseURL = "http://localhost:3100";
const root = `docs/store-motion/v1/${phase}`;
await mkdir(root, { recursive: true });
const protectedFiles = [
  "src/features/storefront/LandingHeroMotion.tsx", "src/features/storefront/landing-geometry.ts",
  "src/features/storefront/LandingMotion.tsx", "src/features/storefront/LandingBenefitsMotion.tsx",
  "src/features/storefront/FeaturedProductCarousel.tsx", "src/features/storefront/carousel-autoplay.ts",
  "src/features/storefront/HomeBackToTop.tsx", "src/components/ui/MotionProvider.tsx", "src/components/ui/SmoothScroll.tsx",
];
const hashes = Object.fromEntries(await Promise.all(protectedFiles.map(async file => [file, createHash("sha256").update(await readFile(file)).digest("hex")])));
await writeFile(`${root}/protected-sources.json`, JSON.stringify(hashes, null, 2));
let previous = [];
if (only) { try { previous = JSON.parse(await readFile(`${root}/manifest.json`, "utf8")).results.filter(row => row.name !== only); } catch { /* First capture for this phase. */ } }
const metadata = { phase, head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), baseURL, buildMode: "webpack development; routes warmed before measurement", fixtures: "CONTENT_MODE=test, DATA_ADAPTER=mock; local only", results: previous };
const browser = await chromium.launch();
const jump = async (page, top) => { await page.evaluate(top => scrollTo({ top, behavior: "instant" }), top); await page.waitForTimeout(260); };

async function record(name, width, run, preference = "no-preference") {
  if (only && name !== only) return;
  const context = await browser.newContext({ baseURL, viewport: { width, height: 900 }, ...(width < 768 ? { isMobile: true, hasTouch: true } : {}), reducedMotion: preference, recordVideo: { dir: `${root}/raw`, size: { width, height: 900 } }, extraHTTPHeaders: { "x-hoe-test-identity": `motion-${phase}-${name}-${width}` } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const result = { name, width, height: 900, preference, touch: width < 768, errors };
  try { await run(page, result); }
  catch (error) { result.failure = error.message; result.url = page.url(); await page.screenshot({ path: `${root}/${width}-${name}-failure.png` }); console.error(name, width, page.url(), error.message); }
  await context.close();
  await page.video().saveAs(`${root}/${width}-${name}-${preference}.webm`);
  metadata.results.push(result);
  console.log(`${phase}: ${width} ${name} ${result.failure ? "FAIL" : "recorded"}`);
}

try {
  for (const width of [1440, 390]) {
    for (const preference of ["no-preference", "reduce"]) await record("home", width, async (page, result) => {
      await page.goto("/");
      await page.locator('[data-carousel-ready="true"]').waitFor();
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${root}/${width}-hero-top-${preference}.png` });
      const end = await page.locator(".olf-hero").evaluate(node => Math.max(0, node.getBoundingClientRect().bottom + scrollY - innerHeight * .85));
      result.hero = [];
      for (const top of [0, end / 2, end, 0]) {
        await jump(page, top);
        result.hero.push(await page.locator('[data-landing-photo], [data-hero-line]').evaluateAll(nodes => nodes.map(node => ({ transform: getComputedStyle(node).transform, opacity: getComputedStyle(node).opacity, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }))));
      }
      const selectors = ['[data-benefits-motion]', '.olf-services', '.olf-featured', '.olf-story-grid', '.olf-process', '.olf-cta'];
      for (const selector of [...selectors, ...selectors.toReversed()]) {
        const top = await page.locator(selector).first().evaluate(node => node.getBoundingClientRect().top + scrollY - innerHeight * .2);
        await jump(page, top);
      }
      await page.locator('.olf-service-card a').first().focus();
      await page.waitForTimeout(350);
      await page.locator('.olf-service-card').first().hover();
      await page.waitForTimeout(350);
      result.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      await page.screenshot({ path: `${root}/${width}-home-focus-${preference}.png` });
    }, preference);

    await record("cards-overlays", width, async page => {
      await page.goto("/san-pham");
      await page.locator(".hoe-product-card").first().scrollIntoViewIfNeeded();
      await page.locator(".hoe-product-card").first().hover();
      await page.waitForTimeout(450);
      await page.locator(".hoe-product-card a").first().focus();
      await page.screenshot({ path: `${root}/${width}-card-focus.png` });
      await jump(page, 0);
      const trigger = width < 1024 ? page.locator(".menu-button") : page.locator('.hoe-store-header .product-navigation-heading > button');
      await trigger.click();
      await page.waitForTimeout(400);
      await page.keyboard.press("Escape");
      await page.mouse.move(0, 0);
      await page.goto("/san-pham/mau-test-nang");
      await page.reload();
      await page.waitForTimeout(800);
      await page.locator('.picker-trigger').first().click();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(300);
      await page.keyboard.press("Escape");
      await page.locator('[data-component="select-10"] [role="combobox"]').nth(2).click();
      await page.waitForTimeout(300);
      await page.getByRole("option", { name: "PM", exact: true }).click();
      await page.waitForTimeout(300);
    });

    await record("calendar", width, async (page, result) => {
      await page.goto("/dich-vu/hoa-thoi");
      await page.locator('.ht-calendar-summary[data-sticky]').waitFor();
      await page.getByRole('radio', { name: 'Gói Tuần' }).check();
      await page.getByRole('button', { name: 'Tăng số bó mỗi tuần', exact: true }).click();
      await page.getByRole('button', { name: 'Tăng số combo', exact: true }).click();
      for (let i = 0; i < 4; i++) await page.locator('.ht-calendar-day-button:not([disabled])').filter({ hasNot: page.locator('.unused-placeholder') }).evaluateAll(nodes => {
        const button = nodes.find(node => !node.closest('.ht-calendar-selected'));
        button?.click();
      });
      await page.locator('.ht-calendar-total').scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      result.count = await page.locator('.ht-calendar-total').innerText();
      await page.screenshot({ path: `${root}/${width}-calendar.png` });
      await page.getByRole('button', { name: 'Tháng sau', exact: true }).click();
      await page.getByRole('button', { name: 'Tháng trước', exact: true }).click();
      await page.locator('[data-component="select-10"] [role="combobox"]').nth(2).click();
      await page.waitForTimeout(350);
      await page.keyboard.press('Escape');
    });

    if (phase === "after") await record("cart-checkout", width, async (page, result) => {
      await page.goto("/gio-hang");
      await page.locator('.empty').waitFor();
      await page.goto("/san-pham/mau-test-nang");
      await page.getByRole('button', { name: 'Tăng số lượng', exact: true }).click();
      await page.getByRole('button', { name: 'Thêm vào giỏ hoa', exact: true }).click();
      await page.getByRole('status').waitFor();
      await page.goto("/gio-hang");
      await page.getByRole('button', { name: 'Sửa cấu hình', exact: true }).click();
      await page.getByLabel('Màu sắc', { exact: true }).fill('Trắng hồng');
      await page.getByRole('button', { name: 'Lưu cấu hình', exact: true }).click();
      await page.getByRole('button', { name: 'Tăng số lượng', exact: true }).click();
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${root}/${width}-cart.png` });
      await page.goto('/dat-hoa');
      await page.getByRole('button', { name: 'Gửi yêu cầu đặt hoa', exact: true }).click();
      await page.locator('.error[role="alert"]').waitFor();
      for (const [name, value] of [['Họ tên người đặt', 'Khách review motion'], ['Số điện thoại', '0901234567'], ['Tên người nhận', 'Người nhận kiểm thử'], ['Địa chỉ nhận hoa', 'Địa chỉ fixture local']]) await page.getByLabel(name, { exact: true }).fill(value);
      const ids = [];
      await page.route('**/api/orders', async route => {
        ids.push(route.request().postDataJSON().requestId);
        await page.waitForTimeout(450);
        if (ids.length === 1) await route.abort('failed');
        else await route.fulfill({ response: await route.fetch() });
      });
      await page.getByRole('button', { name: 'Gửi yêu cầu đặt hoa', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Chưa xác nhận' }).waitFor();
      await page.waitForTimeout(350);
      await page.getByRole('button', { name: 'Gửi yêu cầu đặt hoa', exact: true }).click();
      await page.getByRole('status').waitFor();
      result.retrySameId = ids.length === 2 && ids[0] === ids[1];
      result.receipt = await page.getByRole('status').innerText();
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${root}/${width}-checkout-receipt.png` });
    });

    if (phase === "after") await record("inquiry-comment", width, async (page, result) => {
      await page.goto('/lien-he');
      await page.getByLabel('Họ tên', { exact: true }).fill('Khách review motion');
      await page.getByLabel('Số điện thoại', { exact: true }).fill('0901234567');
      await page.getByLabel('Nội dung yêu cầu', { exact: true }).fill('Tư vấn hoa bằng dữ liệu mock local');
      let attempts = 0;
      await page.route('**/api/inquiries', async route => {
        attempts++;
        await page.waitForTimeout(400);
        if (attempts === 1) await route.abort('failed');
        else await route.fulfill({ response: await route.fetch() });
      });
      await page.getByRole('button', { name: 'Gửi yêu cầu tư vấn', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Chưa xác nhận' }).waitFor();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Gửi yêu cầu tư vấn', exact: true }).click();
      await page.getByRole('status').waitFor();
      result.inquiry = await page.getByRole('status').innerText();
      await page.goto('/blog/chuyen-cua-hoe');
      await page.getByLabel('Tên hiển thị', { exact: true }).fill('Khách fixture motion');
      await page.getByLabel('Bình luận', { exact: true }).fill('Một lời dịu dàng trong kiểm thử local.');
      let commentAttempts = 0;
      await page.route('**/api/comments', async route => {
        if (route.request().method() !== 'POST') { await route.fulfill({ response: await route.fetch() }); return; }
        commentAttempts++;
        await page.waitForTimeout(400);
        if (commentAttempts === 1) await route.abort('failed');
        else await route.fulfill({ response: await route.fetch() });
      });
      await page.getByRole('button', { name: 'Gửi bình luận', exact: true }).click();
      await page.locator('.comments .error[role="alert"]').waitFor();
      result.commentDraftRetained = await page.getByLabel('Bình luận', { exact: true }).inputValue() === 'Một lời dịu dàng trong kiểm thử local.';
      await page.getByRole('button', { name: 'Gửi bình luận', exact: true }).click();
      await page.getByRole('status').filter({ hasText: 'được lưu' }).waitFor();
      result.comment = await page.getByRole('status').filter({ hasText: 'được lưu' }).innerText();
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${root}/${width}-comment.png` });
    });
  }
} finally { await browser.close(); await writeFile(`${root}/manifest.json`, JSON.stringify(metadata, null, 2)); }
