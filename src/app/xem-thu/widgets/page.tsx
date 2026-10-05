import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WidgetPreview } from "@/features/widgets/WidgetPreview";
export const metadata: Metadata = {
  title: "Xem thử widget Hòe",
  robots: { index: false, follow: false },
};
export default function WidgetsPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <main id="main-content" className="container section widget-preview-page">
      <Link href="/" className="brand">
        hòe
      </Link>
      <div className="page-heading">
        <span className="eyebrow">BẢN XEM THỬ GIAO DIỆN</span>
        <h1>
          Một lịch hẹn,
          <br />
          <em>mang màu của Hòe.</em>
        </h1>
        <p>
          Calendar và bộ chọn giờ tiếng Việt, thiết kế cho cả desktop và mobile.
          Đây là trang nghiệm thu widget; không tiếp nhận yêu cầu đặt hoa.
        </p>
      </div>
      <WidgetPreview />
    </main>
  );
}
