import { StoreTextRevealGroup, StoreTextReveal } from "@/components/ui/StoreTextReveal";
import { StoreHeading } from "@/components/StoreHeading";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreProse } from "@/components/StoreProse";
import { getArticles } from "@/server/content";
import { Comments } from "@/features/comments/Comments";
import { features } from "@/domain/features";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params,
    p = (await getArticles()).find((p) => p.slug === slug);
  return p
    ? {
        title: p.title,
        description: p.excerpt,
        alternates: { canonical: "/blog/" + p.slug },
        openGraph: {
          type: "article",
          title: p.title,
          description: p.excerpt,
          publishedTime: p.date,
        },
      }
    : { title: "Bài viết không khả dụng" };
}
export default async function BlogDetail({ params }: Props) {
  const { slug } = await params,
    p = (await getArticles()).find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <>
      <StoreHeading>
        <div className="breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/blog">Chuyện hoa</Link>
        </div>
        <StoreTextRevealGroup initial className="article-title">
          <span className="eyebrow">{p.category}</span>
          <h1>{p.title}</h1>
          <div className="article-meta">
            <StoreTextReveal role="eyebrow" delayMs={180} initial>Hòe</StoreTextReveal>
            <StoreTextReveal as="time" role="eyebrow" delayMs={180} initial dateTime={p.date}>
              {new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "long",
                timeZone: "Asia/Ho_Chi_Minh",
              }).format(new Date(p.date + "T00:00:00+07:00"))}
            </StoreTextReveal>
          </div>
        </StoreTextRevealGroup>
      </StoreHeading>
      <div className="container">
        <article className="prose">
          <StoreProse>{p.body}</StoreProse>
        </article>
        {features.commentsEnabled ? <Comments postId={p.id} /> : null}
      </div>
    </>
  );
}
