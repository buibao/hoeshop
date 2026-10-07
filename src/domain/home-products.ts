import * as z from "zod";
import { imageSource, type HomeContent } from "./content";
import type { Product } from "./schemas";

export const selectionKinds = ["hero", "featured"] as const;
export type SelectionKind = (typeof selectionKinds)[number];
export const selectionCount = { hero: 3, featured: 10 } as const;
export const selectionField = { hero: "heroProductIds", featured: "featuredProductIds" } as const;
export function selectionSchema(kind: SelectionKind) {
  const ids = z.array(z.string().trim().min(1).max(100));
  return z.object({
    editVersion: z.number().int().positive(),
    productIds: (kind === "hero" ? ids.length(3, "Chọn đủ 3 sản phẩm.") : ids.max(10, "Chọn tối đa 10 sản phẩm."))
      .refine((ids) => new Set(ids).size === ids.length, "Không chọn sản phẩm trùng nhau."),
  }).strict();
}

export function homeProductEligible(product: Product, test: boolean) {
  return product.published && (test || !product.fixture) &&
    !!product.image && imageSource.safeParse(product.image).success &&
    (test || !product.image.startsWith("/images/preview/"));
}

// Keep configured order and vacant Hero slots; never substitute another product.
export function resolveHomeProducts(home: HomeContent, catalog: Product[], test: boolean) {
  const eligible = catalog.filter((p) => homeProductEligible(p, test));
  const byId = new Map(eligible.map((p) => [p.id, p]));
  const featured = home.featuredProductIds.length
    ? [...new Set(home.featuredProductIds.slice(0, 10))].flatMap((id) => byId.get(id) || [])
    : eligible.slice(0, Math.min(home.featuredLimit, 10));
  const hero = home.heroProductIds.length
    ? Array.from({ length: 3 }, (_, i) => byId.get(home.heroProductIds[i]) || null)
    : null;
  return { featured, hero };
}
