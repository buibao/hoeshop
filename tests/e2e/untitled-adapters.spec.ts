import { test, expect } from "./fixtures";
import { choose, canonical, segment } from "./controls";
test("popup in modal keeps theme, draft/cancel, escape focus and reset serialization", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/xem-thu/giao-dien");
  const open = page.getByRole("button", {
    name: "Thử field trong modal",
    exact: true,
  });
  await open.click();
  const modal = page.getByRole("dialog", {
    name: "Widget trong modal — dữ liệu mẫu",
  });
  await expect(modal).toBeVisible();
  const trigger = modal.getByRole("button", { name: /Mở lịch/ });
  await trigger.click();
  const calendar = page.getByRole("dialog", { name: "Chọn ngày", exact: true });
  await expect(calendar).toBeVisible();
  await expect(calendar).toHaveCSS("background-color", "rgb(255, 252, 247)");
  const box = await calendar.boundingBox(),
    size = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(size.width + 1);
  await calendar.getByRole("button", { name: "Hôm nay" }).click();
  await page.keyboard.press("Escape");
  await expect(calendar).toHaveCount(0);
  await canonical(page, "modalDate", "2028-02-29");
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("29/02/2028");
  await choose(page, "Hình thức mẫu trong modal", "Hộp");
  await segment(page, "modalTime", "Phút", "37");
  await canonical(page, "modalTime", "23:37");
  await modal.getByRole("button", { name: "Khôi phục mẫu" }).click();
  await canonical(page, "modalShape", "bo");
  await canonical(page, "modalTime", "23:59");
  await canonical(page, "modalDate", "2028-02-29");
  await modal.getByRole("button", { name: "Kiểm tra FormData mẫu" }).click();
  await expect(modal.getByRole("status")).toContainText(
    "2028-02-29 · 23:59 · bo",
  );
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(open).toBeFocused();
  expect(errors).toEqual([]);
});
test("changing official Select recomputes fixed/quote price and sends one business value", async ({
  page,
}) => {
  await page.goto("/san-pham/mau-test-nang");
  const price = page.getByText("Theo cấu hình hiện tại:", { exact: false });
  await expect(price).not.toContainText("Liên hệ báo giá");
  await choose(page, "Hình thức", "Bình");
  await expect(price).toContainText("Liên hệ báo giá");
  await canonical(page, "shape", "binh");
  await choose(page, "Hình thức", "Bó");
  await expect(price).not.toContainText("Liên hệ báo giá");
  await canonical(page, "shape", "bo");
  await choose(page, "Hình thức", "Bình");
  await page.locator('form').evaluate(form => (form as HTMLFormElement).reset());
  await canonical(page, "shape", "bo");
  await expect(price).not.toContainText("Liên hệ báo giá");
});
