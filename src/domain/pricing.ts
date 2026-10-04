import type { CartItem, Configuration, Price, Product } from "./schemas";
import { DomainError } from "./schemas";
export const money = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
export function priceLabel(price: Price) {
  if (price.mode === "quote") return "Liên hệ báo giá";
  return (price.mode === "fixed" ? money(price.amount) : `${money(price.min)} – ${money(price.max)}`) + " / " + price.unit;
}
const designKeys = ["color", "style", "shape", "flowerType", "size", "dislikedFlowers", "requirements", "referenceUrl"];
export function effectivePrice(product: Product, configuration: Configuration): Price {
  if (product.serviceType !== configuration.serviceType) throw new DomainError(422, "INVALID_SERVICE", "Dịch vụ không khớp mẫu hoa.");
  if (product.serviceType === "hoa-thoi" || product.price.mode === "quote") return { mode: "quote" };
  const fields = configuration as unknown as Record<string, string>;
  for (const key of designKeys) {
    const value = fields[key]?.trim();
    if (value && value !== product.defaultDesign[key] && !product.pricedOptions[key]?.includes(value)) return { mode: "quote" };
  }
  return product.price;
}
export function summarize(lines: { price: Price; quantity: number }[]) {
  let min = 0, max = 0, quoteCount = 0;
  for (const { price, quantity } of lines) {
    if (price.mode === "quote") { quoteCount++; continue; }
    min += (price.mode === "fixed" ? price.amount : price.min) * quantity;
    max += (price.mode === "fixed" ? price.amount : price.max) * quantity;
  }
  return { min, max, quoteCount, pricedCount: lines.length - quoteCount };
}
export function totalLabel(total: ReturnType<typeof summarize>) {
  if (!total.pricedCount) return { label: "Cần shop báo giá", value: "Liên hệ báo giá" };
  return { label: total.quoteCount ? "Tạm tính phần đã có giá" : total.min === total.max ? "Tạm tính" : "Khoảng tạm tính", value: total.min === total.max ? money(total.min) : `${money(total.min)} – ${money(total.max)}` };
}
export function snapshotItems(items: CartItem[], catalog: Product[]) {
  return items.map((item) => {
    const product = catalog.find((p) => p.id === item.productId && p.published);
    if (!product) throw new DomainError(422, "UNAVAILABLE_PRODUCT", "Một mẫu hoa không còn khả dụng. Hãy kiểm tra lại giỏ.");
    if (item.expectedRevision !== product.revision) throw new DomainError(409, "CATALOG_CHANGED", "Mẫu hoa hoặc giá đã thay đổi. Hãy xem lại giỏ trước khi gửi.", { productId: product.id });
    return { productId: product.id, name: product.name, revision: product.revision, quantity: item.quantity, configuration: item.configuration, price: effectivePrice(product, item.configuration) };
  });
}
