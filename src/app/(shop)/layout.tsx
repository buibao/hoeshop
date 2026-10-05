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
      <a href="#main-content" className="skip-link">
        Đến nội dung chính
      </a>
      {test ? (
        <div className="banner test">
          Demo
          {process.env.DATA_ADAPTER === "mock"
            ? "Dữ liệu lưu tạm trên máy local, mất khi khởi động lại."
            : process.env.DATABASE_URL && process.env.RATE_LIMIT_SECRET
              ? ""
              : "Chưa kết nối DB test; yêu cầu chưa được tiếp nhận."}
        </div>
      ) : !shopLive() ? (
        <div className="banner">
          Hòe đang chuẩn bị mở nhận đặt hoa. Mời bạn khám phá câu chuyện và dịch
          vụ của Hòe.
        </div>
      ) : null}
      <Header logo={(await getAssets()).logo} />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
