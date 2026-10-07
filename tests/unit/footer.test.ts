import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getSite } from "@/server/file-content";
import { footerSocialLinks, socialPlatform } from "@/domain/contact";
import { Footer } from "@/components/Footer";

const content = vi.hoisted(() => ({ site: {} as ReturnType<typeof getSite>, policies: [] as { id: string; slug: string; title: string }[], articles: [] as object[] }));
vi.mock("@/server/content", () => ({ getSite: async () => content.site, getArticles: async (type?: string) => type === "policies" ? content.policies : content.articles }));
beforeEach(() => {
  content.site = getSite();
  content.policies = [];
  content.articles = [];
});
describe("Footer data and SSR", () => {
  it("orders brand platforms, keeps unknown links, filters unsafe URLs and uses reliable identity", () => {
    const links = footerSocialLinks([
      { label: "Other", url: "https://example.com/facebook" },
      { label: "Ảnh của Hòe", url: "https://www.instagram.com/hoe" },
      { label: "Hòe gửi thương", url: "https://fb.me/hoe", platform: "Facebook" },
      { label: "", url: "https://www.tiktok.com/@hoe" },
      ...["", "javascript:alert(1)", "http://facebook.com/hoe", "https://user:secret@example.com", "broken"].map((url) => ({ label: "Facebook", url })),
    ]);
    expect(links.map((s) => s.platform)).toEqual(["Facebook", "TikTok", "Instagram", undefined]);
    expect(links.map((s) => s.label)).toEqual(["Hòe gửi thương", "TikTok", "Ảnh của Hòe", "Other"]);
    expect(socialPlatform({ label: "Shop", url: "https://facebook.com.evil.example" })).toBeUndefined();
  });
  it("renders separate contact/social groups and all policies in the bottom row", async () => {
    content.site.contact = { phone: "+84 (90) 123 4567", email: "shop@example.com", address: "Địa chỉ dài ".repeat(10), hours: "9:00–18:00", addressUrl: "https://maps.google.com/?q=hoe" };
    content.site.social = [{ label: "Facebook Hòe", url: "https://fb.me/hoe", platform: "Facebook" }, { label: "TikTok", url: "https://tiktok.com/@hoe" }, { label: "Instagram", url: "https://instagram.com/hoe" }, { label: "YouTube", url: "https://youtube.com/hoe" }];
    content.policies = Array.from({ length: 5 }, (_, i) => ({ id: String(i), slug: `policy-${i}`, title: `Policy ${i}` }));
    content.articles = [{}];
    const html = renderToStaticMarkup(await Footer());
    expect(html).toContain('data-footer-groups="4"');
    expect(html).toContain('href="tel:+84901234567"');
    expect(html).toContain('href="mailto:shop@example.com"');
    expect(html).toContain('href="https://maps.google.com/?q=hoe"');
    for (const platform of ["Facebook", "TikTok", "Instagram"]) expect(html).toContain(`data-platform="${platform}"`);
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(3);
    const social = html.split('class="footer-social"')[1].split('class="footer-bottom"')[0];
    expect(social).toContain("YouTube"); expect(social).not.toContain("Policy"); expect(social).not.toContain("shop@example.com");
    const bottom = html.split('class="footer-bottom"')[1];
    for (const policy of content.policies) expect(bottom).toContain(`/chinh-sach/${policy.slug}`);
    expect(bottom).not.toContain("TikTok"); expect(html).toContain('href="/blog"');
  });
  it("omits empty groups/fields/blog and renders safe links without JavaScript", async () => {
    content.site.contact = { phone: " ", email: null, address: " ", hours: null, addressUrl: null };
    content.site.social = [{ label: "Facebook", url: "" }, { label: "TikTok", url: "javascript:alert(1)" }];
    const html = renderToStaticMarkup(await Footer());
    expect(html).toContain('data-footer-groups="2"');
    for (const absent of ["Ghé Hòe", "Kết nối với Hòe", 'href="/blog"', 'aria-label="Chính sách"', "javascript:", "null"])
      expect(html).not.toContain(absent);
    expect(html).toContain(content.site.tagline);
    content.site.contact.addressUrl = "https://maps.google.com/?q=hoe";
    const mapOnly = renderToStaticMarkup(await Footer());
    expect(mapOnly).toContain("Xem đường đi"); expect(mapOnly).toContain('data-footer-groups="3"');
  });
});
