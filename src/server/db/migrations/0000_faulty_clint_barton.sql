CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"resource_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" text NOT NULL,
	"display_name" text NOT NULL,
	"body" text NOT NULL,
	"visibility" text DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hidden_at" timestamp with time zone,
	"hidden_by" text,
	"edit_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "comment_visibility" CHECK ("comments"."visibility" IN ('visible','hidden'))
);
--> statement-breakpoint
CREATE TABLE "idempotency_requests" (
	"operation" text NOT NULL,
	"request_id" uuid NOT NULL,
	"payload_hash" text NOT NULL,
	"resource_id" text NOT NULL,
	"receipt" jsonb NOT NULL,
	"committed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_requests_operation_request_id_pk" PRIMARY KEY("operation","request_id")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"service_type" text NOT NULL,
	"contact" jsonb NOT NULL,
	"body" text NOT NULL,
	"configuration" jsonb,
	"business_status" text DEFAULT 'received' NOT NULL,
	"internal_note" text DEFAULT '' NOT NULL,
	"edit_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inquiries_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "inquiry_status" CHECK ("inquiries"."business_status" IN ('received','contacted','resolved','cancelled'))
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pathname" text NOT NULL,
	"url" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_pathname_unique" UNIQUE("pathname"),
	CONSTRAINT "media_size" CHECK ("media"."bytes" > 0 AND "media"."bytes" <= 5242880),
	CONSTRAINT "media_dimensions" CHECK ("media"."width" > 0 AND "media"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"product_id" text,
	"quantity" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	CONSTRAINT "order_item_quantity" CHECK ("order_items"."quantity" BETWEEN 1 AND 99),
	CONSTRAINT "order_item_position_limit" CHECK ("order_items"."position" BETWEEN 0 AND 29)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"buyer" jsonb NOT NULL,
	"recipient" jsonb NOT NULL,
	"address" text NOT NULL,
	"notes" text NOT NULL,
	"totals" jsonb NOT NULL,
	"shipping" text DEFAULT 'pending' NOT NULL,
	"business_status" text DEFAULT 'received' NOT NULL,
	"internal_note" text DEFAULT '' NOT NULL,
	"edit_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "order_status" CHECK ("orders"."business_status" IN ('received','contacted','confirmed','completed','cancelled'))
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"body_markdown" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"cover_media_id" uuid,
	"image" text,
	"publication_status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"fixture" integer DEFAULT 0 NOT NULL,
	"edit_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "policies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "policy_status" CHECK ("policies"."publication_status" IN ('draft','published','archived'))
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"body_markdown" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"cover_media_id" uuid,
	"image" text,
	"publication_status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"fixture" integer DEFAULT 0 NOT NULL,
	"edit_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug"),
	CONSTRAINT "post_status" CHECK ("posts"."publication_status" IN ('draft','published','archived'))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"service_type" text NOT NULL,
	"description" text NOT NULL,
	"cover_media_id" uuid,
	"image" text,
	"image_alt" text DEFAULT '' NOT NULL,
	"publication_status" text DEFAULT 'draft' NOT NULL,
	"fixture" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"price_mode" text NOT NULL,
	"amount" bigint,
	"min" bigint,
	"max" bigint,
	"unit" text,
	"default_design" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"priced_options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pricing_revision" text NOT NULL,
	"edit_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "product_status" CHECK ("products"."publication_status" IN ('draft','published','archived')),
	CONSTRAINT "product_service" CHECK ("products"."service_type" IN ('hoa-thoi','hoa-tam','hoa-y')),
	CONSTRAINT "product_price" CHECK (("products"."price_mode"='quote' AND "products"."amount" IS NULL AND "products"."min" IS NULL AND "products"."max" IS NULL) OR ("products"."price_mode"='fixed' AND "products"."amount">0 AND "products"."min" IS NULL AND "products"."max" IS NULL AND length("products"."unit")>0) OR ("products"."price_mode"='range' AND "products"."amount" IS NULL AND "products"."min">0 AND "products"."max">="products"."min" AND length("products"."unit")>0)),
	CONSTRAINT "hoa_thoi_quote" CHECK ("products"."service_type" != 'hoa-thoi' OR "products"."price_mode"='quote')
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"operation" text NOT NULL,
	"identity" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limit_buckets_operation_identity_window_start_pk" PRIMARY KEY("operation","identity","window_start")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"edit_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_id" CHECK ("services"."id" IN ('hoa-thoi','hoa-tam','hoa-y'))
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"edit_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_post_page" ON "comments" USING btree ("post_id","visibility","created_at","id");--> statement-breakpoint
CREATE INDEX "inquiries_status_date" ON "inquiries" USING btree ("business_status","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_item_position" ON "order_items" USING btree ("order_id","position");--> statement-breakpoint
CREATE INDEX "orders_status_date" ON "orders" USING btree ("business_status","created_at","id");--> statement-breakpoint
CREATE INDEX "posts_public_order" ON "posts" USING btree ("publication_status","published_at","id");--> statement-breakpoint
CREATE INDEX "products_public_order" ON "products" USING btree ("publication_status","sort_order","id");--> statement-breakpoint
CREATE INDEX "rate_expiry" ON "rate_limit_buckets" USING btree ("expires_at");