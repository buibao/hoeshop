import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import matter from "gray-matter";
import * as z from "zod";
import { homeSchema as fullHomeSchema, homeDefaults, serviceSchema } from "@/domain/content";
import {
  productSchema,
  type Product,
} from "@/domain/schemas";
export function isTestContent() {
  if (
    process.env.CONTENT_MODE === "test" &&
    process.env.VERCEL_ENV === "production"
  )
    throw new Error("Test content is forbidden in Vercel production.");
  return (
    process.env.CONTENT_MODE === "test" ||
    (!process.env.CONTENT_MODE && process.env.VERCEL_ENV === "preview")
  );
}
const root = () => path.join(process.cwd(), "content");
const fixtures = () => path.join(process.cwd(), "tests", "fixtures", "content");
const json = (file: string) =>
  JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const siteSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  contact: z.object({
    phone: z.string().nullable(),
    email: z.string().nullable(),
    address: z.string().nullable(),
    addressUrl: z.string().nullable().default(null),
    hours: z.string().nullable(),
  }),
  social: z.array(
    z.object({
      label: z.string(),
      url: z.url().refine((v) => v.startsWith("https://")),
      platform: z.enum(["Facebook", "TikTok", "Instagram"]).optional(),
    }),
  ),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
});
export const getSite = () =>
  siteSchema.parse(json(path.join(root(), "site.json")));
export const getHome = () =>
  fullHomeSchema.parse({ ...homeDefaults, ...json(path.join(root(), "home.json")) });
const assetSchema = z.object({
  src: z.string().startsWith("/images/"),
  alt: z.string().min(1),
});
const assetsSchema = z.object({
  logo: assetSchema
    .extend({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .nullable(),
  hero: assetSchema.nullable(),
  story: assetSchema.nullable(),
});
export const getAssets = () =>
  assetsSchema.parse(json(path.join(root(), "assets.json")));
export function validateImage(source: string | null) {
  if (!source) return;
  if (source.startsWith("/images/preview/")) {
    if (
      !isTestContent() ||
      !["bouquet.jpg", "roses.jpg", "peonies.jpg"].includes(
        source.split("/").at(-1)!,
      )
    )
      throw new Error("Preview image is not allowed in live content.");
    if (
      !fs.existsSync(
        path.join(fixtures(), "../images", source.split("/").at(-1)!),
      )
    )
      throw new Error("Missing preview image.");
    return;
  }
  const imageRoot = path.resolve(process.cwd(), "public/images");
  const target = path.resolve(process.cwd(), "public", "." + source);
  if (!target.startsWith(imageRoot + path.sep) || !fs.existsSync(target))
    throw new Error("Missing or invalid content image: " + source);
}
export const getServices = () =>
  ["hoa-thoi", "hoa-tam", "hoa-y"].map((id) =>
    serviceSchema.parse(json(path.join(root(), "services", id + ".json"))),
  );
export const getService = (id: string) =>
  getServices().find((s) => s.id === id);
function files(directory: string, ext: string) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((f) => f.endsWith(ext))
    .sort()
    .map((f) => path.join(directory, f));
}
export function getProducts(includeDraft = false): Product[] {
  const source = isTestContent() ? fixtures() : root();
  const products = files(path.join(source, "products"), ".json").map((file) => {
    const data = productSchema.parse(json(file));
    if (!isTestContent() && data.fixture)
      throw new Error("Fixture found in live catalog: " + data.id);
    return {
      ...data,
      revision: createHash("sha256").update(JSON.stringify(data)).digest("hex"),
    };
  });
  if (
    new Set(products.map((p) => p.id)).size !== products.length ||
    new Set(products.map((p) => p.slug)).size !== products.length
  )
    throw new Error("Duplicate product ID/slug.");
  return includeDraft ? products : products.filter((p) => p.published);
}
const articleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  excerpt: z.string(),
  published: z.boolean(),
  fixture: z.boolean().default(false),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string(),
  image: z.string().startsWith("/images/").nullable().default(null),
});
export type Article = z.infer<typeof articleSchema> & { body: string };
export function getArticles(
  kind: "blog" | "policies" = "blog",
  includeDraft = false,
): Article[] {
  const source = isTestContent() && kind === "blog" ? fixtures() : root();
  const articles = files(path.join(source, kind), ".md").map((file) => {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    const data = articleSchema.parse(parsed.data);
    if (!isTestContent() && data.fixture)
      throw new Error("Fixture found in live articles.");
    if (data.published && !parsed.content.trim())
      throw new Error("Published article has no body.");
    return { ...data, body: parsed.content };
  });
  if (
    new Set(articles.map((a) => a.id)).size !== articles.length ||
    new Set(articles.map((a) => a.slug)).size !== articles.length
  )
    throw new Error("Duplicate article ID/slug.");
  return includeDraft ? articles : articles.filter((a) => a.published);
}
export function siteUrl() {
  return (
    process.env.SITE_URL ||
    (process.env.VERCEL_URL
      ? "https://" + process.env.VERCEL_URL
      : "http://localhost:3000")
  );
}
export function shopLive() {
  return (
    process.env.SHOP_LIVE === "true" &&
    !isTestContent() &&
    process.env.DATA_ADAPTER !== "mock"
  );
}
