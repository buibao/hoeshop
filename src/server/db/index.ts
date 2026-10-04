import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { DomainError } from "@/domain/schemas";
let pool: Pool | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDb() {
  if (!process.env.DATABASE_URL)
    throw new DomainError(
      503,
      "NOT_CONFIGURED",
      "Hệ thống tiếp nhận chưa được kết nối cơ sở dữ liệu. Vui lòng thử lại sau.",
    );
  if (!db) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 20000,
      statement_timeout: 15000,
    });
    pool.on("error", () => {
      /* Request handlers return sanitized availability errors. */
    });
    db = drizzle(pool, { schema });
  }
  return db;
}
export async function closeDb() {
  await pool?.end();
  pool = undefined;
  db = undefined;
}
export async function assertDbEnvironment() {
  const expected =
    process.env.VERCEL_ENV === "production"
      ? "production"
      : process.env.VERCEL_ENV === "preview"
        ? "preview"
        : process.env.DB_ENV;
  if (
    !expected ||
    !["development", "test", "preview", "production"].includes(expected)
  )
    throw new DomainError(
      503,
      "DB_ENV_MISSING",
      "Môi trường dữ liệu chưa được cấu hình.",
    );
  const [row] = await getDb()
    .select()
    .from(schema.siteSettings)
    .where(
      (await import("drizzle-orm")).eq(
        schema.siteSettings.key,
        "system.environment",
      ),
    );
  if (row?.data !== expected)
    throw new DomainError(
      503,
      "DB_ENV_MISMATCH",
      "Kết nối dữ liệu không đúng môi trường.",
    );
}
