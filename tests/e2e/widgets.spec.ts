import { test, expect } from "./fixtures";
import fs from "node:fs";
const shots = "docs/phase-2/screenshots";
test("custom calendar/time picker support Vietnamese, keyboard, cancel, clear and canonical values", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/xem-thu/widgets");
  const date = page.getByRole("textbox", {
      name: "Ngày nhận mong muốn",
      exact: true,
    }),
    time = page.getByRole("textbox", { name: "Giờ mong muốn", exact: true });
  await date.fill("29/02/2027");
  await date.blur();
  await expect(
    page.getByRole("alert").filter({ hasText: "không tồn tại" }).first(),
  ).toBeVisible();
  await date.fill("29/02/2028");
  await date.blur();
  await expect(page.locator('input[name="desiredDate"]')).toHaveValue(
    "2028-02-29",
  );
  await date.focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(
    page.getByRole("dialog", { name: "Chọn ngày mong muốn" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tháng sau", exact: true }).click();
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(date).toHaveValue("29/02/2028");
  const trigger = page.getByRole("button", {
    name: "Mở lịch: Ngày nhận mong muốn",
    exact: true,
  });
  await expect(date).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Chọn hôm nay", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(date).not.toHaveValue("29/02/2028");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page
    .getByRole("button", { name: "Chọn giờ: Giờ mong muốn", exact: true })
    .click();
  const hours = page.getByRole("listbox", { name: "Giờ", exact: true }),
    minutes = page.getByRole("listbox", { name: "Phút", exact: true });
  await hours.getByRole("option", { name: "23", exact: true }).click();
  await minutes.getByRole("option", { name: "59", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(time).toHaveValue("23:59");
  await page
    .getByRole("button", { name: "Chọn giờ: Giờ mong muốn", exact: true })
    .click();
  await hours.getByRole("option", { name: "23", exact: true }).focus();
  await page.keyboard.press("Home");
  await minutes.getByRole("option", { name: "59", exact: true }).focus();
  await page.keyboard.press("Home");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(time).toHaveValue("23:59");
  await page
    .getByRole("button", { name: "Chọn giờ: Giờ mong muốn", exact: true })
    .click();
  await page.getByRole("button", { name: "Xóa lựa chọn", exact: true }).click();
  await expect(time).toHaveValue("");
  await trigger.click();
  await page.getByRole("button", { name: "Xóa lựa chọn", exact: true }).click();
  await expect(date).toHaveValue("");
  await expect(page.locator('input[name="desiredDate"]')).toHaveValue("");
  await expect(
    page.getByRole("textbox", { name: "Đang chờ gửi yêu cầu" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
for (const width of [360, 390, 768, 1024, 1440])
  test(`widgets fit ${width}px and return focus with reduced motion`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/xem-thu/widgets");
    await expect(page.locator(".widget-preview-grid")).toHaveAttribute(
      "data-ready",
      "true",
    );
    fs.mkdirSync(shots, { recursive: true });
    const capture = async (name: string) => {
      if (
        (width === 1440 && testInfo.project.name === "desktop") ||
        (width === 390 && testInfo.project.name === "mobile")
      )
        await page.screenshot({
          path: `${shots}/${width}-${name}.png`,
          fullPage: false,
        });
    };
    await page
      .getByRole("textbox", { name: "Ngày nhận mong muốn", exact: true })
      .focus();
    await capture("states-focus");
    const trigger = page.getByRole("button", {
      name: "Mở lịch: Ngày nhận mong muốn",
      exact: true,
    });
    await trigger.click();
    const dialog = page.locator(".hoe-picker .modal-dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      (width < 768 ? 844 : 900) + 1,
    );
    if (width < 768)
      expect(Math.abs(box!.y + box!.height - 844)).toBeLessThan(2);
    await page
      .getByRole("button", { name: "Chọn hôm nay", exact: true })
      .click();
    await capture("calendar-selected");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await page
      .getByRole("button", { name: "Chọn giờ: Giờ đã chọn", exact: true })
      .click();
    await capture("time-selected");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Chọn giờ: Giờ đã chọn", exact: true }),
    ).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("guest cannot read or mutate any admin resource or issue an upload token", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Quản trị đang được kết nối" }),
  ).toBeVisible();
  for (const resource of [
    "orders",
    "inquiries",
    "products",
    "posts",
    "policies",
    "settings",
    "comments",
    "media",
    "dashboard",
  ])
    expect((await request.get(`/api/admin/${resource}`)).status()).toBe(401);
  expect(
    (
      await request.put(
        "/api/admin/orders/00000000-0000-4000-8000-000000000000",
        {
          data: {
            editVersion: 1,
            data: { businessStatus: "confirmed", internalNote: "" },
          },
        },
      )
    ).status(),
  ).toBe(401);
  expect(
    (await request.post("/api/admin/media/upload", { data: {} })).status(),
  ).toBe(401);
});
