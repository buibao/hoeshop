import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const artifacts = "docs/hoa-thoi/screenshots";
const calendar = (page: Page) => page.locator("[data-delivery-calendar]");
const dateButton = (page: Page, date: string) => calendar(page).getByRole("button", { name: new RegExp(` · ${date}`) });
async function pick(page: Page, date: string) {
  for (let i = 0; i < 24 && !await dateButton(page, date).count(); i++) await calendar(page).getByRole("button", { name: "Tháng sau", exact: true }).click();
  await dateButton(page, date).click();
}
async function screenshot(page: Page, name: string, project: string, selector = ".ht-fields") {
  await mkdir(artifacts, { recursive: true });
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.locator(selector).screenshot({ path: `${artifacts}/calendar-${name}-${project}.png`, scale: "css", animations: "disabled", style: ".skip-link { visibility: hidden !important; }" });
}
async function weekly(page: Page) {
  await page.getByRole("radio", { name: /^Gói Tuần/ }).check();
  await page.getByRole("spinbutton", { name: "Số bó mỗi tuần (bắt buộc)", exact: true }).fill("2");
  await page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true }).fill("2");
  for (const date of ["2026-10-14", "2026-10-17", "2026-10-20", "2026-10-23"]) await pick(page, date);
}
async function contact(page: Page) {
  await page.getByLabel("Họ tên", { exact: true }).fill("Khách kiểm thử calendar");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0901234567");
}
async function send(page: Page) {
  const response = page.waitForResponse((r) => r.url().endsWith("/api/inquiries") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Gửi mong muốn đến Hòe" }).click();
  return response;
}
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date("2026-10-10T10:00:00Z")); await page.goto("/dich-vu/hoa-thoi"); });
test("service sections follow intro, recommendations, flowers, package form; partial schedule never posts", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await expect(page.locator(".ht-recommendation")).toHaveCount(3);
  expect(await page.evaluate(() => {
    const nodes = [".service-page-top", ".ht-recommendations", "#mau-hoa.ht-service-section", "#tu-van.ht-package-section"].map((s) => document.querySelector(s)!);
    return nodes.slice(1).every((node, i) => !!(nodes[i].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
  })).toBe(true);
  await expect(page.locator(".ht-summary")).toHaveCount(1);
  await expect(page.locator(".ht-summary")).toContainText("Đã chọn 0/1 ngày");
  await expect(calendar(page).locator('[data-day="2026-10-09"]')).not.toContainText("9");
  await expect(dateButton(page, "2026-10-09")).toHaveCount(0);
  await page.getByRole("button", { name: "Tham khảo 2 bó/tháng", exact: true }).click();
  await expect(page.getByRole("radio", { name: /^Gói Tháng/ })).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: "Số bó mỗi tháng (bắt buộc)", exact: true })).toHaveValue("2");
  await expect(page.getByRole("button", { name: "Tham khảo 2 bó/tháng", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".ht-summary")).toContainText("Đã chọn 0/2 ngày");
  await screenshot(page, "packages-empty", info.project.name, ".ht-recommendations");
  await contact(page);
  let calls = 0; page.on("request", (r) => { if (r.url().endsWith("/api/inquiries")) calls++; });
  await page.getByRole("button", { name: "Gửi mong muốn đến Hòe" }).click();
  await expect(calendar(page)).toBeFocused();
  await expect(calendar(page)).toContainText("Chọn ngày đầu tiên"); expect(calls).toBe(0); expect(errors).toEqual([]);
});
test("weekly exact dates enforce individual quotas and submit authoritative receipt", async ({ page }, info) => {
  await page.getByRole("spinbutton", { name: "Số bó mỗi tuần (bắt buộc)", exact: true }).fill("2");
  await page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true }).fill("2");
  await pick(page, "2026-10-14"); await pick(page, "2026-10-17");
  await expect(dateButton(page, "2026-10-15")).toBeDisabled();
  await expect(dateButton(page, "2026-10-26")).toBeDisabled();
  await expect(page.locator(".ht-summary")).toContainText("Đã chọn 2/4 ngày");
  await screenshot(page, "weekly-partial", info.project.name);
  await pick(page, "2026-10-20"); await pick(page, "2026-10-23");
  await expect(page.locator(".ht-summary")).toContainText("Đã chọn đủ 4 ngày nhận");
  await screenshot(page, "weekly-complete", info.project.name);
  await contact(page); const response = await send(page); expect(response.status()).toBe(201);
  expect(response.request().postDataJSON().configuration.recurrence).toEqual({ version: 5, period: "week", bouquetsPerPeriod: 2, comboCount: 2, startPeriod: "2026-10-12", deliveryDates: ["2026-10-14", "2026-10-17", "2026-10-20", "2026-10-23"] });
  expect(response.request().postDataJSON().body).toBe("");
  await expect(page.locator(".success")).toContainText("Đã chọn đủ 4 ngày nhận");
  await expect(page.locator(".success")).toContainText("14/10/2026");
  await expect(page.getByRole("button", { name: "Tham khảo 2 bó/tháng", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Gửi mong muốn khác" }).click();
  await expect(page.locator(".ht-summary")).toContainText("Đã chọn 0/1 ngày");
  await expect(page.getByRole("button", { name: "Tham khảo 2 bó/tháng", exact: true })).toBeEnabled();
});
test("monthly exact dates span consecutive calendar months and retain matched prices", async ({ page }, info) => {
  await page.getByRole("button", { name: "Tham khảo 2 bó/tháng", exact: true }).click();
  await page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true }).fill("2");
  await pick(page, "2026-10-15"); await pick(page, "2026-10-28");
  await expect(dateButton(page, "2026-10-29")).toBeDisabled();
  await pick(page, "2026-11-05"); await pick(page, "2026-11-22");
  const summary = page.locator(".ht-summary");
  await expect(summary).toContainText("2 bó/tháng × 2 combo");
  await expect(summary).toContainText("950.000–1.300.000 ₫/tháng");
  await expect(summary).toContainText("Đã chọn đủ 4 ngày nhận");
  await screenshot(page, "monthly-complete", info.project.name);
  await contact(page); const response = await send(page); expect(response.status()).toBe(201);
  const receipt = await response.json(); expect(receipt.recurrenceSnapshot).toMatchObject({ endPeriod: "2026-11", totalBouquets: 4, recommendation: { id: "monthly-twice" } });
  await expect(page.locator(".success")).toContainText("05/11/2026");
  await screenshot(page, "monthly-receipt", info.project.name, ".success");
});
test("package edits preserve overflow, outside dates, anchor and independent drafts", async ({ page }, info) => {
  await weekly(page); await contact(page);
  await page.getByRole("button", { name: "Tham khảo 2 bó/tháng", exact: true }).click();
  await expect(page.locator(".ht-summary")).toContainText("Đã chọn 0/2 ngày");
  await page.getByRole("button", { name: "Tham khảo 1 bó/tuần", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true })).toHaveValue("2");
  expect(JSON.parse(await page.locator('input[name="recurrence"]').inputValue()).deliveryDates).toEqual(["2026-10-14", "2026-10-17", "2026-10-20", "2026-10-23"]);
  await page.getByRole("spinbutton", { name: "Số bó mỗi tuần (bắt buộc)", exact: true }).fill("1");
  await expect(page.locator(".ht-summary")).toContainText("2/1 · Vượt");
  await page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true }).fill("1");
  await expect(page.locator(".ht-summary")).toContainText("Ngày cần bỏ để phù hợp gói mới");
  await screenshot(page, "overflow", info.project.name);
  await page.getByRole("radio", { name: /^Gói Tháng/ }).check();
  await expect(page.locator(".ht-summary")).toContainText("Đã chọn 0/2 ngày");
  await page.getByRole("radio", { name: /^Gói Tuần/ }).check();
  await page.getByRole("spinbutton", { name: "Số bó mỗi tuần (bắt buộc)", exact: true }).fill("2");
  await page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true }).fill("2");
  await expect(page.locator(".ht-summary")).toContainText("Đã chọn đủ 4 ngày nhận");
  await page.locator(".ht-summary").getByRole("button", { name: "Bỏ ngày 2026-10-14", exact: true }).click();
  await page.locator(".ht-summary").getByRole("button", { name: "Bỏ ngày 2026-10-17", exact: true }).click();
  expect(JSON.parse(await page.locator('input[name="recurrence"]').inputValue()).startPeriod).toBe("2026-10-12");
  await expect(page.locator(".ht-summary")).toContainText("0/2 · Thiếu");
  await calendar(page).getByRole("button", { name: "Chọn lại thời gian nhận", exact: true }).click();
  const draft = JSON.parse(await page.locator('input[name="recurrence"]').inputValue()); expect(draft.deliveryDates).toEqual([]); expect(draft.startPeriod).toBe("");
  await expect(page.getByLabel("Họ tên", { exact: true })).toHaveValue("Khách kiểm thử calendar");
});
test("calendar feasibility blocks Sunday starts and a 31-bouquet February region", async ({ page }, info) => {
  await page.clock.setFixedTime(new Date("2026-10-11T10:00:00Z")); await page.reload();
  await page.getByRole("spinbutton", { name: "Số bó mỗi tuần (bắt buộc)", exact: true }).fill("2");
  await expect(dateButton(page, "2026-10-11")).toBeDisabled();
  await expect(calendar(page)).toContainText("chỉ còn 1 ngày");
  await page.getByRole("radio", { name: /^Gói Tháng/ }).check();
  await page.getByRole("spinbutton", { name: "Số bó mỗi tháng (bắt buộc)", exact: true }).fill("31");
  await page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true }).fill("2");
  for (let i = 0; i < 3; i++) await calendar(page).getByRole("button", { name: "Tháng sau", exact: true }).click();
  await expect(dateButton(page, "2027-01-15")).toBeDisabled();
  await expect(calendar(page)).toContainText("28 ngày");
  await screenshot(page, "infeasible", info.project.name);
});
test("network retries preserve dates and request IDs until the selected dates change", async ({ page }) => {
  await weekly(page); await contact(page);
  const ids: string[] = [];
  await page.route("**/api/inquiries", async (route) => { ids.push(route.request().postDataJSON().requestId); await route.abort("failed"); });
  const button = page.getByRole("button", { name: "Gửi mong muốn đến Hòe" });
  await button.click(); await expect(page.locator('.ht-inquiry [role="alert"]')).toContainText("mã yêu cầu được giữ nguyên");
  await button.click(); await expect(page.locator('.ht-inquiry [role="alert"]')).toContainText("mã yêu cầu được giữ nguyên"); expect(ids[0]).toBe(ids[1]);
  await pick(page, "2026-10-20"); await pick(page, "2026-10-21");
  await button.click(); await expect(page.locator('.ht-inquiry [role="alert"]')).toContainText("mã yêu cầu được giữ nguyên"); expect(ids[2]).not.toBe(ids[1]);
});
test("product calendar, cart edit, reload and checkout retain exact dates", async ({ page }) => {
  await page.goto("/san-pham/mau-test-hoa-thoi"); await weekly(page);
  await page.getByRole("button", { name: "Thêm vào giỏ hoa" }).click(); await page.goto("/gio-hang");
  await expect(page.locator(".cart-row")).toContainText("Đã chọn đủ 4 ngày nhận");
  await expect(page.locator(".cart-summary")).toContainText("Liên hệ báo giá");
  await page.getByRole("button", { name: "Sửa cấu hình" }).click();
  await page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true }).fill("3");
  await pick(page, "2026-10-27"); await pick(page, "2026-10-30");
  await page.getByRole("button", { name: "Lưu cấu hình" }).click(); await page.reload();
  await expect(page.locator(".cart-row")).toContainText("Đã chọn đủ 6 ngày nhận");
  await page.goto("/dat-hoa");
  await page.getByLabel("Họ tên người đặt", { exact: true }).fill("Khách giỏ"); await page.getByLabel("Số điện thoại", { exact: true }).fill("0901234567");
  await page.getByLabel("Tên người nhận", { exact: true }).fill("Khách giỏ"); await page.getByLabel("Địa chỉ nhận hoa", { exact: true }).fill("Địa chỉ kiểm thử");
  const response = page.waitForResponse((r) => r.url().endsWith("/api/orders") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Gửi yêu cầu đặt hoa" }).click(); expect((await response).status()).toBe(201);
  await expect(page.locator(".success")).toContainText("30/10/2026"); await expect(page.locator(".success")).toContainText("Đã chọn đủ 6 ngày nhận");
});
test("legacy cart checkout opens calendar editing without inventing saved dates", async ({ page }) => {
  await page.goto("/san-pham/mau-test-hoa-thoi"); await weekly(page); await page.getByRole("button", { name: "Thêm vào giỏ hoa" }).click();
  await page.evaluate(() => { const saved = JSON.parse(localStorage.getItem("hoe.cart.v1")!); saved.items[0].configuration.recurrence = { version: 2, period: "week", weekdays: [1, 5] }; localStorage.setItem("hoe.cart.v1", JSON.stringify(saved)); });
  await page.reload(); await page.goto("/dat-hoa");
  await expect(page.getByRole("button", { name: "Gửi yêu cầu đặt hoa" })).toBeDisabled();
  await page.getByRole("link", { name: "Mở giỏ để sửa lịch nhận" }).click();
  await expect(calendar(page)).toBeVisible();
  expect(JSON.parse(await page.locator('input[name="recurrence"]').inputValue()).deliveryDates).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hoe.cart.v1")!).items[0].configuration.recurrence.version)).toBe(2);
  await pick(page, "2026-10-14"); await pick(page, "2026-10-17"); await page.getByRole("button", { name: "Lưu cấu hình" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hoe.cart.v1")!).items[0].configuration.recurrence.deliveryDates)).toEqual(["2026-10-14", "2026-10-17"]);
});
test("responsive calendar hit areas, keyboard and reduced motion remain usable", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = await dateButton(page, "2026-10-14").boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await page.setViewportSize({ width: info.project.name === "mobile" ? 390 : 1440, height: 900 });
  const button = dateButton(page, "2026-10-14"); await button.focus(); await page.keyboard.press("Space"); await expect(button).toHaveAccessibleName(/đã chọn/);
  await page.keyboard.press("Space"); await expect(button).not.toHaveAccessibleName(/đã chọn/);
  await screenshot(page, "responsive-keyboard", info.project.name);
});
