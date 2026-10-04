import nextEnv from "@next/env";
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "../../src/server/db";
import * as s from "../../src/server/db/schema";
import * as files from "../../src/server/file-content";
import {
  siteSchema,
  homeSchema,
  homeDefaults,
  assetsSchema,
  serviceSchema,
} from "../../src/domain/content";
import { pricingRevision } from "../../src/server/db/mappers";
nextEnv.loadEnvConfig(process.cwd());
const dry = process.argv.includes("--dry-run"),
  fixtures = process.argv.includes("--fixtures");
const env = process.env.DB_ENV;
if (!env || !["development", "test", "preview", "production"].includes(env))
  throw new Error("Set DB_ENV explicitly before seed.");
if (fixtures && env === "production")
  throw new Error("Fixtures are forbidden in production.");
process.env.CONTENT_MODE = fixtures ? "test" : "live";
try {
  const db = getDb();
  const [identity] = await db
    .select()
    .from(s.siteSettings)
    .where(eq(s.siteSettings.key, "system.environment"));
  if (identity && identity.data !== env)
    throw new Error("Database environment mismatch; seed refused.");
  const settings = [
    { key: "system.environment", data: env },
    { key: "site", data: siteSchema.parse(files.getSite()) },
    {
      key: "home",
      data: homeSchema.parse({ ...homeDefaults, ...files.getHome() }),
    },
    { key: "assets", data: assetsSchema.parse(files.getAssets()) },
  ];
  const products = files
    .getProducts(true)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      serviceType: p.serviceType,
      description: p.description,
      image: p.image,
      imageAlt: p.imageAlt,
      fixture: p.fixture ? 1 : 0,
      publicationStatus: p.published ? "published" : "draft",
      priceMode: p.price.mode,
      amount: p.price.mode === "fixed" ? p.price.amount : null,
      min: p.price.mode === "range" ? p.price.min : null,
      max: p.price.mode === "range" ? p.price.max : null,
      unit: p.price.mode === "quote" ? null : p.price.unit,
      defaultDesign: p.defaultDesign,
      pricedOptions: p.pricedOptions,
      pricingRevision: pricingRevision(p),
    }));
  const articles = (kind: "blog" | "policies") =>
    files
      .getArticles(kind, true)
      .map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        bodyMarkdown: a.body,
        category: a.category,
        image: a.image,
        fixture: a.fixture ? 1 : 0,
        publicationStatus: a.published ? "published" : "draft",
        publishedAt: a.published ? new Date(a.date + "T00:00:00+07:00") : null,
      }));
  console.log(
    JSON.stringify({
      mode: dry ? "dry-run" : "seed",
      environment: env,
      fixtures,
      settings: settings.length,
      services: 3,
      products: products.length,
      posts: articles("blog").length,
      policies: articles("policies").length,
    }),
  );
  if (!dry)
    await db.transaction(async (tx) => {
      await tx.insert(s.siteSettings).values(settings).onConflictDoNothing();
      await tx
        .insert(s.services)
        .values(
          files
            .getServices()
            .map((v) => ({ id: v.id, data: serviceSchema.parse(v) })),
        )
        .onConflictDoNothing();
      if (products.length)
        await tx.insert(s.products).values(products).onConflictDoNothing();
      if (articles("blog").length)
        await tx.insert(s.posts).values(articles("blog")).onConflictDoNothing();
      if (articles("policies").length)
        await tx
          .insert(s.policies)
          .values(articles("policies"))
          .onConflictDoNothing();
    });
} catch {
  console.error(
    "Seed failed or database environment mismatched. No secrets/content printed.",
  );
  process.exitCode = 1;
} finally {
  await closeDb();
}
