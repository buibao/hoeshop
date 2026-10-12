import { test, expect } from "./fixtures";

test("Store roles keep reading surfaces and primary/secondary actions distinct", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const selector of [".olf-hero", ".olf-services", ".olf-story", ".olf-process", ".olf-cta", ".hoe-store-header", ".hoe-store-footer"]) {
    expect(await page.locator(selector).first().evaluate(el => getComputedStyle(el).backgroundImage)).toContain("gradient");
  }
  const berry = page.locator(".olf-benefit-card").nth(2);
  for (const selector of ["h3", "p", ".olf-step-number", ".olf-benefit-art"]) {
    expect(await berry.locator(selector).evaluate(el => getComputedStyle(el).color)).toBe("rgb(255, 255, 255)");
  }
  expect(await page.locator(".olf-carousel-controls .icon-button").first().evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
  await page.goto("/blog/chuyen-cua-hoe");
  expect(await page.locator(".store-heading-section").evaluate(el => getComputedStyle(el).backgroundImage)).toContain("gradient");
  expect(await page.locator(".article-title").evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
  expect(await page.locator(".comments form").evaluate(el => getComputedStyle(el).backgroundImage)).toContain("gradient");
  expect(await page.locator(".prose").evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
  expect(await page.getByLabel("Tên hiển thị", { exact: true }).evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
});

test("full-width owners preserve copy measures and submenu retains current and interactive highlights", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dich-vu/hoa-thoi");
  const heading = await page.locator(".store-heading-section").boundingBox();
  expect(heading?.x).toBe(0);
  expect(heading?.width).toBe(page.viewportSize()!.width);
  expect(await page.locator(".page-heading").evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
  for (const selector of [".ht-inquiry", ".ht-delivery-calendar"]) {
    expect(await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundImage)).toContain("gradient");
  }
  const mobile = page.viewportSize()!.width < 1024;
  if (mobile) await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Các loại hoa", exact: true }).last();
  await trigger.click();
  const submenu = page.locator(mobile ? ".hoe-store-menu .hoe-store-submenu" : ".hoe-store-header .hoe-store-submenu");
  const links = submenu.locator("li a");
  await page.mouse.move(page.viewportSize()!.width - 4, 4);
  const current = submenu.locator('a[aria-current="page"]');
  const activeImage = await current.evaluate(el => getComputedStyle(el).backgroundImage);
  expect(activeImage).toContain("gradient");
  for (let index = 0; index < 3; index++) {
    const link = links.nth(index);
    await trigger.focus();
    await link.hover();
    expect(await link.evaluate(el => getComputedStyle(el).backgroundImage)).toBe(activeImage);
    for (let other = 0; other < 3; other++) {
      if (other !== index) {
        const otherLink = links.nth(other);
        const isCurrent = await otherLink.getAttribute("aria-current") === "page";
        expect(await otherLink.evaluate(el => getComputedStyle(el).backgroundImage)).toBe(isCurrent ? activeImage : "none");
      }
    }
    for (const owner of [link, link.locator("strong"), link.locator("small")]) {
      expect(await owner.evaluate(el => getComputedStyle(el).textDecorationLine)).toBe("none");
    }
    await page.keyboard.press("Tab");
    await link.focus();
    await page.mouse.move(page.viewportSize()!.width - 4, 4);
    expect(await link.evaluate(el => el.matches(":focus-visible"))).toBe(true);
    expect(await link.evaluate(el => getComputedStyle(el).backgroundImage)).toContain("gradient");
    expect(await link.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
    expect(await trigger.evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
  }
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  if (mobile) await page.keyboard.press("Escape");
  await page.goto("/san-pham/mau-test-diu-dang");
  expect((await page.locator(".store-detail-section").boundingBox())?.width).toBe(page.viewportSize()!.width);
  expect(await page.locator(".detail-copy").evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
  expect(await page.locator(".detail-copy form").evaluate(el => getComputedStyle(el).backgroundImage)).toContain("gradient");
});

test("Store picker portal keeps strong selection, cancel, focus and disabled reset", async ({ page }) => {
  await page.goto("/san-pham/mau-test-diu-dang");
  const trigger = page.getByRole("button", { name: /Mở lịch:/ }).first();
  await trigger.click();
  await expect(page.locator(".hoe-store-scope.hoe-picker")).toBeVisible();
  await page.getByRole("button", { name: "Chọn hôm nay", exact: true }).click();
  const selected = page.locator(".hoe-day-selected .hoe-day-button");
  await expect(selected).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.keyboard.press("Tab");
  await selected.focus();
  await expect(selected).toHaveCSS("outline-color", "rgb(255, 255, 255)");
  expect(await selected.evaluate(el => getComputedStyle(el).backgroundImage)).toContain("gradient");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page.locator(".hoe-picker")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Chọn hôm nay", exact: true }).click();
  await expect(selected).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.getByRole("button", { name: "Xác nhận", exact: true }).focus();
  await expect(page.getByRole("button", { name: "Xác nhận", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".hoe-picker")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  const hour = page.getByRole("combobox", { name: "Giờ mong muốn — Giờ", exact: true });
  await hour.click();
  const option = page.getByRole("listbox").getByRole("option", { name: "11", exact: true });
  await option.hover();
  await expect(option).toHaveCSS("background-color", "rgb(245, 245, 245)");
  await page.keyboard.press("Enter");
  await page.getByRole("combobox", { name: "Giờ mong muốn — Buổi", exact: true }).click();
  await page.getByRole("option", { name: "PM", exact: true }).click();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("23:00");
  await hour.click();
  await page.keyboard.press("Escape");
  await expect(hour).toBeFocused();
});

test("soft calendar selection clears, disabled actions lose gradient and forced colours retain cues", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T10:00:00Z"));
  await page.goto("/dich-vu/hoa-thoi");
  const day = page.locator(".ht-calendar-day-button:not([disabled])").first();
  await day.click();
  await expect(day).toHaveCSS("color", "rgb(51, 44, 42)");
  expect(await day.evaluate(el => getComputedStyle(el).backgroundImage)).toContain("gradient");
  await day.click();
  expect(await day.evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
  const submit = page.getByRole("button", { name: "Gửi mong muốn đến Hòe", exact: true });
  // Exercise CSS transition into disabled without changing the application handlers.
  await submit.evaluate(el => { (el as HTMLButtonElement).disabled = true; });
  await submit.hover({ force: true });
  expect(await submit.evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
  await submit.evaluate(el => { (el as HTMLButtonElement).disabled = false; });
  await day.click();
  await page.emulateMedia({ forcedColors: "active" });
  expect(await day.evaluate(el => getComputedStyle(el).backgroundImage)).toBe("none");
  expect(await day.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
});

test("root fallback and client navigation preserve Store isolation", async ({ page }) => {
  await page.goto("/khong-co-trang-nay");
  await expect(page.locator(".hoe-store-scope .empty")).toBeVisible();
  await page.getByRole("link", { name: "Về trang chủ", exact: true }).click();
  // Use the mounted AppRouter context so retained CSS is tested without reloads.
  for (const route of ["/admin", "/dang-nhap", "/xem-thu/widgets", "/admin/khong-co", "/xem-thu/khong-co"]) {
    await expect(page.locator(".hoe-store-header .brand")).toBeVisible();
    await page.waitForLoadState("load");
    await expect(page.locator('[data-carousel-ready="true"]')).toHaveCount(1);
    await page.evaluate(async destination => {
      const link = document.querySelector('.hoe-store-header .brand')!;
      const key = Object.keys(link).find(key => key.startsWith("__reactFiber$"))!;
      type Fiber = { return: Fiber | null; memoizedProps?: { value?: { push?: (path: string) => void; refresh?: () => void } } };
      let fiber = (link as unknown as Record<string, Fiber>)[key] as Fiber | null;
      while (fiber) {
        const router = fiber.memoizedProps?.value;
        if (router?.push && router.refresh) { router.push(destination); return; }
        fiber = fiber.return;
      }
      throw new Error("Mounted AppRouter context not found");
    }, route);
    await expect(page).toHaveURL(new RegExp(route.replaceAll("/", "\\/")), { timeout: 30000 });
    await expect(page.locator(".hoe-store-scope")).toHaveCount(0);
    expect(await page.locator("body").evaluate(el => getComputedStyle(el).getPropertyValue("--store-gradient-action"))).toBe("");
    expect(await page.locator("body").evaluate(el => getComputedStyle(el).getPropertyValue("--store-motion-feedback"))).toBe("");
    await page.goto("/");
  }
});
