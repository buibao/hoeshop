import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { getDb, assertDbEnvironment, closeDb } from "@/server/db";
import * as s from "@/server/db/schema";
import { getHome as fileHome, getSite as fileSite } from "@/server/file-content";
import { getHome, getProducts, getSite } from "@/server/content";
import { resolveHomeProducts } from "@/domain/home-products";
import { contactEditorData } from "@/domain/contact";
import { revalidateTag } from "next/cache";
import { GET, PATCH } from "@/app/api/admin/home/[kind]/route";
import { GET as options } from "@/app/api/admin/product-options/route";
import { PATCH as contact } from "@/app/api/admin/settings/site/contact/route";
import { adminSave, adminHomeSelection } from "@/server/admin/repository";

const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: session.userId }) }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
const prefix = "feedback-" + randomUUID().slice(0, 8);
const ids = Array.from({ length: 64 }, (_, i) => `${prefix}-${String(i).padStart(2, "0")}`);
let originals: (typeof s.siteSettings.$inferSelect)[] = [];
const request = (path: string, payload?: unknown) => new Request(`http://localhost${path}`, payload ? { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) } : {});
const context = (kind: string) => ({ params: Promise.resolve({ kind }) });
const version = async () => (await adminHomeSelection("hero")).editVersion;

beforeAll(async () => {
  if (process.env.DB_ENV !== "test" || !process.env.DATABASE_URL || process.env.VERCEL_ENV) throw new Error("Separate Postgres test DB required.");
  await assertDbEnvironment();
  vi.stubEnv("CONTENT_MODE", "live");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_placeholder");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_placeholder");
  vi.stubEnv("ADMIN_CLERK_USER_IDS", "user_feedback_admin");
  originals = await getDb().select().from(s.siteSettings).where(inArray(s.siteSettings.key, ["home", "site"]));
  const home = { ...fileHome(), primaryCta: { label: "Chọn một chút hoa (Admin)", href: "/san-pham" }, featuredLimit: 3, featuredProductIds: ids.slice(0, 12) };
  await getDb().insert(s.siteSettings).values([{ key: "home", data: home }, { key: "site", data: fileSite() }]).onConflictDoUpdate({ target: s.siteSettings.key, set: { data: {} } });
  await getDb().update(s.siteSettings).set({ data: home, editVersion: 1 }).where(eq(s.siteSettings.key, "home"));
  await getDb().update(s.siteSettings).set({ data: { ...fileSite(), social: [{ label: "YouTube", url: "https://youtube.com/hoe" }] }, editVersion: 1 }).where(eq(s.siteSettings.key, "site"));
  await getDb().insert(s.products).values(ids.map((id, i) => ({ id, slug: id, name: `Hoa feedback ${String(i).padStart(2, "0")} ${prefix}`, serviceType: "hoa-tam", description: "Catalog integration test", image: i === 62 ? null : "/images/floral-mark.svg", imageAlt: "Hoa test", publicationStatus: i === 61 ? "draft" : "published", fixture: i === 63 ? 1 : 0, sortOrder: i, priceMode: "quote", pricingRevision: "feedback-test" })));
});
afterAll(async () => {
  if (originals.length) {
    await getDb().delete(s.products).where(inArray(s.products.id, ids));
    for (const row of originals) await getDb().update(s.siteSettings).set({ data: row.data, editVersion: row.editVersion, updatedAt: row.updatedAt }).where(eq(s.siteSettings.key, row.key));
    await getDb().delete(s.adminAuditLogs).where(eq(s.adminAuditLogs.actorId, "user_feedback_admin"));
  }
  await closeDb(); vi.unstubAllEnvs();
});

describe("Home selection APIs with Clerk guard and real Postgres", () => {
  it("blocks guests/non-admins on reads and writes", async () => {
    session.userId = null;
    expect((await GET(request("/api/admin/home/hero"), context("hero"))).status).toBe(401);
    session.userId = "user_denied";
    expect((await options(request("/api/admin/product-options"))).status).toBe(403);
    expect((await PATCH(request("/api/admin/home/hero", { editVersion: 1, productIds: ids.slice(0, 3) }), context("hero"))).status).toBe(403);
    expect((await contact(request("/api/admin/settings/site/contact", {}))).status).toBe(403);
    session.userId = "user_feedback_admin";
  });
  it("finds and selects products beyond the first 50 with status/eligibility", async () => {
    const body = await (await options(request(`/api/admin/product-options?q=${prefix}&page=2`))).json();
    expect(body.products.some((p: { id: string }) => p.id === ids[60])).toBe(true);
    expect(body.products.find((p: { id: string }) => p.id === ids[61]).eligible).toBe(false);
    expect(body.products.find((p: { id: string }) => p.id === ids[62]).eligible).toBe(false);
    expect(body.products.some((p: { id: string }) => p.id === ids[63])).toBe(false);
    const match = await (await options(request(`/api/admin/product-options?q=${encodeURIComponent(`Hoa feedback 60 ${prefix}`)}`))).json();
    expect(match.products.map((p: { id: string }) => p.id)).toEqual([ids[60]]);
  });
  it("rejects duplicates, missing count, draft, missing image, fixture and missing IDs", async () => {
    for (const productIds of [[ids[0]], [ids[0], ids[0], ids[1]], [ids[0], ids[1], ids[61]], [ids[0], ids[1], ids[62]], [ids[0], ids[1], ids[63]], [ids[0], ids[1], "missing"]]) {
      expect((await PATCH(request("/api/admin/home/hero", { editVersion: 1, productIds }), context("hero"))).status).toBe(422);
    }
    expect(await version()).toBe(1);
  });
  it("saves 3 Hero and 10 featured in order, retains other fields, logs and invalidates cache", async () => {
    const hero = [ids[60], ids[1], ids[0]];
    expect((await PATCH(request("/api/admin/home/hero", { editVersion: 1, productIds: hero }), context("hero"))).status).toBe(200);
    const [beforeFeatured] = await getDb().select().from(s.siteSettings).where(eq(s.siteSettings.key, "home"));
    expect((beforeFeatured.data as Record<string, unknown>).featuredProductIds).toHaveLength(12);
    expect((await PATCH(request("/api/admin/home/featured", { editVersion: 1, productIds: ids.slice(0, 10) }), context("featured"))).status).toBe(409);
    const featured = ids.slice(0, 10).reverse();
    expect((await PATCH(request("/api/admin/home/featured", { editVersion: 2, productIds: featured }), context("featured"))).status).toBe(200);
    const saved = await getHome();
    expect(saved.heroProductIds).toEqual(hero); expect(saved.featuredProductIds).toEqual(featured);
    expect(saved.featuredLimit).toBe(10); expect(saved.title).toBe(fileHome().title);
    expect(saved.primaryCta).toEqual({ label: "Chọn một chút hoa (Admin)", href: "/#nhung-doa-hoa" });
    expect(resolveHomeProducts(saved, await getProducts(), false).featured.map((p) => p.id)).toEqual(featured);
    expect(revalidateTag).toHaveBeenCalledWith("settings", { expire: 0 });
    const logs = await getDb().select().from(s.adminAuditLogs).where(eq(s.adminAuditLogs.actorId, "user_feedback_admin"));
    expect(logs.map((l) => l.action)).toEqual(expect.arrayContaining(["update:home-hero", "update:home-featured"]));
    expect(logs.find((l) => l.action === "update:home-hero")?.metadata).toMatchObject({ changedFields: ["heroProductIds"], previousVersion: 1 });
  });
  it("a general Home save cannot alter the protected selections", async () => {
    const home = await getHome();
    await adminSave("settings", "home", await version(), { ...home, title: "Nội dung mới", heroProductIds: [], featuredProductIds: [], featuredLimit: 1 }, "user_feedback_admin");
    const saved = await getHome();
    expect(saved.title).toBe("Nội dung mới"); expect(saved.heroProductIds).toEqual(home.heroProductIds);
    expect(saved.featuredProductIds).toEqual(home.featuredProductIds); expect(saved.featuredLimit).toBe(10);
  });
  it("concurrent menus return one 409 without losing either field", async () => {
    const editVersion = await version();
    const before = await getHome();
    const results = await Promise.all([
      PATCH(request("/api/admin/home/hero", { editVersion, productIds: [ids[10], ids[11], ids[12]] }), context("hero")),
      PATCH(request("/api/admin/home/featured", { editVersion, productIds: ids.slice(10, 20) }), context("featured")),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const after = await getHome();
    expect(after.title).toBe(before.title);
    if (results[0].status === 200) expect(after.featuredProductIds).toEqual(before.featuredProductIds);
    else expect(after.heroProductIds).toEqual(before.heroProductIds);
  });
  it("unpublishing a chosen product removes public content and warns in Admin without replacement", async () => {
    const before = await getHome();
    const selectedId = before.featuredProductIds[0];
    await getDb().update(s.products).set({ publicationStatus: "draft" }).where(eq(s.products.id, selectedId));
    const resolved = resolveHomeProducts(await getHome(), await getProducts(), false);
    expect(resolved.featured).toHaveLength(9); expect(resolved.featured.some((p) => p.id === selectedId)).toBe(false);
    const selection = await adminHomeSelection("featured");
    expect(selection.products.find((p) => p.id === selectedId)?.eligible).toBe(false);
    expect((await PATCH(request("/api/admin/home/featured", { editVersion: selection.editVersion, productIds: selection.productIds }), context("featured"))).status).toBe(422);
  });
  it("saves fewer than ten and clears featured without legacy refill, retaining Hero and audit/CAS", async () => {
    const before = await getHome();
    for (const productIds of [[ids[4], ids[3], ids[2]], [ids[4]], []]) {
      const editVersion = await version();
      expect((await PATCH(request("/api/admin/home/featured", { editVersion, productIds }), context("featured"))).status).toBe(200);
      expect((await PATCH(request("/api/admin/home/featured", { editVersion, productIds }), context("featured"))).status).toBe(409);
      const saved = await getHome();
      expect(saved.featuredProductIds).toEqual(productIds);
      expect(saved.featuredLimit).toBe(productIds.length);
      expect(saved.heroProductIds).toEqual(before.heroProductIds);
      expect(saved.title).toBe(before.title);
      expect(resolveHomeProducts(saved, await getProducts(), false).featured.map((p) => p.id)).toEqual(productIds);
    }
    const editVersion = await version();
    for (const productIds of [ids.slice(0, 11), [ids[1], ids[1]], [ids[61]], ["missing"]])
      expect((await PATCH(request("/api/admin/home/featured", { editVersion, productIds }), context("featured"))).status).toBe(422);
    expect(await version()).toBe(editVersion);
    const logs = await getDb().select().from(s.adminAuditLogs).where(eq(s.adminAuditLogs.actorId, "user_feedback_admin"));
    expect(logs.filter((l) => l.action === "update:home-featured").length).toBeGreaterThanOrEqual(4);
    expect(revalidateTag).toHaveBeenCalledWith("settings", { expire: 0 });
  });
  it("contact PATCH preserves FAQ/brand/other socials, rejects bad URLs/email and stale versions", async () => {
    const before = await getSite();
    const data = contactEditorData(before);
    data.contact = { ...data.contact, phone: "+84 (90) 123 4567", email: "shop@example.com", address: "Địa chỉ test dài ".repeat(15), addressUrl: "https://maps.google.com/?q=hoe" };
    data.social.Facebook = { label: "Facebook Hòe", url: "https://facebook.com/hoe" };
    data.social.Instagram.url = "https://instagram.com/hoe"; data.social.TikTok.url = "https://tiktok.com/@hoe";
    for (const invalidContact of [{ ...data.contact, email: "invalid" }, { ...data.contact, addressUrl: "http://example.com" }])
      expect((await contact(request("/api/admin/settings/site/contact", { ...data, contact: invalidContact, editVersion: 1 }))).status).toBe(422);
    expect((await contact(request("/api/admin/settings/site/contact", { ...data, editVersion: 1 }))).status).toBe(200);
    expect((await contact(request("/api/admin/settings/site/contact", { ...data, editVersion: 1 }))).status).toBe(409);
    const after = await getSite();
    expect(after.faq).toEqual(before.faq); expect(after.name).toBe(before.name);
    expect(after.social).toContainEqual(before.social[0]); expect(after.social).toHaveLength(4);
    expect(after.contact).toEqual({ ...data.contact, address: data.contact.address!.trim() });
  });
});
