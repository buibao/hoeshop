import { orderSchema } from "@/domain/schemas";
import { snapshotItems, summarize } from "@/domain/pricing";
import { getProducts, shopLive, isTestContent } from "@/server/content";
import { getRepositories } from "@/server/repositories";
import { hashPayload, rateKey } from "@/server/integrations/signing";
import { DomainError } from "@/domain/schemas";
import { parseBody, jsonResponse, errorResponse } from "@/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const input = await parseBody(request, orderSchema);
    if (!isTestContent() && !shopLive()) throw new DomainError(503, "SHOP_NOT_OPEN", "Hòe đang chuẩn bị mở nhận yêu cầu đặt hoa.");
    const context = { requestId: input.requestId, payloadHash: hashPayload(input), rateKey: rateKey(request) };
    const repo = getRepositories();
    // Check the original request hash before recomputing prices: a saved retry must keep its snapshot.
    const existing = await repo.existingOrder(context);
    if (existing) return jsonResponse(existing);
    const items = snapshotItems(input.items, getProducts());
    const record = { requestId: input.requestId, createdAt: new Date().toISOString(), status: "received" as const,
      buyer: input.buyer, recipient: { ...input.recipient, phone: input.recipient.phone || input.buyer.phone },
      address: input.address, notes: input.notes, items, totals: summarize(items), shipping: "pending" as const };
    if (JSON.stringify(record).length > 45000) throw new DomainError(422, "SNAPSHOT_TOO_LARGE", "Yêu cầu quá dài. Vui lòng chia thành các yêu cầu nhỏ hơn.");
    return jsonResponse(await repo.saveOrder(record, context), 201);
  } catch (error) { return errorResponse(error); }
}
