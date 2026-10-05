"use client";
import { ActionLink } from "@/components/ui/ActionLink";
import { Action } from "@/components/ui/Action";

export default function ShopError({ reset }: { reset: () => void }) {
  return (
    <main className="container mx-auto w-full max-w-container px-4 md:px-8 section py-12 md:py-16">
      <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">HÒE ĐANG CHUẨN BỊ</span>
      <h1 >Hẹn bạn một chút nhé.</h1>
      <p className="muted text-tertiary">
        Nội dung và hệ thống tiếp nhận đang được kết nối. Yêu cầu chưa được xác
        nhận khi chưa có mã tiếp nhận.
      </p>
      <div className="hero-actions mt-6 flex flex-wrap items-center gap-3">
        <Action className="button" onClick={reset}>
          Thử lại
        </Action>
        <ActionLink className="text-link" href="/xem-thu/widgets">
          Xem thử widget
        </ActionLink>
      </div>
    </main>
  );
}
