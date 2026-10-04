"use client";
import Link from "next/link";
export default function ShopError({ reset }: { reset: () => void }) {
  return (
    <main className="container section">
      <span className="eyebrow">HÒE ĐANG CHUẨN BỊ</span>
      <h1 style={{ fontSize: 40 }}>Hẹn bạn một chút nhé.</h1>
      <p className="muted">
        Nội dung và hệ thống tiếp nhận đang được kết nối. Yêu cầu chưa được xác
        nhận khi chưa có mã tiếp nhận.
      </p>
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
