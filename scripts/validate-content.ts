import {
  getProducts,
  getArticles,
  getSite,
  getHome,
  getServices,
  getAssets,
  validateImage,
  isTestContent,
} from "../src/server/file-content";
getSite();
getHome();
getServices();
getProducts(true);
getArticles("blog", true);
getArticles("policies", true);
Object.values(getAssets()).forEach((asset) =>
  validateImage(asset?.src || null),
);
getProducts().forEach((p) => validateImage(p.image));
getServices().forEach((s) => validateImage(s.image));
getArticles().forEach((a) => validateImage(a.image));
console.log(
  "Content schemas validated. Mode:",
  isTestContent() ? "TEST" : "LIVE",
);
if (
  process.env.VERCEL_ENV === "production" &&
  process.env.DATA_ADAPTER === "mock"
)
  throw new Error("Mock adapter is forbidden on Vercel.");
if (process.env.SHOP_LIVE === "true") {
  if (
    isTestContent() ||
    !process.env.DATABASE_URL ||
    !process.env.RATE_LIMIT_SECRET ||
    !process.env.ADMIN_CLERK_USER_IDS ||
    !process.env.CLERK_SECRET_KEY
  )
    throw new Error(
      "Opening shop requires live database, auth and rate configuration. Run readiness checks against DB before release.",
    );
}
