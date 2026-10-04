import { getProducts, getArticles, getSite, getHome, getServices, getAssets, validateImage, isTestContent } from "../src/server/content";
getSite(); getHome(); getServices(); getProducts(true); getArticles("blog", true); getArticles("policies", true);
Object.values(getAssets()).forEach(asset => validateImage(asset?.src || null));
getProducts().forEach(p => validateImage(p.image)); getServices().forEach(s => validateImage(s.image));
getArticles().forEach(a => validateImage(a.image));
console.log("Content schemas validated. Mode:", isTestContent() ? "TEST" : "LIVE");
if (process.env.VERCEL_ENV === "production" && process.env.DATA_ADAPTER === "mock") throw new Error("Mock adapter is forbidden on Vercel.");
if (process.env.SHOP_LIVE === "true") {
  if (isTestContent() || !process.env.SHEETS_GATEWAY_URL || !process.env.SHEETS_GATEWAY_SECRET || !process.env.RATE_LIMIT_SECRET)
    throw new Error("Opening shop requires live content and Sheets configuration.");
  if (!getProducts().length || !getArticles().length || !getArticles("policies").length)
    throw new Error("Opening shop requires published products, blog and policies.");
  const contact = getSite().contact;
  if (!contact.phone || !contact.address) throw new Error("Opening shop requires real contact details.");
  if (!getAssets().logo || !getAssets().hero || getProducts().some(p => !p.image)) throw new Error("Opening shop requires approved logo, hero and product images.");
}
