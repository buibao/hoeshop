import {
  inquirySchema,
  structuralInquirySchema,
  DomainError,
} from "@/domain/schemas";
import { PostgresRepository } from "@/server/repositories/postgres";
import type { WriteContext } from "@/server/repositories/contracts";
import { isTestContent, shopLive } from "@/server/content";
import { getRepositories } from "@/server/repositories";
import { hashSubmission, rateKey } from "@/server/integrations/signing";
import { parseBody, jsonResponse, errorResponse } from "@/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const input = await parseBody(request, structuralInquirySchema);
    const context: WriteContext = {
      requestId: input.requestId,
      payloadHash: hashSubmission(input),
      rateKey: rateKey(request),
    };
    const repo = getRepositories();
    if (repo instanceof PostgresRepository) {
      const receipt = await repo.submitInquiry(
        input,
        context,
        isTestContent() || shopLive(),
      );
      return jsonResponse(receipt, context.replayed ? 200 : 201);
    }
    const existing = await repo.existingInquiry(context);
    if (existing) return jsonResponse(existing);
    if (!isTestContent() && !shopLive())
      throw new DomainError(
        503,
        "SHOP_NOT_OPEN",
        "Hòe đang chuẩn bị mở nhận yêu cầu tư vấn.",
      );
    inquirySchema.parse(input);
    return jsonResponse(
      await repo.saveInquiry(
        { ...input, createdAt: new Date().toISOString(), status: "received" },
        context,
      ),
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
