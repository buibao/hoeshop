import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
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
    <div className="container mx-auto w-full max-w-container px-4 md:px-8">
      <div className="breadcrumb flex flex-wrap items-center gap-3 py-6 text-sm text-tertiary">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href="/blog">Chuyện hoa</Link>
      </div>
      <div className="article-title flex flex-col gap-4 py-8">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">{p.category}</span>
        <h1>{p.title}</h1>
        <div className="article-meta text-sm text-tertiary">
          <span>Hòe</span>
          <time dateTime={p.date}>
            {new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "long",
              timeZone: "Asia/Ho_Chi_Minh",
            }).format(new Date(p.date + "T00:00:00+07:00"))}
          </time>
        </div>
      </div>
      <article className="prose prose prose-neutral max-w-none">
        <Markdown skipHtml>{p.body}</Markdown>
      </article>
      {features.commentsEnabled ? <Comments postId={p.id} /> : null}
    </div>
  );
}
