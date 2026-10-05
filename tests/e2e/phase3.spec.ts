import { test, expect } from "./fixtures";
import { choose } from "./controls";
test("design preview is isolated and shows Vietnamese quote/mixed states", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/xem-thu/giao-dien");
  await expect(
    page.getByRole("heading", { name: "Một diện mạo mới, vẫn là Hòe." }),
  ).toBeVisible();
  const entries =
    (page.viewportSize()?.width || 1440) < 768
      ? page.locator(".admin-order-mobile article")
      : page.getByRole("row");
  const quoteRow = entries.filter({ hasText: "#DEMO0001" });
  await expect(quoteRow).toContainText("Cần shop báo giá");
  await expect(quoteRow).not.toContainText("0₫");
  await expect(entries.filter({ hasText: "#DEMO0002" })).toContainText(
    "Tạm tính phần đã có giá",
  );
  await expect(
    page.locator('input[name="product.defaultDesign.shape"]'),
  ).toHaveValue("");
  let adminWrites = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/admin/") && r.method() !== "GET") adminWrites++;
  });
  await choose(page, "Hiển thị", "Công khai");
  await page.getByRole("button", { name: "Kiểm tra mẫu giao diện" }).click();
  const shape = page
    .locator('[data-field-name="product.defaultDesign.shape"]')
    .getByRole("button");
  await expect(shape).toBeFocused();
  await expect(
    page.locator('[data-field-name="product.defaultDesign.shape"]').first(),
  ).toContainText("Chọn hình thức mặc định");
  await expect(
    page.getByRole("alert").filter({ hasText: "Cần kiểm tra trước khi lưu" }),
  ).toContainText("Chọn hình thức mặc định");
  await expect(page.getByLabel("Tên mẫu hoa", { exact: true })).toHaveValue(
    "Một chút nắng — mẫu giao diện",
  );
  await choose(page, "Hình thức mặc định", "Bình");
  const included = page.getByRole("checkbox", { name: "Hộp", exact: true });
  await included.focus();
  await included.press("Space");
  await expect(included).toBeChecked();
  await page.getByRole("button", { name: "Kiểm tra mẫu giao diện" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Cấu hình hợp lệ" }),
  ).toBeVisible();
  expect(adminWrites).toBe(0);
  expect((await request.get("/api/admin/orders")).status()).toBe(401);
  expect(errors).toEqual([]);
});
test("review pages are readable at all widths and respect reduced motion", async ({
  page,
}) => {
  test.setTimeout(90000); // Fifteen navigations and image decode checks across five widths.
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/san-pham/mau-test-nang", "/xem-thu/giao-dien"]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      for (const image of await page.locator("img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (i) =>
                (i as HTMLImageElement).complete &&
                (i as HTMLImageElement).naturalWidth > 0,
            ),
          )
          .toBe(true);
      }
    }
  }
});
test("editor warns before discarding input and preview menu returns focus", async ({
  page,
}) => {
  await page.goto("/xem-thu/giao-dien");
  await page
    .getByLabel("Tên mẫu hoa", { exact: true })
    .fill("Nội dung chưa lưu");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Xem Home", exact: true }).click();
  await expect(page).toHaveURL(/xem-thu\/giao-dien/);
  await expect(page.getByLabel("Tên mẫu hoa", { exact: true })).toHaveValue(
    "Nội dung chưa lưu",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/xem-thu/giao-dien?panel=admin");
  const admin = page;
  const trigger = admin.getByRole("button", { name: "Mở menu" });
  await trigger.click();
  await expect(admin.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(admin.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});
