import { ActionLink } from "@/components/ui/ActionLink";
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
    <div className="container mx-auto w-full max-w-container px-4 md:px-8">
      <div className="page-heading flex flex-col gap-4 py-8 md:py-12">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">NHỮNG CÂU CHUYỆN MUỐN ĐƯỢC KỂ</span>
        <h1>
          Chuyện hoa,
          <br />
          chuyện chúng mình.
        </h1>
        <p>
          Đôi khi, một chút sắc màu và hương thơm cũng đủ để một ngày bình
          thường trở nên đáng yêu hơn.
        </p>
      </div>
      {posts.length ? (
        <div className="blog-grid grid grid-cols-1 gap-8 md:grid-cols-2">
          {posts.map((p) => (
            <article key={p.id} className="blog-card flex flex-col gap-4 rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
              <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">{p.category}</span>
              <h2>
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p>{p.excerpt}</p>
              <ActionLink href={`/blog/${p.slug}`} className="text-link">
                Đọc câu chuyện <ArrowRight size={15} />
              </ActionLink>
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
  );
}
