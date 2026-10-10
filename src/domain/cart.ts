import {
  cartItemSchema,
  storedCartItemSchema,
  type CartItem,
  type Configuration,
  type Product,
} from "./schemas";
export function canonical(value: unknown): string {
  // Only schedule arrays are unordered. Cart lines and content order remain significant.
  if (value && typeof value === "object" && "version" in value && "period" in value) {
    const schedule = value as Record<string, unknown>;
    value = { ...schedule,
      ...(Array.isArray(schedule.deliveryDates) ? { deliveryDates: [...schedule.deliveryDates].sort() } : {}),
      ...(Array.isArray(schedule.weekdays) ? { weekdays: [...schedule.weekdays].sort((a, b) => Number(a) - Number(b)) } : {}),
      ...(Array.isArray(schedule.weeks) ? { weeks: [...schedule.weeks].sort((a, b) => a.weekIndex - b.weekIndex).map((w) => ({ ...w, weekdays: [...w.weekdays].sort((a: number, b: number) => a - b) })) } : {}),
    };
  }
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export function cartKey(
  item: Pick<CartItem, "productId" | "configuration" | "expectedRevision">,
) {
  return canonical([item.productId, item.expectedRevision, item.configuration]);
}
export function addCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const parsed = cartItemSchema.parse(item);
  const match = items.find((i) => cartKey(i) === cartKey(parsed));
  if (!match) {
    if (items.length >= 30)
      throw new Error("Giỏ đã có 30 dòng. Vui lòng gửi yêu cầu riêng.");
    return [...items, parsed];
  }
  const merged = cartItemSchema.parse({
    ...match,
    quantity: match.quantity + parsed.quantity,
  });
  return items.map((i) => (i.lineId === match.lineId ? merged : i));
}
export function readCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const saved = JSON.parse(raw);
    // Expired delivery dates stay visible and are corrected before submission.
    if (
      saved.version !== 1 ||
      !Array.isArray(saved.items) ||
      saved.items.length > 30
    )
      return [];
    return saved.items
      .map((i: unknown) => storedCartItemSchema.safeParse(i))
      .filter(
        (r: ReturnType<typeof storedCartItemSchema.safeParse>) => r.success,
      )
      .map((r: ReturnType<typeof storedCartItemSchema.safeParse>) => r.data!);
  } catch {
    return [];
  }
}
export function serializeCart(items: CartItem[]) {
  return JSON.stringify({
    version: 1,
    items: items.map((i) => storedCartItemSchema.parse(i)),
  });
}
export function reconcileSubmitted(current: CartItem[], submitted: CartItem[]) {
  return current.flatMap((item) => {
    const sent = submitted.find(
      (s) => s.lineId === item.lineId && cartKey(s) === cartKey(item),
    );
    if (!sent) return [item];
    const quantity = item.quantity - sent.quantity;
    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
}
export function defaultConfiguration(
  product: Pick<Product, "serviceType" | "defaultDesign">,
): Record<string, string> {
  return { serviceType: product.serviceType, ...product.defaultDesign };
}
export function initialConfiguration(
  serviceType: Configuration["serviceType"],
): Record<string, string> {
  return { serviceType, ...(serviceType === "hoa-y" ? { shape: "bo" } : {}) };
}
