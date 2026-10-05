import { test, expect } from "./fixtures";
test("official dual-tier/disclosure navigation preserves catalog and all service URLs", async ({
  page,
}) => {
  await page.goto("/");
  const mobile = (page.viewportSize()?.width || 1440) < 1024;
  if (mobile) {
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByText("Sản phẩm", { exact: true })
      .click();
  } else {
    await page.getByRole("link", { name: "Sản phẩm", exact: true }).click();
    await expect(page).toHaveURL(/\/san-pham$/);
  }
  const nav = mobile ? page.getByRole("dialog") : page.locator("header").last();
  for (const [name, slug] of [
    ["Hoa Thời", "hoa-thoi"],
    ["Hoa Tâm", "hoa-tam"],
    ["Hoa Ý", "hoa-y"],
  ])
    await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute(
      "href",
      `/dich-vu/${slug}`,
    );
  await expect(
    nav.getByRole("link", { name: "Tất cả mẫu hoa", exact: true }),
  ).toHaveAttribute("href", "/san-pham");
  await nav.getByRole("link", { name: "Hoa Ý", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/dich-vu\/hoa-y$/);
  await expect(
    page.getByRole("heading", { name: "Mẫu hoa tham khảo" }),
  ).toBeVisible();
  for (const category of await page
    .locator(".hoe-product-card .category")
    .all())
    await expect(category).toHaveText("Hoa Ý");
  if (mobile) await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("caption remains below image and product crop/radius is consistent", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const caption = await page
        .locator(".editorial-photo-caption")
        .boundingBox(),
      photo = await page.locator(".editorial-hero-photo").boundingBox();
    expect(caption!.y).toBeGreaterThanOrEqual(photo!.y + photo!.height);
    const crops = await page
      .locator(".editorial-products .product-image")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          radius: getComputedStyle(node).borderRadius,
          ratio:
            node.getBoundingClientRect().width /
            node.getBoundingClientRect().height,
        })),
      );
    expect(crops.length).toBeGreaterThan(1);
    expect(new Set(crops.map((c) => c.radius)).size).toBe(1);
    for (const crop of crops) expect(crop.ratio).toBeCloseTo(0.8, 2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
});
test("content is immediate, without custom reveal/parallax, in both motion preferences", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const preference of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion: preference });
    await page.goto("/");
    await expect(
      page
        .getByRole("link", { name: "Chọn một chút hoa", exact: true })
        .first(),
    ).toBeVisible();
    const products = page.locator(".editorial-products");
    await products.scrollIntoViewIfNeeded();
    await expect(products.locator("a").first()).toBeVisible();
    expect(
      await products.evaluate((node) => getComputedStyle(node).transform),
    ).toBe("none");
    await expect(page.locator("[data-editorial-reveal]")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
