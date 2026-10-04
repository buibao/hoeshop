import * as z from "zod";
import { productSchema } from "@/domain/schemas";
import {
  siteSchema,
  homeSchema,
  assetsSchema,
  serviceSchema,
} from "@/domain/content";
export const resources = [
  "orders",
  "inquiries",
  "products",
  "posts",
  "policies",
  "services",
  "settings",
  "comments",
  "media",
] as const;
export const resourceSchema = z.enum(resources);
export type Resource = z.infer<typeof resourceSchema>;
export const editSchema = z
  .object({ editVersion: z.number().int().nonnegative(), data: z.unknown() })
  .strict();
const status = z.enum(["draft", "published", "archived"]);
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{1,100}$/);
export const adminProductSchema = z
  .object({
    product: productSchema,
    publicationStatus: status,
    sortOrder: z.number().int().min(0).max(9999).default(0),
  })
  .strict();
export const articleSchema = z
  .object({
    id: slug,
    slug,
    title: z.string().trim().min(1).max(300),
    excerpt: z.string().trim().max(1000),
    bodyMarkdown: z.string().trim().max(45000),
    category: z.string().trim().max(100),
    image: productSchema.shape.image,
    publicationStatus: status,
    publishedAt: z.iso.datetime().nullable(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.publicationStatus === "published" &&
      (!v.excerpt || v.bodyMarkdown.length < 80)
    )
      ctx.addIssue({
        code: "custom",
        path: ["bodyMarkdown"],
        message: "Hoàn thiện mô tả và nội dung trước khi xuất bản.",
      });
  });
export const orderEditSchema = z
  .object({
    businessStatus: z.enum([
      "received",
      "contacted",
      "confirmed",
      "completed",
      "cancelled",
    ]),
    internalNote: z.string().trim().max(5000),
  })
  .strict();
export const inquiryEditSchema = z
  .object({
    businessStatus: z.enum(["received", "contacted", "resolved", "cancelled"]),
    internalNote: z.string().trim().max(5000),
  })
  .strict();
export function parseSetting(id: string, data: unknown) {
  const schema = { site: siteSchema, home: homeSchema, assets: assetsSchema }[
    id
  ];
  if (!schema) throw new Error("Unknown section setting");
  return schema.parse(data);
}
export { serviceSchema };
