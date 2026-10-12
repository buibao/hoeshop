import { StoreTextRevealGroup, StoreTextReveal } from "@/components/ui/StoreTextReveal";
import { StoreHeading } from "@/components/StoreHeading";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getArticles } from "@/server/content";
import { Empty } from "@/components/Empty";
export const metadata: Metadata = {
  title: "Chuyện hoa",
  description: "Chuyện của Hòe, chuyện của những đóa hoa.",
};
export default async function BlogPage() {
  const posts = await getArticles();
  return (
    <>
      <StoreHeading>
        <StoreTextRevealGroup initial className="page-heading">
          <span className="eyebrow">NHỮNG CÂU CHUYỆN MUỐN ĐƯỢC KỂ</span>
          <h1>
            Chuyện hoa,
            <br />
            chuyện chúng mình.
          </h1>
          <p>
            Đôi khi, một chút sắc màu và hương thơm cũng đủ để một ngày bình
            thường trở nên đáng yêu hơn.
          </p>
        </StoreTextRevealGroup>
      </StoreHeading>
      <div className="container">
        {posts.length ? (
          <div className="blog-grid">
            {posts.map((p) => (
              <article key={p.id} className="blog-card">
                <StoreTextReveal as="span" role="eyebrow" className="eyebrow">{p.category}</StoreTextReveal>
                <StoreTextReveal as="h2" role="body">
                  <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                </StoreTextReveal>
                <StoreTextReveal as="p" role="body">{p.excerpt}</StoreTextReveal>
                <Link href={`/blog/${p.slug}`} className="text-link">
                  Đọc câu chuyện <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Câu chuyện đang được chuẩn bị"
            body="Hòe sẽ gửi bạn những câu chuyện mới khi nội dung đã sẵn sàng."
          />
        )}
      </div>
    </>
  );
}
