import type { Metadata } from "next";
import Link from "next/link";
import { getSite } from "@/server/content";
export const metadata: Metadata = {
  title: "Về Hòe",
  description: "Hòe — nơi những điều khó nói được kể bằng hoa.",
};
export default async function AboutPage() {
  const site = await getSite();
  return (
    <div className="container">
      <div className="page-heading">
        <span className="eyebrow">HOA & NHỮNG ĐIỀU DỊU DÀNG</span>
        <h1>
          Hòe bắt đầu từ
          <br />
          những điều nhỏ bé.
        </h1>
        <p>
          Hòe tin rằng hoa không chỉ dành cho những ngày đặc biệt. Hoa có thể
          nói lời yêu thương, cảm ơn, nhớ nhung, hoặc đơn giản là nhắc ta dịu
          dàng với chính mình.
        </p>
      </div>
      <section className="service-grid" style={{ marginBottom: 65 }}>
        {[
          [
            "H",
            "Chân thành",
            "Hoa là ngôn ngữ của cảm xúc. Hòe đặt sự chân thành vào từng nhành hoa, để những điều thương yêu được gửi trọn vẹn.",
          ],
          [
            "O",
            "Nguyên bản",
            "Mỗi mong muốn là một câu chuyện riêng. Hòe cùng bạn tìm một thiết kế mang dấu ấn của người gửi và người nhận.",
          ],
          [
            "E",
            "Thanh lịch",
            "Vẻ đẹp từ những điều vừa đủ. Hòe chăm chút màu sắc, hình dáng và cảm giác mà những đóa hoa mang đến.",
          ],
        ].map(([letter, title, body]) => (
          <article key={letter} className="service-card">
            <span className="eyebrow">{letter} — GIÁ TRỊ CỦA HÒE</span>
            <h3 style={{ fontSize: 30 }}>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>
      <h2>Những điều bạn muốn biết</h2>
      <div className="faq">
        {site.faq.map((q) => (
          <details key={q.question}>
            <summary>{q.question}</summary>
            <p>{q.answer}</p>
          </details>
        ))}
      </div>
      <Link
        href="/blog/chuyen-cua-hoe"
        className="text-link"
        style={{ marginBottom: 65 }}
      >
        Đọc chuyện của Hòe
      </Link>
    </div>
  );
}
