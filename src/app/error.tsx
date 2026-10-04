"use client";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <div className="container section empty"><h1>Trang tạm thời chưa tải được</h1><p>Vui lòng thử lại sau một chút.</p><button className="button" onClick={reset}>Thử lại</button></div>;
}
