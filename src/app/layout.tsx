import type { Metadata } from "next";
import { Lora, Be_Vietnam_Pro } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSite, getAssets, isTestContent, shopLive, siteUrl } from "@/server/content";
import "./globals.css";
const heading = Lora({ subsets: ["latin", "vietnamese"], display: "swap", variable: "--font-heading" });
const body = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], display: "swap", variable: "--font-body" });
export function generateMetadata(): Metadata {
  const site = getSite();
  return {
    metadataBase: new URL(siteUrl()), title: { default: "Hòe — Hòe gửi hoa, chill ghé nhà.", template: "%s | Hòe" },
    description: site.description,
    robots: isTestContent() || !shopLive() ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title: "Hòe", description: site.description, locale: "vi_VN", type: "website" },
  };
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const test = isTestContent();
  return <html lang="vi" className={`${heading.variable} ${body.variable}`}><body>
    <a href="#main-content" className="skip-link">Đến nội dung chính</a>
    {test ? <div className="banner test">BẢN TEST — Mẫu hoa, giá và ảnh minh họa để kiểm thử. {process.env.DATA_ADAPTER === "mock" ? "Dữ liệu lưu tạm trên máy local, mất khi khởi động lại." : process.env.SHEETS_GATEWAY_URL && process.env.SHEETS_GATEWAY_SECRET && process.env.RATE_LIMIT_SECRET ? "Gửi vào Sheet test, không tiếp nhận đơn thật." : "Chưa kết nối Sheet test; yêu cầu chưa được tiếp nhận."}</div>
      : !shopLive() ? <div className="banner">Hòe đang chuẩn bị mở nhận đặt hoa. Mời bạn khám phá câu chuyện và dịch vụ của Hòe.</div> : null}
    <Header logo={getAssets().logo}/><main id="main-content">{children}</main><Footer />
  </body></html>;
}
