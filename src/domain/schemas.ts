import * as z from "zod";
import vietnamese from "zod/v4/locales/vi.js";
import { storedRecurrenceSchema, submissionRecurrenceSchema, vietnamToday } from "./recurrence";
import { isCalendarRecurrence } from "./delivery-schedule";
export { vietnamToday } from "./recurrence";
z.config(vietnamese());

export const serviceTypeSchema = z.enum(["hoa-thoi", "hoa-tam", "hoa-y"]);
export type ServiceType = z.infer<typeof serviceTypeSchema>;
const text = (max = 500) => z.string().trim().max(max).default("");
const optionalEmail = z.union([z.literal(""), z.email().max(254)]).default("");
export const dateStructureSchema = text(10).refine((v) => {
  if (!v) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(v + "T00:00:00Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === v;
}, "Ngày mong muốn không hợp lệ.");
export const desiredDateSchema = dateStructureSchema.refine(
  (v) => !v || v >= vietnamToday(),
  "Ngày mong muốn đã ở quá khứ.",
);
const desiredTime = text(5).refine(
  (v) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
  "Giờ mong muốn không hợp lệ.",
);
const referenceUrl = text(2000).refine((v) => {
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}, "Link ảnh phải là URL https hợp lệ.");
const common = {
  desiredDate: desiredDateSchema,
  desiredTime,
  style: text(120),
  color: text(120),
  budget: text(120),
};
const thoi = z
  .object({
    serviceType: z.literal("hoa-thoi"),
    ...common,
    recurringNeeds: text(1500),
    recurrence: storedRecurrenceSchema.optional(),
  })
  .strict();
const tam = z
  .object({
    serviceType: z.literal("hoa-tam"),
    ...common,
    relationship: text(120),
    occasion: text(120),
    emotion: z
      .string()
      .trim()
      .min(1, "Hãy cho Hòe biết cảm xúc muốn gửi.")
      .max(500),
    dislikedFlowers: text(250),
    message: text(1000),
  })
  .strict();
const y = z
  .object({
    serviceType: z.literal("hoa-y"),
    ...common,
    shape: z.enum(["bo", "hop", "binh", "canh"], {
      error: "Hãy chọn hình thức.",
    }),
    flowerType: text(250),
    size: text(120),
    occasion: text(120),
    message: text(1000),
    referenceUrl,
    requirements: text(1500),
  })
  .strict();
export const configurationSchema = z.discriminatedUnion("serviceType", [
  thoi,
  tam,
  y,
]).superRefine((v, ctx) => {
  if (v.serviceType !== "hoa-thoi") return;
  const checked = submissionRecurrenceSchema.safeParse(v.recurrence);
  if (!checked.success) {
    if (!isCalendarRecurrence(v.recurrence)) {
      ctx.addIssue({ code: "custom", path: ["recurrence"], message: "Vui lòng chọn lại gói và các ngày nhận theo calendar." });
    } else for (const issue of checked.error.issues) ctx.addIssue({ ...issue, path: ["recurrence", ...issue.path] });
  }
  if (v.desiredDate) ctx.addIssue({ code: "custom", path: ["desiredDate"], message: "Chọn ngày nhận trong calendar của gói hoa." });
});
export const structuralConfigurationSchema = z.discriminatedUnion(
  "serviceType",
  [
    thoi.extend({ desiredDate: dateStructureSchema }),
    tam.extend({ desiredDate: dateStructureSchema }),
    y.extend({ desiredDate: dateStructureSchema }),
  ],
);
// Dates are revalidated on submission. Persisted carts must survive a date becoming past.
export const storedConfigurationSchema = z.discriminatedUnion("serviceType", [
  thoi.extend({ desiredDate: text(10) }),
  tam.extend({ desiredDate: text(10) }),
  y.extend({ desiredDate: text(10) }),
]);
export type Configuration = z.infer<typeof configurationSchema>;
export const priceSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("fixed"),
      amount: z.number().int().positive(),
      unit: z.string().trim().min(1).max(30),
    })
    .strict(),
  z
    .object({
      mode: z.literal("range"),
      min: z.number().int().positive(),
      max: z.number().int().positive(),
      unit: z.string().trim().min(1).max(30),
    })
    .strict()
    .refine((p) => p.min <= p.max, "Khoảng giá không hợp lệ."),
  z.object({ mode: z.literal("quote") }).strict(),
]);
export type Price = z.infer<typeof priceSchema>;
export const productSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    serviceType: serviceTypeSchema,
    description: z.string().min(1),
    image: z
      .string()
      .refine(
        (v) =>
          v.startsWith("/images/") ||
          /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(v),
        "Ảnh phải thuộc thư viện Hòe.",
      )
      .nullable(),
    imageAlt: z.string(),
    published: z.boolean(),
    fixture: z.boolean().default(false),
    price: priceSchema,
    defaultDesign: z.record(z.string(), z.string()).default({}),
    pricedOptions: z.record(z.string(), z.array(z.string())).default({}),
  })
  .strict()
  .refine(
    (p) => p.serviceType !== "hoa-thoi" || p.price.mode === "quote",
    "Hoa Thời phase 1 chỉ nhận báo giá.",
  );
export type Product = z.infer<typeof productSchema> & { revision: string };
export const cartItemSchema = z
  .object({
    lineId: z.uuid(),
    productId: z.string().min(1).max(100),
    expectedRevision: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(99),
    configuration: configurationSchema,
  })
  .strict();
export type CartItem = z.infer<typeof cartItemSchema>;
export const storedCartItemSchema = cartItemSchema.extend({
  configuration: storedConfigurationSchema,
});
export const structuralCartItemSchema = cartItemSchema.extend({
  configuration: structuralConfigurationSchema,
});
export const cartSchema = z
  .object({ version: z.literal(1), items: z.array(cartItemSchema).max(30) })
  .strict();
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập số điện thoại.")
  .max(30)
  .refine(
    (v) =>
      /^[+\d\s().-]+$/.test(v) &&
      v.replace(/\D/g, "").length >= 8 &&
      v.replace(/\D/g, "").length <= 15,
    "Số điện thoại cần có 8–15 chữ số.",
  );
const buyerSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    phone: phoneSchema,
    email: optionalEmail,
  })
  .strict();
export const orderSchema = z
  .object({
    requestId: z.uuid(),
    buyer: buyerSchema,
    recipient: z
      .object({
        name: z.string().trim().min(1).max(120),
        phone: z.union([z.literal(""), phoneSchema]).default(""),
      })
      .strict(),
    address: z.string().trim().min(1).max(1000),
    notes: text(1500),
    items: z.array(cartItemSchema).min(1).max(30),
    honeypot: z.literal("").default(""),
  })
  .strict();
export type OrderInput = z.infer<typeof orderSchema>;
export const structuralOrderSchema = orderSchema.extend({
  items: z.array(structuralCartItemSchema).min(1).max(30),
});
export const inquirySchema = z
  .object({
    requestId: z.uuid(),
    kind: z.enum(["general", "service"]).default("general"),
    name: z.string().trim().min(1).max(120),
    phone: phoneSchema,
    email: optionalEmail,
    serviceType: z.enum(["hoa-thoi", "hoa-tam", "hoa-y", "tu-van"]),
    body: z.string().trim().max(3000),
    configuration: configurationSchema.optional(),
    honeypot: z.literal("").default(""),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (!v.body && !(v.kind === "service" && v.serviceType === "hoa-thoi" && v.configuration?.serviceType === "hoa-thoi" && v.configuration.recurrence))
      ctx.addIssue({ code: "custom", path: ["body"], message: "Vui lòng mô tả nhu cầu." });
    if (
      v.kind === "service" &&
      (!v.configuration || v.configuration.serviceType !== v.serviceType)
    )
      ctx.addIssue({
        code: "custom",
        path: ["configuration"],
        message: "Cấu hình dịch vụ không hợp lệ.",
      });
    if (
      v.kind === "service" &&
      v.configuration?.serviceType === "hoa-y" &&
      !v.configuration.requirements
    )
      ctx.addIssue({
        code: "custom",
        path: ["configuration", "requirements"],
        message: "Vui lòng mô tả thiết kế mong muốn.",
      });
  });
export type InquiryInput = z.infer<typeof inquirySchema>;
export const structuralInquirySchema = inquirySchema.safeExtend({
  configuration: structuralConfigurationSchema.optional(),
});
export const commentSchema = z
  .object({
    requestId: z.uuid(),
    postId: z.string().min(1).max(100),
    displayName: z.string().trim().min(1).max(80),
    body: z.string().trim().min(1).max(1500),
    honeypot: z.literal("").default(""),
  })
  .strict();
export type CommentInput = z.infer<typeof commentSchema>;
export interface PublicComment {
  commentId: string;
  postId: string;
  displayName: string;
  body: string;
  createdAt: string;
}
export interface Receipt {
  requestId: string;
  status: "received";
  configuration?: Configuration;
  recurrenceSnapshot?: import("./recurrence").RecurrenceSnapshot;
  recurringItems?: Array<{ name: string; quantity: number; configuration: Configuration & { recurrenceSnapshot?: import("./recurrence").RecurrenceSnapshot } }>;
}
export interface CommentPage {
  comments: PublicComment[];
  nextCursor: string | null;
}
export class DomainError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
