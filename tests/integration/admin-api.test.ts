import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, assertDbEnvironment, closeDb } from "@/server/db";
import * as s from "@/server/db/schema";
import { GET as list } from "@/app/api/admin/[resource]/route";
import { PUT, DELETE } from "@/app/api/admin/[resource]/[id]/route";
import { POST as uploadToken } from "@/app/api/admin/media/upload/route";
import { getArticles } from "@/server/content";
import { head } from "@vercel/blob";
import { finishMedia, mediaPrefix } from "@/server/admin/media";
const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: session.userId }),
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@vercel/blob", () => ({ del: vi.fn(), head: vi.fn() }));
const id = "api-" + randomUUID(),
  mediaId = randomUUID(),
  context = { params: Promise.resolve({ resource: "posts", id }) };
const data = {
  id,
  slug: id,
  title: "Bài mới qua API",
  excerpt: "Một bài dùng cho kiểm thử riêng.",
  bodyMarkdown: "Hoa kể chuyện. Hòe gửi thương. ".repeat(6),
  category: "Test",
  image: null as string | null,
  publicationStatus: "draft",
  publishedAt: null,
};
const request = (method: string, payload: unknown) =>
  new Request("http://localhost:3000/api/admin/posts/" + id, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
beforeAll(async () => {
  if (
    process.env.DB_ENV !== "test" ||
    !process.env.DATABASE_URL ||
    process.env.VERCEL_ENV
  )
    throw new Error("Separate Postgres test DB required.");
  await assertDbEnvironment();
  vi.stubEnv("CONTENT_MODE", "test");
  vi.stubEnv("DATA_ADAPTER", "postgres");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_placeholder");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_placeholder");
  vi.stubEnv("ADMIN_CLERK_USER_IDS", "user_allowed");
});
afterAll(async () => {
  await getDb().delete(s.posts).where(eq(s.posts.id, id));
  await getDb().delete(s.media).where(eq(s.media.id, mediaId));
  await getDb()
    .delete(s.adminAuditLogs)
    .where(eq(s.adminAuditLogs.resourceId, id));
  await closeDb();
  vi.unstubAllEnvs();
});
describe("private APIs with mocked Clerk session and real Postgres", () => {
  it("resolves uploads in the configured Blob store before fetching bytes", async () => {
    const pathname = mediaPrefix("user_allowed") + randomUUID() + ".png";
    vi.mocked(head).mockResolvedValue({
      url: "https://our-store.public.blob.vercel-storage.com/" + pathname,
      pathname,
      size: 100,
      contentType: "image/png",
    } as Awaited<ReturnType<typeof head>>);
    const network = vi.spyOn(globalThis, "fetch");
    try {
      await expect(
        finishMedia(
          "https://other-store.public.blob.vercel-storage.com/" + pathname,
          "Ảnh test",
          "user_allowed",
        ),
      ).rejects.toMatchObject({ status: 422 });
      expect(head).toHaveBeenCalledWith(pathname);
      expect(network).not.toHaveBeenCalled();
    } finally {
      network.mockRestore();
    }
  });
  it("guest gets 401 and non-admin gets 403 before database read, edit or upload", async () => {
    session.userId = null;
    const result = await list(
      new Request("http://localhost/api/admin/orders"),
      { params: Promise.resolve({ resource: "orders" }) },
    );
    expect(result.status).toBe(401);
    expect(result.headers.get("cache-control")).toBe("no-store");
    session.userId = "user_denied";
    expect(
      (await PUT(request("PUT", { editVersion: 0, data }), context)).status,
    ).toBe(403);
    expect((await uploadToken(request("POST", {}))).status).toBe(403);
  });
  it("admin creates draft, publishes a new slug immediately and stale edit cannot overwrite", async () => {
    session.userId = "user_allowed";
    expect(
      (await PUT(request("PUT", { editVersion: 0, data }), context)).status,
    ).toBe(200);
    expect((await getArticles()).some((a) => a.slug === id)).toBe(false);
    expect(
      (
        await PUT(
          request("PUT", {
            editVersion: 1,
            data: { ...data, publicationStatus: "published" },
          }),
          context,
        )
      ).status,
    ).toBe(200);
    expect((await getArticles()).some((a) => a.slug === id)).toBe(true);
    expect(
      (
        await PUT(
          request("PUT", {
            editVersion: 1,
            data: { ...data, title: "Stale title" },
          }),
          context,
        )
      ).status,
    ).toBe(409);
    const [row] = await getDb()
      .select()
      .from(s.posts)
      .where(eq(s.posts.id, id));
    expect(row.title).toBe(data.title);
  });
  it("media references keep a real FK, refuse deletion with usage list, then allow explicit deletion", async () => {
    const url =
      "https://test.public.blob.vercel-storage.com/hoe/verified-test/photo.png";
    await getDb().insert(s.media).values({
      id: mediaId,
      pathname: "hoe/verified-test/photo.png",
      url,
      mime: "image/png",
      bytes: 100,
      width: 10,
      height: 10,
      alt: "Ảnh test DB",
      uploadedBy: "user_allowed",
    });
    expect(
      (
        await PUT(
          request("PUT", {
            editVersion: 2,
            data: { ...data, image: url, publicationStatus: "published" },
          }),
          context,
        )
      ).status,
    ).toBe(200);
    const [row] = await getDb()
      .select()
      .from(s.posts)
      .where(eq(s.posts.id, id));
    expect(row.coverMediaId).toBe(mediaId);
    const removeContext = {
      params: Promise.resolve({ resource: "media", id: mediaId }),
    };
    const blocked = await DELETE(
      request("DELETE", { confirm: true }),
      removeContext,
    );
    expect(blocked.status).toBe(409);
    expect((await blocked.json()).error.details.references).toContainEqual({
      type: "posts",
      id,
      title: data.title,
    });
    expect(
      (
        await PUT(
          request("PUT", {
            editVersion: 3,
            data: { ...data, publicationStatus: "archived" },
          }),
          context,
        )
      ).status,
    ).toBe(200);
    expect((await getArticles()).some((a) => a.slug === id)).toBe(false);
    expect(
      (await DELETE(request("DELETE", { confirm: true }), removeContext))
        .status,
    ).toBe(200);
    expect(
      await getDb().select().from(s.media).where(eq(s.media.id, mediaId)),
    ).toHaveLength(0);
  });
});
