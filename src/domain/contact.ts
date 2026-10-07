import * as z from "zod";
import { siteSchema } from "./content";

export const socialPlatforms = ["Facebook", "TikTok", "Instagram"] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];
const socialInput = z.object({
  label: z.string().trim().max(5000),
  url: z.union([z.url().refine((v) => v.startsWith("https://"), "Dùng URL HTTPS hợp lệ."), z.literal("")]),
}).strict();
export const contactEditSchema = z.object({
  editVersion: z.number().int().positive(),
  contact: siteSchema.shape.contact,
  social: z.object({ Facebook: socialInput, TikTok: socialInput, Instagram: socialInput }).strict(),
}).strict();
export type SiteContent = z.infer<typeof siteSchema>;
export type ContactEdit = z.infer<typeof contactEditSchema>;

export function socialPlatform(social: { label: string; url: string; platform?: SocialPlatform }): SocialPlatform | undefined {
  if (social.platform) return social.platform;
  const label = social.label.trim().toLowerCase();
  const exact = socialPlatforms.find((p) => p.toLowerCase() === label);
  if (exact) return exact;
  try {
    const host = new URL(social.url).hostname.toLowerCase().replace(/^www\./, "");
    return socialPlatforms.find((p) => host === `${p.toLowerCase()}.com` || host.endsWith(`.${p.toLowerCase()}.com`));
  } catch { return undefined; }
}
export function contactEditorData(site: Pick<SiteContent, "contact" | "social">) {
  return {
    contact: site.contact,
    social: Object.fromEntries(socialPlatforms.map((platform) => {
      const entry = site.social.find((s) => socialPlatform(s) === platform);
      return [platform, { label: entry?.label || platform, url: entry?.url || "" }];
    })) as ContactEdit["social"],
  };
}
export function mergeContactSocial(existing: SiteContent["social"], input: ContactEdit["social"]) {
  return [...existing.filter((s) => !socialPlatform(s)), ...socialPlatforms.flatMap((platform) => {
    const entry = input[platform];
    return entry.url ? [{ label: entry.label || platform, url: entry.url, platform }] : [];
  })];
}
export function phoneHref(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}` : null;
}

export function httpsHref(value: string | null | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function footerSocialLinks(social: SiteContent["social"]) {
  return social.flatMap((entry) => {
    const url = httpsHref(entry.url);
    if (!url) return [];
    const platform = socialPlatform(entry);
    return [{ url, platform, label: entry.label.trim() || platform || new URL(url).hostname }];
  }).sort((a, b) => (a.platform ? socialPlatforms.indexOf(a.platform) : socialPlatforms.length)
    - (b.platform ? socialPlatforms.indexOf(b.platform) : socialPlatforms.length));
}
