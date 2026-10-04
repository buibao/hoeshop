import { z } from "zod";
import { commentSchema, DomainError } from "@/domain/schemas";
import { getArticles } from "@/server/content";
import { getRepositories } from "@/server/repositories";
import { hashPayload, rateKey } from "@/server/integrations/signing";
import { parseBody, jsonResponse, errorResponse } from "@/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function requirePost(postId: string) {
  if (!getArticles().some((p) => p.id === postId)) throw new DomainError(422, "UNKNOWN_POST", "Bài viết không khả dụng.");
}
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const postId = z.string().min(1).max(100).parse(query.get("postId"));
    const cursor = query.get("cursor"); if (cursor) z.uuid().parse(cursor);
    requirePost(postId);
    return jsonResponse(await getRepositories().listComments(postId, cursor));
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const input = await parseBody(request, commentSchema);
    requirePost(input.postId);
    return jsonResponse(await getRepositories().saveComment(input, { requestId: input.requestId, payloadHash: hashPayload(input), rateKey: rateKey(request) }), 201);
  } catch (error) { return errorResponse(error); }
}
