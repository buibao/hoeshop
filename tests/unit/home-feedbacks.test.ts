import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { homeSchema, siteSchema } from "@/domain/content";
import { resolveHomeProducts, selectionSchema } from "@/domain/home-products";
import { contactEditSchema, contactEditorData, mergeContactSocial, phoneHref } from "@/domain/contact";
import { homeFeedbackMigration } from "@/domain/home-feedback-migration";
import { getHome, getSite, getProducts } from "@/server/file-content";
import { GET, PATCH } from "@/app/api/admin/home/[kind]/route";
import { GET as options } from "@/app/api/admin/product-options/route";
import { PATCH as contact } from "@/app/api/admin/settings/site/contact/route";
import { assertAdminId } from "@/server/admin/auth";
import { FeaturedProductCarousel } from "@/features/storefront/FeaturedProductCarousel";
import { createElement } from "react";

vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));
afterEach(() => vi.unstubAllEnvs());
describe("Home feedback contracts", () => {
  it("reads legacy defaults without forcing 3/10 on deployment", () => {
    const home = getHome();
    const legacy = Object.fromEntries(Object.entries(home).filter(([key]) => key !== "heroProductIds"));
    expect(homeSchema.parse(legacy).heroProductIds).toEqual([]);
    const site = getSite();
    const oldContact = Object.fromEntries(Object.entries(site.contact).filter(([key]) => key !== "addressUrl"));
    expect(siteSchema.parse({ ...site, contact: oldContact }).contact.addressUrl).toBeNull();
    expect(homeSchema.parse({ ...legacy, featuredProductIds: Array.from({ length: 12 }, (_, i) => String(i)) }).featuredProductIds).toHaveLength(12);
  });
  it("preserves configured order, caps 10, drops drafts/fixtures/missing images without replacement", () => {
    vi.stubEnv("CONTENT_MODE", "test");
    const sample = getProducts()[0];
    const catalog = Array.from({ length: 12 }, (_, i) => ({ ...sample, id: String(i), published: true, fixture: false }));
    catalog[2].published = false; catalog[4].image = null; catalog[5].fixture = true;
    const home = { ...getHome(), featuredLimit: 1, featuredProductIds: catalog.map((p) => p.id), heroProductIds: ["1", "2", "missing"] };
    const resolved = resolveHomeProducts(home, catalog, false);
    // Test preview URLs are excluded in live mode too.
    expect(resolved.featured).toEqual([]);
    catalog.forEach((p) => { if (p.image) p.image = "/images/floral-mark.svg"; });
    const live = resolveHomeProducts(home, catalog, false);
    expect(live.featured.map((p) => p.id)).toEqual(["0", "1", "3", "6", "7", "8", "9"]);
    expect(live.hero?.map((p) => p?.id || null)).toEqual(["1", null, null]);
    expect(resolveHomeProducts({ ...home, heroProductIds: [] }, catalog, false).hero).toBeNull();
  });
  it("requires 3 Hero, allows 0–10 featured, and rejects duplicates or extra fields", () => {
    expect(selectionSchema("hero").safeParse({ editVersion: 1, productIds: ["a", "a", "c"] }).success).toBe(false);
    for (const productIds of [[], ["a"], ["a", "b", "c"], Array.from({ length: 10 }, (_, i) => String(i))])
      expect(selectionSchema("featured").safeParse({ editVersion: 1, productIds }).success).toBe(true);
    for (const productIds of [["a", "a"], Array.from({ length: 11 }, (_, i) => String(i))])
      expect(selectionSchema("featured").safeParse({ editVersion: 1, productIds }).success).toBe(false);
    expect(selectionSchema("hero").safeParse({ editVersion: 1, productIds: ["a"] }).success).toBe(false);
    expect(selectionSchema("hero").safeParse({ editVersion: 1, productIds: ["a", "b", "c"], title: "overwrite" }).success).toBe(false);
  });
  it("migration changes only CTA target and oversized legacy selections; keeps copy and order", () => {
    const input = { ...getHome(), primaryCta: { label: "Chọn một chút hoa (Admin)", href: "/san-pham" }, featuredProductIds: Array.from({ length: 12 }, (_, i) => String(i)), custom: "keep" };
    const patch = homeFeedbackMigration(input);
    expect(Object.keys(patch)).toEqual(["primaryCta", "featuredProductIds", "featuredLimit"]);
    const migrated = { ...input, ...patch };
    expect(migrated.custom).toBe("keep");
    expect(migrated.primaryCta).toEqual({ label: "Chọn một chút hoa (Admin)", href: "/#nhung-doa-hoa" });
    expect(migrated.featuredProductIds).toEqual(input.featuredProductIds.slice(0, 10));
    expect(homeFeedbackMigration(migrated)).toEqual({});
    expect(homeFeedbackMigration({ ...input, featuredProductIds: ["one"] })).not.toHaveProperty("featuredProductIds");
  });
  it("preserves other social platforms, hides empty links, validates HTTPS/email and keeps international +", () => {
    const site = { ...getSite(), social: [{ label: "Trang của shop", url: "https://www.facebook.com/hoe" }, { label: "YouTube", url: "https://youtube.com/hoe" }] };
    const data = contactEditorData(site);
    expect(data.social.Facebook.label).toBe("Trang của shop");
    data.social.Facebook.url = "";
    data.social.TikTok.url = "https://tiktok.com/@hoe";
    expect(mergeContactSocial(site.social, data.social)).toEqual([{ label: "YouTube", url: "https://youtube.com/hoe" }, { label: "TikTok", url: "https://tiktok.com/@hoe", platform: "TikTok" }]);
    const shortLinks = mergeContactSocial(site.social, { ...data.social, Facebook: { label: "Hòe gửi thương", url: "https://fb.me/hoe" } });
    expect(contactEditorData({ ...site, social: shortLinks }).social.Facebook).toEqual({ label: "Hòe gửi thương", url: "https://fb.me/hoe" });
    expect(contactEditSchema.safeParse({ ...data, editVersion: 1, contact: { ...data.contact, addressUrl: "javascript:alert(1)" } }).success).toBe(false);
    expect(contactEditSchema.safeParse({ ...data, editVersion: 1, contact: { ...data.contact, email: "broken" } }).success).toBe(false);
    expect(phoneHref("+84 (90) 123 4567")).toBe("tel:+84901234567");
    expect(phoneHref("   ")).toBeNull();
  });
  it("SSR keeps cards readable before hydration and avoids serializing the catalog", () => {
    const html = renderToStaticMarkup(createElement(FeaturedProductCarousel, { slides: [{ id: "one", card: createElement("a", { href: "/san-pham/one" }, "Hoa một") }] }));
    expect(html).toContain("Hoa một"); expect(html).toContain('href="/san-pham/one"');
    expect(html).toContain('data-carousel-ready="false"');
  });
  it("all private endpoints reject guests before touching the database", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", ""); vi.stubEnv("CLERK_SECRET_KEY", ""); vi.stubEnv("DATABASE_URL", "");
    const request = new Request("http://localhost/api/admin/home/hero");
    const context = { params: Promise.resolve({ kind: "hero" }) };
    for (const response of [await GET(request, context), await PATCH(request, context), await options(request), await contact(request)]) {
      expect(response.status).toBe(401); expect(response.headers.get("cache-control")).toBe("no-store");
    }
    vi.stubEnv("ADMIN_CLERK_USER_IDS", "allowed");
    expect(() => assertAdminId("denied")).toThrow(expect.objectContaining({ status: 403 }));
  });
});
