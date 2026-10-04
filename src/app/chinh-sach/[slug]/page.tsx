import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { getArticles } from "@/server/content";
type Props={params:Promise<{slug:string}>};
export const dynamicParams = false;
export function generateStaticParams(){return getArticles("policies").map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params,p=getArticles("policies").find(p=>p.slug===slug);return p ? {title:p.title,description:p.excerpt} : {title:"Chính sách chưa xuất bản"};}
export default async function PolicyPage({params}:Props){const {slug}=await params,p=getArticles("policies").find(p=>p.slug===slug);if(!p)notFound();return <div className="container section"><div className="article-title"><span className="eyebrow">CHÍNH SÁCH CỦA HÒE</span><h1>{p.title}</h1></div><article className="prose"><Markdown skipHtml>{p.body}</Markdown></article></div>;}
