import { describe, it, expect, vi, afterEach } from "vitest";
import {
  cartItemSchema,
  configurationSchema,
  inquirySchema,
  orderSchema,
  vietnamToday,
} from "@/domain/schemas";
import { addCartItem, readCart, serializeCart } from "@/domain/cart";
import {
  effectivePrice,
  snapshotItems,
  summarize,
  totalLabel,
} from "@/domain/pricing";
import { getProducts, getArticles, isTestContent } from "@/server/file-content";
import { randomUUID } from "node:crypto";
afterEach(() => vi.unstubAllEnvs());
function products() {
  vi.stubEnv("CONTENT_MODE", "test");
  return getProducts();
}
function item(
  product = getProducts()[0],
  configuration: unknown = { serviceType: "hoa-tam", emotion: "Biết ơn" },
) {
  return cartItemSchema.parse({
    lineId: randomUUID(),
    productId: product.id,
    expectedRevision: product.revision,
    quantity: 1,
    configuration,
  });
}
describe("pricing and catalog", () => {
  it("calculates fixed + range without treating quote as zero", () => {
    const catalog = products(),
      tam = catalog.find((p) => p.serviceType === "hoa-tam")!,
      y = catalog.find((p) => p.serviceType === "hoa-y")!;
    const sum = summarize([
      { price: tam.price, quantity: 2 },
      { price: y.price, quantity: 1 },
      { price: { mode: "quote" }, quantity: 1 },
    ]);
    expect(sum).toEqual({
      min: 1700000,
      max: 1900000,
      quoteCount: 1,
      pricedCount: 2,
    });
    expect(totalLabel(sum).label).toBe("Tạm tính phần đã có giá");
    expect(
      totalLabel(summarize([{ price: { mode: "quote" }, quantity: 2 }])).value,
    ).toBe("Liên hệ báo giá");
  });
  it("moves design changes to quote but messages/budget keep base price", () => {
    const p = products().find((p) => p.serviceType === "hoa-y")!;
    const base = configurationSchema.parse({
      serviceType: "hoa-y",
      shape: "bo",
      budget: "300.000",
      message: "Thương bạn",
    });
    expect(effectivePrice(p, base).mode).toBe("range");
    expect(effectivePrice(p, { ...base, color: "Tím" }).mode).toBe("quote");
    expect(
      effectivePrice(p, configurationSchema.parse({ ...base, shape: "binh" }))
        .mode,
    ).toBe("quote");
  });
  it("checks published products, service and revision", () => {
    const catalog = products(),
      p = catalog.find((p) => p.serviceType === "hoa-tam")!,
      line = item(p);
    expect(snapshotItems([line], catalog)[0].name).toBe(p.name);
    expect(() =>
      snapshotItems([{ ...line, expectedRevision: "old" }], catalog),
    ).toThrow("thay đổi");
    expect(() =>
      snapshotItems([{ ...line, productId: "test-draft" }], catalog),
    ).toThrow("không còn");
    expect(() =>
      effectivePrice(
        p,
        configurationSchema.parse({ serviceType: "hoa-y", shape: "bo" }),
      ),
    ).toThrow("không khớp");
  });
  it("never exposes fixture/draft content in live catalog", () => {
    vi.stubEnv("CONTENT_MODE", "live");
    expect(getProducts()).toEqual([]);
    vi.stubEnv("CONTENT_MODE", "test");
    expect(getProducts().some((p) => !p.published)).toBe(false);
    expect(getArticles().some((p) => !p.published)).toBe(false);
    expect(getArticles("policies")).toEqual([]);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => isTestContent()).toThrow("forbidden");
  });
  it("defaults to fixtures only on Vercel Preview, never production", () => {
    vi.stubEnv("CONTENT_MODE", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isTestContent()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isTestContent()).toBe(false);
    expect(getProducts()).toEqual([]);
  });
});
describe("service validation", () => {
  it("refuses subscription fields, requires emotion and shape", () => {
    expect(
      configurationSchema.safeParse({
        serviceType: "hoa-thoi",
        planId: "weekly",
        months: 2,
      }).success,
    ).toBe(false);
    expect(
      configurationSchema.safeParse({ serviceType: "hoa-tam", emotion: " " })
        .success,
    ).toBe(false);
    expect(
      configurationSchema.safeParse({ serviceType: "hoa-y" }).success,
    ).toBe(false);
    expect(
      configurationSchema.safeParse({ serviceType: "hoa-thoi" }).success,
    ).toBe(true);
  });
  it("validates HTTPS reference URLs without fetching", () => {
    const base = { serviceType: "hoa-y", shape: "bo" };
    for (const referenceUrl of ["", "https://example.com/reference.jpg"])
      expect(
        configurationSchema.safeParse({ ...base, referenceUrl }).success,
      ).toBe(true);
    for (const referenceUrl of [
      "http://example.com",
      "javascript:alert(1)",
      "https://u:p@example.com",
      "https://example.com/" + "a".repeat(2000),
    ])
      expect(
        configurationSchema.safeParse({ ...base, referenceUrl }).success,
      ).toBe(false);
  });
  it("uses Vietnam calendar around midnight and rejects invalid/past days", () => {
    expect(vietnamToday(new Date("2026-10-04T18:00:00Z"))).toBe("2026-10-05");
    expect(
      configurationSchema.safeParse({
        serviceType: "hoa-thoi",
        desiredDate: "2000-01-01",
      }).success,
    ).toBe(false);
    expect(
      configurationSchema.safeParse({
        serviceType: "hoa-thoi",
        desiredDate: "2099-02-30",
      }).success,
    ).toBe(false);
    expect(
      configurationSchema.safeParse({
        serviceType: "hoa-thoi",
        desiredDate: "2099-01-01",
        desiredTime: "24:20",
      }).success,
    ).toBe(false);
  });
  it("keeps general consultation independent and validates no-sample Hoa Ý", () => {
    const common = {
      requestId: randomUUID(),
      name: "Khách test",
      phone: "0901234567",
      body: "Tư vấn giúp tôi",
    };
    expect(
      inquirySchema.safeParse({ ...common, serviceType: "hoa-y" }).success,
    ).toBe(true);
    expect(
      inquirySchema.safeParse({
        ...common,
        kind: "service",
        serviceType: "hoa-y",
        configuration: { serviceType: "hoa-y", shape: "bo" },
      }).success,
    ).toBe(false);
    expect(
      inquirySchema.safeParse({
        ...common,
        kind: "service",
        serviceType: "hoa-y",
        configuration: {
          serviceType: "hoa-y",
          shape: "bo",
          requirements: "Một bó hoa tím",
        },
      }).success,
    ).toBe(true);
  });
});
describe("cart", () => {
  it("separates configurations and merges exact matches", () => {
    const p = products().find((p) => p.serviceType === "hoa-tam")!,
      a = item(p),
      b = item(p, { serviceType: "hoa-tam", emotion: "Yêu thương" });
    const mixed = addCartItem(addCartItem([], a), b);
    expect(mixed).toHaveLength(2);
    const merged = addCartItem(mixed, {
      ...a,
      lineId: randomUUID(),
      quantity: 2,
    });
    expect(merged[0].quantity).toBe(3);
    expect(() => addCartItem([{ ...a, quantity: 99 }], a)).toThrow();
  });
  it("persists configurations without buyer info and survives expired dates", () => {
    const p = products().find((p) => p.serviceType === "hoa-tam")!,
      a = item(p);
    const stored = {
      ...a,
      configuration: { ...a.configuration, desiredDate: "2000-01-01" },
    };
    const restored = readCart(serializeCart([stored]));
    expect(restored).toHaveLength(1);
    expect(restored[0].configuration.desiredDate).toBe("2000-01-01");
    expect(cartItemSchema.safeParse(restored[0]).success).toBe(false);
    expect(serializeCart([a])).not.toContain("buyer");
    expect(readCart("{broken")).toEqual([]);
    expect(readCart(JSON.stringify({ version: 99, items: [a] }))).toEqual([]);
  });
  it("server schema rejects client pricing and order status", () => {
    const p = products().find((p) => p.serviceType === "hoa-tam")!;
    const base = {
      requestId: randomUUID(),
      buyer: { name: "Test", phone: "0901234567" },
      recipient: { name: "Test" },
      address: "Địa chỉ test",
      items: [item(p)],
    };
    expect(orderSchema.safeParse(base).success).toBe(true);
    expect(
      orderSchema.safeParse({ ...base, status: "confirmed" }).success,
    ).toBe(false);
    expect(
      orderSchema.safeParse({ ...base, items: [{ ...item(p), price: 1 }] })
        .success,
    ).toBe(false);
  });
});
