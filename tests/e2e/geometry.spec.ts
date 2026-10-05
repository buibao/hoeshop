import { test, expect } from "./fixtures";
test("md button/input and icon slots match locked upstream scale", async ({
  page,
}) => {
  await page.goto("/xem-thu/giao-dien");
  const button = page.getByRole("button", {
    name: "Hành động chính",
    exact: true,
  });
  const metrics = await button.evaluate((node) => {
    const s = getComputedStyle(node);
    return {
      height: node.getBoundingClientRect().height,
      top: s.paddingTop,
      left: s.paddingLeft,
      radius: s.borderRadius,
      font: s.fontSize,
      gap: s.gap,
    };
  });
  expect(metrics).toEqual({
    height: 40,
    top: "10px",
    left: "14px",
    radius: "8px",
    font: "14px",
    gap: "4px",
  });
  const input = page.getByRole("textbox", {
    name: "Ô nhập mặc định",
    exact: true,
  });
  await expect(input).toHaveCSS("font-size", "16px");
  await expect(input).toHaveCSS("padding-top", "8px");
  await page.goto("/");
  const action = page
    .getByRole("link", { name: "Chọn một chút hoa", exact: true })
    .first();
  await expect(action.locator("svg[data-icon=trailing]")).toHaveCount(1);
  const box = await action.boundingBox();
  expect(box!.height).toBe(40);
  await expect(action.locator("svg")).toHaveCSS("width", "20px");
});
