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
    <main id="main-content" className="container mx-auto w-full max-w-container px-4 md:px-8 section py-12 md:py-16 widget-preview-page">
      <Link href="/" className="brand font-display text-display-xs text-brand-secondary">
        hòe
      </Link>
      <div className="page-heading flex flex-col gap-4 py-8 md:py-12">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">BẢN XEM THỬ GIAO DIỆN</span>
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
