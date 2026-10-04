import { createHash } from "node:crypto";
import { canonical } from "@/domain/cart";
import { productSchema, vietnamToday, type Product } from "@/domain/schemas";
import type { products, posts } from "./schema";
export function pricingRevision(
  product: Pick<
    Product,
    "serviceType" | "price" | "defaultDesign" | "pricedOptions"
  >,
) {
  return createHash("sha256")
    .update(
      canonical({
        serviceType: product.serviceType,
        price: product.price,
        defaultDesign: product.defaultDesign,
        pricedOptions: product.pricedOptions,
      }),
    )
    .digest("hex");
}
export function productRecord(row: typeof products.$inferSelect): Product {
  const price =
    row.priceMode === "quote"
      ? { mode: "quote" }
      : row.priceMode === "fixed"
        ? { mode: "fixed", amount: row.amount, unit: row.unit }
        : { mode: "range", min: row.min, max: row.max, unit: row.unit };
  return {
    ...productSchema.parse({
      id: row.id,
      slug: row.slug,
      name: row.name,
      serviceType: row.serviceType,
      description: row.description,
      image: row.image,
      imageAlt: row.imageAlt,
      published: row.publicationStatus === "published",
      fixture: !!row.fixture,
      price,
      defaultDesign: row.defaultDesign,
      pricedOptions: row.pricedOptions,
    }),
    revision: row.pricingRevision,
  };
}
export function articleRecord(row: typeof posts.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.bodyMarkdown,
    category: row.category,
    published: row.publicationStatus === "published",
    fixture: !!row.fixture,
    date: vietnamToday(row.publishedAt || row.createdAt),
    image: row.image,
  };
}
