import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { getArticles } from "@/server/content";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params,
    p = (await getArticles("policies")).find((p) => p.slug === slug);
  return p
    ? { title: p.title, description: p.excerpt }
    : { title: "Chính sách chưa xuất bản" };
}
export default async function PolicyPage({ params }: Props) {
  const { slug } = await params,
    p = (await getArticles("policies")).find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <div className="container mx-auto w-full max-w-container px-4 md:px-8 section py-12 md:py-16">
      <div className="article-title flex flex-col gap-4 py-8">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">CHÍNH SÁCH CỦA HÒE</span>
        <h1>{p.title}</h1>
      </div>
      <article className="prose prose prose-neutral max-w-none">
        <Markdown skipHtml>{p.body}</Markdown>
      </article>
    </div>
  );
}
