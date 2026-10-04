import * as z from "zod";
import { commentSchema, DomainError } from "@/domain/schemas";
import { getArticles } from "@/server/content";
import { getRepositories } from "@/server/repositories";
import { hashSubmission, rateKey } from "@/server/integrations/signing";
import { PostgresRepository } from "@/server/repositories/postgres";
import { parseBody, jsonResponse, errorResponse } from "@/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function requirePost(postId: string) {
  if (!(await getArticles()).some((p) => p.id === postId))
    throw new DomainError(422, "UNKNOWN_POST", "Bài viết không khả dụng.");
}
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const postId = z.string().min(1).max(100).parse(query.get("postId"));
    const cursor = query.get("cursor");
    if (cursor) z.string().max(200).parse(cursor);
    const repo = getRepositories();
    if (!(repo instanceof PostgresRepository)) await requirePost(postId);
    return jsonResponse(await repo.listComments(postId, cursor));
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    const input = await parseBody(request, commentSchema);
    const repo = getRepositories();
    if (!(repo instanceof PostgresRepository)) await requirePost(input.postId);
    return jsonResponse(
      await repo.saveComment(input, {
        requestId: input.requestId,
        payloadHash: hashSubmission(input),
        rateKey: rateKey(request),
      }),
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
