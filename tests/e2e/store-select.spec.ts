import { test, expect } from "./fixtures";

test("time dropdowns preserve the calendar summary position and page scroll", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dich-vu/hoa-thoi");
  const summary = page.locator(".ht-calendar-summary");
  const triggers = page.locator('[data-component="select-10"] [role="combobox"]');
  const period = triggers.nth(2);
  await expect(summary).toHaveAttribute("data-sticky", /true|false/);
  await period.scrollIntoViewIfNeeded();
  const measure = () => page.evaluate(() => {
    const panel = document.querySelector(".ht-calendar-summary")!.getBoundingClientRect();
    return { top: panel.top, left: panel.left, height: panel.height, scroll: scrollY, overflow: getComputedStyle(document.body).overflowY };
  });
  // Opening a modal select used to change body overflow and move this sticky
  // summary even though neither the calendar nor the page had scrolled.
  const before = await measure();
  if (testInfo.project.name === "desktop") await expect(summary).toHaveCSS("position", "sticky");
  for (const index of [2, 0, 1]) {
    await triggers.nth(index).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect.poll(measure).toEqual(before);
    await page.keyboard.press("Escape");
    await expect(triggers.nth(index)).toBeFocused();
    await expect.poll(measure).toEqual(before);
  }
  await period.click();
  await page.getByRole("option", { name: "PM", exact: true }).click();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("21:00");
  await expect.poll(measure).toEqual(before);
  await period.click();
  await page.getByRole("option", { name: "AM", exact: true }).click();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("09:00");
  await expect.poll(measure).toEqual(before);
});

test("store selects persist shape and exact 24-hour time through cart edits", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/san-pham/mau-test-nang");
  const shape = page.getByRole("combobox", { name: "Hình thức", exact: true });
  await expect(shape).toHaveCSS("height", "44px");
  await expect(page.locator('[data-component="select-10"]')).toHaveCSS("height", "44px");
  await expect(page.locator('[data-component="select-10"] [data-slot="button"]')).toHaveCount(0);
  await shape.click();
  await page.getByRole("option", { name: "Bình", exact: true }).click();
  await expect(shape).toHaveText("Kiểu hoa: Bình");
  await expect(page.locator(".detail-copy form .form-note")).toContainText("Liên hệ báo giá");
  expect(await page.locator(".detail-copy form").evaluate(form => new FormData(form as HTMLFormElement).get("shape"))).toBe("binh");

  const hour = page.getByRole("combobox", { name: "Giờ mong muốn — Giờ", exact: true });
  const minute = page.getByRole("combobox", { name: "Giờ mong muốn — Phút", exact: true });
  await hour.click();
  const list = page.getByRole("listbox");
  await expect(page.locator('[data-slot="select-content"][data-open]')).toHaveClass(/hoe-store-scope/);
  const box = await list.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await page.getByRole("option", { name: "11", exact: true }).click();
  await minute.click();
  await page.getByRole("option", { name: "59", exact: true }).click();
  await page.getByRole("combobox", { name: "Giờ mong muốn — Buổi", exact: true }).click();
  await page.getByRole("option", { name: "PM", exact: true }).click();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("23:59");
  await hour.evaluate(element => { element.closest("fieldset")!.disabled = true; });
  await expect(hour).toBeDisabled();
  await expect(minute).toBeDisabled();
  await expect(page.getByRole("button", { name: "Xóa giờ: Giờ mong muốn", exact: true })).toBeDisabled();
  await hour.evaluate(element => { element.closest("fieldset")!.disabled = false; });
  await hour.click();
  await page.keyboard.press("Home");
  await page.keyboard.press("Escape");
  await expect(hour).toBeFocused();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("23:59");
  await page.screenshot({ path: testInfo.outputPath("store-form.png") });
  await page.getByRole("button", { name: "Tăng số lượng", exact: true }).click();
  expect(await page.locator(".detail-copy form").evaluate(form => new FormData(form as HTMLFormElement).get("quantity"))).toBe("2");
  await page.getByRole("button", { name: "Thêm vào giỏ hoa" }).click();
  await expect(page.getByRole("status")).toContainText("Đã thêm vào giỏ hoa.");
  await page.getByRole("button", { name: "Xóa giờ: Giờ mong muốn", exact: true }).click();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("");
  await expect(hour).toBeFocused();

  await page.goto("/gio-hang");
  await page.getByRole("button", { name: "Sửa cấu hình", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Hình thức", exact: true })).toHaveText("Kiểu hoa: Bình");
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("23:59");
  await page.getByRole("combobox", { name: "Giờ mong muốn — Giờ", exact: true }).click();
  await page.getByRole("option", { name: "12", exact: true }).click();
  await page.getByRole("combobox", { name: "Giờ mong muốn — Phút", exact: true }).click();
  await page.getByRole("option", { name: "00", exact: true }).click();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("12:00");
  await page.getByRole("combobox", { name: "Giờ mong muốn — Buổi", exact: true }).click();
  await page.getByRole("option", { name: "AM", exact: true }).click();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("00:00");
  await page.getByRole("combobox", { name: "Giờ mong muốn — Phút", exact: true }).click();
  await page.getByRole("option", { name: "59", exact: true }).click();
  await expect(page.locator('input[name="desiredTime"]')).toHaveValue("00:59");
  await page.getByRole("button", { name: "Lưu cấu hình", exact: true }).click();
  await page.reload();
  const configuration = await page.evaluate(() => JSON.parse(localStorage.getItem("hoe.cart.v1")!).items[0].configuration);
  expect(configuration.shape).toBe("binh");
  expect(configuration.desiredTime).toBe("00:59");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("contact service select reaches the inquiry API and respects disabled fieldsets", async ({ page }) => {
  await page.goto("/lien-he");
  const service = page.getByRole("combobox", { name: "Dịch vụ quan tâm", exact: true });
  await expect(service).toHaveText("Dịch vụ: Tư vấn chung");
  await service.click();
  await page.getByRole("option", { name: "Hoa Ý", exact: true }).click();
  await service.evaluate(element => { element.closest("fieldset")!.disabled = true; });
  await expect(service).toBeDisabled();
  await service.evaluate(element => { element.closest("fieldset")!.disabled = false; });
  await page.getByLabel("Họ tên", { exact: true }).fill("Khách chọn dịch vụ");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0901234567");
  await page.getByLabel("Nội dung yêu cầu", { exact: true }).fill("Tư vấn mẫu bình hoa");
  const response = page.waitForResponse(r => r.url().endsWith("/api/inquiries") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Gửi yêu cầu tư vấn", exact: true }).click();
  const received = await response;
  expect(received.request().postDataJSON().serviceType).toBe("hoa-y");
  expect(received.status()).toBe(201);
  await expect(page.getByRole("status")).toContainText("Hòe đã nhận yêu cầu tư vấn");
});
