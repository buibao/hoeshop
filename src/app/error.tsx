"use client";
import { StoreFallbackScope } from "@/components/StoreFallbackScope";
import { StoreTextRevealGroup } from "@/components/ui/StoreTextReveal";
import { termes, cormorant } from "@/fonts/store-fonts";
import "@/styles/store-typography.css";
import "@/styles/store-gradients.css";
import "@/styles/store-text-reveal.css";
export default function AvailabilityError({ reset }: { reset: () => void }) {
  return (
    <StoreFallbackScope className={`hoe-store-scope ${termes.variable} ${cormorant.variable}`}><main className="container section">
      <span className="brand">hòe</span>
      <StoreTextRevealGroup initial className="page-heading">
        <span className="eyebrow">HÒE ĐANG CHUẨN BỊ</span>
        <h1 style={{ fontSize: 40 }}>Hẹn bạn một chút nhé.</h1>
        <p>
          Nội dung và hệ thống tiếp nhận đang được kết nối. Yêu cầu chỉ được ghi
          nhận khi bạn nhận mã tiếp nhận.
        </p>
        <button className="button" onClick={reset}>
          Thử lại
        </button>
      </StoreTextRevealGroup>
    </main></StoreFallbackScope>
  );
}
