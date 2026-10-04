"use client";
import { useSyncExternalStore } from "react";
import type { CartItem } from "@/domain/schemas";
import { cartItemSchema } from "@/domain/schemas";
import { addCartItem, readCart, serializeCart } from "@/domain/cart";
const STORAGE_KEY = "hoe.cart.v1";
const initial = { items: [] as CartItem[], ready: false, notice: "" };
let snapshot = initial;
let initialized = false;
const listeners = new Set<() => void>();
function publish(items: CartItem[]) {
  let notice = "";
  try { window.localStorage.setItem(STORAGE_KEY, serializeCart(items)); }
  catch { notice = "Trình duyệt không cho lưu giỏ. Giỏ vẫn dùng được trong phiên này."; }
  snapshot = { items, ready: true, notice }; listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  if (!initialized) {
    initialized = true;
    let notice = "", items: CartItem[] = [];
    try { items = readCart(window.localStorage.getItem(STORAGE_KEY)); }
    catch { notice = "Trình duyệt không cho đọc giỏ đã lưu."; }
    snapshot = { items, ready: true, notice };
    queueMicrotask(() => listeners.forEach((cb) => cb()));
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) { snapshot = { items: readCart(e.newValue), ready: true, notice: "" }; listeners.forEach((cb) => cb()); }
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}
export function useCart() {
  const data = useSyncExternalStore(subscribe, () => snapshot, () => initial);
  return {
    ...data,
    add: (item: CartItem) => publish(addCartItem(snapshot.items, item)),
    update: (lineId: string, next: CartItem) => publish(snapshot.items.map((i) => i.lineId === lineId ? cartItemSchema.parse(next) : i)),
    remove: (lineId: string) => publish(snapshot.items.filter((i) => i.lineId !== lineId)),
    clear: () => publish([]),
  };
}
