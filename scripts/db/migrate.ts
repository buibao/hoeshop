import nextEnv from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL_UNPOOLED)
  throw new Error("DATABASE_URL_UNPOOLED is required for migrations.");
const expected = process.env.DB_ENV;
if (
  !expected ||
  !["test", "development", "preview", "production"].includes(expected)
)
  throw new Error("Set DB_ENV explicitly before migration.");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  max: 1,
});
try {
  const { rows } = await pool.query(
    "SELECT to_regclass('public.site_settings') AS existing",
  );
  if (rows[0].existing) {
    const identity = await pool.query(
      "SELECT data FROM site_settings WHERE key='system.environment'",
    );
    if (identity.rows[0] && identity.rows[0].data !== expected)
      throw new Error("Database environment mismatch; migration refused.");
  }
  await migrate(drizzle(pool), {
    migrationsFolder: "src/server/db/migrations",
  });
  console.log("Database migrations applied.");
} catch {
  console.error(
    "Migration failed or environment mismatch. Check target connection and DB_ENV; no secrets printed.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
