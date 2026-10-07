import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Run only on a dedicated test catalog. The operator supplies authenticated Clerk state.
test.describe.serial("Home feedbacks: Admin → API → Postgres → Store", () => {
  const query = process.env.HOME_FEEDBACK_TEST_PRODUCT_QUERY || "Hoa kiểm thử";
  const evidence = process.env.HOME_FEEDBACK_EVIDENCE_DIR || ".local/feedback/screenshots";
  let heroIds: string[] = [];
  let heroPhotos: { image: string; alt: string }[] = [];
  let featuredIds: string[] = [];
  test("Hero picker searches past 50, orders slots, saves and reloads", async ({ page }) => {
    await page.goto("/admin/home-hero");
    await expect(page.getByRole("heading", { name: "Sản phẩm Hero", exact: true })).toBeVisible();
    while (await page.getByRole("button", { name: /^Bỏ sản phẩm vị trí/ }).count()) await page.getByRole("button", { name: /^Bỏ sản phẩm vị trí/ }).last().click();
    const search = page.getByRole("searchbox", { name: "Tìm theo tên sản phẩm" });
    for (const name of [query + " 60", query + " 00", query + " 01"]) {
      await search.fill(name);
      const option = page.locator(".admin-product-option").filter({ hasText: name });
      await expect(option).toHaveCount(1);
      await option.getByRole("checkbox").check();
    }
    await page.getByRole("button", { name: "Đưa sản phẩm vị trí 1 xuống", exact: true }).click();
    const save = page.waitForResponse((r) => r.url().endsWith("/api/admin/home/hero") && r.request().method() === "PATCH");
    await page.getByRole("button", { name: "Lưu lựa chọn", exact: true }).click();
    expect((await save).status()).toBe(200);
    await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi.");
    const receipt = await page.request.get("/api/admin/home/hero"); expect(receipt.status()).toBe(200);
    const savedHero = await receipt.json();
    heroIds = savedHero.productIds;
    heroPhotos = heroIds.map((id) => {
      const product = savedHero.products.find((p: { id: string }) => p.id === id);
      return { image: product.image, alt: product.imageAlt || product.name };
    });
    await page.reload();
    const selected = page.locator(".admin-selected-product");
    await expect(selected).toHaveCount(3);
    await expect(selected.nth(0)).toContainText(query + " 00");
    await expect(selected.nth(1)).toContainText(query + " 60");
    await expect(page.locator(".admin-product-option")).not.toHaveCount(0);
    await mkdir(evidence, { recursive: true });
    await page.screenshot({ path: `${evidence}/admin-hero-1440.png`, fullPage: true });
  });
  test("Featured picker saves ten ordered products; stale tab preserves its edits and shows a comparison", async ({ page, context }) => {
    await page.goto("/admin/home-featured");
    while (await page.getByRole("button", { name: /^Bỏ sản phẩm vị trí/ }).count()) await page.getByRole("button", { name: /^Bỏ sản phẩm vị trí/ }).last().click();
    await page.getByRole("searchbox", { name: "Tìm theo tên sản phẩm" }).fill(query);
    await expect(page.locator(".admin-product-option")).toHaveCount(24);
    for (let i = 0; i < 10; i++) await page.locator(".admin-product-option").nth(i).getByRole("checkbox").check();
    await page.getByRole("button", { name: "Đưa sản phẩm vị trí 1 xuống", exact: true }).click();
    const save = page.waitForResponse((r) => r.url().endsWith("/api/admin/home/featured") && r.request().method() === "PATCH");
    await page.getByRole("button", { name: "Lưu lựa chọn", exact: true }).click();
    expect((await save).status()).toBe(200);
    await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi.");
    const receipt = await page.request.get("/api/admin/home/featured"); expect(receipt.status()).toBe(200);
    featuredIds = (await receipt.json()).productIds;
    expect(featuredIds).toHaveLength(10);
    const stale = await context.newPage();
    await stale.goto("/admin/home-hero");
    await stale.getByRole("button", { name: "Đưa sản phẩm vị trí 1 xuống", exact: true }).click();
    await page.getByRole("button", { name: "Đưa sản phẩm vị trí 1 xuống", exact: true }).click();
    await page.getByRole("button", { name: "Lưu lựa chọn", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi.");
    const conflict = stale.waitForResponse((r) => r.url().endsWith("/api/admin/home/hero") && r.request().method() === "PATCH");
    await stale.getByRole("button", { name: "Lưu lựa chọn", exact: true }).click();
    expect((await conflict).status()).toBe(409);
    await expect(stale.locator(".admin-warning")).toContainText("Lựa chọn đang nhập được giữ nguyên");
    await expect(stale.locator(".admin-selected-product").nth(0)).toContainText(query + " 60");
    await stale.getByRole("button", { name: "Xem bản mới nhất", exact: true }).click();
    await expect(stale.getByRole("heading", { name: "Lựa chọn đã lưu gần nhất" })).toBeVisible();
    await stale.screenshot({ path: `${evidence}/admin-conflict.png`, fullPage: true });
    expect((await (await page.request.get("/api/admin/home/hero")).json()).productIds).toEqual(heroIds);
    featuredIds = (await (await page.request.get("/api/admin/home/featured")).json()).productIds;
    await stale.close();
    await page.reload(); await expect(page.locator(".admin-selected-product")).toHaveCount(10);
    await expect(page.locator(".admin-product-option")).not.toHaveCount(0);
    await page.screenshot({ path: `${evidence}/admin-featured-1440.png`, fullPage: true });
  });
  test("Contact form validates then saves contact links and three social platforms", async ({ page }) => {
    await page.goto("/admin/settings/site");
    await page.getByLabel("Email", { exact: true }).fill("invalid");
    await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
    await expect(page.locator("#contact\\.email-error")).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill("feedback@example.com");
    await page.getByLabel("Số điện thoại", { exact: true }).fill("+84 (90) 123 4567");
    await page.getByLabel("Địa chỉ", { exact: true }).fill("Địa chỉ kiểm thử — 123 Đường Hoa, Phường Bến Thành, Thành phố Hồ Chí Minh");
    await page.getByLabel("Giờ hoạt động", { exact: true }).fill("9:00–18:00, Thứ Hai đến Chủ Nhật (TEST)");
    await page.getByLabel("Link bản đồ (HTTPS)", { exact: true }).fill("https://maps.google.com/?q=hoe");
    for (const [platform, url] of [["Facebook", "https://facebook.com/hoe"], ["TikTok", "https://tiktok.com/@hoe"], ["Instagram", "https://instagram.com/hoe"]]) await page.getByLabel(`Link ${platform} (HTTPS)`, { exact: true }).fill(url);
    await page.getByLabel("Tên hiển thị Facebook", { exact: true }).fill("Hòe gửi thương");
    await page.getByLabel("Link Facebook (HTTPS)", { exact: true }).fill("https://fb.me/hoe");
    const save = page.waitForResponse((r) => r.url().endsWith("/api/admin/settings/site/contact") && r.request().method() === "PATCH");
    await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click(); expect((await save).status()).toBe(200);
    await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi.");
    await page.reload(); await expect(page.getByLabel("Email", { exact: true })).toHaveValue("feedback@example.com");
    await expect(page.getByLabel("Tên hiển thị Facebook", { exact: true })).toHaveValue("Hòe gửi thương");
    await expect(page.getByLabel("Link Facebook (HTTPS)", { exact: true })).toHaveValue("https://fb.me/hoe");
    await page.screenshot({ path: `${evidence}/admin-contact-1440.png`, fullPage: true });
  });
  test("ten product loop centers each step at 5/3/1, mobile menu and Footer have no overflow", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [360, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/#nhung-doa-hoa");
      await page.reload();
      const heroImages = page.locator(".olf-hero-photos .olf-photo-frame img");
      await expect(heroImages).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await expect(heroImages.nth(i)).toHaveAttribute("alt", heroPhotos[i].alt);
        expect(decodeURIComponent((await heroImages.nth(i).getAttribute("src"))!)).toContain(heroPhotos[i].image);
      }
      const carousel = page.locator(".olf-featured-carousel");
      await expect(carousel).toHaveAttribute("data-carousel-ready", "true");
      await expect(carousel.locator(".olf-carousel-slide")).toHaveCount(10);
      const geometry = await carousel.evaluate((root) => {
        const viewport = root.querySelector(".olf-carousel-viewport")!.getBoundingClientRect();
        const slides = [...root.querySelectorAll(".olf-carousel-slide")].map((s) => s.getBoundingClientRect());
        const selected = root.querySelector('[data-selected="true"]')!.getBoundingClientRect();
        return { center: selected.x + selected.width / 2 - viewport.x - viewport.width / 2, visible: slides.filter((s) => s.right > viewport.left + 2 && s.left < viewport.right - 2).length };
      });
      expect(Math.abs(geometry.center)).toBeLessThan(2);
      expect(geometry.visible).toBe(width >= 1280 ? 5 : 3);
      await page.screenshot({ path: `${evidence}/home-carousel-${width}.png` });
      for (let i = 1; i <= 10; i++) {
        await carousel.getByRole("button", { name: "Sản phẩm tiếp theo", exact: true }).click();
        await expect(carousel.locator(".olf-carousel-position")).toHaveText(`${i % 10 + 1} / 10`);
      }
      await expect(carousel.getByRole("button", { name: "Sản phẩm trước", exact: true })).toBeEnabled();
      const footer = page.locator(".hoe-store-footer");
      await footer.scrollIntoViewIfNeeded();
      await expect(footer.locator('a[href="tel:+84901234567"]')).toBeVisible();
      await expect(footer.locator('a[href="mailto:feedback@example.com"]')).toBeVisible();
      await expect(footer.locator('a[href="https://fb.me/hoe"]')).toHaveText("Hòe gửi thương");
      await expect(footer.locator('a[href="https://fb.me/hoe"]')).toHaveAttribute("rel", "noopener noreferrer");
      for (const platform of ["tiktok", "instagram"]) await expect(footer.locator(`a[href*="${platform}.com"]`)).toHaveAttribute("rel", "noopener noreferrer");
      await expect(footer.locator(".footer-grid")).toHaveAttribute("data-footer-groups", "4");
      await expect(footer.getByRole("heading", { name: "Ghé Hòe", exact: true })).toBeVisible();
      for (const platform of ["Facebook", "TikTok", "Instagram"]) await expect(footer.locator(`svg[data-platform="${platform}"]`)).toHaveAttribute("aria-hidden", "true");
      const geometryFooter = await footer.locator(".footer-grid").evaluate((grid) => ({ columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length, widths: [...grid.querySelectorAll('.footer-social-links a')].map((link) => link.getBoundingClientRect().height) }));
      expect(geometryFooter.columns).toBe(width >= 1024 ? 4 : width >= 768 ? 2 : 1);
      expect(geometryFooter.widths.every((height) => height >= 44)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: `${evidence}/footer-${width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/home-featured");
    await page.getByRole("button", { name: "Mở menu quản trị" }).click();
    const nav = page.getByRole("dialog").getByRole("navigation", { name: "Quản trị" });
    await expect(nav.getByRole("link", { name: "Sản phẩm nổi bật", exact: true })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Sản phẩm Hero", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/home-hero$/);
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.screenshot({ path: `${evidence}/admin-hero-390.png`, fullPage: true });
    await page.goto("/admin/settings/home");
    await expect(page.locator('[id="primaryCta.href"]')).toHaveAttribute("readonly", "");
    await expect(page.locator('[id="primaryCta.href"]')).toHaveValue("/#nhung-doa-hoa");
    await expect(page.locator("#heroProductIds, #featuredProductIds, #featuredLimit")).toHaveCount(0);
    await page.getByRole("button", { name: "Mở menu quản trị" }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: "Website", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Đóng menu quản trị" }).click();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto("/#nhung-doa-hoa");
    await expect(page.locator(".olf-featured-carousel")).toHaveAttribute("data-carousel-ready", "true");
    await page.screenshot({ path: `${evidence}/home-carousel-focus-1440.png` });
    expect(errors).toEqual([]);
  });

  test("Featured Admin saves four, one and zero, and Store reload respects each selection", async ({ page }) => {
    await page.goto("/admin/home-featured");
    const initial = await (await page.request.get("/api/admin/home/featured")).json();
    for (const count of [4, 1, 0]) {
      await page.goto("/admin/home-featured");
      while (await page.getByRole("button", { name: /^Bỏ sản phẩm vị trí/ }).count() > count) await page.getByRole("button", { name: /^Bỏ sản phẩm vị trí/ }).last().click();
      const save = page.waitForResponse((r) => r.url().endsWith("/api/admin/home/featured") && r.request().method() === "PATCH");
      await page.getByRole("button", { name: "Lưu lựa chọn", exact: true }).click(); expect((await save).status()).toBe(200);
      await page.reload(); await expect(page.locator(".admin-selected-product")).toHaveCount(count);
      expect((await (await page.request.get("/api/admin/home/featured")).json()).productIds).toHaveLength(count);
      if (count === 4) await page.screenshot({ path: `${evidence}/admin-featured-four.png`, fullPage: true });
      await page.goto("/#nhung-doa-hoa"); await page.reload();
      await expect(page.locator(".olf-carousel-slide")).toHaveCount(count);
      if (count) {
        await expect(page.locator(".olf-featured-carousel")).toHaveAttribute("data-carousel-ready", "true");
        await expect(page.getByRole("button", { name: "Sản phẩm trước", exact: true })).toBeDisabled();
      } else await expect(page.getByRole("heading", { name: "Những mùa hoa đang được chuẩn bị", exact: true })).toBeVisible();
    }
    await page.goto("/admin/home-featured");
    const current = await (await page.request.get("/api/admin/home/featured")).json();
    expect((await page.request.patch("/api/admin/home/featured", { data: { editVersion: current.editVersion, productIds: initial.productIds } })).status()).toBe(200);
  });

  test("Footer handles long/empty configuration, keyboard focus and preserves other settings", async ({ page }) => {
    await page.goto("/admin/settings/site");
    const before = await (await page.request.get("/api/admin/settings/site/contact")).json();
    const homeBefore = await (await page.request.get("/api/admin/home/featured")).json();
    await page.getByLabel("Địa chỉ", { exact: true }).fill("Địa chỉ kiểm thử dài ".repeat(24).trim());
    await page.getByLabel("Email", { exact: true }).fill(`${"contact".repeat(9)}@${"longdomain".repeat(5)}.example.com`);
    await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi.");
    for (const width of [1024, 360]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto("/");
      await page.locator(".hoe-store-footer").scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: `${evidence}/footer-long-${width}.png` });
    }
    const social = page.locator('.footer-social-links a').first();
    await social.focus(); await page.keyboard.press("Tab");
    await expect(page.locator('.footer-social-links a').nth(1)).toBeFocused();
    await expect(page.locator('.footer-social-links a').nth(1)).toHaveCSS("outline-style", "solid");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(social).toHaveCSS("transition-duration", "0s");
    await page.goto("/admin/settings/site");
    for (const label of ["Địa chỉ", "Link bản đồ (HTTPS)", "Số điện thoại", "Email", "Giờ hoạt động", "Link Facebook (HTTPS)", "Link TikTok (HTTPS)", "Link Instagram (HTTPS)"]) await page.getByLabel(label, { exact: true }).fill("");
    await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi.");
    await page.goto("/"); await page.reload();
    await expect(page.locator(".footer-contact, .footer-social")).toHaveCount(0);
    await expect(page.locator(".footer-grid")).toHaveAttribute("data-footer-groups", "2");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `${evidence}/footer-empty-360.png` });
    await page.goto("/admin/settings/site");
    const current = await (await page.request.get("/api/admin/settings/site/contact")).json();
    const socialInput = Object.fromEntries(["Facebook", "TikTok", "Instagram"].map((platform) => {
      const entry = before.social.find((s: { platform?: string; label: string; url: string }) => s.platform === platform || s.label === platform);
      return [platform, { label: entry?.label || platform, url: entry?.url || "" }];
    }));
    expect((await page.request.patch("/api/admin/settings/site/contact", { data: { editVersion: current.editVersion, contact: before.contact, social: socialInput } })).status()).toBe(200);
    expect((await (await page.request.get("/api/admin/home/featured")).json()).productIds).toEqual(homeBefore.productIds);
  });
});
