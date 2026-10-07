import * as z from "zod";
export const imageSource = z
  .string()
  .refine(
    (v) =>
      v.startsWith("/images/") ||
      /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(v),
    "Chọn ảnh từ thư viện Hòe.",
  );
const copy = z.string().trim().max(5000);
const link = z.string().regex(/^\/(?!\/)/, "Dùng đường dẫn trong website.");
export const siteSchema = z
  .object({
    name: copy,
    tagline: copy,
    description: copy,
    contact: z.object({
      phone: copy.nullable(),
      email: z.union([z.email(), z.literal("")]).nullable(),
      address: copy.nullable(),
      addressUrl: z.union([z.url().refine((v) => v.startsWith("https://"), "Dùng URL HTTPS hợp lệ."), z.literal("")]).nullable().default(null),
      hours: copy.nullable(),
    }),
    social: z
      .array(
        z.object({
          label: copy,
          url: z.url().refine((v) => v.startsWith("https://")),
          platform: z.enum(["Facebook", "TikTok", "Instagram"]).optional(),
        }),
      )
      .max(20),
    faq: z.array(z.object({ question: copy, answer: copy })).max(30),
  })
  .strict();
const asset = z.object({
  src: imageSource,
  alt: z.string().trim().min(1).max(500),
});
export const assetsSchema = z
  .object({
    logo: asset
      .extend({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .nullable(),
    hero: asset.nullable(),
    story: asset.nullable(),
  })
  .strict();
const cta = z.object({ label: copy, href: link });
export const homeDefaults = {
  primaryCta: { label: "Chọn một chút hoa", href: "/#nhung-doa-hoa" },
  secondaryCta: { label: "Khám phá dịch vụ", href: "/#dich-vu" },
  footnote: "Hoa kể chuyện. Hòe gửi thương.",
  imageNote: "Những điều nhỏ bé,\nlàm ngày thêm xinh.",
  benefitEyebrow: "VÌ NIỀM VUI NÊN THẬT NHẸ NHÀNG",
  benefitTitle: "Bận cứ bận,\nchill cứ chill.",
  benefitIntro:
    "Bạn giữ những điều quan trọng, để Hòe cùng bạn chăm chút những niềm vui nhỏ.",
  servicesEyebrow: "BA CÁCH ĐỂ HOA KỂ CHUYỆN",
  servicesTitle: "Mỗi mong muốn,\nmột cách gửi hoa.",
  servicesIntro:
    "Một niềm vui cho mình, một lời thương cho ai đó. Bạn chọn điểm bắt đầu, Hòe cùng bạn viết tiếp.",
  featuredEyebrow: "MỘT CHÚT CẢM HỨNG",
  featuredTitle: "Những đóa hoa của Hòe",
  featuredCta: { label: "Xem các mẫu hoa", href: "/san-pham" },
  storyEyebrow: "CHUYỆN CỦA HÒE",
  storyTitle: "Niềm vui xứng đáng\nđược ở bên bạn nhiều hơn.",
  storyBody:
    "Một bó hoa có thể là lời yêu thương, một lời cảm ơn, một chút nhớ nhung, hay đơn giản là món quà dành cho chính mình. Hòe muốn những điều dịu dàng ấy có mặt cả trong những ngày rất đỗi bình thường.",
  storyCtaLabel: "Đọc câu chuyện của Hòe",
  processTitle: "Một lời thương, ba bước nhỏ",
  process: [
    {
      title: "Chọn điều muốn gửi",
      body: "Chọn mẫu hoa hoặc kể Hòe nghe nhu cầu của bạn.",
    },
    {
      title: "Gửi mong muốn",
      body: "Thêm lời nhắn, ngày nhận và thông tin liên hệ.",
    },
    {
      title: "Cùng Hòe xác nhận",
      body: "Shop liên hệ chốt thiết kế, giá, phí giao và lịch nhận.",
    },
  ],
  faqTitle: "Một vài điều bạn muốn biết",
  ctaEyebrow: "BẠN MUỐN HÒE GỬI ĐIỀU GÌ?",
  ctaTitle: "Để hoa thay bạn kể.",
  ctaBody:
    "Một chút hoa, một chút dịu dàng. Dành cho bạn, và những người bạn thương.",
};
export const homeSchema = z
  .object({
    eyebrow: copy,
    title: copy,
    intro: copy,
    benefits: z.array(z.object({ title: copy, body: copy })).max(10),
    featuredLimit: z.number().int().min(0).max(12),
    featuredProductIds: z.array(z.string()).max(12).default([]),
    heroProductIds: z.array(z.string()).max(3).default([]),
    storySlug: z.string(),
    primaryCta: cta,
    secondaryCta: cta,
    footnote: copy,
    imageNote: copy,
    benefitEyebrow: copy,
    benefitTitle: copy,
    benefitIntro: copy,
    servicesEyebrow: copy,
    servicesTitle: copy,
    servicesIntro: copy,
    featuredEyebrow: copy,
    featuredTitle: copy,
    featuredCta: cta,
    storyEyebrow: copy,
    storyTitle: copy,
    storyBody: copy,
    storyCtaLabel: copy,
    processTitle: copy,
    process: z
      .array(z.object({ title: copy, body: copy }))
      .min(1)
      .max(6),
    faqTitle: copy,
    ctaEyebrow: copy,
    ctaTitle: copy,
    ctaBody: copy,
  })
  .strict();
export const serviceSchema = z
  .object({
    id: z.enum(["hoa-thoi", "hoa-tam", "hoa-y"]),
    name: copy,
    shortName: copy,
    subtitle: copy,
    description: copy,
    number: copy,
    image: imageSource.nullable(),
    hints: z.record(z.string(), copy).default({}),
    colorPresets: z.array(copy).max(20).default([]),
    stylePresets: z.array(copy).max(20).default([]),
  })
  .strict();
export type HomeContent = z.infer<typeof homeSchema>;
