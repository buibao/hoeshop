"use client";
import { StoreTextReveal } from "@/components/ui/StoreTextReveal";
import Link from "next/link";
export default function ShopError({ reset }: { reset: () => void }) {
  return (
    <main className="container section">
      <StoreTextReveal as="span" role="eyebrow" className="eyebrow">HÒE ĐANG CHUẨN BỊ</StoreTextReveal>
      <StoreTextReveal as="h1" role="page" initial style={{ fontSize: 40 }}>Hẹn bạn một chút nhé.</StoreTextReveal>
      <StoreTextReveal as="p" role="body" className="muted">
        Nội dung và hệ thống tiếp nhận đang được kết nối. Yêu cầu chưa được xác
        nhận khi chưa có mã tiếp nhận.
      </StoreTextReveal>
      <div className="hero-actions">
        <button className="button" onClick={reset}>
          Thử lại
        </button>
        <Link className="text-link" href="/xem-thu/widgets">
          Xem thử widget
        </Link>
      </div>
    </main>
  );
}
