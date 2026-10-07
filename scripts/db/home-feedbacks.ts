import nextEnv from "@next/env";
import { and, eq } from "drizzle-orm";
import { getDb, assertDbEnvironment, closeDb } from "../../src/server/db";
import * as s from "../../src/server/db/schema";
import { homeFeedbackMigration } from "../../src/domain/home-feedback-migration";

nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes("--apply");
const argument = (name: string) => process.argv.find((v) => v.startsWith(`${name}=`))?.slice(name.length + 1);
try {
  await assertDbEnvironment();
  await getDb().transaction(async (tx) => {
    const [row] = await tx.select().from(s.siteSettings).where(eq(s.siteSettings.key, "home")).for("update");
    if (!row) throw new Error("Missing Home settings.");
    const patch = homeFeedbackMigration(row.data as Record<string, unknown>);
    const fields = Object.keys(patch);
    if (apply && fields.length) {
      const actor = argument("--actor");
      const version = Number(argument("--edit-version"));
      if (!actor || version !== row.editVersion) throw new Error("Provide --actor and the current --edit-version from the dry run.");
      await tx.update(s.siteSettings).set({ data: { ...(row.data as object), ...patch }, editVersion: row.editVersion + 1, updatedAt: new Date() }).where(and(eq(s.siteSettings.key, "home"), eq(s.siteSettings.editVersion, version)));
      await tx.insert(s.adminAuditLogs).values({ actorId: actor, action: "migrate:home-feedbacks", resourceId: "home", metadata: { previousVersion: version, changedFields: fields } });
    }
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", environment: process.env.DB_ENV, editVersion: row.editVersion, changedFields: fields, saved: apply && fields.length > 0 }));
  });
} catch (error) {
  console.error(error instanceof Error && error.message.startsWith("Provide") ? error.message : "Home migration failed. Verify the database environment and current version; no settings reset.");
  process.exitCode = 1;
} finally { await closeDb(); }
