import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import * as z from "zod";
import { getDb, assertDbEnvironment } from "@/server/db";
import * as s from "@/server/db/schema";
import { DomainError } from "@/domain/schemas";
import { pricingRevision, productRecord } from "@/server/db/mappers";
import { homeProductEligible, selectionField, selectionSchema, type SelectionKind } from "@/domain/home-products";
import { contactEditSchema, mergeContactSocial, type ContactEdit } from "@/domain/contact";
import { homeSchema, siteSchema } from "@/domain/content";
import { isTestContent } from "@/server/file-content";
import { homeImageAvailable } from "@/server/home-products";
import {
  adminProductSchema,
  articleSchema,
  inquiryEditSchema,
  orderEditSchema,
  parseSetting,
  serviceSchema,
  type Resource,
} from "./schemas";
const tables = {
  orders: s.orders,
  inquiries: s.inquiries,
  products: s.products,
  posts: s.posts,
  policies: s.policies,
  services: s.services,
  settings: s.siteSettings,
  comments: s.comments,
  media: s.media,
};
const names: Record<Resource, string> = {
  orders: "orders",
  inquiries: "inquiries",
  products: "products",
  posts: "posts",
  policies: "policies",
  services: "services",
  comments: "comments",
  media: "media",
  settings: "site_settings",
};
const invalid = (message: string) =>
  new DomainError(422, "INVALID_CONTENT", message);
const stale = () =>
  new DomainError(
    409,
    "STALE_EDIT",
    "Nội dung đã được người khác sửa. Tải lại trước khi lưu.",
  );
export async function adminList(
  resource: Resource,
  id?: string,
  page = 0,
  status?: string,
) {
  await assertDbEnvironment();
  const table = tables[resource];
  const key =
    resource === "settings"
      ? s.siteSettings.key
      : (table as Exclude<typeof table, typeof s.siteSettings>).id;
  const where = id
    ? eq(key, id)
    : resource === "settings"
      ? sql`${key} NOT LIKE 'system.%'`
      : status && ["orders", "inquiries"].includes(resource)
        ? sql`${sql.identifier("business_status")}=${status}`
        : undefined;
  const rows = await getDb()
    .select()
    .from(table)
    .where(where)
    .orderBy(
      desc(resource === "comments" ? s.comments.createdAt : table.createdAt),
      desc(key),
    )
    .limit(id ? 1 : 51)
    .offset(id ? 0 : page * 50);
  if (id && rows.length && ["orders", "inquiries"].includes(resource)) {
    const history = await getDb()
      .select()
      .from(s.adminAuditLogs)
      .where(eq(s.adminAuditLogs.resourceId, id))
      .orderBy(desc(s.adminAuditLogs.createdAt))
      .limit(50);
    return [
      {
        ...rows[0],
        audit: history,
        ...(resource === "orders"
          ? {
              items: await getDb()
                .select()
                .from(s.orderItems)
                .where(eq(s.orderItems.orderId, id))
                .orderBy(s.orderItems.position),
            }
          : {}),
      },
    ];
  }
  if (resource === "orders" && rows.length) {
    // One grouped query for this page; never load all items or issue N+1 queries.
    const ids = rows.map((row) => String((row as { id: string }).id));
    const groups = await getDb().execute(
      sql`SELECT order_id, array_agg(DISTINCT snapshot->'configuration'->>'serviceType') AS services FROM order_items WHERE order_id IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`,`,
      )}) GROUP BY order_id`,
    );
    const services = new Map(
      groups.rows.map((row) => [row.order_id, row.services]),
    );
    return rows.map((row) => ({
      ...row,
      serviceTypes: services.get((row as { id: string }).id) || [],
    }));
  }
  return rows;
}
async function mediaReferences(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  values: Record<string, unknown>,
) {
  // Every Blob reference must point to a verified library entry. Lock it through commit.
  const urls =
    JSON.stringify(values).match(
      /https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"\\)<>]+/g,
    ) || [];
  const verified = new Map<string, string>();
  for (const url of new Set(urls)) {
    const [row] = await tx
      .select({ id: s.media.id })
      .from(s.media)
      .where(eq(s.media.url, url))
      .for("share");
    if (!row) throw invalid("Ảnh chưa được xác minh trong thư viện Hòe.");
    verified.set(url, row.id);
  }
  return verified;
}
export async function adminSave(
  resource: Resource,
  id: string,
  version: number,
  data: unknown,
  actor: string,
) {
  await assertDbEnvironment();
  if (["media"].includes(resource))
    throw invalid("Dùng thao tác thư viện ảnh.");
  let values: Record<string, unknown>;
  if (resource === "products") {
    const v = adminProductSchema.parse(data);
    const p = {
      ...v.product,
      defaultDesign: Object.fromEntries(
        Object.entries(v.product.defaultDesign)
          .map(([key, value]) => [key, value.trim()] as const)
          .filter(([, value]) => value !== ""),
      ),
      pricedOptions: Object.fromEntries(
        Object.entries(v.product.pricedOptions)
          .map(([key, values]): [string, string[]] => [
            key,
            [...new Set(values.map((value) => value.trim()).filter(Boolean))],
          ])
          .filter(([, values]) => values.length > 0),
      ),
    };
    if (id !== p.id) throw invalid("Không thay đổi ID nội dung.");
    if (process.env.DB_ENV === "production" && p.fixture)
      throw invalid("Không xuất bản dữ liệu test vào production.");
    values = {
      slug: p.slug,
      name: p.name,
      service_type: p.serviceType,
      description: p.description,
      image: p.image,
      image_alt: p.imageAlt,
      fixture: p.fixture ? 1 : 0,
      publication_status: v.publicationStatus,
      sort_order: v.sortOrder,
      price_mode: p.price.mode,
      amount: p.price.mode === "fixed" ? p.price.amount : null,
      min: p.price.mode === "range" ? p.price.min : null,
      max: p.price.mode === "range" ? p.price.max : null,
      unit: p.price.mode === "quote" ? null : p.price.unit,
      default_design: p.defaultDesign,
      priced_options: p.pricedOptions,
      pricing_revision: pricingRevision(p),
    };
  } else if (resource === "posts" || resource === "policies") {
    const v = articleSchema.parse(data);
    if (id !== v.id) throw invalid("Không thay đổi ID nội dung.");
    values = {
      slug: v.slug,
      title: v.title,
      excerpt: v.excerpt,
      body_markdown: v.bodyMarkdown,
      category: v.category,
      image: v.image,
      publication_status: v.publicationStatus,
      published_at:
        v.publicationStatus === "published"
          ? v.publishedAt || new Date().toISOString()
          : v.publishedAt,
    };
  } else if (resource === "services") {
    const v = serviceSchema.parse(data);
    if (v.id !== id) throw invalid("ID dịch vụ không hợp lệ.");
    values = { data: v };
  } else if (resource === "settings") {
    if (!["site", "home", "assets"].includes(id))
      throw invalid("Mục cài đặt không khả dụng.");
    values = { data: parseSetting(id, data) };
  } else if (resource === "comments") {
    const v = z
      .object({ visibility: z.enum(["visible", "hidden"]) })
      .strict()
      .parse(data);
    values = {
      visibility: v.visibility,
      hidden_at: v.visibility === "hidden" ? new Date() : null,
      hidden_by: v.visibility === "hidden" ? actor : null,
    };
  } else {
    const v = (
      resource === "orders" ? orderEditSchema : inquiryEditSchema
    ).parse(data);
    values = {
      business_status: v.businessStatus,
      internal_note: v.internalNote,
    };
  }
  const result = await getDb().transaction(async (tx) => {
    if (resource === "settings" && id === "home") {
      const [current] = await tx.select().from(s.siteSettings).where(eq(s.siteSettings.key, id)).for("update");
      if (!current || current.editVersion !== version) throw stale();
      // Selection fields belong exclusively to the guarded selection menus.
      const entered = values.data as Record<string, unknown>;
      const stored = current.data as Record<string, unknown>;
      values.data = { ...stored, ...entered,
        heroProductIds: stored.heroProductIds || [],
        featuredProductIds: stored.featuredProductIds || [],
        featuredLimit: stored.featuredLimit,
        primaryCta: { ...(entered.primaryCta as object), href: "/#nhung-doa-hoa" },
      };
    }
    const references = await mediaReferences(tx, values);
    if (["products", "posts", "policies"].includes(resource))
      values.cover_media_id = references.get(String(values.image)) || null;
    const table = sql.identifier(names[resource]),
      key = sql.identifier(resource === "settings" ? "key" : "id");
    const previous = ["orders", "inquiries"].includes(resource)
      ? (
          await tx.execute(
            sql`SELECT business_status,internal_note FROM ${table} WHERE ${key}=${id} AND edit_version=${version} FOR UPDATE`,
          )
        ).rows[0]
      : undefined;
    let saved;
    if (version === 0) {
      if (!["products", "posts", "policies"].includes(resource)) throw stale();
      const entries = Object.entries({ id, ...values });
      saved = await tx.execute(
        sql`INSERT INTO ${table} (${sql.join(
          entries.map(([k]) => sql.identifier(k)),
          sql`,`,
        )}) VALUES (${sql.join(
          entries.map(([, v]) => sql`${v}`),
          sql`,`,
        )}) ON CONFLICT DO NOTHING RETURNING *`,
      );
    } else {
      const entries = Object.entries(values);
      saved = await tx.execute(
        sql`UPDATE ${table} SET ${sql.join(
          entries.map(([k, v]) => sql`${sql.identifier(k)}=${v}`),
          sql`,`,
        )},edit_version=edit_version+1${resource === "comments" ? sql`` : sql`,updated_at=now()`} WHERE ${key}=${id} AND edit_version=${version} RETURNING *`,
      );
    }
    if (!saved.rows.length) throw stale();
    await tx.insert(s.adminAuditLogs).values({
      actorId: actor,
      action: version ? "update:" + resource : "create:" + resource,
      resourceId: id,
      metadata: {
        previousVersion: version,
        changedFields: Object.keys(values),
        status:
          values.business_status ||
          values.publication_status ||
          values.visibility ||
          null,
        ...(previous
          ? {
              before: {
                status: previous.business_status,
                note: previous.internal_note,
              },
              after: {
                status: values.business_status,
                note: values.internal_note,
              },
            }
          : {}),
      },
    });
    return saved.rows[0];
  });
  if (
    ["products", "posts", "policies", "services", "settings"].includes(resource)
  )
    revalidateTag(resource, { expire: 0 });
  return result;
}

type ProductRow = typeof s.products.$inferSelect;
function productOption(row: ProductRow) {
  const available = homeImageAvailable(row.image);
  const product = productRecord({ ...row, image: available ? row.image : null });
  const eligible = homeProductEligible(product, isTestContent()) && available;
  return { id: product.id, name: product.name, image: product.image,
    imageAlt: product.imageAlt, price: product.price,
    publicationStatus: row.publicationStatus, eligible };
}
export async function adminProductOptions(query: string, page: number) {
  await assertDbEnvironment();
  const rows = await getDb().select().from(s.products).where(and(
    !isTestContent() ? eq(s.products.fixture, 0) : undefined,
    query ? sql`strpos(lower(${s.products.name}), lower(${query})) > 0` : undefined,
  )).orderBy(asc(s.products.sortOrder), asc(s.products.id)).limit(25).offset(page * 24);
  return { products: rows.slice(0, 24).map(productOption), hasMore: rows.length > 24, page };
}
export async function adminHomeSelection(kind: SelectionKind) {
  await assertDbEnvironment();
  const [row] = await getDb().select().from(s.siteSettings).where(eq(s.siteSettings.key, "home"));
  if (!row) throw invalid("Chưa có cấu hình Home.");
  const home = homeSchema.passthrough().parse(row.data);
  const productIds = home[selectionField[kind]];
  const rows = productIds.length ? await getDb().select().from(s.products).where(inArray(s.products.id, productIds)) : [];
  return { editVersion: row.editVersion, productIds, products: rows.map(productOption) };
}

// Lock and merge the current JSON, then compare its version inside the same transaction.
async function patchSettings(key: string, version: number, actor: string,
  action: string, merge: (tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], data: Record<string, unknown>) => Promise<{ data: Record<string, unknown>; fields: string[] }>) {
  await assertDbEnvironment();
  const result = await getDb().transaction(async (tx) => {
    const [current] = await tx.select().from(s.siteSettings).where(eq(s.siteSettings.key, key)).for("update");
    if (!current || current.editVersion !== version) throw stale();
    const next = await merge(tx, current.data as Record<string, unknown>);
    const [saved] = await tx.update(s.siteSettings).set({ data: next.data,
      editVersion: version + 1, updatedAt: new Date() }).where(and(eq(s.siteSettings.key, key), eq(s.siteSettings.editVersion, version))).returning();
    if (!saved) throw stale();
    await tx.insert(s.adminAuditLogs).values({ actorId: actor, action, resourceId: key,
      metadata: { previousVersion: version, changedFields: next.fields } });
    return { editVersion: saved.editVersion };
  });
  revalidateTag("settings", { expire: 0 });
  return result;
}
export async function adminSaveHomeSelection(kind: SelectionKind, input: unknown, actor: string) {
  const { editVersion, productIds } = selectionSchema(kind).parse(input);
  return patchSettings("home", editVersion, actor, `update:home-${kind}`, async (tx, data) => {
    const rows = productIds.length ? await tx.select().from(s.products).where(inArray(s.products.id, productIds)).orderBy(asc(s.products.id)).for("share") : [];
    if (rows.length !== productIds.length || rows.some((row) => !productOption(row).eligible))
      throw invalid("Chỉ chọn sản phẩm đang công khai, có ảnh hợp lệ và được phép xuất hiện ở Store. Hãy chọn lại các mục không còn hợp lệ.");
    await mediaReferences(tx, { images: rows.map((row) => row.image) });
    const field = selectionField[kind];
    // Zero distinguishes an explicitly cleared selection from legacy catalog fallback.
    return { data: { ...data, [field]: productIds, ...(kind === "featured" ? { featuredLimit: productIds.length } : {}) },
      fields: kind === "featured" ? [field, "featuredLimit"] : [field] };
  });
}
export async function adminContactSettings() {
  await assertDbEnvironment();
  const [row] = await getDb().select().from(s.siteSettings).where(eq(s.siteSettings.key, "site"));
  if (!row) throw invalid("Chưa có cấu hình liên hệ.");
  const site = siteSchema.parse(row.data);
  return { editVersion: row.editVersion, contact: site.contact, social: site.social };
}
export async function adminSaveContactSettings(input: ContactEdit, actor: string) {
  const checked = contactEditSchema.parse(input);
  return patchSettings("site", checked.editVersion, actor, "update:site-contact", async (_tx, data) => {
    const site = siteSchema.passthrough().parse(data);
    const social = mergeContactSocial(site.social, checked.social);
    siteSchema.shape.social.parse(social);
    return { data: { ...data, contact: { ...(data.contact as object), ...checked.contact }, social }, fields: ["contact", "social"] };
  });
}
export async function dashboard() {
  await assertDbEnvironment();
  const [result] = await getDb()
    .select({
      received: sql<number>`count(*) filter(where ${s.orders.businessStatus}='received')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(s.orders);
  const [inq] = await getDb()
    .select({
      received: sql<number>`count(*) filter(where ${s.inquiries.businessStatus}='received')::int`,
    })
    .from(s.inquiries);
  return {
    ...result,
    inquiries: inq.received,
    shopLive: process.env.SHOP_LIVE === "true",
    environment: process.env.DB_ENV,
  };
}
