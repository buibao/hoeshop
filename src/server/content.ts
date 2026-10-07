import { unstable_cache } from "next/cache";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb, assertDbEnvironment } from "./db";
import * as s from "./db/schema";
import * as files from "./file-content";
import { productRecord, articleRecord, pricingRevision } from "./db/mappers";
import {
  siteSchema,
  homeSchema,
  homeDefaults,
  assetsSchema,
  serviceSchema,
} from "@/domain/content";
import { DomainError } from "@/domain/schemas";
export { isTestContent, shopLive, siteUrl } from "./file-content";
export type Article = ReturnType<typeof articleRecord>;
// Only local test fixtures or an explicitly labeled, disconnected Preview use files.
export function fixtureContent() {
  return files.isTestContent() && !process.env.DATABASE_URL;
}
async function setting(key: string) {
  await assertDbEnvironment();
  const [row] = await getDb()
    .select()
    .from(s.siteSettings)
    .where(eq(s.siteSettings.key, key));
  if (!row)
    throw new DomainError(
      503,
      "CONTENT_MISSING",
      "Nội dung website đang được chuẩn bị.",
    );
  return row.data;
}
const cachedSetting = unstable_cache(setting, ["hoe-settings"], {
  tags: ["settings"],
  revalidate: 60,
});
export async function getSite() {
  return siteSchema.parse(
    fixtureContent() ? files.getSite() : await cachedSetting("site"),
  );
}
export async function getHome() {
  const home = homeSchema.parse(
    fixtureContent()
      ? { ...homeDefaults, ...files.getHome() }
      : await cachedSetting("home"),
  );
  // Read compatibility until the audited settings migration is applied.
  return { ...home, primaryCta: { ...home.primaryCta, href: "/#nhung-doa-hoa" } };
}
export async function getAssets() {
  return assetsSchema.parse(
    fixtureContent() ? files.getAssets() : await cachedSetting("assets"),
  );
}
async function servicesQuery() {
  await assertDbEnvironment();
  return (
    await getDb().select().from(s.services).orderBy(asc(s.services.id))
  ).map((r) => serviceSchema.parse(r.data));
}
const cachedServices = unstable_cache(servicesQuery, ["hoe-services"], {
  tags: ["services"],
  revalidate: 60,
});
export async function getServices() {
  const rows = fixtureContent()
    ? files.getServices().map((r) => serviceSchema.parse(r))
    : await cachedServices();
  return rows.sort((a, b) => a.number.localeCompare(b.number));
}
export async function getService(id: string) {
  return (await getServices()).find((v) => v.id === id);
}
async function productsQuery(includeDraft = false) {
  await assertDbEnvironment();
  return (
    await getDb()
      .select()
      .from(s.products)
      .where(
        and(
          includeDraft
            ? undefined
            : eq(s.products.publicationStatus, "published"),
          !files.isTestContent() ? eq(s.products.fixture, 0) : undefined,
        ),
      )
      .orderBy(asc(s.products.sortOrder), asc(s.products.id))
  ).map(productRecord);
}
const cachedProducts = unstable_cache(() => productsQuery(), ["hoe-products"], {
  tags: ["products"],
  revalidate: 60,
});
export async function getProducts(includeDraft = false) {
  if (fixtureContent())
    return files
      .getProducts(includeDraft)
      .map((p) => ({ ...p, revision: pricingRevision(p) }));
  return includeDraft ? productsQuery(true) : cachedProducts();
}
export async function getProductsFresh() {
  return fixtureContent() ? getProducts() : productsQuery();
}
async function articlesQuery(kind: "blog" | "policies", includeDraft = false) {
  await assertDbEnvironment();
  const table = kind === "blog" ? s.posts : s.policies;
  return (
    await getDb()
      .select()
      .from(table)
      .where(
        and(
          includeDraft ? undefined : eq(table.publicationStatus, "published"),
          !files.isTestContent() ? eq(table.fixture, 0) : undefined,
        ),
      )
      .orderBy(desc(table.publishedAt), asc(table.id))
  ).map(articleRecord);
}
const cachedArticles = unstable_cache(
  (kind: "blog" | "policies") => articlesQuery(kind),
  ["hoe-articles"],
  { tags: ["posts", "policies"], revalidate: 60 },
);
export async function getArticles(
  kind: "blog" | "policies" = "blog",
  includeDraft = false,
): Promise<Article[]> {
  if (fixtureContent()) return files.getArticles(kind, includeDraft);
  return includeDraft ? articlesQuery(kind, true) : cachedArticles(kind);
}
