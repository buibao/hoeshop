import { inquirySchema, DomainError } from "@/domain/schemas";
import { isTestContent, shopLive } from "@/server/content";
import { getRepositories } from "@/server/repositories";
import { hashPayload, rateKey } from "@/server/integrations/signing";
import { parseBody, jsonResponse, errorResponse } from "@/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const input = await parseBody(request, inquirySchema);
    if (!isTestContent() && !shopLive()) throw new DomainError(503, "SHOP_NOT_OPEN", "Hòe đang chuẩn bị mở nhận yêu cầu tư vấn.");
    const context = { requestId: input.requestId, payloadHash: hashPayload(input), rateKey: rateKey(request) };
    const repo = getRepositories();
    const existing = await repo.existingInquiry(context);
    if (existing) return jsonResponse(existing);
    return jsonResponse(await repo.saveInquiry({ ...input, createdAt: new Date().toISOString(), status: "received" }, context), 201);
  } catch (error) { return errorResponse(error); }
}
