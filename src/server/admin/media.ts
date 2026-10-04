import { createHash } from "node:crypto";
import { del, head } from "@vercel/blob";
import sharp from "sharp";
import { eq, sql } from "drizzle-orm";
import { getDb, assertDbEnvironment } from "@/server/db";
import * as s from "@/server/db/schema";
import { DomainError } from "@/domain/schemas";
export const MEDIA_LIMIT = 5 * 1024 * 1024;
export const MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
export const mediaPrefix = (actor: string) =>
  `hoe/${createHash("sha256").update(actor).digest("hex").slice(0, 24)}/`;
export async function verifyImage(bytes: Buffer, claimedMime: string) {
  if (!bytes.length || bytes.length > MEDIA_LIMIT)
    throw new DomainError(
      422,
      "MEDIA_SIZE",
      "Ảnh cần nhỏ hơn hoặc bằng 5 MiB.",
    );
  let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    metadata = await sharp(bytes, {
      limitInputPixels: 40_000_000,
      animated: false,
    }).metadata();
  } catch {
    throw new DomainError(
      422,
      "MEDIA_INVALID",
      "Ảnh không đọc được hoặc vượt giới hạn xử lý. Chọn ảnh khác nhé.",
    );
  }
  const formats: Record<string, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    heif: "image/avif",
  };
  const mime = formats[metadata.format || ""];
  if (
    !mime ||
    mime !== claimedMime ||
    !MEDIA_TYPES.includes(mime) ||
    !metadata.width ||
    !metadata.height ||
    (metadata.pages || 1) > 1 ||
    (metadata.format === "heif" && metadata.compression !== "av1")
  )
    throw new DomainError(
      422,
      "MEDIA_TYPE",
      "Ảnh phải là JPEG, PNG, WebP hoặc AVIF hợp lệ.",
    );
  // Decode pixels as well as headers: truncated or corrupt files cannot enter the library.
  try {
    await sharp(bytes, { limitInputPixels: 40_000_000 })
      .resize(1, 1)
      .raw()
      .toBuffer();
  } catch {
    throw new DomainError(
      422,
      "MEDIA_INVALID",
      "Tệp ảnh bị lỗi. Chọn ảnh khác nhé.",
    );
  }
  return {
    mime,
    bytes: bytes.length,
    width: metadata.width,
    height: metadata.height,
  };
}
export async function finishMedia(url: string, alt: string, actor: string) {
  await assertDbEnvironment();
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(parsed.hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !decodeURIComponent(parsed.pathname).slice(1).startsWith(mediaPrefix(actor))
  )
    throw new DomainError(
      422,
      "MEDIA_URL",
      "Ảnh không thuộc phiên tải lên của bạn.",
    );
  // Resolve the pathname in our token's store, then require its canonical URL.
  const info = await head(decodeURIComponent(parsed.pathname).slice(1));
  if (
    info.url !== url ||
    !info.pathname.startsWith(mediaPrefix(actor)) ||
    info.size > MEDIA_LIMIT ||
    !MEDIA_TYPES.includes(info.contentType)
  )
    throw new DomainError(422, "MEDIA_SIZE", "Ảnh tải lên không hợp lệ.");
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok || !response.body)
    throw new DomainError(
      503,
      "MEDIA_UNAVAILABLE",
      "Chưa đọc được ảnh tải lên.",
    );
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MEDIA_LIMIT) {
      await reader.cancel();
      throw new DomainError(422, "MEDIA_SIZE", "Ảnh vượt 5 MiB.");
    }
    chunks.push(value);
  }
  let verified;
  try {
    verified = await verifyImage(Buffer.concat(chunks), info.contentType);
  } catch (error) {
    await del(url);
    throw error;
  }
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(s.media)
      .values({
        pathname: info.pathname,
        url,
        alt,
        uploadedBy: actor,
        ...verified,
      })
      .onConflictDoNothing()
      .returning();
    if (row)
      await tx
        .insert(s.adminAuditLogs)
        .values({ actorId: actor, action: "upload:media", resourceId: row.id });
    return (
      row ||
      (
        await tx
          .select()
          .from(s.media)
          .where(eq(s.media.pathname, info.pathname))
      )[0]
    );
  });
}
export async function deleteMedia(id: string, actor: string) {
  await assertDbEnvironment();
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(s.media)
      .where(eq(s.media.id, id))
      .for("update");
    if (!row)
      throw new DomainError(
        404,
        "MEDIA_NOT_FOUND",
        "Ảnh không còn trong thư viện.",
      );
    const references: { type: string; id: string; title: string }[] = [];
    for (const [name, table, key, title] of [
      ["products", "products", "id", "name"],
      ["posts", "posts", "id", "title"],
      ["policies", "policies", "id", "title"],
      ["services", "services", "id", "id"],
      ["settings", "site_settings", "key", "key"],
    ]) {
      const result = await tx.execute(
        sql`SELECT ${sql.identifier(key)} AS id, ${sql.identifier(title)} AS title FROM ${sql.identifier(table)} t WHERE strpos(to_jsonb(t)::text,${row.url})>0 OR strpos(to_jsonb(t)::text,${row.id})>0`,
      );
      references.push(
        ...result.rows.map((r) => ({
          type: name,
          id: String(r.id),
          title: String(r.title),
        })),
      );
    }
    if (references.length)
      throw new DomainError(
        409,
        "MEDIA_IN_USE",
        "Gỡ hoặc thay ảnh ở các nội dung đang dùng trước khi xóa.",
        { references },
      );
    await del(row.url);
    await tx.delete(s.media).where(eq(s.media.id, id));
    await tx
      .insert(s.adminAuditLogs)
      .values({ actorId: actor, action: "delete:media", resourceId: id });
    return { deleted: true };
  });
}
