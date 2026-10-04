import { orderSchema, structuralOrderSchema } from "@/domain/schemas";
import { PostgresRepository } from "@/server/repositories/postgres";
import type { WriteContext } from "@/server/repositories/contracts";
import { snapshotItems, summarize } from "@/domain/pricing";
import { getProducts, shopLive, isTestContent } from "@/server/content";
import { getRepositories } from "@/server/repositories";
import { hashSubmission, rateKey } from "@/server/integrations/signing";
import { DomainError } from "@/domain/schemas";
import { parseBody, jsonResponse, errorResponse } from "@/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const input = await parseBody(request, structuralOrderSchema);
    const context: WriteContext = {
      requestId: input.requestId,
      payloadHash: hashSubmission(input),
      rateKey: rateKey(request),
    };
    const repo = getRepositories();
    if (repo instanceof PostgresRepository) {
      const receipt = await repo.submitOrder(
        input,
        context,
        isTestContent() || shopLive(),
      );
      return jsonResponse(receipt, context.replayed ? 200 : 201);
    }
    // Check the original request hash before recomputing prices: a saved retry must keep its snapshot.
    const existing = await repo.existingOrder(context);
    if (existing) return jsonResponse(existing);
    if (!isTestContent() && !shopLive())
      throw new DomainError(
        503,
        "SHOP_NOT_OPEN",
        "Hòe đang chuẩn bị mở nhận yêu cầu đặt hoa.",
      );
    orderSchema.parse(input);
    const items = snapshotItems(input.items, await getProducts());
    const record = {
      requestId: input.requestId,
      createdAt: new Date().toISOString(),
      status: "received" as const,
      buyer: input.buyer,
      recipient: {
        ...input.recipient,
        phone: input.recipient.phone || input.buyer.phone,
      },
      address: input.address,
      notes: input.notes,
      items,
      totals: summarize(items),
      shipping: "pending" as const,
    };
    if (JSON.stringify(record).length > 45000)
      throw new DomainError(
        422,
        "SNAPSHOT_TOO_LARGE",
        "Yêu cầu quá dài. Vui lòng chia thành các yêu cầu nhỏ hơn.",
      );
    return jsonResponse(await repo.saveOrder(record, context), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
