import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { getArticles } from "@/server/content";
import { Comments } from "@/features/comments/Comments";
import { features } from "@/domain/features";
type Props={params:Promise<{slug:string}>};
export const dynamicParams = false;
export function generateStaticParams(){return getArticles().map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params,p=getArticles().find(p=>p.slug===slug);return p ? {title:p.title,description:p.excerpt,alternates:{canonical:"/blog/"+p.slug},openGraph:{type:"article",title:p.title,description:p.excerpt,publishedTime:p.date}} : {title:"Bài viết không khả dụng"};
}
export default async function BlogDetail({params}:Props){
  const {slug}=await params,p=getArticles().find(p=>p.slug===slug);if(!p)notFound();
  return <div className="container"><div className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><Link href="/blog">Chuyện hoa</Link></div>
    <div className="article-title"><span className="eyebrow">{p.category}</span><h1>{p.title}</h1><div className="article-meta"><span>Hòe</span><time dateTime={p.date}>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"long",timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(p.date+"T00:00:00+07:00"))}</time></div></div>
    <article className="prose"><Markdown skipHtml>{p.body}</Markdown></article>{features.commentsEnabled ? <Comments postId={p.id}/> : null}
  </div>;
}
