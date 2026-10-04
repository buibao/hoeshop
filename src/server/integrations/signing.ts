import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { canonical } from "@/domain/cart";
export const hashPayload = (payload: unknown) => createHash("sha256").update(canonical(payload)).digest("hex");
export function signEnvelope(payload: unknown, secret: string, now = Date.now()) {
  const timestamp = Math.floor(now / 1000);
  const payloadText = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update("v1." + timestamp + "." + payloadText).digest("hex");
  return { version: 1, timestamp, payload: payloadText, signature };
}
export function verifyEnvelope(envelope: ReturnType<typeof signEnvelope>, secret: string, now = Date.now()) {
  if (envelope.version !== 1 || !Number.isInteger(envelope.timestamp) || Math.abs(Math.floor(now / 1000) - envelope.timestamp) > 300 || !/^[a-f0-9]{64}$/.test(envelope.signature)) return false;
  const expected = createHmac("sha256", secret).update("v1." + envelope.timestamp + "." + envelope.payload).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(envelope.signature, "hex"));
}
export function rateKey(request: Request) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret && process.env.DATA_ADAPTER !== "mock") throw new Error("Rate limit secret is missing.");
  // On Vercel use its overwritten, trusted IP header. Ignore arbitrary client forwarding headers.
  const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown" : "local";
  return createHmac("sha256", secret || "local-test-only").update(ip).digest("hex");
}
