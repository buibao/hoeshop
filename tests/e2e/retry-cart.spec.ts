import { test, expect, type Page } from "./fixtures";
async function add(page: Page, emotion = "Thương") {
  await page.goto("/san-pham/mau-test-diu-dang");
  await page.getByLabel("Cảm xúc muốn gửi", { exact: true }).fill(emotion);
  await page.getByRole("button", { name: "Thêm vào giỏ hoa" }).click();
  await expect(page.getByText("Đã thêm vào giỏ hoa.")).toBeVisible();
}
async function details(page: Page) {
  await page
    .getByLabel("Họ tên người đặt", { exact: true })
    .fill("Khách retry");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0901234567");
  await page
    .getByLabel("Tên người nhận", { exact: true })
    .fill("Người nhận test");
  await page
    .getByLabel("Địa chỉ nhận hoa", { exact: true })
    .fill("Địa chỉ retry test");
}
test("pending metadata survives reload without storing contact and reuses request ID", async ({
  page,
}) => {
  await add(page);
  await page.goto("/dat-hoa");
  await details(page);
  const ids: string[] = [];
  let first = true;
  await page.route("**/api/orders", async (route) => {
    ids.push(route.request().postDataJSON().requestId);
    const response = await route.fetch();
    if (first) {
      first = false;
      await route.abort("failed");
    } else await route.fulfill({ response });
  });
  await page
    .getByRole("button", { name: "Gửi yêu cầu đặt hoa", exact: true })
    .click();
  await expect(page.locator(".error[role=alert]")).toContainText(
    "Chưa xác nhận",
  );
  const metadata = await page.evaluate(() =>
    localStorage.getItem("hoe.pending.v1"),
  );
  expect(metadata).toContain(ids[0]);
  expect(metadata).not.toContain("0901234567");
  expect(metadata).not.toContain("Địa chỉ retry test");
  await page.reload();
  await expect(
    page.getByLabel("Họ tên người đặt", { exact: true }),
  ).toHaveValue("");
  await details(page);
  await page
    .getByRole("button", { name: "Gửi yêu cầu đặt hoa", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Hòe đã nhận yêu cầu");
  expect(ids).toHaveLength(2);
  expect(ids[1]).toBe(ids[0]);
  expect(
    await page.evaluate(() => localStorage.getItem("hoe.pending.v1")),
  ).toBe("[]");
});
test("receipt subtracts submitted quantity and preserves items added in another tab", async ({
  page,
  context,
}) => {
  await add(page);
  await page.goto("/dat-hoa");
  await details(page);
  let release!: () => void, started!: () => void;
  const hold = new Promise<void>((resolve) => {
      release = resolve;
    }),
    received = new Promise<void>((resolve) => {
      started = resolve;
    });
  await page.route("**/api/orders", async (route) => {
    const response = await route.fetch();
    started();
    await hold;
    await route.fulfill({ response });
  });
  await page
    .getByRole("button", { name: "Gửi yêu cầu đặt hoa", exact: true })
    .click();
  await received;
  const other = await context.newPage();
  await add(other);
  await add(other, "Biết ơn");
  release();
  await expect(page.getByRole("status")).toContainText("Hòe đã nhận yêu cầu");
  await expect(
    page.getByRole("link", { name: "Quay lại giỏ hoa" }),
  ).toBeVisible();
  const remaining = await page.evaluate(
    () => JSON.parse(localStorage.getItem("hoe.cart.v1")!).items,
  );
  expect(remaining).toHaveLength(2);
  expect(remaining.map((r: { quantity: number }) => r.quantity)).toEqual([
    1, 1,
  ]);
  await other.close();
});
