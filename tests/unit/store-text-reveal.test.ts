import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StoreScope } from "@/components/StoreScope";
import { StoreTextReveal, StoreTextRevealGroup, StoreTextExemption } from "@/components/ui/StoreTextReveal";
import { StoreProse } from "@/components/StoreProse";

const render = (child: React.ReactNode) => renderToStaticMarkup(h(StoreScope, { className: "hoe-store-scope", children: child }));

describe("Store text progressive enhancement", () => {
  it("keeps the semantic heading, emphasis, Vietnamese text and a single static inline anchor", () => {
    const html = render(h(StoreTextReveal, { as: "h1", role: "page", id: "story" }, "Hòe: ", h("em", null, "đều đặn"), " và ", h("a", { href: "/lien-he" }, "dịu dàng")));
    expect(html).toContain('<h1 id="story"');
    expect(html).toContain("<em>đều đặn</em>");
    expect(html.match(/href="\/lien-he"/g)).toHaveLength(1);
    expect(html).toContain('data-text-link-copy');
    const heading = html.slice(html.indexOf("<h1"), html.indexOf("</h1>") + 5);
    for (const hidden of ['aria-hidden=', 'inert=', 'style="', '<div']) expect(heading).not.toContain(hidden);
  });
  it("exempt and outside-Store copy has no layers, scripts or observer targets", () => {
    const child = h(StoreTextReveal, { as: "h2", role: "heading", initial: true }, "Protected");
    expect(render(h(StoreTextExemption, null, child))).toContain("<h2>Protected</h2>");
    const outside = renderToStaticMarkup(child);
    expect(outside).toBe("<h2>Protected</h2>");
  });
  it("groups retain heading structure and leave controls and live updates outside motion", () => {
    const html = render(h(StoreTextRevealGroup, { className: "page-heading", initial: true }, h("span", { className: "eyebrow" }, "Hòe"), h("h1", null, "Những đóa hoa"), h("p", null, "Mô tả"), h("button", null, "Tiếp tục"), h("p", { role: "status" }, "Đã cập nhật")));
    expect(html).toContain('class="page-heading" data-text-group');
    expect(html).toContain('<button>Tiếp tục</button>');
    expect(html).toContain('<p role="status">Đã cập nhật</p>');
    expect(html.match(/data-store-text=/g)).toHaveLength(3);
    expect(html.match(/<script /g)).toHaveLength(3);
  });
  it("long Markdown observes paragraphs individually and preserves lists, links and selection text", () => {
    const html = render(h(StoreProse, { children: "## Chính sách mẫu kiểm thử\n\nĐoạn một với **chữ đậm**.\n\nĐoạn hai có [liên hệ](/lien-he).\n\n- Mục thứ nhất\n\n- Mục thứ hai" }));
    expect(html.match(/<p[^>]*data-store-text=/g)).toHaveLength(2);
    expect(html).toContain("<strong>chữ đậm</strong>");
    expect(html).toContain('<a href="/lien-he"><span data-text-link-copy');
    expect(html).toContain("<p>Mục thứ nhất</p>");
  });
});
