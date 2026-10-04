import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
const run = randomUUID(),
  postId = "uat-" + run;
const article = {
  id: postId,
  slug: postId,
  title: "Chuyện hoa UAT",
  excerpt: "Nội dung kiểm thử trên Preview riêng.",
  bodyMarkdown:
    "Một chút hoa, một chút dịu dàng. ".repeat(8) +
    "\n<script>window.uatInjected=true</script>",
  category: "UAT",
  image: null,
  publicationStatus: "draft",
  publishedAt: null,
};
test.describe.configure({ mode: "serial" });
test.beforeAll(async ({ request }) => {
  const r = await request.get("/api/admin/dashboard");
  expect(r.status()).toBe(200);
  const d = await r.json();
  expect(["test", "preview"]).toContain(d.environment);
  expect(d.shopLive).toBe(false);
});
test("Google admin session works and guest/non-admin are rejected at server", async ({
  page,
  browser,
  request,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Một ngày cùng Hòe" }),
  ).toBeVisible();
  expect(
    (await request.get("/api/admin/orders")).headers()["cache-control"],
  ).toBe("no-store");
  const guest = await browser.newContext(),
    outsider = await browser.newContext({
      storageState: process.env.UAT_NON_ADMIN_STATE,
    });
  expect(
    (
      await guest.request.get(process.env.UAT_BASE_URL + "/api/admin/orders")
    ).status(),
  ).toBe(401);
  expect(
    (
      await outsider.request.get(process.env.UAT_BASE_URL + "/api/admin/orders")
    ).status(),
  ).toBe(403);
  expect(
    (
      await outsider.request.post(
        process.env.UAT_BASE_URL + "/api/admin/media/upload",
        { data: {} },
      )
    ).status(),
  ).toBe(403);
  await guest.close();
  await outsider.close();
});
test("draft preview is safe, new published slug works without build and stale edit returns 409", async ({
  page,
  request,
}) => {
  expect(
    (
      await request.put(`/api/admin/posts/${postId}`, {
        data: { editVersion: 0, data: article },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get(`/blog/${postId}`)).status()).toBe(404);
  await page.goto(`/admin/posts/${postId}`);
  await page.getByRole("button", { name: "Xem thử nội dung" }).click();
  expect(await page.evaluate(() => "uatInjected" in window)).toBe(false);
  const update = await request.put(`/api/admin/posts/${postId}`, {
    data: {
      editVersion: 1,
      data: { ...article, publicationStatus: "published" },
    },
  });
  expect(update.status()).toBe(200);
  expect((await request.get(`/blog/${postId}`)).status()).toBe(200);
  expect(
    (
      await request.put(`/api/admin/posts/${postId}`, {
        data: { editVersion: 1, data: article },
      })
    ).status(),
  ).toBe(409);
});
test("visible comment, hide/retry conflict, restore and unpublish use fresh DB state", async ({
  request,
}) => {
  const body = {
    requestId: randomUUID(),
    postId,
    displayName: "Khách UAT",
    body: "<script>window.uatInjected=true</script>",
  };
  const saved = await request.post("/api/comments", { data: body });
  expect(saved.status()).toBe(201);
  expect(
    (
      await request.put(`/api/admin/comments/${body.requestId}`, {
        data: { editVersion: 1, data: { visibility: "hidden" } },
      })
    ).status(),
  ).toBe(200);
  const hidden = await (
    await request.get(`/api/comments?postId=${postId}`)
  ).json();
  expect(hidden.comments).toHaveLength(0);
  expect((await request.post("/api/comments", { data: body })).status()).toBe(
    409,
  );
  expect(
    (
      await request.put(`/api/admin/comments/${body.requestId}`, {
        data: { editVersion: 2, data: { visibility: "visible" } },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await (await request.get(`/api/comments?postId=${postId}`)).json())
      .comments,
  ).toHaveLength(1);
  expect(
    (
      await request.put(`/api/admin/posts/${postId}`, {
        data: {
          editVersion: 2,
          data: { ...article, publicationStatus: "archived" },
        },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get(`/blog/${postId}`)).status()).toBe(404);
});
test("Blob upload verifies image, referenced media returns 409, unreferenced deletion succeeds", async ({
  page,
  request,
}) => {
  await page.goto("/admin/media");
  await page
    .getByLabel("Ảnh JPEG / PNG / WebP / AVIF, tối đa 5 MiB")
    .setInputFiles("tests/fixtures/images/bouquet.jpg");
  await page.getByLabel("Mô tả ảnh cho người đọc").fill("Ảnh UAT " + run);
  await page.getByRole("button", { name: "Tải ảnh lên" }).click();
  await expect(page.getByRole("status")).toContainText("Ảnh đã được xác minh");
  const rows = (await (await request.get("/api/admin/media")).json()).rows,
    media = rows.find((m: { alt: string }) => m.alt === "Ảnh UAT " + run);
  expect(media).toBeTruthy();
  const p = {
    product: {
      id: "product-" + run,
      slug: "product-" + run,
      name: "Mẫu UAT",
      description: "Dữ liệu UAT riêng",
      serviceType: "hoa-tam",
      image: media.url,
      imageAlt: media.alt,
      published: false,
      fixture: false,
      price: { mode: "quote" },
      defaultDesign: {},
      pricedOptions: {},
    },
    publicationStatus: "draft",
    sortOrder: 0,
  };
  expect(
    (
      await request.put(`/api/admin/products/product-${run}`, {
        data: { editVersion: 0, data: p },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.delete(`/api/admin/media/${media.id}`, {
        data: { confirm: true },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.put(`/api/admin/products/product-${run}`, {
        data: {
          editVersion: 1,
          data: {
            ...p,
            product: { ...p.product, image: null },
            publicationStatus: "archived",
          },
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.delete(`/api/admin/media/${media.id}`, {
        data: { confirm: true },
      })
    ).status(),
  ).toBe(200);
});
