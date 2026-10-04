import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getArticles } from "@/server/content";
import { Empty } from "@/components/Empty";
export const metadata:Metadata={title:"Chuyện hoa",description:"Chuyện của Hòe, chuyện của những đóa hoa."};
export default function BlogPage(){
  const posts=getArticles();
  return <div className="container"><div className="page-heading"><span className="eyebrow">NHỮNG CÂU CHUYỆN MUỐN ĐƯỢC KỂ</span><h1>Chuyện hoa,<br/>chuyện chúng mình.</h1><p>Đôi khi, một chút sắc màu và hương thơm cũng đủ để một ngày bình thường trở nên đáng yêu hơn.</p></div>
    {posts.length ? <div className="blog-grid">{posts.map(p=><article key={p.id} className="blog-card"><span className="eyebrow">{p.category}</span><h2><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2><p>{p.excerpt}</p><Link href={`/blog/${p.slug}`} className="text-link">Đọc câu chuyện <ArrowRight size={15}/></Link></article>)}</div> : <Empty title="Câu chuyện đang được chuẩn bị" body="Hòe sẽ gửi bạn những câu chuyện mới khi nội dung đã sẵn sàng."/>}
  </div>;
}
