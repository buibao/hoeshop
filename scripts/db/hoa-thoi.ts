import nextEnv from "@next/env";
import { and, eq } from "drizzle-orm";
import { getDb, assertDbEnvironment, closeDb } from "../../src/server/db";
import * as s from "../../src/server/db/schema";
import { hoaThoiMigration } from "../../src/domain/hoa-thoi-migration";
import { serviceSchema } from "../../src/domain/content";

nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes("--apply");
const argument = (name: string) => process.argv.find((v) => v.startsWith(`${name}=`))?.slice(name.length + 1);
try {
  if (!["development", "test"].includes(process.env.DB_ENV || "") || process.env.VERCEL || process.env.VERCEL_ENV)
    throw new Error("Only a verified development/test database is allowed; Preview/production are forbidden.");
  await assertDbEnvironment();
  await getDb().transaction(async (tx) => {
    const [row] = await tx.select().from(s.services).where(eq(s.services.id, "hoa-thoi")).for("update");
    if (!row) throw new Error("Seed the development/test Hoa Thoi service first.");
    const patch = hoaThoiMigration(row.data as Record<string, unknown>);
    const fields = Object.keys(patch);
    if (apply && fields.length) {
      const actor = argument("--actor"), version = Number(argument("--edit-version"));
      if (!actor || version !== row.editVersion) throw new Error("Provide --actor and the current --edit-version from the dry run.");
      const data = { ...(row.data as object), ...patch };
      serviceSchema.parse(data);
      const [saved] = await tx.update(s.services).set({ data, editVersion: row.editVersion + 1, updatedAt: new Date() }).where(and(eq(s.services.id, "hoa-thoi"), eq(s.services.editVersion, version))).returning({ id: s.services.id });
      if (!saved) throw new Error("The service changed; repeat the dry run.");
      await tx.insert(s.adminAuditLogs).values({ actorId: actor, action: "migrate:hoa-thoi-recommendations", resourceId: "hoa-thoi", metadata: { previousVersion: version, changedFields: fields } });
    }
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", environment: process.env.DB_ENV, editVersion: row.editVersion, changedFields: fields, saved: apply && fields.length > 0, cacheTag: "services", cache: "Restart local dev after apply, or wait for the existing 60-second service cache." }));
  });
} catch (error) {
  console.error(error instanceof Error && /^(Only|Provide|Seed|The service)/.test(error.message) ? error.message : "Hoa Thoi migration failed. Verify the development/test database environment; no content reset.");
  process.exitCode = 1;
} finally { await closeDb(); }
