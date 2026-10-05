"use client";
export default function AvailabilityError({ reset }: { reset: () => void }) {
  return (
    <main className="container section">
      <span className="brand">hòe</span>
      <div className="page-heading">
        <span className="eyebrow">HÒE ĐANG CHUẨN BỊ</span>
        <h1 style={{ fontSize: 40 }}>Hẹn bạn một chút nhé.</h1>
        <p>
          Nội dung và hệ thống tiếp nhận đang được kết nối. Yêu cầu chỉ được ghi
          nhận khi bạn nhận mã tiếp nhận.
        </p>
        <button className="button" onClick={reset}>
          Thử lại
        </button>
      </div>
    </main>
  );
}
