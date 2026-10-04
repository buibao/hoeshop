import type { MetadataRoute } from "next";
import { siteUrl, shopLive } from "@/server/content";
export default function robots(): MetadataRoute.Robots {
  return shopLive()
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/api/",
            "/admin/",
            "/dang-nhap/",
            "/xem-thu/",
            "/gio-hang",
            "/dat-hoa",
            "/images/preview/",
          ],
        },
        sitemap: siteUrl() + "/sitemap.xml",
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
