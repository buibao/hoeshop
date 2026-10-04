import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getProducts, getArticles, siteUrl, shopLive } from "@/server/content";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  if (!shopLive()) return [];
  const paths = [
    "",
    "/san-pham",
    "/ve-hoe",
    "/blog",
    "/lien-he",
    "/dich-vu/hoa-thoi",
    "/dich-vu/hoa-tam",
    "/dich-vu/hoa-y",
    ...(await getProducts()).map((p) => "/san-pham/" + p.slug),
    ...(await getArticles()).map((p) => "/blog/" + p.slug),
    ...(await getArticles("policies")).map((p) => "/chinh-sach/" + p.slug),
  ];
  return paths.map((p) => ({
    url: siteUrl() + p,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }));
}
