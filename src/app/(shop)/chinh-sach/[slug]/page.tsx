import { StoreTextRevealGroup } from "@/components/ui/StoreTextReveal";
import { StoreHeading } from "@/components/StoreHeading";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreProse } from "@/components/StoreProse";
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
    <>
      <StoreHeading containerClassName="section store-policy-heading">
        <StoreTextRevealGroup initial className="article-title">
          <span className="eyebrow">CHÍNH SÁCH CỦA HÒE</span>
          <h1>{p.title}</h1>
        </StoreTextRevealGroup>
      </StoreHeading>
      <div className="container section store-policy-body">
        <article className="prose">
          <StoreProse>{p.body}</StoreProse>
        </article>
      </div>
    </>
  );
}
