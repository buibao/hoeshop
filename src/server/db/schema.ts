import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  bigint,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
const time = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
const edit = () => ({
  editVersion: integer("edit_version").notNull().default(1),
});
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pathname: text("pathname").notNull().unique(),
    url: text("url").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    alt: text("alt").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    ...time(),
  },
  (t) => [
    check("media_size", sql`${t.bytes} > 0 AND ${t.bytes} <= 5242880`),
    check("media_dimensions", sql`${t.width} > 0 AND ${t.height} > 0`),
  ],
);
export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    serviceType: text("service_type").notNull(),
    description: text("description").notNull(),
    coverMediaId: uuid("cover_media_id").references(() => media.id),
    image: text("image"),
    imageAlt: text("image_alt").notNull().default(""),
    publicationStatus: text("publication_status").notNull().default("draft"),
    fixture: integer("fixture").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    priceMode: text("price_mode").notNull(),
    amount: bigint("amount", { mode: "number" }),
    min: bigint("min", { mode: "number" }),
    max: bigint("max", { mode: "number" }),
    unit: text("unit"),
    defaultDesign: jsonb("default_design")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    pricedOptions: jsonb("priced_options")
      .$type<Record<string, string[]>>()
      .notNull()
      .default({}),
    pricingRevision: text("pricing_revision").notNull(),
    ...edit(),
    ...time(),
  },
  (t) => [
    index("products_public_order").on(t.publicationStatus, t.sortOrder, t.id),
    check(
      "product_status",
      sql`${t.publicationStatus} IN ('draft','published','archived')`,
    ),
    check(
      "product_service",
      sql`${t.serviceType} IN ('hoa-thoi','hoa-tam','hoa-y')`,
    ),
    check(
      "product_price",
      sql`(${t.priceMode}='quote' AND ${t.amount} IS NULL AND ${t.min} IS NULL AND ${t.max} IS NULL) OR (${t.priceMode}='fixed' AND ${t.amount}>0 AND ${t.min} IS NULL AND ${t.max} IS NULL AND length(${t.unit})>0) OR (${t.priceMode}='range' AND ${t.amount} IS NULL AND ${t.min}>0 AND ${t.max}>=${t.min} AND length(${t.unit})>0)`,
    ),
    check(
      "hoa_thoi_quote",
      sql`${t.serviceType} != 'hoa-thoi' OR ${t.priceMode}='quote'`,
    ),
  ],
);
const articleFields = () => ({
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  bodyMarkdown: text("body_markdown").notNull(),
  category: text("category").notNull().default(""),
  coverMediaId: uuid("cover_media_id").references(() => media.id),
  image: text("image"),
  publicationStatus: text("publication_status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  fixture: integer("fixture").notNull().default(0),
  ...edit(),
  ...time(),
});
export const posts = pgTable("posts", articleFields(), (t) => [
  index("posts_public_order").on(t.publicationStatus, t.publishedAt, t.id),
  check(
    "post_status",
    sql`${t.publicationStatus} IN ('draft','published','archived')`,
  ),
]);
export const policies = pgTable("policies", articleFields(), (t) => [
  check(
    "policy_status",
    sql`${t.publicationStatus} IN ('draft','published','archived')`,
  ),
]);
export const services = pgTable(
  "services",
  {
    id: text("id").primaryKey(),
    data: jsonb("data").notNull(),
    ...edit(),
    ...time(),
  },
  (t) => [check("service_id", sql`${t.id} IN ('hoa-thoi','hoa-tam','hoa-y')`)],
);
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  ...edit(),
  ...time(),
});
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().unique(),
    buyer: jsonb("buyer").notNull(),
    recipient: jsonb("recipient").notNull(),
    address: text("address").notNull(),
    notes: text("notes").notNull(),
    totals: jsonb("totals").notNull(),
    shipping: text("shipping").notNull().default("pending"),
    businessStatus: text("business_status").notNull().default("received"),
    internalNote: text("internal_note").notNull().default(""),
    ...edit(),
    ...time(),
  },
  (t) => [
    index("orders_status_date").on(t.businessStatus, t.createdAt, t.id),
    check(
      "order_status",
      sql`${t.businessStatus} IN ('received','contacted','confirmed','completed','cancelled')`,
    ),
  ],
);
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    position: integer("position").notNull(),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    quantity: integer("quantity").notNull(),
    snapshot: jsonb("snapshot").notNull(),
  },
  (t) => [
    uniqueIndex("order_item_position").on(t.orderId, t.position),
    check("order_item_quantity", sql`${t.quantity} BETWEEN 1 AND 99`),
    check("order_item_position_limit", sql`${t.position} BETWEEN 0 AND 29`),
  ],
);
export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().unique(),
    kind: text("kind").notNull(),
    serviceType: text("service_type").notNull(),
    contact: jsonb("contact").notNull(),
    body: text("body").notNull(),
    configuration: jsonb("configuration"),
    businessStatus: text("business_status").notNull().default("received"),
    internalNote: text("internal_note").notNull().default(""),
    ...edit(),
    ...time(),
  },
  (t) => [
    index("inquiries_status_date").on(t.businessStatus, t.createdAt, t.id),
    check(
      "inquiry_status",
      sql`${t.businessStatus} IN ('received','contacted','resolved','cancelled')`,
    ),
  ],
);
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id),
    displayName: text("display_name").notNull(),
    body: text("body").notNull(),
    visibility: text("visibility").notNull().default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
    hiddenBy: text("hidden_by"),
    ...edit(),
  },
  (t) => [
    index("comments_post_page").on(t.postId, t.visibility, t.createdAt, t.id),
    check("comment_visibility", sql`${t.visibility} IN ('visible','hidden')`),
  ],
);
export const idempotencyRequests = pgTable(
  "idempotency_requests",
  {
    operation: text("operation").notNull(),
    requestId: uuid("request_id").notNull(),
    payloadHash: text("payload_hash").notNull(),
    resourceId: text("resource_id").notNull(),
    receipt: jsonb("receipt").notNull(),
    committedAt: timestamp("committed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.operation, t.requestId] })],
);
export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    operation: text("operation").notNull(),
    identity: text("identity").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.operation, t.identity, t.windowStart] }),
    index("rate_expiry").on(t.expiresAt),
  ],
);
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  resourceId: text("resource_id").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
