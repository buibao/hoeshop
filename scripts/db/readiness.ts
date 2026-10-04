import nextEnv from "@next/env";
import { eq } from "drizzle-orm";
import { getDb, closeDb, assertDbEnvironment } from "../../src/server/db";
import * as s from "../../src/server/db/schema";
import { productRecord } from "../../src/server/db/mappers";
import {
  siteSchema,
  homeSchema,
  assetsSchema,
  serviceSchema,
} from "../../src/domain/content";
nextEnv.loadEnvConfig(process.cwd());
try {
  await assertDbEnvironment();
  const db = getDb(),
    failures: string[] = [];
  const settings = await db.select().from(s.siteSettings),
    setting = (key: string) => settings.find((v) => v.key === key)?.data;
  const site = siteSchema.parse(setting("site"));
  homeSchema.parse(setting("home"));
  const assets = assetsSchema.parse(setting("assets"));
  const services = await db.select().from(s.services);
  services.forEach((v) => serviceSchema.parse(v.data));
  if (services.length !== 3) failures.push("Thiếu dịch vụ.");
  const catalog = await db
    .select()
    .from(s.products)
    .where(eq(s.products.publicationStatus, "published"));
  catalog.forEach(productRecord);
  if (!catalog.length) failures.push("Chưa có catalog công khai.");
  if (catalog.some((p) => p.fixture || !p.image || !p.imageAlt))
    failures.push("Catalog có test hoặc thiếu ảnh/mô tả ảnh.");
  if (!site.contact.phone && !site.contact.email)
    failures.push("Chưa có liên hệ thật.");
  if (!assets.logo || !assets.hero)
    failures.push("Chưa có logo/ảnh đầu trang thật.");
  const policies = await db
    .select()
    .from(s.policies)
    .where(eq(s.policies.publicationStatus, "published"));
  if (!policies.length) failures.push("Chưa có chính sách công khai.");
  if (policies.some((p) => p.fixture || p.bodyMarkdown.length < 80))
    failures.push("Chính sách chưa hoàn thiện.");
  if (process.env.DB_ENV !== "production")
    failures.push("Đây chưa phải DB production.");
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    !process.env.ADMIN_CLERK_USER_IDS ||
    !process.env.BLOB_READ_WRITE_TOKEN ||
    !process.env.RATE_LIMIT_SECRET
  )
    failures.push("Thiếu auth/media/rate configuration.");
  if (process.env.DATA_ADAPTER && process.env.DATA_ADAPTER !== "postgres")
    failures.push("Adapter phải là postgres.");
  console.log(
    JSON.stringify(
      {
        ready: failures.length === 0,
        environment: process.env.DB_ENV,
        failures,
      },
      null,
      2,
    ),
  );
  if (failures.length) process.exitCode = 1;
} catch {
  console.error(
    "Readiness failed: database/content unavailable or invalid. No secrets printed.",
  );
  process.exitCode = 1;
} finally {
  await closeDb();
}
