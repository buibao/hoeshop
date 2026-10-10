import { test, expect } from "./fixtures";
import { mkdir } from "node:fs/promises";
const artifacts = "docs/hoa-thoi/ui-ux/states";
const date = (page: import("@playwright/test").Page, iso: string) => page.locator("[data-delivery-calendar]").getByRole("button", { name: new RegExp(` · ${iso}`) });
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T10:00:00Z"));
  await page.goto("/dich-vu/hoa-thoi");
  await expect(page.locator(".ht-summary")).toHaveAttribute("data-sticky", /true|false/);
});

test("service and narrow product column fit all specified widths with one readable summary", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/dich-vu/hoa-thoi", "/san-pham/mau-test-hoa-thoi"]) {
    await page.goto(route);
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator(".ht-summary")).toHaveCount(1);
      const measurements = await page.locator(".ht-fields").evaluate((root) => {
        const summary = root.querySelector(".ht-summary")!;
        const calendar = root.querySelector(".ht-delivery-calendar")!;
        const control = root.querySelector(".ht-number-stepper")!;
        const day = root.querySelector<HTMLButtonElement>('.ht-calendar-day-button:not(:disabled)')!;
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          dayWidth: day.getBoundingClientRect().width,
          dayHeight: day.getBoundingClientRect().height,
          stepperHeight: control.getBoundingClientRect().height,
          formWidth: root.getBoundingClientRect().width,
          months: root.querySelectorAll(".ht-calendar-month").length,
          sticky: getComputedStyle(summary).position,
          calendarBeforeSummary: !!(calendar.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING),
          liveRegions: root.querySelectorAll('[aria-live="polite"]').length,
        };
      });
      expect(measurements.overflow, `${route} at ${width}px`).toBe(false);
      expect(measurements.dayWidth).toBeGreaterThanOrEqual(44);
      expect(measurements.dayHeight).toBeGreaterThanOrEqual(44);
      expect(measurements.stepperHeight).toBe(48);
      expect(measurements.calendarBeforeSummary).toBe(true);
      expect(measurements.liveRegions).toBe(1);
      if (measurements.formWidth < 900) expect(measurements.sticky).toBe("static");
      if (measurements.formWidth < 650) expect(measurements.months).toBe(1);
    }
  }
  await page.setViewportSize({ width: info.project.name === "mobile" ? 390 : 1440, height: 900 });
});

test("cycle progress stays beside its week, shares boundary counts and does not shift on selection", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("spinbutton", { name: "Số bó mỗi tuần (bắt buộc)", exact: true }).fill("2");
  await page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true }).fill("2");
  await date(page, "2026-10-14").click();
  const before = await date(page, "2026-10-17").boundingBox();
  await date(page, "2026-10-17").click();
  const after = await date(page, "2026-10-17").boundingBox();
  expect(after!.y).toBe(before!.y);
  await date(page, "2026-10-20").click();
  await expect(page.locator(".ht-calendar-total")).toContainText("Đã chọn 3/4 ngày");
  await expect(page.locator(".ht-calendar-cycle").filter({ hasText: "Tuần 19/10/2026" })).toContainText("1/2 ngày");
  await expect(page.locator(".ht-summary")).toContainText("12/10/2026–25/10/2026");
  expect(await page.locator(".ht-inquiry").innerText()).not.toMatch(/quota/i);
  await mkdir(artifacts, { recursive: true });
  await page.locator(".ht-fields").screenshot({ path: `${artifacts}/service-three-of-four-${info.project.name}.png`, animations: "disabled", style: "nextjs-portal, .skip-link { visibility: hidden !important; }" });
  await date(page, "2026-10-23").click();
  await page.locator(".ht-fields").screenshot({ path: `${artifacts}/service-complete-${info.project.name}.png`, animations: "disabled", style: "nextjs-portal, .skip-link { visibility: hidden !important; }" });

  await page.locator(".ht-reset-calendar").click();
  await date(page, "2026-10-30").click();
  await expect(page.locator(".ht-calendar-cycle").filter({ hasText: "Tuần 26/10/2026" }).first()).toContainText("1/2 ngày");
  await page.getByRole("button", { name: "Tháng sau", exact: true }).click();
  await expect(page.locator(".ht-calendar-cycle").filter({ hasText: "Tuần 26/10/2026" }).first()).toContainText("1/2 ngày");
  const draft = JSON.parse(await page.locator('input[name="recurrence"]').inputValue());
  expect(draft.deliveryDates).toEqual(["2026-10-30"]);
  await page.getByRole("radio", { name: "Gói Tháng", exact: true }).check();
  await page.getByRole("spinbutton", { name: "Số bó mỗi tháng (bắt buộc)", exact: true }).fill("2");
  await date(page, "2026-11-05").click();
  await expect(page.locator(".ht-calendar-progress-row")).toHaveCount(0);
  await expect(page.locator(".ht-calendar-cycle").filter({ hasText: "Tháng 11/2026" })).toContainText("1/2 ngày");
});

test("radio keyboard, persistent calendar focus, drafts and tall summary remain usable", async ({ page }, info) => {
  await page.getByLabel("Họ tên", { exact: true }).fill("Bản nháp UI");
  const weekly = page.getByRole("radio", { name: "Gói Tuần", exact: true });
  const monthly = page.getByRole("radio", { name: "Gói Tháng", exact: true });
  await weekly.focus();
  await page.keyboard.press("ArrowRight");
  await expect(monthly).toBeChecked();
  await expect(monthly).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(weekly).toBeChecked();
  await page.keyboard.press("Space");
  await expect(weekly).toBeChecked();
  await mkdir(artifacts, { recursive: true });
  await page.locator(".ht-package-controls").screenshot({ path: `${artifacts}/radio-focus-${info.project.name}.png`, style: "nextjs-portal, .skip-link { visibility: hidden !important; }" });

  const next = page.getByRole("button", { name: "Tháng sau", exact: true });
  await next.focus(); await page.keyboard.press("Enter");
  await expect(next).toBeFocused();
  await date(page, "2026-11-05").focus();
  await page.keyboard.press("Space");
  await expect(date(page, "2026-11-05")).toBeFocused();
  await expect(page.getByLabel("Họ tên", { exact: true })).toHaveValue("Bản nháp UI");
  await page.getByRole("spinbutton", { name: "Số combo (bắt buộc)", exact: true }).fill("52");
  await expect(page.locator(".ht-summary")).toHaveAttribute("data-sticky", "false");
  expect(await page.locator(".ht-period-groups").evaluate((el) => getComputedStyle(el).maxHeight)).toBe("none");
  await expect(page.locator(".ht-period-progress")).toHaveCount(52);
  await page.locator(".ht-period-progress").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".ht-period-progress").last()).toBeVisible();
});
