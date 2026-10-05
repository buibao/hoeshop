import { describe, expect, it } from "vitest";
import { adminProductSchema } from "@/server/admin/schemas";
import { productEditorData, issueMap } from "@/features/admin/form-model";
import { effectivePrice, summarize, totalLabel } from "@/domain/pricing";
import { defaultConfiguration } from "@/domain/cart";
import { structuralConfigurationSchema } from "@/domain/schemas";
import { valueLabel } from "@/domain/labels";
const base = {
  id: "new-hoa-y",
  slug: "new-hoa-y",
  name: "Mẫu mới",
  description: "Hoa test",
  serviceType: "hoa-y",
  image: null,
  imageAlt: "",
  published: false,
  price: { mode: "fixed", amount: 500000, unit: "mẫu" },
  defaultDesign: {},
  pricedOptions: {},
};
describe("phase 3 pricing and admin consistency", () => {
  it("legacy Hoa Ý is never silently assigned a priced shape; draft works, publish requires a default", () => {
    const initial = productEditorData({
      ...base,
      priceMode: "fixed",
      amount: 500000,
      unit: "mẫu",
      publicationStatus: "draft",
    });
    expect((initial.product as typeof base).defaultDesign).not.toHaveProperty(
      "shape",
    );
    expect(adminProductSchema.safeParse(initial).success).toBe(true);
    const result = adminProductSchema.safeParse({
      ...initial,
      publicationStatus: "published",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].path.join(".")).toBe(
        "product.defaultDesign.shape",
      );
  });
  it.each(["fixed", "range", "quote"])(
    "default and explicitly priced shapes retain %s price; others quote",
    (mode) => {
      const price =
        mode === "range"
          ? { mode, min: 300000, max: 500000, unit: "mẫu" }
          : mode === "fixed"
            ? base.price
            : { mode };
      const parsed = adminProductSchema.parse({
        product: {
          ...base,
          price,
          defaultDesign: { shape: "binh" },
          pricedOptions: { shape: ["hop"] },
        },
        publicationStatus: "published",
      });
      const product = { ...parsed.product, revision: "r" },
        configuration = structuralConfigurationSchema.parse(
          defaultConfiguration(product),
        );
      expect(configuration.serviceType).toBe("hoa-y");
      expect(effectivePrice(product, configuration)).toEqual(price);
      if (configuration.serviceType === "hoa-y") {
        expect(
          effectivePrice(product, { ...configuration, shape: "hop" }),
        ).toEqual(price);
        expect(
          effectivePrice(product, { ...configuration, shape: "bo" }),
        ).toEqual({ mode: "quote" });
      }
    },
  );
  it("rejects invalid default and priced shapes with field paths", () => {
    const parsed = adminProductSchema.safeParse({
      product: {
        ...base,
        defaultDesign: { shape: "basket" },
        pricedOptions: { shape: ["unknown"] },
      },
      publicationStatus: "draft",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = issueMap(
        parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      );
      expect(Object.keys(errors)).toEqual([
        "product.defaultDesign.shape",
        "product.pricedOptions.shape",
      ]);
    }
  });
  it("quote-only never says zero, mixed only sums priced items", () => {
    const quote = totalLabel(
      summarize([{ price: { mode: "quote" }, quantity: 2 }]),
    );
    expect(quote).toEqual({
      label: "Cần shop báo giá",
      value: "Liên hệ báo giá",
    });
    const mixed = totalLabel(
      summarize([
        { price: { mode: "fixed", amount: 500000, unit: "mẫu" }, quantity: 2 },
        { price: { mode: "quote" }, quantity: 1 },
      ]),
    );
    expect(mixed.label).toBe("Tạm tính phần đã có giá");
    expect(mixed.value).toContain("1.000.000");
    expect(
      totalLabel(
        summarize([
          {
            price: { mode: "range", min: 300000, max: 500000, unit: "mẫu" },
            quantity: 1,
          },
        ]),
      ).label,
    ).toBe("Khoảng tạm tính");
    expect(
      totalLabel(
        summarize([
          {
            price: { mode: "fixed", amount: 500000, unit: "mẫu" },
            quantity: 1,
          },
        ]),
      ).label,
    ).toBe("Tạm tính");
  });
  it("preserves nested field paths and first error; Vietnamese labels share stable values", () => {
    expect(
      issueMap([{ path: "product.price", message: "Khoảng giá không hợp lệ" }]),
    ).toEqual({ "product.price.max": "Khoảng giá không hợp lệ" });
    expect(
      issueMap([
        { path: "product.price.min", message: "A" },
        { path: "product.price.min", message: "B" },
        { path: "faq.0.answer", message: "C" },
      ]),
    ).toEqual({ "product.price.min": "A", "faq.0.answer": "C" });
    expect(
      ["received", "published", "resolved", "binh"].map(valueLabel),
    ).toEqual(["Mới nhận", "Công khai", "Đã giải quyết", "Bình"]);
  });
});
