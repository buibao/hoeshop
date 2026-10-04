import { canonical } from "@/domain/cart";
const KEY = "hoe.pending.v1";
export const PENDING_TTL = 7 * 24 * 60 * 60 * 1000;
export interface Pending {
  operation: string;
  requestId: string;
  fingerprint: string;
  createdAt: number;
}
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export async function fingerprint(payload: unknown) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical(payload)),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
function read(storage: StoragePort, now: number): Pending[] {
  try {
    const rows: unknown = JSON.parse(storage.getItem(KEY) || "[]");
    if (!Array.isArray(rows)) return [];
    return rows
      .filter(
        (p): p is Pending =>
          p &&
          typeof p.operation === "string" &&
          typeof p.requestId === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            p.requestId,
          ) &&
          /^[a-f0-9]{64}$/.test(p.fingerprint) &&
          typeof p.createdAt === "number" &&
          p.createdAt <= now &&
          now - p.createdAt < PENDING_TTL,
      )
      .slice(-30);
  } catch {
    return [];
  }
}
export function pendingFor(
  storage: StoragePort,
  operation: string,
  hash: string,
  now = Date.now(),
): Pending {
  const rows = read(storage, now);
  const found = rows.find(
    (p) => p.operation === operation && p.fingerprint === hash,
  );
  if (found) return found;
  const pending = {
    operation,
    fingerprint: hash,
    requestId: crypto.randomUUID(),
    createdAt: now,
  };
  storage.setItem(KEY, JSON.stringify([...rows, pending].slice(-30)));
  return pending;
}
export function completePending(
  storage: StoragePort,
  operation: string,
  requestId: string,
) {
  storage.setItem(
    KEY,
    JSON.stringify(
      read(storage, Date.now()).filter(
        (p) => p.operation !== operation || p.requestId !== requestId,
      ),
    ),
  );
}
