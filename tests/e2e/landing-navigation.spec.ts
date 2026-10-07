import { test, expect } from "./fixtures";

test("product navigation works with hover, keyboard, mobile and service links", async ({
  page,
}) => {
  await page.goto("/");
  const mobile = (page.viewportSize()?.width || 1440) < 768;
  if (mobile)
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  const nav = page.getByRole("navigation", {
    name: mobile ? "Điều hướng trên điện thoại" : "Điều hướng chính",
    exact: true,
  });
  const toggle = nav.getByRole("button", { name: "Các loại hoa" });
  if (!mobile) {
    await nav.getByRole("link", { name: "Sản phẩm", exact: true }).hover();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.locator(".olf-hero-description").hover();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  }
  await toggle.focus();
  await page.keyboard.press("ArrowDown");
  await expect(nav.getByRole("link", { name: /Hoa Thời/ })).toBeFocused();
  for (const [name, slug] of [
    ["Hoa Thời", "hoa-thoi"],
    ["Hoa Tâm", "hoa-tam"],
    ["Hoa Ý", "hoa-y"],
  ]) {
    await expect(
      nav.getByRole("link", { name: new RegExp(name) }),
    ).toHaveAttribute("href", `/dich-vu/${slug}`);
  }
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  if (mobile) await expect(page.getByRole("dialog")).toBeVisible();
  // The fading-out links must leave Tab order immediately when dismissed.
  await page.keyboard.press("Tab");
  await expect(
    nav.getByRole("link", { name: "Về Hòe", exact: true }),
  ).toBeFocused();
  await toggle.focus();
  await page.keyboard.press("Space");
  await nav.getByRole("link", { name: /Hoa Ý/ }).click();
  await expect(page).toHaveURL(/\/dich-vu\/hoa-y$/);
  await expect(page.locator(".service-page-top .eyebrow")).toContainText(
    "Hoa Ý",
  );
  await expect(
    page.getByRole("heading", { name: "Mẫu hoa tham khảo" }),
  ).toBeVisible();
  await expect(page.locator(".hoe-product-card")).not.toHaveCount(0);
  for (const category of await page
    .locator(".hoe-product-card .category")
    .all())
    await expect(category).toHaveText("Hoa Ý");
  if (mobile) await expect(page.getByRole("dialog")).toBeHidden();
});

test("centered hero keeps copy clear of photos and Home crops are consistent", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator('[data-home-design="oh-les-fleurs"]')).toHaveCount(1);
    const heading = await page.locator(".olf-hero-heading").boundingBox();
    const description = await page.locator(".olf-hero-description").boundingBox();
    expect(heading && description).toBeTruthy();
    expect(description!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
    await expect(page.getByRole("heading", {level: 1})).toHaveCount(1);
    if (width < 768) {
      const photos = await page.locator('.olf-hero-photos').boundingBox();
      expect(photos!.y).toBeGreaterThanOrEqual(heading!.y+heading!.height);
      expect(description!.y).toBeGreaterThanOrEqual(photos!.y+photos!.height);
    }
    const crops = await page
      .locator(".editorial-products .product-image")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return {
            radius: getComputedStyle(node).borderRadius,
            ratio: box.width / box.height,
          };
        }),
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

test("scroll reveals settle visibly and reduced motion keeps content immediate", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator(".olf-hero-description .olf-button")).toBeVisible();
  const products = page.locator(".editorial-products");
  await products.scrollIntoViewIfNeeded();
  for (const reveal of await page
    .locator(".olf-featured > [data-scroll-fade]:last-child > [data-scroll-fade-content]")
    .all()) {
    await expect
      .poll(() =>
        reveal.evaluate((node) => Number(getComputedStyle(node).opacity)),
      )
      .toBe(1);
    await expect(reveal.locator("a").first()).toBeVisible();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await products.scrollIntoViewIfNeeded();
  for (const reveal of await page
    .locator(".olf-featured > [data-scroll-fade]:last-child > [data-scroll-fade-content]")
    .all()) {
    expect(
      await reveal.evaluate((node) => Number(getComputedStyle(node).opacity)),
    ).toBe(1);
    expect(
      await reveal.evaluate((node) => getComputedStyle(node).transform),
    ).toBe("none");
  }
  expect(errors).toEqual([]);
});
