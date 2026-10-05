import { test, expect } from "./fixtures";
import { segment, canonical } from "./controls";
test("official date picker commits only Apply; time segments serialize optional minute precision", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/xem-thu/widgets");
  await expect(page.locator("[data-ready]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await segment(page, "desiredDate", "Ngày", "29");
  await segment(page, "desiredDate", "Tháng", "02");
  await segment(page, "desiredDate", "Năm", "2028");
  await canonical(page, "desiredDate", "2028-02-29");
  const field = page.locator('[data-field-name="desiredDate"]'),
    trigger = field.getByRole("button", { name: /Mở lịch/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Chọn ngày" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Hôm nay" }).click();
  await canonical(page, "desiredDate", "2028-02-29");
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await canonical(page, "desiredDate", "2028-02-29");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: "Hôm nay" }).click();
  await page.keyboard.press("Escape");
  await canonical(page, "desiredDate", "2028-02-29");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: "Hôm nay" }).click();
  await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.locator('input[name="desiredDate"]')).not.toHaveValue(
    "2028-02-29",
  );
  await segment(page, "desiredTime", "Giờ", "23");
  await segment(page, "desiredTime", "Phút", "59");
  await canonical(page, "desiredTime", "23:59");
  await page.getByRole("button", { name: "Xem lựa chọn" }).click();
  await expect(page.getByRole("status")).toContainText("23:59");
  await segment(page, "desiredTime", "Giờ", "00");
  await segment(page, "desiredTime", "Phút", "00");
  await canonical(page, "desiredTime", "00:00");
  await segment(page, "desiredTime", "Phút", "37");
  await canonical(page, "desiredTime", "00:37");
  await page
    .locator('[data-field-name="desiredTime"]')
    .getByRole("button", { name: "Xóa giờ" })
    .click();
  await canonical(page, "desiredTime", "");
  await field.getByRole("button", { name: "Xóa ngày" }).click();
  await canonical(page, "desiredDate", "");
  await segment(page, "desiredTime", "Giờ", "14");
  await page.getByRole("button", { name: "Xem lựa chọn" }).click();
  await expect(
    page.getByText("Vui lòng nhập đủ các phần của ngày/giờ hoặc xóa lựa chọn."),
  ).toBeVisible();
  await expect(
    page
      .locator('[data-field-name="desiredTime"]')
      .getByRole("spinbutton", { name: /^Phút,/ }),
  ).toBeFocused();
  await expect(
    page
      .locator('[data-field-name="disabledTime"]')
      .getByRole("spinbutton")
      .first(),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
for (const width of [360, 390, 768, 1024, 1440])
  test(`official picker fits ${width}px, Vietnamese Monday and reduced motion`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/xem-thu/widgets");
    await expect(page.locator("[data-ready]")).toHaveAttribute(
      "data-ready",
      "true",
    );
    const trigger = page
      .locator('[data-field-name="desiredDate"]')
      .getByRole("button", { name: /Mở lịch/ });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Chọn ngày" });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(901);
    await expect(dialog.locator("thead th").first()).toContainText("Thứ 2");
    await page.screenshot({ path: info.outputPath(`calendar-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
test("guest cannot read/mutate admin resources or obtain upload token", async ({
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
