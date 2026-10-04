import type { MetadataRoute } from "next";
import { getProducts,getArticles,siteUrl,shopLive } from "@/server/content";
export default function sitemap():MetadataRoute.Sitemap{
  if(!shopLive())return [];
  const paths=["","/san-pham","/ve-hoe","/blog","/lien-he","/dich-vu/hoa-thoi","/dich-vu/hoa-tam","/dich-vu/hoa-y",...getProducts().map(p=>"/san-pham/"+p.slug),...getArticles().map(p=>"/blog/"+p.slug),...getArticles("policies").map(p=>"/chinh-sach/"+p.slug)];
  return paths.map(p=>({url:siteUrl()+p,changeFrequency:"weekly",priority:p===""?1:0.6}));
}
