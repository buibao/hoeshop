import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  getSite,
  getAssets,
  isTestContent,
  shopLive,
  siteUrl,
} from "@/server/content";
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: "Hòe — Hòe gửi hoa, chill ghé nhà.",
      template: "%s | Hòe",
    },
    description: site.description,
    robots:
      isTestContent() || !shopLive()
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      title: "Hòe",
      description: site.description,
      locale: "vi_VN",
      type: "website",
    },
  };
}
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const test = isTestContent();
  return (
    <>
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:shadow-lg focus:outline-2 focus:outline-focus-ring">
        Đến nội dung chính
      </a>
      {test ? (
        <div className="banner bg-brand-primary px-4 py-3 text-center text-sm text-brand-secondary test">
          BẢN TEST — Mẫu hoa, giá và ảnh minh họa để kiểm thử.{" "}
          {process.env.DATA_ADAPTER === "mock"
            ? "Dữ liệu lưu tạm trên máy local, mất khi khởi động lại."
            : process.env.DATABASE_URL && process.env.RATE_LIMIT_SECRET
              ? "Dữ liệu được lưu vào DB test riêng; không tiếp nhận đơn thật."
              : "Chưa kết nối DB test; yêu cầu chưa được tiếp nhận."}
        </div>
      ) : !shopLive() ? (
        <div className="banner bg-brand-primary px-4 py-3 text-center text-sm text-brand-secondary">
          Hòe đang chuẩn bị mở nhận đặt hoa. Mời bạn khám phá câu chuyện và dịch
          vụ của Hòe.
        </div>
      ) : null}
      <Header logo={(await getAssets()).logo} />
      <main id="main-content" className="[&_h1]:font-display [&_h2]:font-display [&_h3]:font-display">{children}</main>
      <Footer />
    </>
  );
}
